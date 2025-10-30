import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, Role, AlarmSound, PredefinedNote } from '../types';
import { maponService } from '../services/maponService';

// Mock alarm sounds - using valid, short WAV files encoded in base64
const defaultAlarmSounds: AlarmSound[] = [
    { id: 'classic', name: 'Classic Alarm', data: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSFVb19XgI+Ag/5/f3+AAYCBgYKBg4WIg4WEhYR/f4CAgYGEhYWHh4mIiYmJiYiGhYSEgYGBgIA/Pz4/Pz8/Pz09PTw8PDs7Ozo6Ojk5OTg4ODc3NzY2NjU1Nf8/' },
    { id: 'siren', name: 'Siren', data: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' },
    { id: 'beep', name: 'Beep', data: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBIAAAABAAEARKwAABCxAgAEABAAZGF0YQAYAAAAAADY/t7/yP7S/sr+yP7e/t7+2/7d/t/+3P7g/t/+3P7c/g==' }
];

const defaultPredefinedNotes: PredefinedNote[] = [
    { id: '1', label: 'Falso Allarme', text: 'Contattato il cliente. Confermato falso allarme. Causa: [INSERIRE CAUSA].' },
    { id: '2', label: 'Allarme di Test', text: 'Allarme generato per scopi di test interni.' },
    { id: '3', label: 'Intervento Richiesto', text: 'Allarme verificato. Richiesto intervento delle forze dell\'ordine.' },
    { id: '4', label: 'Contatto Cliente', text: 'Contattato il cliente per verifica. In attesa di riscontro.' },
];

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    selectedSound: AlarmSound;
    alarmSounds: AlarmSound[];
    changeAlarmSound: (soundId: string) => void;
    predefinedNotes: PredefinedNote[];
    savePredefinedNotes: (notes: PredefinedNote[]) => void;
}

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [alarmSounds] = useState<AlarmSound[]>(defaultAlarmSounds);
    const [selectedSound, setSelectedSound] = useState<AlarmSound>(defaultAlarmSounds[0]);
    const [predefinedNotes, setPredefinedNotes] = useState<PredefinedNote[]>(defaultPredefinedNotes);


    const loadSession = useCallback(() => {
        try {
            const storedUser = sessionStorage.getItem('currentUser');
            const storedSoundId = localStorage.getItem('selectedAlarmSoundId');
            const storedNotes = localStorage.getItem('predefinedNotes');

            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }
            if (storedSoundId) {
                const sound = alarmSounds.find(s => s.id === storedSoundId);
                if (sound) setSelectedSound(sound);
            }
            if (storedNotes) {
                setPredefinedNotes(JSON.parse(storedNotes));
            }
        } catch (e) {
            console.error("Failed to load session:", e);
        } finally {
            setLoading(false);
        }
    }, [alarmSounds]);

    useEffect(() => {
        loadSession();
    }, [loadSession]);

    const login = async (email: string, password: string): Promise<void> => {
        setError(null);
        try {
            const user = await maponService.login(email, password);
            if (user) {
                setCurrentUser(user);
                sessionStorage.setItem('currentUser', JSON.stringify(user));
            } else {
                throw new Error("Invalid email or password.");
            }
        } catch (e: any) {
            setError(e.message || "Login failed.");
        }
    };

    const logout = (): void => {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
    };
    
    const changeAlarmSound = (soundId: string) => {
        const sound = alarmSounds.find(s => s.id === soundId);
        if(sound) {
            setSelectedSound(sound);
            localStorage.setItem('selectedAlarmSoundId', soundId);
        }
    };

    const savePredefinedNotes = (notes: PredefinedNote[]) => {
        setPredefinedNotes(notes);
        localStorage.setItem('predefinedNotes', JSON.stringify(notes));
    };

    const value = {
        currentUser,
        loading,
        error,
        login,
        logout,
        selectedSound,
        alarmSounds,
        changeAlarmSound,
        predefinedNotes,
        savePredefinedNotes
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
