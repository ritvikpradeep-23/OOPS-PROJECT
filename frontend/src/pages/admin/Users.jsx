import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { Shield, UserPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createUser, deleteUser, errorMessage, getUsers } from '../../services/backend';
import { useApi } from '../../services/useApi';

const Users = () => {
    const { user: currentUser } = useAuth();
    const { data: users, error: loadError, reload } = useApi(getUsers);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
    const [error, setError] = useState('');

    const saveUser = async event => {
        event.preventDefault();
        if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
            setError('Enter a name, email, and password with at least 6 characters.');
            return;
        }
        try {
            await createUser({ ...form, name: form.name.trim(), email: form.email.trim() });
            setForm({ name: '', email: '', password: '', role: 'USER' });
            setError('');
            setAdding(false);
            await reload();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    const revoke = async user => {
        if (!window.confirm(`Revoke access for ${user.name}? Their requests, notifications and volunteer profile will be deleted.`)) return;
        try {
            await deleteUser(user.id);
            setError('');
            await reload();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    return (
        <div>
            <PageHeader title="User Fleet Management" description="Authorize roles, suspend assets, and manage global credentials." action={<button onClick={() => setAdding(value => !value)} className="btn btn-primary"><UserPlus size={16} /> Add Personnel</button>} />
            {(error || loadError) && <p role="alert" style={{ marginBottom: '1rem', color: 'var(--color-danger-text)' }}>{error || loadError}</p>}
            {adding && <form onSubmit={saveUser} className="card" style={{ marginBottom: '1.5rem' }}><div className="card-body"><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><input className="form-input" placeholder="Full name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /><input className="form-input" type="email" placeholder="Email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required /><input className="form-input" type="password" placeholder="Temporary password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} required /><select className="form-input" value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}><option value="USER">User</option><option value="ADMIN">Admin</option></select></div><div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}><button type="submit" className="btn btn-primary">Create Account</button><button type="button" onClick={() => setAdding(false)} className="btn btn-secondary">Cancel</button></div></div></form>}
            <div className="card"><div className="card-header"><Shield size={18} style={{ marginRight: '0.5rem', display: 'inline-block' }} />Active Access Matrix</div><div className="card-body"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}><thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)' }}><th style={{ padding: '1rem' }}>Account Name</th><th style={{ padding: '1rem' }}>Auth Tier</th><th style={{ padding: '1rem' }}>Status</th><th style={{ padding: '1rem' }}>Actions</th></tr></thead><tbody>{users.map(user => <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}<div style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{user.email}</div></td><td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.role === 'ADMIN' ? 'Command (Admin)' : 'Field Responder'}</td><td style={{ padding: '1rem' }}><StatusBadge status="Active" /></td><td style={{ padding: '1rem' }}>{user.id !== currentUser?.id && <button onClick={() => revoke(user)} className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', color: 'var(--color-danger)' }}><Trash2 size={14} /> Revoke</button>}</td></tr>)}</tbody></table>{!users.length && <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No registered accounts.</p>}</div></div>
        </div>
    );
};

export default Users;
