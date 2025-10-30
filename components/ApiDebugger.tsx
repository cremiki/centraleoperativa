import React, { useState } from 'react';
import { maponService } from '../services/maponService';
import { Unit } from '../types';

export const ApiDebugger: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<Unit[] | null>(null);

    const handleTestApi = async () => {
        setLoading(true);
        setError(null);
        setData(null);
        try {
            // This now calls the service without a key, which in turn calls our backend proxy.
            // This tests the entire connection chain, including the server-side API key.
            const result = await maponService.getUnits();
            setData(result);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 h-full p-6 overflow-y-auto text-white">
            <h1 className="text-3xl font-bold mb-4">API Debugger</h1>
            <p className="text-gray-400 mb-6">
                Use this tool to test the connection to the Mapon API via the backend proxy.
                This will verify that the backend is running and the `MAPON_API_KEY` environment variable is configured correctly.
            </p>

            <button
                onClick={handleTestApi}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 transition-colors"
            >
                {loading ? 'Testing...' : 'Test Backend Connection'}
            </button>

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Backend Response</h2>
                <div className="bg-gray-800 rounded-lg p-4 min-h-[200px] font-mono text-sm">
                    {loading && <p className="text-gray-400">Loading...</p>}
                    {error && <p className="text-red-400">Error: {error}</p>}
                    {data && (
                        <div>
                            <p className="text-green-400 mb-2">Success! The backend proxy successfully fetched {data.length} device(s) from Mapon.</p>
                            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(data, null, 2)}</pre>
                        </div>
                    )}
                    {!loading && !error && !data && <p className="text-gray-500">Click the button to test the backend connection.</p>}
                </div>
            </div>
        </div>
    );
};
