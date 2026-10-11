import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ErrorNote from '../../components/ErrorNote';
import { Eye, Filter, Trash2 } from 'lucide-react';
import { approveRequest, assignVolunteerToRequest, completeRequest, deleteRequest, errorMessage, getDisasters, getRequests, getVolunteers, rejectRequest } from '../../services/backend';
import { useApi } from '../../services/useApi';

const ReliefRequests = () => {
    const [filter, setFilter] = useState('All');
    const { data: requests, error, reload } = useApi(getRequests);
    const { data: volunteers } = useApi(getVolunteers);
    const { data: disasters } = useApi(getDisasters);
    const [assignment, setAssignment] = useState(null);
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
    const assignVolunteer = event => {
        event.preventDefault();
        if (!assignment.volunteerId || !assignment.scheduledAt) return;
        run(async () => {
            await assignVolunteerToRequest(assignment.requestId, assignment);
            setAssignment(null);
        });
    };
    const codeOf = id => requests.find(item => item.id === id)?.code || id;
    const visibleRequests = requests.filter(request => filter === 'All' || request.status === filter);
    const approvedVolunteers = volunteers.filter(volunteer => volunteer.status === 'Approved' || volunteer.status === 'Active');
    return <div><PageHeader title="Relief Requests Triage" description="Manage requests and assign approved volunteers to response tasks." /><ErrorNote message={error || actionError} />{assignment && <form onSubmit={assignVolunteer} className="card" style={{ marginBottom: '1.5rem' }}><div className="card-body"><h4 style={{ marginBottom: '1rem' }}>Assign Volunteer to {codeOf(assignment.requestId)}</h4><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><select className="form-input" value={assignment.volunteerId} onChange={event => setAssignment({ ...assignment, volunteerId: event.target.value })} required><option value="">Select approved volunteer</option>{approvedVolunteers.map(volunteer => <option key={volunteer.id} value={volunteer.id}>{volunteer.userName}</option>)}</select><select className="form-input" value={assignment.disasterId} onChange={event => setAssignment({ ...assignment, disasterId: event.target.value })}><option value="">Select disaster</option>{disasters.map(disaster => <option key={disaster.id} value={disaster.id}>{disaster.name}</option>)}</select><input className="form-input" type="datetime-local" value={assignment.scheduledAt} onChange={event => setAssignment({ ...assignment, scheduledAt: event.target.value })} required /></div><div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}><button type="submit" className="btn btn-primary">Save Assignment</button><button type="button" onClick={() => setAssignment(null)} className="btn btn-secondary">Cancel</button></div></div></form>}<div className="card"><div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Global Request Pipeline</span><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Filter size={14} /><select value={filter} onChange={event => setFilter(event.target.value)} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option><option>Completed</option></select></div></div><div className="card-body"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}><thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}><th style={{ padding: '1rem' }}>ID</th><th style={{ padding: '1rem' }}>Requested By</th><th style={{ padding: '1rem' }}>Requirement</th><th style={{ padding: '1rem' }}>Status</th><th style={{ padding: '1rem' }}>Actions</th></tr></thead><tbody>{visibleRequests.map(request => <tr key={request.id} style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '1rem', fontWeight: 600 }}>{request.code}</td><td style={{ padding: '1rem' }}>{request.userName || request.userEmail || 'Requester'}</td><td style={{ padding: '1rem' }}>{request.type}</td><td style={{ padding: '1rem' }}><StatusBadge status={request.status} /></td><td style={{ padding: '1rem' }}><div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><button onClick={() => window.alert(`${request.code}\n${request.type}\n${request.location}\n${request.details || ''}`)} className="btn btn-secondary"><Eye size={14} /> View</button>{request.status === 'Pending' && <><button onClick={() => run(() => approveRequest(request.id))} className="btn btn-primary">Approve</button><button onClick={() => run(() => rejectRequest(request.id))} className="btn btn-secondary">Reject</button></>}{request.status === 'Approved' && <><button onClick={() => setAssignment({ requestId: request.id, volunteerId: '', disasterId: request.disasterId || '', scheduledAt: '' })} className="btn btn-primary">Assign Volunteer</button><button onClick={() => run(() => completeRequest(request.id))} className="btn btn-secondary">Complete</button></>}<button onClick={() => remove(request)} className="btn btn-secondary" style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table>{!visibleRequests.length && <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No requests match this filter.</p>}</div></div></div>;
};

export default ReliefRequests;
