import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { HistoricalDataPoint } from '../types';
import { maponService } from '../services/maponService';
import { DataContext } from '../contexts/DataContext';

const getMarkerIcon = (color: string) => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="${color}">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const startIcon = getMarkerIcon('#34D399'); // Green
const endIcon = getMarkerIcon('#F87171'); // Red

export const HistoricalView: React.FC = () => {
    const { units } = useContext(DataContext);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [history, setHistory] = useState<HistoricalDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const queryParams = new URLSearchParams(useLocation().search);
    const deviceIdFromQuery = queryParams.get('deviceId');

    useEffect(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        setDateRange({
            from: yesterday.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0]
        });

        if (deviceIdFromQuery) {
            setSelectedUnitId(Number(deviceIdFromQuery));
        } else if (units.length > 0) {
            setSelectedUnitId(units[0].unit_id);
        }
    }, [deviceIdFromQuery, units]);
    
    const handleFetchHistory = async () => {
        if (!selectedUnitId || !dateRange.from || !dateRange.to) {
            setError('Please select a device and a valid date range.');
            return;
        }
        setLoading(true);
        setError('');
        setHistory([]);
        try {
            const fromDate = new Date(dateRange.from);
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59); // Include the whole end day
            const data = await maponService.getUnitHistory(selectedUnitId, fromDate, toDate);
            setHistory(data);
        } catch (e) {
            setError('Failed to fetch historical data.');
        } finally {
            setLoading(false);
        }
    };

    const path = useMemo(() => history.map(p => [p.location.lat, p.location.lng] as [number, number]), [history]);
    const mapBounds = useMemo(() => {
        if (path.length > 0) {
            return L.latLngBounds(path);
        }
        return null;
    }, [path]);

    return (
        <div className="flex h-full bg-gray-900 text-white">
            <div className="w-1/4 p-4 bg-gray-800 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Route History</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Device</label>
                        <select
                            value={selectedUnitId || ''}
                            onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                        >
                            {units.map(unit => <option key={unit.unit_id} value={unit.unit_id}>{unit.number}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))}
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">To</label>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))}
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                        />
                    </div>
                    <button
                        onClick={handleFetchHistory}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
                    >
                        {loading ? 'Loading...' : 'Show History'}
                    </button>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
            </div>
            <div className="w-3/4">
                <MapContainer center={[42.8333, 12.8333]} zoom={6} scrollWheelZoom={true} style={{ height: "100%", width: "100%", backgroundColor: '#1a202c' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                     {history.length > 0 && mapBounds && (
                        <>
                            <Marker position={path[0]} icon={startIcon}>
                               <Popup>Start: {new Date(history[0].timestamp).toLocaleString()}</Popup>
                            </Marker>
                            <Marker position={path[path.length - 1]} icon={endIcon}>
                                <Popup>End: {new Date(history[history.length - 1].timestamp).toLocaleString()}</Popup>
                            </Marker>
                            <Polyline positions={path} color="cyan" weight={3} />
                        </>
                    )}
                </MapContainer>
            </div>
        </div>
    );
};
