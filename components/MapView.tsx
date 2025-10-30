import React, { useContext, useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DataContext } from '../contexts/DataContext';
import { Unit } from '../types';
import { UnitDetailPanel } from './UnitDetailPanel';
import { SearchIcon } from './Icons';

const getIcon = (ignition: boolean, speed: number) => {
    const color = ignition ? (speed > 0 ? 'green' : 'orange') : 'red';
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
            <path fill="${color}" stroke="white" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            <circle cx="12" cy="9.5" r="2.5" fill="white"/>
        </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
};

const MapController: React.FC<{ coords: [number, number] | null }> = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 15, {
                animate: true,
                duration: 1,
            });
        }
    }, [coords]);
    return null;
};

export const MapView: React.FC = () => {
    const { units, clients, loading, error, refreshData } = useContext(DataContext);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);

    const initialCenter: [number, number] = [42.8333, 12.8333]; // Center of Italy
    
    const unitsOnMap = units.filter(unit => unit.location.lat !== 0 && unit.location.lng !== 0);

    const searchResults = useMemo(() => {
        if (searchTerm.length < 2) return [];
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return units
            .map(unit => ({
                unit,
                client: clients.find(c => c.id === unit.clientId),
            }))
            .filter(({ unit, client }) => {
                if (!unit.number) return false;
                const companyMatch = client?.company.toLowerCase().includes(lowerCaseSearchTerm);
                const driverMatch = unit.driver.toLowerCase().includes(lowerCaseSearchTerm);
                const numberMatch = unit.number.toLowerCase().includes(lowerCaseSearchTerm);
                return companyMatch || driverMatch || numberMatch;
            });
    }, [searchTerm, units, clients]);

    const handleSelectUnitFromSearch = (unit: Unit) => {
        setSelectedUnit(unit);
        if (unit.location.lat !== 0 && unit.location.lng !== 0) {
            setFlyToCoords([unit.location.lat, unit.location.lng]);
        }
        setSearchTerm(''); // Close results
    };

    if (loading && units.length === 0) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900">
          <div className="text-xl text-gray-300">Connecting to tracking service via backend...</div>
        </div>
      );
    }
     if (error && units.length === 0) {
        const isApiKeyError = error.includes('Invalid API key') || error.includes('API key might be missing');
        return (
            <div className="flex items-center justify-center h-full bg-gray-900 p-8">
                <div className="text-center bg-red-900/50 border border-red-700 rounded-lg p-6 max-w-2xl">
                    <h2 className="text-2xl font-bold text-red-300 mb-2">
                        Connection Error
                    </h2>
                    <p className="text-red-400 mb-4">{error}</p>
                    
                    {isApiKeyError && (
                        <div className="mt-6 text-left text-sm bg-gray-800 p-4 rounded-md">
                            <p className="font-bold text-yellow-300 mb-2">Azione Richiesta (Amministratore):</p>
                            <p className="text-gray-300">
                                Questo errore indica un problema con la chiave API Mapon. La chiave potrebbe essere errata, scaduta o mancante.
                            </p>
                            <p className="font-bold text-green-300 mt-4 mb-2">Soluzione:</p>
                            <p className="text-gray-300">
                               L'amministratore deve configurare la variabile d'ambiente `MAPON_API_KEY` nel pannello di controllo del servizio di hosting (es. Vercel) con una chiave API Mapon valida.
                            </p>
                        </div>
                    )}
                    
                    <button
                        onClick={refreshData}
                        className="mt-6 inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full">
            <div className="flex-1 relative">
                 <div className="absolute top-4 left-4 z-[1000] w-full max-w-sm">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cerca per targa, autista, azienda..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <ul className="mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map(({ unit, client }) => (
                                <li
                                    key={unit.unit_id}
                                    onClick={() => handleSelectUnitFromSearch(unit)}
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                                >
                                    <p className="font-bold text-white">{unit.number}</p>
                                    <p className="text-sm text-gray-400">
                                        {unit.driver} - <span className="text-gray-500">{client?.company}</span>
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <MapContainer center={initialCenter} zoom={6} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                    <MapController coords={flyToCoords} />
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer name="Dark Mode">
                             <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer checked name="Google Maps">
                            <TileLayer
                                attribution="&copy; Google Maps"
                                url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                            />
                        </LayersControl.BaseLayer>
                         <LayersControl.BaseLayer name="Google Satellite">
                            <TileLayer
                                attribution="&copy; Google Maps"
                                url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.Overlay name="Show Traffic">
                             <TileLayer
                                 url="https://{s}.google.com/vt/lyrs=tr&x={x}&y={y}&z={z}&hl=en"
                                 subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                                 opacity={0.7}
                            />
                        </LayersControl.Overlay>
                    </LayersControl>

                    {unitsOnMap.map(unit => (
                        <Marker 
                            key={unit.unit_id} 
                            position={[unit.location.lat, unit.location.lng]}
                            icon={getIcon(unit.ignition, unit.speed)}
                            eventHandlers={{
                                click: () => {
                                    setSelectedUnit(unit);
                                },
                            }}
                        />
                    ))}
                </MapContainer>
            </div>
            {selectedUnit && (
                <UnitDetailPanel 
                    unit={selectedUnit} 
                    onClose={() => setSelectedUnit(null)} 
                />
            )}
        </div>
    );
};
