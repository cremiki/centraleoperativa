import React, { useContext } from 'react';
import { Unit, Role } from '../types';
import { DataContext } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import { CloseIcon } from './Icons';
import { useNavigate } from 'react-router-dom';

const DetailRow: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={`flex justify-between items-center py-2 border-b border-gray-700 ${className}`}>
        <dt className="text-sm font-medium text-gray-400">{label}</dt>
        <dd className="text-sm text-white font-semibold text-right break-all">{value}</dd>
    </div>
);

const DataBlock: React.FC<{ title: string; data: Record<string, any> | undefined }> = ({ title, data }) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
        <div className="mt-4">
            <h4 className="text-md font-bold text-blue-400 mb-2">{title}</h4>
            <div className="bg-gray-900/50 rounded-md p-3 text-xs font-mono">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span>{JSON.stringify(value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const UnitDetailPanel: React.FC<{ unit: Unit; onClose: () => void }> = ({ unit, onClose }) => {
    const { clients } = useContext(DataContext);
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const client = clients.find(c => c.id === unit.clientId);

    return (
        <div className={`w-96 shadow-2xl flex flex-col z-[1000] text-white animate-slide-in ${unit.isMock ? 'bg-sky-900' : 'bg-gray-800'}`}>
            <header className={`flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700 ${unit.isMock ? 'bg-sky-950' : 'bg-gray-900'}`}>
                <h2 className="text-xl font-bold">{unit.number}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <CloseIcon />
                </button>
            </header>

            <div className="flex-1 p-4 overflow-y-auto">
                {unit.isMock && (
                     <div className="bg-sky-800/50 border border-sky-700 text-sky-200 text-sm rounded-md p-3 mb-6">
                        <p><span className="font-bold">Nota:</span> I dati di cliente e autista per questo veicolo sono dimostrativi.</p>
                    </div>
                )}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">Driver Contact</h3>
                    <dl>
                        <DetailRow label="Name" value={unit.driver} />
                        <DetailRow label="Phone" value={unit.driverPhone || 'N/A'} />
                    </dl>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">Client Information</h3>
                    <dl>
                        <DetailRow label="Company" value={client?.company || 'N/A'} />
                        <DetailRow label="Contact Person" value={client?.contactPerson || 'N/A'} />
                        <DetailRow label="Phone" value={client?.phone || 'N/A'} />
                    </dl>
                </div>
                
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">Vehicle Status</h3>
                    <dl>
                        <DetailRow label="Model" value={unit.model} />
                        <DetailRow label="Status" value={unit.ignition ? `Moving` : 'Stopped'} />
                        <DetailRow label="Speed" value={`${unit.speed} km/h`} />
                        <DetailRow label="Ignition" value={unit.ignition ? 'On' : 'Off'} />
                        <DetailRow label="Supply Voltage" value={unit.supply_voltage ? `${unit.supply_voltage} V` : 'N/A'} />
                        <DetailRow 
                            label="Fuel Level" 
                            value={unit.fuel ? `${unit.fuel.percentage}% (${unit.fuel.litres}L)` : 'N/A'} 
                        />
                        <DetailRow label="Address" value={unit.location.address} />
                        <DetailRow label="Last Update" value={new Date(unit.last_data_update).toLocaleString()} />
                    </dl>
                </div>


                <DataBlock title="CAN Bus Data" data={unit.can} />
                <DataBlock title="Digital Inputs (IO_DIN)" data={unit.io_din} />
                <DataBlock title="Relays" data={unit.relays} />

                 { currentUser?.role === Role.ADMINISTRATOR && (
                    <button 
                        onClick={() => navigate(`/history?deviceId=${unit.unit_id}`)}
                        className="mt-6 w-full bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors duration-200"
                    >
                        View Full History
                    </button>
                )}
            </div>
        </div>
    );
};

// Add this to your global CSS or in a style tag in index.html for the animation
const styles = `
@keyframes slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
.animate-slide-in {
  animation: slide-in 0.3s ease-out forwards;
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
