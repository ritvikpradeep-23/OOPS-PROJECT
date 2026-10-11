import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { getMyProfile, toApiRole, toUiRole, updateMyProfile } from '../services/backend';

const AuthContext = createContext();

const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token && token !== 'local-auth-token') {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                clearSession();
            }
        } else {
            clearSession();
        }
        setLoading(false);
    }, []);

    const login = async ({ email, password }) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, id, name, email: accountEmail, role } = res.data;
        localStorage.setItem('token', token);

        let profile = {};
        try {
            profile = await getMyProfile();
        } catch {
            profile = {};
        }

        const authenticatedUser = {
            id,
            name,
            email: accountEmail,
            role: toUiRole(role),
            apiRole: role,
            phone: profile.phone || '',
            location: profile.location || ''
        };
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        setUser(authenticatedUser);
        return authenticatedUser;
    };

    const register = async ({ name, email, password, role, phone, location }) => {
        const res = await api.post('/auth/register', { name, email, password, phone, location, role: toApiRole(role) });
        return res.data;
    };

    const logout = () => {
        clearSession();
        setUser(null);
    };

    const updateUser = async updates => {
        const merged = { ...user, ...updates };
        const saved = await updateMyProfile({ name: merged.name, phone: merged.phone || null, location: merged.location || null });
        const nextUser = { ...merged, name: saved.name, phone: saved.phone || '', location: saved.location || '' };
        localStorage.setItem('user', JSON.stringify(nextUser));
        setUser(nextUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
