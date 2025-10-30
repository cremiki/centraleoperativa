import React, { useState, useContext } from 'react';
import { Unit, Client, Role } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { DataContext } from '../contexts/DataContext';

const DeviceModal: React.FC<{ unit: Unit | null; clients: Client[]; onClose: () => void; onSave: (unit: Partial<Unit>) => void; }> = ({ unit, clients, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Unit>>({
        number: '',
        model: '',
        driver: '',
        driverPhone: '',
        clientId: clients[0]?.id || 0
    });

    React.useEffect(() => {
        if (unit) {
            setFormData(unit);
        }
    }, [unit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'clientId' ? Number(value) : value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1100]">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{unit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 font-bold">Vehicle ID / Plate</label>
                        <input type="text" name="number" value={formData.number} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                     <div>
                        <label className="block mb-2 font-bold">Model</label>
                        <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                    <div>
                        <label className="block mb-2 font-bold">Driver</label>
                        <input type="text" name="driver" value={formData.driver} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                    <div>
                        <label className="block mb-2 font-bold">Driver Phone</label>
                        <input type="tel" name="driverPhone" value={formData.driverPhone || ''} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                    <div>
                        <label className="block mb-2 font-bold">Client</label>
                        <select name="clientId" value={formData.clientId} onChange={handleChange} className="w-full p-2 rounded bg-gray-700">
                           {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Save Vehicle</button>
                </div>
            </div>
        </div>
    );
};


export const DeviceManagement: React.FC = () => {
    const { units, clients, refreshData } = useContext(DataContext);
    const { currentUser } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

    const handleSave = (unit: Partial<Unit>) => {
        console.log("Saving unit", unit);
        // MOCK SAVE: In a real app, this would call a service method
        // maponService.updateUnit(unit).then(() => refreshData());
        alert("Vehicle data saved (mock).");
        refreshData();
    };
    
    const handleDelete = (unitId: number) => {
        if(window.confirm("Are you sure? This cannot be undone.")) {
            console.log("Deleting unit", unitId);
            // MOCK DELETE: maponService.deleteUnit(unitId).then(() => refreshData());
             alert("Vehicle deleted (mock).");
             refreshData();
        }
    };

    const openEditModal = (unit: Unit) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingUnit(null);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-gray-900 h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Vehicle Management</h1>
                {currentUser?.role === Role.ADMINISTRATOR && (
                    <button onClick={openAddModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-500">
                        Add New Vehicle
                    </button>
                )}
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                        <tr>
                            <th className="p-4">Vehicle ID</th>
                            <th className="p-4">Model</th>
                            <th className="p-4">Client</th>
                            <th className="p-4">Driver</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {units.map(unit => {
                            const client = clients.find(c => c.id === unit.clientId);
                            return (
                                <tr key={unit.unit_id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-4 font-semibold">{unit.number}</td>
                                    <td className="p-4">{unit.model}</td>
                                    <td className="p-4">{client?.company || 'N/A'}</td>
                                    <td className="p-4">{unit.driver}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${unit.ignition ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {unit.ignition ? 'Active' : 'Stopped'}
                                        </span>
                                    </td>
                                    <td className="p-4 space-x-2">
                                         <button onClick={() => openEditModal(unit)} className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm">Edit</button>
                                        {currentUser?.role === Role.ADMINISTRATOR && (
                                             <button onClick={() => handleDelete(unit.unit_id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 text-sm">Delete</button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <DeviceModal unit={editingUnit} clients={clients} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </div>
    );
};
