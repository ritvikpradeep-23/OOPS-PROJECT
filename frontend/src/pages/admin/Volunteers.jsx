import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ErrorNote from '../../components/ErrorNote';
import { Search } from 'lucide-react';
import { errorMessage, getVolunteers, setVolunteerStatus } from '../../services/backend';
import { useApi } from '../../services/useApi';

const Volunteers = () => {
    const [search, setSearch] = useState('');
    const { data: volunteers, error, reload } = useApi(getVolunteers);
    const [actionError, setActionError] = useState('');
    const visible = volunteers.filter(item => `${item.userName} ${item.role}`.toLowerCase().includes(search.toLowerCase()));
    const updateStatus = async (volunteer, status) => {
        try {
            setActionError('');
            await setVolunteerStatus(volunteer.id, status);
            await reload();
        } catch (err) {
            setActionError(errorMessage(err));
        }
    };
    return <div><PageHeader title="Volunteer Applications" description="Review applications and monitor assignment responses." /><ErrorNote message={error || actionError} /><div className="card"><div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Applications</span><div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem' }}><Search size={14} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search applicant..." style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none' }} /></div></div><div className="card-body"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}><thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}><th style={{ padding: '1rem' }}>Applicant</th><th style={{ padding: '1rem' }}>Role</th><th style={{ padding: '1rem' }}>Status</th><th style={{ padding: '1rem' }}>Assignment Response</th><th style={{ padding: '1rem' }}>Actions</th></tr></thead><tbody>{visible.map(volunteer => <tr key={volunteer.id} style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '1rem', fontWeight: 600 }}>{volunteer.userName}</td><td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{volunteer.role}</td><td style={{ padding: '1rem' }}><StatusBadge status={volunteer.status} /></td><td style={{ padding: '1rem' }}>{volunteer.assignment ? <><StatusBadge status={volunteer.assignment.response || 'Pending'} /><div style={{ marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{volunteer.assignment.requestId}</div></> : 'Unassigned'}</td><td style={{ padding: '1rem' }}><div style={{ display: 'flex', gap: '0.4rem' }}>{volunteer.status === 'Pending' && <><button onClick={() => updateStatus(volunteer, 'Approved')} className="btn btn-primary">Approve</button><button onClick={() => updateStatus(volunteer, 'Rejected')} className="btn btn-secondary">Reject</button></>}{volunteer.status === 'Approved' && <button onClick={() => updateStatus(volunteer, 'Active')} className="btn btn-primary">Activate</button>}</div></td></tr>)}</tbody></table>{!visible.length && <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>No volunteer applications found.</p>}</div></div></div>;
};

export default Volunteers;
