import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, User, Mail, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../services/backend';

const Register = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [error, setError] = useState('');
    const { register, login } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || password.length < 6) {
            setError('Enter your name and email, and use a password with at least 6 characters.');
            return;
        }
        setError('');
        try {
            await register({ name: name.trim(), email: email.trim(), password, role });
            await login({ email: email.trim(), password });
            navigate(role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard');
        } catch (error) {
            setError(errorMessage(error));
        }
    };

    return (
        <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
                <div className="auth-card">
                    <div className="auth-card-header">
                        <div className="auth-card-lock">
                            <span>New Responder Registration</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-success)' }}><Lock size={12} /> TLS 1.3</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldAlert size={22} color="#fff" />
                            </div>
                            <div>
                                <h3 style={{ marginBottom: 0 }}>Create Account</h3>
                                <p>Join the Resilio Relief Coordinator Network</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label className="form-label">Account Role</label>
                            <select value={role} onChange={event => setRole(event.target.value)} className="form-input">
                                <option value="USER">Citizen / Volunteer</option>
                                <option value="ADMIN">Admin / Officer</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                                    <User size={16} />
                                </div>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" className="form-input" style={{ paddingLeft: '2.5rem' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                                    <Mail size={16} />
                                </div>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="responder@resilio.org" className="form-input" style={{ paddingLeft: '2.5rem' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Access Key / Password</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                                    <KeyRound size={16} />
                                </div>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a secure access key" className="form-input" style={{ paddingLeft: '2.5rem' }} />
                            </div>
                        </div>

                        {error && <p role="alert" style={{ color: 'var(--color-danger-text)', fontSize: '0.8rem', marginTop: '1rem' }}>{error}</p>}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                            Register & Deploy &rarr;
                        </button>
                    </form>

                    <div className="auth-links" style={{ marginTop: '1.5rem' }}>
                        <p>Already have credentials? <Link to="/login" style={{ color: 'var(--brand-primary)' }}>Sign in here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
