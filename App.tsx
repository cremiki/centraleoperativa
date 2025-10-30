import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { DataProvider, DataContext } from './contexts/DataContext';

import { Login } from './pages/Login';
import { MapView } from './components/MapView';
import { TicketManager } from './components/TicketManager';
import { DeviceManagement } from './pages/DeviceManagement';
import { AlarmManager } from './components/AlarmManager';
import { HistoricalView } from './components/HistoricalView';
import { Reporting } from './components/Reporting';
import { UserManagement } from './pages/UserManagement';
import { ApiDebugger } from './components/ApiDebugger';
import { ClientManagement } from './pages/ClientManagement';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Role } from './types';

import { MapIcon, TicketIcon, DeviceIcon, HistoryIcon, ReportIcon, UserAdminIcon, DebugIcon, ClientIcon, LogoutIcon } from './components/Icons';

// Fix for default Leaflet icon path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const Nav: React.FC = () => {
    const location = useLocation();
    const { currentUser, logout } = useContext(AuthContext);
    const { error: dataError } = useContext(DataContext);

    if (!currentUser) return null;

    const navItems = [
        { path: '/', label: 'Map View', icon: <MapIcon />, roles: [Role.OPERATOR, Role.ADMINISTRATOR] },
        { path: '/tickets', label: 'Tickets', icon: <TicketIcon />, roles: [Role.OPERATOR, Role.ADMINISTRATOR] },
        { path: '/devices', label: 'Vehicles', icon: <DeviceIcon />, roles: [Role.OPERATOR, Role.ADMINISTRATOR] },
        { path: '/clients', label: 'Clients', icon: <ClientIcon />, roles: [Role.OPERATOR, Role.ADMINISTRATOR] },
        { path: '/history', label: 'History', icon: <HistoryIcon />, roles: [Role.ADMINISTRATOR] },
        { path: '/reports', label: 'Reports', icon: <ReportIcon />, roles: [Role.ADMINISTRATOR] },
        { path: '/users', label: 'Users', icon: <UserAdminIcon />, roles: [Role.ADMINISTRATOR] },
        { path: '/debugger', label: 'API Debugger', icon: <DebugIcon />, roles: [Role.ADMINISTRATOR] },
    ];

    return (
        <nav className="bg-gray-800 shadow-lg">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                     <h1 className="text-xl font-bold text-white">GPS Operations Center</h1>
                      {dataError && (
                         <div className="relative group">
                            <span className="flex h-3 w-3" title="Connection Error">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <div className="absolute top-full mt-2 w-72 p-2 bg-gray-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                <strong>Connection Error:</strong> {dataError}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    {navItems.filter(item => item.roles.includes(currentUser.role)).map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                location.pathname === item.path
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            {item.icon}
                            <span className="ml-2">{item.label}</span>
                        </Link>
                    ))}
                    <div className="flex items-center space-x-4 border-l border-gray-600 pl-4">
                        <div className="text-sm text-gray-300">Welcome, <span className="font-bold">{currentUser.name}</span></div>
                         <button onClick={logout} title="Logout" className="flex items-center text-gray-400 hover:text-white transition-colors">
                           <LogoutIcon />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<div>Already logged in</div>} />
            <Route path="/" element={<ProtectedRoute roles={[Role.ADMINISTRATOR, Role.OPERATOR]}><MapView /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute roles={[Role.ADMINISTRATOR, Role.OPERATOR]}><TicketManager /></ProtectedRoute>} />
            <Route path="/devices" element={<ProtectedRoute roles={[Role.ADMINISTRATOR, Role.OPERATOR]}><DeviceManagement /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute roles={[Role.ADMINISTRATOR, Role.OPERATOR]}><ClientManagement /></ProtectedRoute>} />

            {/* Admin only routes */}
            <Route path="/history" element={<ProtectedRoute roles={[Role.ADMINISTRATOR]}><HistoricalView /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute roles={[Role.ADMINISTRATOR]}><Reporting /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute roles={[Role.ADMINISTRATOR]}><UserManagement /></ProtectedRoute>} />
            <Route path="/debugger" element={<ProtectedRoute roles={[Role.ADMINISTRATOR]}><ApiDebugger /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )
}

const MainLayout: React.FC = () => {
    // API Key modal and related logic has been removed.
    // The application now attempts to connect via the backend proxy immediately.
    // Error handling for a missing/invalid key is done in the DataProvider/MapView.
    return (
        <DataProvider>
            <div className="flex flex-col h-screen font-sans">
                <Nav />
                <main className="flex-1 overflow-hidden relative">
                    <AppRoutes />
                </main>
                <AlarmManager />
            </div>
        </DataProvider>
    );
};

const AppRouter: React.FC = () => {
    const { currentUser, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading session...</div>;
    }

    return (
        <Routes>
            {currentUser ? (
                // User is logged in, show the main application layout.
                <Route path="/*" element={<MainLayout />} />
            ) : (
                // User is not logged in, only allow access to the login page.
                <>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </>
            )}
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <HashRouter>
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    </HashRouter>
  );
};

export default App;
