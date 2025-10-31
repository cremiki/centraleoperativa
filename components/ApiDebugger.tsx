import React, { useState } from 'react';
import { maponService } from '../services/maponService';
import { Unit } from '../types';

const isResponseEmpty = (data: any): boolean => {
    if (!data) return true;
    if (typeof data !== 'object') return false; // Should not happen with our proxy fix
    if (Array.isArray(data.data) && data.data.length === 0) return true;
    if (data.data?.alerts && Array.isArray(data.data.alerts) && data.data.alerts.length === 0) return true;
    return false;
};

export const ApiDebugger: React.FC = () => {
    // State for unit testing
    const [unitLoading, setUnitLoading] = useState(false);
    const [unitError, setUnitError] = useState<string | null>(null);
    const [unitData, setUnitData] = useState<Unit[] | null>(null);

    // New state for alarm testing
    const [alarmLoading, setAlarmLoading] = useState(false);
    const [alarmError, setAlarmError] = useState<string | null>(null);
    const [alarmData, setAlarmData] = useState<any | null>(null);

    const handleTestUnitsApi = async () => {
        setUnitLoading(true);
        setUnitError(null);
        setUnitData(null);
        try {
            // This now calls the service without a key, which in turn calls our backend proxy.
            // This tests the entire connection chain, including the server-side API key.
            const result = await maponService.getUnits();
            setUnitData(result);
        } catch (e: any) {
            setUnitError(e.message || 'An unknown error occurred.');
        } finally {
            setUnitLoading(false);
        }
    };
    
    const handleTestAlarmsApi = async () => {
        setAlarmLoading(true);
        setAlarmError(null);
        setAlarmData(null);
        try {
            const result = await maponService.getRawAlarms();
            if (result.error) {
                 setAlarmError(result.error);
            } else {
                 setAlarmData(result);
            }
        } catch (e: any) {
             setAlarmError(e.message || 'An unknown error occurred.');
        } finally {
            setAlarmLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 h-full p-6 overflow-y-auto text-white">
            <h1 className="text-3xl font-bold mb-4">API Debugger</h1>
            <p className="text-gray-400 mb-6">
                Use these tools to test the connection to the Mapon API via the backend proxy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Units Test */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Vehicles Endpoint Test</h2>
                    <p className="text-sm text-gray-500 mb-3">Tests fetching the list of all vehicles.</p>
                    <button
                        onClick={handleTestUnitsApi}
                        disabled={unitLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 transition-colors"
                    >
                        {unitLoading ? 'Testing...' : 'Test Vehicles Connection'}
                    </button>
                    <div className="mt-4 bg-gray-800 rounded-lg p-4 min-h-[200px] font-mono text-sm overflow-x-auto">
                        {unitLoading && <p className="text-gray-400">Loading...</p>}
                        {unitError && <p className="text-red-400">Error: {unitError}</p>}
                        {unitData && (
                            <div>
                                <p className="text-green-400 mb-2">Success! Fetched {unitData.length} device(s).</p>
                                <pre className="whitespace-pre-wrap break-all">{JSON.stringify(unitData, null, 2)}</pre>
                            </div>
                        )}
                        {!unitLoading && !unitError && !unitData && <p className="text-gray-500">Click the button to test the connection.</p>}
                    </div>
                </div>

                {/* Alarms Test */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Alarms Endpoint Test</h2>
                    <p className="text-sm text-gray-500 mb-3">Tests fetching alarms from the last 2 hours.</p>
                     <button
                        onClick={handleTestAlarmsApi}
                        disabled={alarmLoading}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 transition-colors"
                    >
                        {alarmLoading ? 'Testing...' : 'Test Alarms Connection'}
                    </button>
                    <div className="mt-4 bg-gray-800 rounded-lg p-4 min-h-[200px] font-mono text-sm overflow-x-auto">
                        {alarmLoading && <p className="text-gray-400">Loading...</p>}
                        {alarmError && <p className="text-red-400">Error: Failed to connect to the backend service. Please check the network connection and backend status. Details: {alarmError}</p>}
                        {alarmData && (
                            <div>
                                {isResponseEmpty(alarmData) ? (
                                    <p className="text-yellow-400">Connection successful, but no alarms were found in the specified time window.</p>
                                ) : (
                                    <p className="text-green-400 mb-2">Success! Received a response for alarms.</p>
                                )}
                                <pre className="whitespace-pre-wrap break-all">{JSON.stringify(alarmData, null, 2)}</pre>
                            </div>
                        )}
                         {!alarmLoading && !alarmError && !alarmData && <p className="text-gray-500">Click the button to test the connection.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
