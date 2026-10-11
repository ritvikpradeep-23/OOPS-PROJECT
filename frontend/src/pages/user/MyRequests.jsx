import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ErrorNote from '../../components/ErrorNote';
import { Archive, Edit, Trash2 } from 'lucide-react';
import { completeRequest, deleteRequest, errorMessage, getRequests, updateRequest } from '../../services/backend';
import { useApi } from '../../services/useApi';

const MyRequests = () => {
    const { data: requests, error, reload } = useApi(getRequests);
    const [editing, setEditing] = useState(null);
    const [actionError, setActionError] = useState('');

    const run = async action => {
        try {
            setActionError('');
            await action();
            await reload();
        } catch (err) {
            setActionError(errorMessage(err));
        }
    };
    const remove = request => { if (window.confirm(`Delete ${request.code}?`)) run(() => deleteRequest(request.id)); };
    const save = event => { event.preventDefault(); run(async () => { await updateRequest(editing.id, editing); setEditing(null); }); };
    const complete = id => run(() => completeRequest(id));

    return <div><PageHeader title="My Requests" description="Track the status of your emergency SOS and supply requests." /><ErrorNote message={error || actionError} />{editing && <form onSubmit={save} className="card" style={{ marginBottom: '1.5rem' }}><div className="card-body"><div style={{ display: 'grid', gap: '1rem' }}><select className="form-input" value={editing.type} onChange={event => setEditing({ ...editing, type: event.target.value })}><option>Medical Assistance</option><option>Food & Water Ration</option><option>Evacuation Support</option><option>Shelter Required</option></select><input className="form-input" value={editing.location || ''} onChange={event => setEditing({ ...editing, location: event.target.value })} placeholder="Location" required /><input className="form-input" type="number" min="1" value={editing.people || 1} onChange={event => setEditing({ ...editing, people: event.target.value })} required /><textarea className="form-input" value={editing.details || ''} onChange={event => setEditing({ ...editing, details: event.target.value })} rows="3" placeholder="Details" /></div><div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}><button type="submit" className="btn btn-primary">Save</button><button type="button" onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button></div></div></form>}<div className="card"><div className="card-header"><Archive size={18} style={{ marginRight: '0.5rem', display: 'inline-block' }} />Active Pipeline</div><div className="card-body"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}><thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)' }}><th style={{ padding: '1rem' }}>Request ID</th><th style={{ padding: '1rem' }}>Type</th><th style={{ padding: '1rem' }}>Submitted On</th><th style={{ padding: '1rem' }}>Status</th><th style={{ padding: '1rem' }}>Actions</th></tr></thead><tbody>{requests.map(request => <tr key={request.id}><td style={{ padding: '1rem', fontWeight: 600 }}>{request.code}</td><td style={{ padding: '1rem' }}>{request.type}</td><td style={{ padding: '1rem' }}>{new Date(request.createdAt).toLocaleString()}</td><td style={{ padding: '1rem' }}><StatusBadge status={request.status} /></td><td style={{ padding: '1rem' }}><div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><button onClick={() => window.alert(`${request.code}\n${request.type}\n${request.location}\n${request.details || ''}`)} className="btn btn-secondary">View</button>{request.status === 'Pending' && <button onClick={() => setEditing({ ...request })} className="btn btn-secondary"><Edit size={14} /></button>}{request.status === 'Approved' && <button onClick={() => complete(request.id)} className="btn btn-primary">Complete</button>}<button onClick={() => remove(request)} className="btn btn-secondary" style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table>{!requests.length && <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No requests submitted yet.</p>}</div></div></div>;
};
export default MyRequests;
