import React, { useEffect, useContext } from 'react';
import { Alarm } from '../types';
import { DataContext } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import { SoundOnIcon, SoundOffIcon, CloseIcon } from './Icons';

const useAlarmSound = (isPlaying: boolean, soundData: string) => {
    useEffect(() => {
        // If not playing or no sound data is provided, do nothing.
        if (!isPlaying || !soundData || typeof window.Audio === 'undefined') {
            return;
        }

        // Create a new audio object for this alarm instance.
        const audio = new Audio(soundData);
        audio.loop = true;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Don't log an error if the play promise is aborted by our own code (e.g., by pausing).
                if (error.name !== 'AbortError') {
                    console.error("Audio play failed, user interaction might be required.", error);
                }
            });
        }

        // The cleanup function is crucial. It runs when the effect's dependencies change
        // (i.e., when isPlaying becomes false or soundData changes), or when the component unmounts.
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, [isPlaying, soundData]); // Re-run the effect if the playing state or the sound source changes.
};

export const AlarmManager: React.FC = () => {
    const { alarms, initiateTicketCreation, isMuted, setIsMuted, dismissAlarm } = useContext(DataContext);
    const { selectedSound } = useContext(AuthContext);

    const hasAlarms = alarms.length > 0;
    useAlarmSound(hasAlarms && !isMuted, selectedSound.data);

    if (!hasAlarms) {
        return null;
    }

    return (
        <div className="fixed bottom-0 right-0 p-6 flex flex-col items-end space-y-4 z-[1000]">
            {alarms.map(alarm => (
                <div key={alarm.id} className="relative bg-red-600 text-white rounded-lg shadow-2xl p-6 w-full max-w-sm animate-pulse border-4 border-red-400">
                    <button 
                        onClick={() => dismissAlarm(alarm.id)} 
                        className="absolute top-2 right-2 p-1 text-white/70 hover:text-white transition-colors"
                        aria-label="Dismiss alarm"
                    >
                        <CloseIcon />
                    </button>
                    <h2 className="text-2xl font-extrabold mb-2">ALARM!</h2>
                    <p className="text-lg font-semibold">{alarm.message}</p>
                    <p className="text-sm opacity-90">Type: {alarm.type}</p>
                    <p className="text-sm opacity-90">Time: {new Date(alarm.timestamp).toLocaleString()}</p>
                    <button
                        onClick={() => initiateTicketCreation(alarm)}
                        className="mt-4 w-full bg-white text-red-600 font-bold py-2 px-4 rounded-md hover:bg-red-100 transition-colors duration-200"
                    >
                        Acknowledge & Create Ticket
                    </button>
                </div>
            ))}
             <div className="bg-gray-800 p-2 rounded-full shadow-lg border-2 border-gray-600">
                 <button 
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute Sound" : "Mute Sound"}
                    className="flex items-center justify-center h-12 w-12 text-white rounded-full hover:bg-gray-700 transition-colors"
                    aria-label={isMuted ? "Unmute alarm sound" : "Mute alarm sound"}
                >
                    {isMuted ? <SoundOffIcon /> : <SoundOnIcon />}
                </button>
            </div>
        </div>
    );
};
