// File: /api/proxy.js
// This is a serverless function that will be deployed as part of the Vercel project.

export default async function handler(req, res) {
  // Allow requests from any origin. For production, you should restrict this
  // to your actual frontend's domain for better security.
  // Example: res.setHeader('Access-Control-Allow-Origin', 'https://your-app-domain.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Extract the target Mapon URL from the query parameter.
  const { targetUrl } = req.query;

  if (!targetUrl) {
    return res.status(400).json({ error: 'The "targetUrl" query parameter is required.' });
  }

  // 2. Securely retrieve the Mapon API key from the server's environment variables.
  // This key is NEVER exposed to the frontend.
  const apiKey = process.env.MAPON_API_KEY;

  if (!apiKey) {
    // This error indicates a server misconfiguration, not a client error.
    return res.status(500).json({ 
      error: { 
        code: 500, 
        message: 'API Key is not configured on the server. The MAPON_API_KEY environment variable is missing.' 
      }
    });
  }
  
  // 3. Construct the final URL for the Mapon API call, appending the secret key.
  const finalUrl = `${targetUrl}&key=${apiKey}`;

  try {
    // 4. Perform the fetch call from the server to the Mapon API.
    // Added { cache: 'no-store' } to prevent any potential caching issues.
    const maponResponse = await fetch(finalUrl, { cache: 'no-store' });
    const responseBody = await maponResponse.text(); // Read body once

    // Try to parse as JSON, but handle cases where it might not be
    let data;
    try {
        data = JSON.parse(responseBody);
    } catch(e) {
        // If parsing fails, it could be a non-JSON error response from Mapon or the network
        if (!maponResponse.ok) {
            return res.status(maponResponse.status).json({ 
                error: {
                    code: maponResponse.status,
                    message: `Mapon API returned a non-JSON error: ${maponResponse.statusText}`,
                    details: responseBody
                }
            });
        }
        // If response was OK but not JSON, forward it as is
        res.setHeader('Content-Type', maponResponse.headers.get('Content-Type') || 'text/plain');
        return res.status(200).send(responseBody);
    }


    // 5. Check if the response from Mapon indicates an error (either a network error or a specific Mapon error payload).
    if (!maponResponse.ok || data.error) {
      console.error('Error from Mapon API:', data.error || `HTTP Status ${maponResponse.status}`);
      return res.status(data.error ? 400 : maponResponse.status).json(data);
    }
    
    // 6. Forward the successful JSON response from Mapon back to our frontend.
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in proxy function:', error);
    return res.status(502).json({ // 502 Bad Gateway is appropriate here
        error: {
            code: 502,
            message: 'The proxy server failed to connect to the Mapon API.',
            details: error.message
        }
    });
  }
}
