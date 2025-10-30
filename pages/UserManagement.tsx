import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { maponService } from '../services/maponService';

const UserModal: React.FC<{ user: User | null; onClose: () => void; onSave: (user: User) => void; }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<User, 'id'> & { id?: number; password?: string }>({
        name: '',
        email: '',
        role: Role.OPERATOR,
        password: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: '' }); // Don't show existing password
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const userToSave: User = {
            id: formData.id || 0, // Service will assign ID if 0
            name: formData.name,
            email: formData.email,
            role: formData.role,
            password: formData.password || undefined // Only send password if changed
        };
        onSave(userToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1100]">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{user ? 'Edit User' : 'Add New User'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 font-bold">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                    <div>
                        <label className="block mb-2 font-bold">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
                    </div>
                     <div>
                        <label className="block mb-2 font-bold">Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" placeholder={user ? "Leave blank to keep current password" : ""}/>
                    </div>
                    <div>
                        <label className="block mb-2 font-bold">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 rounded bg-gray-700">
                            {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Save User</button>
                </div>
            </div>
        </div>
    );
};

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        maponService.getUsers().then(setUsers);
    }, []);

    const handleSaveUser = async (user: User) => {
        await maponService.updateUser(user);
        const updatedUsers = await maponService.getUsers();
        setUsers(updatedUsers);
    };

    const handleDeleteUser = async (userId: number) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            await maponService.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        }
    };
    
    const openEditModal = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-gray-900 h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">User Management</h1>
                <button onClick={openAddModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-500">
                    Add New User
                </button>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="p-4">{user.name}</td>
                            <td className="p-4">{user.email}</td>
                            <td className="p-4">{user.role}</td>
                            <td className="p-4 space-x-2">
                                <button onClick={() => openEditModal(user)} className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm">Edit</button>
                                <button onClick={() => handleDeleteUser(user.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 text-sm">Delete</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <UserModal user={editingUser} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} />}
        </div>
    );
};
