import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import ErrorNote from '../../components/ErrorNote';
import { AlertTriangle, FileText, Package, MapPin, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDisasters, getRequests, getResources, getVolunteers } from '../../services/backend';
import { useApi } from '../../services/useApi';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: disasters, error: disasterError } = useApi(getDisasters);
    const { data: requests, error: requestError } = useApi(getRequests);
    const { data: resources, error: resourceError } = useApi(getResources);
    const { data: volunteers, error: volunteerError } = useApi(getVolunteers);
    const pendingRequests = requests.filter(request => request.status === 'Pending');
    const activeDisasters = disasters.filter(disaster => disaster.status !== 'Resolved');
    const recentRequests = requests.slice(0, 3);
    return <div>
        <PageHeader title={`Welcome back, ${user?.name || ''}`} description="Current operational data from this frontend and connected API." badge={{ text: 'HQ Active', color: 'danger' }} action={<div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => navigate('/admin/location-map')} className="btn btn-secondary">Location Map</button><button onClick={() => navigate('/admin/notifications')} className="btn btn-primary">Broadcast</button></div>} />
        <ErrorNote message={disasterError || requestError || resourceError || volunteerError} />
        <div className="grid-stats">
            <StatCard title="Active disasters" value={activeDisasters.length} icon={<AlertTriangle size={18} />} color="danger" subtitle={`${disasters.length} total records`} onClick={() => navigate('/admin/manage-disasters')} />
            <StatCard title="Pending requests" value={pendingRequests.length} icon={<FileText size={18} />} color="warning" subtitle={`${requests.length} total requests`} onClick={() => navigate('/admin/relief-requests')} />
            <StatCard title="Resources" value={resources.length} icon={<Package size={18} />} color="info" subtitle="Current inventory records" onClick={() => navigate('/admin/resources')} />
            <StatCard title="Volunteers" value={volunteers.length} icon={<Users size={18} />} color="success" subtitle={`${volunteers.filter(item => item.status === 'Active').length} active`} onClick={() => navigate('/admin/volunteers')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card"><div className="card-header"><span>Recent Requests</span><button onClick={() => navigate('/admin/relief-requests')} className="btn btn-secondary">View All <ChevronRight size={14} /></button></div><div className="card-body">{recentRequests.map(request => <div key={request.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{request.code}</strong><StatusBadge status={request.status} /></div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0' }}>{request.type} · {request.userName || request.userEmail || 'Requester'}</p><button onClick={() => navigate('/admin/relief-requests')} className="btn btn-secondary">Review</button></div>)}{!recentRequests.length && <p style={{ color: 'var(--text-secondary)' }}>No requests recorded.</p>}</div></div>
            <div className="card"><div className="card-header"><span>Current Disasters</span><button onClick={() => navigate('/admin/manage-disasters')} className="btn btn-secondary">Manage <ChevronRight size={14} /></button></div><div className="card-body">{disasters.slice(0, 3).map(disaster => <div key={disaster.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{disaster.name}</strong><StatusBadge status={disaster.status} /></div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{disaster.location || 'Location not provided'}</p></div>)}{!disasters.length && <p style={{ color: 'var(--text-secondary)' }}>No disasters reported.</p>}</div></div>
        </div>
        <div className="card" style={{ marginTop: '1.5rem' }}><div className="card-header"><span>Operational Map</span><button onClick={() => navigate('/admin/location-map')} className="btn btn-primary"><MapPin size={14} /> Open Map</button></div><div className="card-body"><p style={{ color: 'var(--text-secondary)' }}>Map markers are available for stored disasters, requests, resources, and relief centers.</p></div></div>
    </div>;
};

export default AdminDashboard;
