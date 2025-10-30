import React, { useState, useEffect, useContext } from 'react';
import { Client, Role } from '../types';
import { maponService } from '../services/maponService';
import { AuthContext } from '../contexts/AuthContext';
import { DataContext } from '../contexts/DataContext';

const ClientModal: React.FC<{ client: Client | null; onClose: () => void; onSave: (client: Client) => void; }> = ({ client, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Client, 'id'> & { id?: number }>({
        company: '',
        contactPerson: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (client) {
            setFormData(client);
        }
    }, [client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave({ id: formData.id || 0, ...formData });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1100]">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{client ? 'Edit Client' : 'Add New Client'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 font-bold">Company Name</label>
                        <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                     <div>
                        <label className="block mb-2 font-bold">Contact Person</label>
                        <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                    <div>
                        <label className="block mb-2 font-bold">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                    <div>
                        <label className="block mb-2 font-bold">Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Save Client</button>
                </div>
            </div>
        </div>
    );
};

export const ClientManagement: React.FC = () => {
    const { clients, refreshData } = useContext(DataContext);
    const { currentUser } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const handleSaveClient = async (client: Client) => {
        await maponService.updateClient(client);
        refreshData(); // Refresh all data to ensure consistency
    };

    const handleDeleteClient = async (clientId: number) => {
        if (window.confirm('Are you sure you want to delete this client? This might affect associated vehicles.')) {
            await maponService.deleteClient(clientId);
            refreshData();
        }
    };
    
    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-gray-900 h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Client Management</h1>
                 {currentUser?.role === Role.ADMINISTRATOR && (
                    <button onClick={openAddModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-500">
                        Add New Client
                    </button>
                 )}
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                        <tr>
                            <th className="p-4">Company</th>
                            <th className="p-4">Contact Person</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {clients.map(client => (
                        <tr key={client.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="p-4">{client.company}</td>
                            <td className="p-4">{client.contactPerson}</td>
                            <td className="p-4">{client.email}</td>
                            <td className="p-4">{client.phone}</td>
                            <td className="p-4 space-x-2">
                                <button onClick={() => openEditModal(client)} className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm">Edit</button>
                                {currentUser?.role === Role.ADMINISTRATOR && (
                                    <button onClick={() => handleDeleteClient(client.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 text-sm">Delete</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <ClientModal client={editingClient} onClose={() => setIsModalOpen(false)} onSave={handleSaveClient} />}
        </div>
    );
};
