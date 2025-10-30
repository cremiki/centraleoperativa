import React, { useState, useContext, useMemo } from 'react';
import { Alarm, TicketStatus } from '../types';
import { DataContext } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import { CloseIcon }  from './Icons';

export const CreateTicketModal: React.FC<{ alarm: Alarm }> = ({ alarm }) => {
    const { units, clients, cancelTicketCreation, addTicket } = useContext(DataContext);
    const { predefinedNotes } = useContext(AuthContext);
    const [notes, setNotes] = useState('');

    const unit = useMemo(() => units.find(u => u.unit_id === alarm.deviceId), [units, alarm.deviceId]);
    const client = useMemo(() => clients.find(c => c.id === unit?.clientId), [clients, unit]);

    const handleAddPredefinedNote = (text: string) => {
        setNotes(prev => prev ? `${prev}\n- ${text}` : `- ${text}`);
    };

    const handleCreateTicket = () => {
        if (!unit) return;
        addTicket({
            alarmId: alarm.id,
            deviceId: unit.unit_id,
            deviceName: unit.number,
            summary: alarm.message,
            notes: notes.trim()
        });
        // addTicket will close the modal by setting alarmToTicket to null
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1200]">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Create Ticket from Alarm</h2>
                    <button onClick={cancelTicketCreation} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                </div>
                
                {/* Pre-populated Info */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 bg-gray-900/50 p-4 rounded-md text-sm">
                    <div className="font-bold text-gray-400">Vehicle:</div>
                    <div>{unit?.number || 'Loading...'}</div>
                    <div className="font-bold text-gray-400">Client:</div>
                    <div>{client?.company || 'Loading...'}</div>
                    <div className="font-bold text-gray-400 col-span-2">Alarm:</div>
                    <div className="col-span-2">{alarm.message}</div>
                </div>

                {/* Notes section */}
                <div>
                    <label htmlFor="ticket-notes" className="block mb-2 font-bold">Notes</label>
                    <textarea
                        id="ticket-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 h-32 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add notes about the alarm and actions taken..."
                    ></textarea>
                </div>

                {/* Predefined notes buttons */}
                <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-400">Add Predefined Note:</h3>
                    <div className="flex flex-wrap gap-2">
                        {predefinedNotes.map(note => (
                            <button
                                key={note.id}
                                onClick={() => handleAddPredefinedNote(note.text)}
                                className="px-3 py-1 bg-gray-600 text-sm rounded hover:bg-gray-500 transition-colors"
                            >
                                {note.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={cancelTicketCreation} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                    <button onClick={handleCreateTicket} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Create Ticket</button>
                </div>
            </div>
        </div>
    );
};
