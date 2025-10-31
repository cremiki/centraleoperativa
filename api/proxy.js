// File: /api/proxy.js
// This is a serverless function that acts as both a secure proxy to Mapon
// and a data persistence layer using a serverless Key-Value store (like Vercel KV).

// IMPORTANT: To make this work, you need to:
// 1. `npm install @vercel/kv`
// 2. Create a Vercel KV database in your Vercel project dashboard.
// 3. Connect the KV database to your project. This will automatically
//    set the required environment variables (KV_URL, KV_REST_API_TOKEN, etc.).
import { kv } from '@vercel/kv';

// --- Database Keys ---
const DB_KEYS = {
    CLIENTS: 'gps_app_clients',
    UNIT_OVERRIDES: 'gps_app_unit_overrides',
};
const MOCK_CLIENTS_INITIAL_DATA = [
    { id: 101, company: 'Logistics Inc.', contactPerson: 'Mario Rossi', phone: '+39 02 1234567', email: 'mario.rossi@logistics.inc' },
    { id: 102, company: 'Transporti Veloci', contactPerson: 'Giulia Verdi', phone: '+39 06 7654321', email: 'giulia.verdi@transportiveloci.it' },
    { id: 103, company: 'Courier Express', contactPerson: 'Luca Gialli', phone: '+39 055 9876543', email: 'luca.gialli@courierexpress.com' },
    { id: 104, company: 'Alpine Haulers', contactPerson: 'Franco Moro', phone: '+39 011 4567890', email: 'franco.moro@alpinehaulers.com' }
];


// --- Main Handler ---
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Route requests based on method
  if (req.method === 'GET') {
    return handleMaponProxy(req, res);
  } else if (req.method === 'POST') {
    return handleDataPersistence(req, res);
  } else {
    return res.status(405).json({ message: 'Method Not Allowed', code: 405 });
  }
}


// --- Mapon Proxy Logic (for GET requests) ---
async function handleMaponProxy(req, res) {
  const { targetUrl } = req.query;
  if (!targetUrl) {
    return res.status(400).json({ message: 'The "targetUrl" query parameter is required for GET requests.', code: 400 });
  }

  const apiKey = process.env.MAPON_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'API Key is not configured on the server.', code: 500 });
  }
  
  const finalUrl = `${targetUrl}&key=${apiKey}`;

  try {
    const maponResponse = await fetch(finalUrl, { cache: 'no-store' });
    const responseBody = await maponResponse.text();
    let data;
    try {
        data = JSON.parse(responseBody);
    } catch(e) {
        if (!maponResponse.ok) {
            const errorMessage = `Mapon API returned a non-JSON error: ${maponResponse.statusText}`;
            return res.status(maponResponse.status).json({ message: errorMessage, code: maponResponse.status, details: responseBody });
        }
        res.setHeader('Content-Type', maponResponse.headers.get('Content-Type') || 'text/plain');
        return res.status(200).send(responseBody);
    }

    if (!maponResponse.ok || data.error) {
      console.error('Error from Mapon API:', data.error || `HTTP Status ${maponResponse.status}`);
      // Forward Mapon's error structure
      return res.status(data.error ? 400 : maponResponse.status).json(data);
    }
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in proxy function:', error);
    return res.status(502).json({ message: 'The proxy server failed to connect to the Mapon API.', code: 502, details: error.message });
  }
}


// --- Data Persistence Logic (for POST requests) ---
async function handleDataPersistence(req, res) {
    let actionForLogging; // For logging purposes in the catch block
    try {
        // Robust body check and parsing now inside the try...catch block
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ message: 'Request body is missing or is not a valid JSON object.', code: 400 });
        }
        
        const { action, payload } = req.body;
        actionForLogging = action; // Assign for potential error logging

        if (!action) {
             return res.status(400).json({ message: 'The "action" property is missing in the request body.', code: 400 });
        }

        // Check for KV configuration before any operation
        if (!process.env.KV_URL || !process.env.KV_REST_API_TOKEN) {
            throw new Error("Server configuration error: The KV database connection details are missing in the environment variables.");
        }

        switch (action) {
            case 'get_clients': {
                let clients = await kv.get(DB_KEYS.CLIENTS);
                if (!clients) {
                    // First time fetch, populate with mock data and save
                    await kv.set(DB_KEYS.CLIENTS, MOCK_CLIENTS_INITIAL_DATA);
                    clients = MOCK_CLIENTS_INITIAL_DATA;
                }
                return res.status(200).json({ data: clients });
            }
            case 'save_client': {
                let clients = await kv.get(DB_KEYS.CLIENTS) || [];
                const index = clients.findIndex(c => c.id === payload.id);
                if (index > -1) {
                    clients[index] = payload;
                } else {
                    clients.push({ ...payload, id: payload.id || Date.now() });
                }
                await kv.set(DB_KEYS.CLIENTS, clients);
                return res.status(200).json({ data: payload });
            }
            case 'delete_client': {
                let clients = await kv.get(DB_KEYS.CLIENTS) || [];
                const updatedClients = clients.filter(c => c.id !== payload.id);
                await kv.set(DB_KEYS.CLIENTS, updatedClients);
                return res.status(200).json({ success: true });
            }
             case 'get_unit_overrides': {
                const overrides = await kv.get(DB_KEYS.UNIT_OVERRIDES) || [];
                return res.status(200).json({ data: overrides });
            }
            case 'save_unit_override': {
                const overridesArray = await kv.get(DB_KEYS.UNIT_OVERRIDES) || [];
                const overridesMap = new Map(overridesArray);
                
                const existing = overridesMap.get(payload.unit_id) || {};
                const newOverride = { ...existing, ...payload };
                overridesMap.set(payload.unit_id, newOverride);

                await kv.set(DB_KEYS.UNIT_OVERRIDES, Array.from(overridesMap.entries()));
                return res.status(200).json({ success: true });
            }

            default:
                return res.status(400).json({ message: `Unknown action: ${action}`, code: 400 });
        }
    } catch (error) {
        console.error(`Error processing action "${actionForLogging || 'unknown'}":`, error);
        if (error instanceof TypeError) {
             return res.status(400).json({ message: 'Invalid request body format. Expected a JSON object.', code: 400 });
        }
        return res.status(500).json({ message: error.message || `An unexpected server error occurred during action: ${actionForLogging}`, code: 500 });
    }
}
