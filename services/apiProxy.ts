/**
 * API Proxy Service
 *
 * This module centralizes all outgoing network requests to our own backend proxy.
 *
 * NEW ARCHITECTURE:
 * The frontend no longer calls public proxies. It makes a request to its own
 * backend endpoint (e.g., /api/proxy), which is a serverless function deployed
 * alongside the frontend on a platform like Vercel.
 *
 * 1. Frontend calls our backend proxy: `fetch('/api/proxy?targetUrl=...')`. This is a same-origin request, so no CORS issues.
 * 2. Backend proxy receives the request. It securely appends the `MAPON_API_KEY` (stored as a secret environment variable) to the target URL.
 * 3. Backend proxy calls the Mapon API. As a server, it has no CORS restrictions.
 * 4. Backend proxy forwards Mapon's response back to the frontend.
 *
 * This is a robust, secure, and professional architecture. The API key is never
 * exposed to the browser.
 */

// The URL to our own backend proxy endpoint.
// A relative URL works perfectly when the frontend and the api function
// are deployed on the same platform (like Vercel).
const PROXY_ENDPOINT = '/api/proxy';

const handleApiError = (errorPayload: any, status: number) => {
    // Prioritize the specific message from our own backend proxy or a Mapon error.
    let errorMessage = errorPayload.message || errorPayload.error?.message;
    const errorCode = errorPayload.code || errorPayload.error?.code || status;

    // If the backend didn't provide a specific message, use a default based on the code.
    if (!errorMessage) {
        switch(errorCode) {
            case 2: errorMessage = 'Service unavailable or in maintenance (Mapon).'; break;
            case 3: errorMessage = 'Invalid parameters sent to Mapon API.'; break;
            case 10: errorMessage = 'Invalid API key. Please check the key configured in the backend environment.'; break;
            case 1005: errorMessage = 'Access Denied by Mapon.'; break;
            // The default message for 500 is now more generic, as a specific error should be sent by the backend.
            case 500: errorMessage = 'An internal server error occurred.'; break;
            case 502: errorMessage = 'Bad Gateway: The server could not connect to an upstream service.'; break;
            default: errorMessage = 'An unknown error occurred.';
        }
    }

    // Append details if provided by the backend.
    if (errorPayload.details) {
      errorMessage += `. Details: ${errorPayload.details}`;
    }

    throw new Error(`API Error: ${errorMessage} (Code: ${errorCode})`);
};


class ApiProxy {
    async get(targetUrl: string): Promise<any> {
        // We encode the targetUrl to ensure all its characters (like '&', '=', '?')
        // are safely passed as a single query parameter to our proxy.
        const proxyUrl = `${PROXY_ENDPOINT}?targetUrl=${encodeURIComponent(targetUrl)}`;
        
        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (!response.ok) {
                // The error payload is now structured by our own proxy, so we pass it
                // to a unified error handler.
                handleApiError(data, response.status);
            }
            
            // Even in a successful response, Mapon might return an error object.
            // Our proxy forwards this, so we check for it here.
            if (data.error) {
                handleApiError(data, response.status);
            }

            return data;

        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                 console.error('Network or Proxy Error:', error.message);
                 // Re-throw a more user-friendly message. The original error is logged.
                 throw new Error(`Failed to connect to the backend service. Please check the network connection and backend status. Details: ${error.message}`);
            }
            // If it's not a standard Error object, just rethrow
            throw error;
        }
    }

    async post(body: Record<string, any>): Promise<any> {
        try {
            const response = await fetch(PROXY_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (!response.ok) {
                handleApiError(data, response.status);
            }

            if (data.error) {
                 handleApiError(data, response.status);
            }
            
            return data;

        } catch (error) {
             if (error instanceof Error && error.name !== 'AbortError') {
                 console.error('Network or Proxy POST Error:', error.message);
                 throw new Error(`Failed to POST to the backend service. Details: ${error.message}`);
            }
            throw error;
        }
    }
}

export const apiProxy = new ApiProxy();
