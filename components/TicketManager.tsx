import React, { useState, useContext } from 'react';
import { Ticket, TicketStatus, TicketHistoryItem } from '../types';
import { DataContext } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';

interface TicketManagerProps {}

const statusColors: Record<TicketStatus, string> = {
    [TicketStatus.OPEN]: 'bg-red-500',
    [TicketStatus.IN_PROGRESS]: 'bg-yellow-500',
    [TicketStatus.RESOLVED]: 'bg-green-500',
    [TicketStatus.CLOSED]: 'bg-gray-500',
};

const TicketModal: React.FC<{ ticket: Ticket; onClose: () => void; onSave: (ticket: Ticket) => void; authorName: string; }> = ({ ticket, onClose, onSave, authorName }) => {
    const [status, setStatus] = useState(ticket.status);
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        if (status !== ticket.status || notes.trim() !== '') {
            const newHistoryItem: TicketHistoryItem = {
                status: status,
                timestamp: new Date().toISOString(),
                notes: notes || `Status changed to ${status}`,
                author: authorName,
            };
            onSave({ ...ticket, status, history: [newHistoryItem, ...ticket.history] });
        }
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1100]">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Ticket Details: {ticket.id}</h2>
                <div className="space-y-4">
                    <p><strong>Device:</strong> {ticket.deviceName}</p>
                    <p><strong>Summary:</strong> {ticket.summary}</p>
                    <p><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
                    <div>
                        <label className="block mb-2 font-bold">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className="w-full p-2 rounded bg-gray-700">
                            {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 font-bold">Add Note</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 rounded bg-gray-700 h-24" placeholder="Add notes about the update..."></textarea>
                    </div>
                    <div className="mt-6">
                        <h3 className="font-bold text-lg mb-2">History</h3>
                        <div className="max-h-48 overflow-y-auto bg-gray-900 p-3 rounded">
                            {ticket.history.map((item, index) => (
                                <div key={index} className="border-b border-gray-700 pb-2 mb-2">
                                    <p><strong>{item.status}</strong> by {item.author} - <span className="text-sm text-gray-400">{new Date(item.timestamp).toLocaleString()}</span></p>
                                    <p className="text-sm italic">"{item.notes}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export const TicketManager: React.FC<TicketManagerProps> = () => {
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const { tickets, updateTicket } = useContext(DataContext);
    const { currentUser } = useContext(AuthContext);
    
    return (
        <div className="bg-gray-900 h-full p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6 text-white">Ticket Management</h1>
            {tickets.length === 0 ? (
                <p className="text-gray-400">No tickets to display.</p>
            ) : (
                <div className="bg-gray-800 rounded-lg shadow-lg">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                            <tr>
                                <th className="p-4">Ticket ID</th>
                                <th className="p-4">Device</th>
                                <th className="p-4">Summary</th>
                                <th className="p-4">Created At</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {tickets.map(ticket => (
                            <tr key={ticket.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-4 font-mono text-sm">{ticket.id}</td>
                                <td className="p-4">{ticket.deviceName}</td>
                                <td className="p-4">{ticket.summary}</td>
                                <td className="p-4">{new Date(ticket.createdAt).toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full text-white ${statusColors[ticket.status]}`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => setSelectedTicket(ticket)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 text-sm">View/Edit</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedTicket && <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onSave={updateTicket} authorName={currentUser?.name || 'System'} />}
        </div>
    );
};
