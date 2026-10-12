import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, AlertTriangle, Eye, ShieldCheck, Siren, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessage, getPublicStats } from '../../services/backend';
import { BROWSER_ONLY } from '../../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('user');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, logout } = useAuth();
    const [applicationCounts, setApplicationCounts] = useState({ centers: 0, assisted: 0, fulfillment: 0, deployments: 0 });

    useEffect(() => {
        getPublicStats()
            .then(stats => setApplicationCounts({
                centers: stats.centers,
                assisted: stats.assisted,
                fulfillment: stats.resolvedDisasters,
                deployments: stats.activeVolunteers
            }))
            .catch(() => {});
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Enter your email and password to continue.');
            return;
        }
        setError('');
        try {
            const user = await login({ email: email.trim(), password });
            if (user.role !== role.toUpperCase()) {
                logout();
                setError(`These credentials are registered for the ${user.role === 'ADMIN' ? 'admin' : 'user'} role.`);
                return;
            }
            if (user.role === 'ADMIN') navigate('/admin/dashboard');
            else navigate('/user/dashboard');
        } catch (error) {
            setError(errorMessage(error));
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <ShieldAlert size={24} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>Resilio <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginLeft: '0.5rem' }}>V4.8</span></h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Disaster Relief Resource & Logistics Console</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }}></div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>{applicationCounts.deployments} active deployments right now</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255, 0.05)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Kerala Hubs & West Coast</span>
                    </div>
                </div>

                <h1 className="auth-title">
                    Coordinate relief before <span>every second</span> is gone.
                </h1>

                <p className="auth-subtitle">
                    Resilio connects verified field volunteers, medical responders, and municipal relief depots onto a zero-latency spatial map. Help reaches precise coordinates faster.
                </p>

                <div className="auth-stats">
                    <div className="auth-stat-item">
                        <h4><Siren size={14} /> RELIEF CENTERS</h4>
                        <p>{applicationCounts.centers} <span>registered centers</span></p>
                    </div>
                    <div className="auth-stat-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '1.5rem' }}>
                        <h4><ShieldCheck size={14} /> ASSISTED</h4>
                        <p>{applicationCounts.assisted} <span style={{ color: 'var(--text-secondary)' }}>completed requests</span></p>
                    </div>
                    <div className="auth-stat-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '1.5rem' }}>
                        <h4><ShieldAlert size={14} /> FULFILLMENT</h4>
                        <p>{applicationCounts.fulfillment} <span style={{ color: 'var(--text-secondary)' }}>resolved disasters</span></p>
                    </div>
                    <div style={{ gridColumn: 'span 3', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }}></div>
                            Spatial Mesh: Latency 14ms (P2P Mesh + Starlink)
                        </div>
                        <div>Region Code: KL-IN-078</div>
                    </div>
                </div>

                <div className="auth-beacon">
                    <div style={{ background: 'var(--color-danger)', width: '32px', height: '32px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Siren size={18} color="#fff" />
                    </div>
                    <div className="auth-beacon-text">
                        <h5>Immediate Distress or SOS?</h5>
                        <p>Bypass authentication to transmit emergency coordinate beacons directly to Coast Guard & First Responders.</p>
                    </div>
                    <button onClick={() => window.alert('Emergency beacon request queued for responder dispatch.')} style={{ marginLeft: '1rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--color-danger)', color: 'var(--color-danger-text)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Emergency Beacon
                    </button>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-card-header">
                        <div className="auth-card-lock">
                            <span>Authorized Entry</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-success)' }}><Lock size={12} /> TLS 1.3 256-Bit</span>
                        </div>
                        <h3>Access Command Portal</h3>
                        <p>Enter responder ID credentials or select emergency role.</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="role-toggle">
                            <button
                                type="button"
                                className={`role-btn ${role === 'user' ? 'active' : ''}`}
                                onClick={() => setRole('user')}
                            >
                                <AlertTriangle size={18} /> Citizen / Volunteer
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                                onClick={() => setRole('admin')}
                            >
                                <ShieldCheck size={18} /> Admin / Officer
                            </button>
                        </div>

                        {role === 'user' && (
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--color-info-text)' }}>
                                    <AlertTriangle size={16} /> Quick OTP login and Field Dispatch available for volunteers
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-info)', background: 'rgba(59, 130, 246, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>TIER-1</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Responder ID / Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                                    <ShieldAlert size={16} />
                                </div>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="resp-942@resilio.org" className="form-input" style={{ paddingLeft: '2.5rem' }} />
                            </div>
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Access Key / Password</label>
                                <button type="button" onClick={() => window.alert('Password recovery is ready for the backend auth flow.')} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: 0 }}>Forgot Key?</button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                                    <Lock size={16} />
                                </div>
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" className="form-input" style={{ paddingLeft: '2.5rem' }} />
                                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', cursor: 'pointer', background: 'none', border: 0 }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand-primary)' }} />
                                Remember this terminal
                            </label>
                            <span style={{ color: 'var(--text-tertiary)' }}>Offline sync enabled</span>
                        </div>

                        {error && <p role="alert" style={{ color: 'var(--color-danger-text)', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                            Sign In to Dashboard &rarr;
                        </button>
                    </form>

                    <div className="auth-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', marginTop: '2rem' }}>
                        <p>New field responder? <Link to="/register" style={{ color: 'var(--brand-primary)' }}>Register deployment details</Link></p>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}><Lock size={12} /> Emergency Operations Center: ops@resilio.org</p>
                        {BROWSER_ONLY && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textAlign: 'center' }}>Demo mode: accounts and data are saved on this device only.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
