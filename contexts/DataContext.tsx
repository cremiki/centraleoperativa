import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Unit, Alarm, Ticket, Client, TicketStatus } from '../types';
import { maponService } from '../services/maponService';
import { AuthContext } from './AuthContext';
import { CreateTicketModal } from '../components/CreateTicketModal';

interface DataContextType {
    units: Unit[];
    clients: Client[];
    alarms: Alarm[];
    tickets: Ticket[];
    loading: boolean;
    error: string | null;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    updateTicket: (ticket: Ticket) => void;
    refreshData: () => void;
    alarmToTicket: Alarm | null;
    initiateTicketCreation: (alarm: Alarm) => void;
    cancelTicketCreation: () => void;
    addTicket: (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'status'> & { notes: string }) => void;
    dismissAlarm: (alarmId: string) => void;
}

export const DataContext = createContext<DataContextType>(null!);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useContext(AuthContext);
    const [units, setUnits] = useState<Unit[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [alarmToTicket, setAlarmToTicket] = useState<Alarm | null>(null);
    const lastAlarmCheck = useRef<Date>(new Date(Date.now() - 120 * 60 * 1000));


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch critical data first to render the map
            const fetchedUnits = await maponService.getUnits();
            setUnits(fetchedUnits);

            // Then fetch secondary data. If this fails, the app is still usable.
            const fetchedClients = await maponService.getClients();
            setClients(fetchedClients);
            
        } catch (e: any) {
            console.error("Data fetch failed:", e.message);
            // This error will now be more specific to what failed (either units or clients)
            setError(e.message || 'Failed to fetch data. Check backend configuration.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch data as soon as the provider is mounted.
        // The backend proxy handles authentication (API key).
        fetchData();

        const pollInterval = 5000; // Poll every 5 seconds
        const dataAndAlarmInterval = setInterval(async () => {

            let unitsError: string | null = null;
            let alarmsError: string | null = null;

            // --- Fetch Units Independently ---
            try {
                // Key is no longer needed
                const updatedUnits = await maponService.getUnits();
                setUnits(updatedUnits);
            } catch (e: any) {
                unitsError = e.message || 'Failed to update vehicle data.';
            }

            // --- Fetch Alarms Independently ---
            try {
                const tillTime = new Date();
                // For the initial fetch, use the large 2-hour window.
                // For all subsequent fetches, this will become a fixed 5-minute look-back window.
                const fromTime = lastAlarmCheck.current;
                
                const newAlarms = await maponService.getAlarms(fromTime, tillTime);
                
                // After the first poll, switch to a fixed 5-minute look-back window.
                // This is a robust "trawling" method to catch all alarms, even with significant API delays.
                const nextFromTime = new Date(tillTime.getTime() - 5 * 60 * 1000);
                lastAlarmCheck.current = nextFromTime;

                if (newAlarms.length > 0) {
                    setAlarms(prevAlarms => {
                        const existingIds = new Set(prevAlarms.map(a => a.id));
                        const uniqueNewAlarms = newAlarms.filter(newAlarm => !existingIds.has(newAlarm.id));
                        return uniqueNewAlarms.length > 0 ? [...prevAlarms, ...uniqueNewAlarms] : prevAlarms;
                    });
                }
            } catch (e: any) {
                alarmsError = e.message || 'Failed to fetch alarms.';
            }
            
            // --- Handle and Combine Errors ---
            const combinedError = [unitsError, alarmsError].filter(Boolean).join('; ');
            
            if (combinedError) {
                // We no longer invalidate a key, just display the error from the backend.
                setError(combinedError);
            } else if (error) {
                // If there were no new errors, clear any old error message.
                setError(null);
            }

        }, pollInterval);


        return () => {
            clearInterval(dataAndAlarmInterval);
        };
    }, [fetchData, error]);
    
    const initiateTicketCreation = (alarm: Alarm) => {
        setAlarmToTicket(alarm);
    };

    const cancelTicketCreation = () => {
        setAlarmToTicket(null);
    };

    const dismissAlarm = (alarmId: string) => {
        setAlarms(prevAlarms => prevAlarms.filter(a => a.id !== alarmId));
    };



    const addTicket = (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'status'> & { notes: string }) => {
        const { deviceId, deviceName, summary, alarmId, notes } = ticketData;

        setTickets(prevTickets => {
            const newTicket: Ticket = {
                id: `TICKET-${Date.now()}`,
                alarmId: alarmId,
                deviceId: deviceId,
                deviceName: deviceName,
                status: TicketStatus.OPEN,
                createdAt: new Date().toISOString(),
                summary: summary,
                history: [{ 
                    status: TicketStatus.OPEN, 
                    timestamp: new Date().toISOString(), 
                    notes: notes || 'Ticket created from alarm.', 
                    author: currentUser?.name || "System" 
                }]
            };
            return [newTicket, ...prevTickets];
        });
        
        // Remove the alarm that the ticket was created for
        dismissAlarm(alarmId);
        setAlarmToTicket(null); // Close the modal
    };


    const updateTicket = (ticket: Ticket) => {
        setTickets(tickets.map(t => t.id === ticket.id ? ticket : t));
    };

    const refreshData = () => {
        fetchData();
    };

    return (
        <DataContext.Provider value={{ 
            units, 
            clients, 
            alarms, 
            tickets, 
            loading, 
            error, 
            isMuted, 
            setIsMuted, 
            updateTicket, 
            refreshData,
            alarmToTicket,
            initiateTicketCreation,
            cancelTicketCreation,
            addTicket,
            dismissAlarm
        }}>
            {children}
            {alarmToTicket && <CreateTicketModal alarm={alarmToTicket} />}
        </DataContext.Provider>
    );
};
