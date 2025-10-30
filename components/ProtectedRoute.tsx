import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
    children: React.ReactElement;
    roles: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { currentUser } = useContext(AuthContext);
    const location = useLocation();

    if (!currentUser) {
        // User not logged in, redirect to login page
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!roles.includes(currentUser.role)) {
        // User is logged in but does not have the required role, redirect to home page
        return <Navigate to="/" replace />;
    }

    return children;
};
