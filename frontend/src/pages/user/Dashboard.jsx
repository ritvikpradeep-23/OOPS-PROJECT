import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import ErrorNote from '../../components/ErrorNote';
import { AlertTriangle, HandHeart, Activity, MapPin, Navigation, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDisasters, getRequests, getResources } from '../../services/backend';
import { useApi } from '../../services/useApi';

const UserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: disasters, error: disasterError } = useApi(getDisasters);
    const { data: requests, error: requestError } = useApi(getRequests);
    const { data: resources, error: resourceError } = useApi(getResources);
    const latestRequest = requests[0];
    const visibleDisasters = disasters.filter(disaster => disaster.status !== 'Resolved').slice(0, 3);
    return <div>
        <PageHeader title={`Welcome back, ${user?.name || ''}`} description="Current relief activity from your application data." badge={{ text: 'Field Responder', color: 'success' }} action={<div style={{ display: 'flex', gap: '0.75rem' }}><button onClick={() => navigate('/user/resources')} className="btn btn-secondary">Resources</button><button onClick={() => navigate('/user/request-help')} className="btn btn-primary">+ Request Help / SOS</button></div>} />
        <ErrorNote message={disasterError || requestError || resourceError} />
        <div className="grid-stats">
            <StatCard title="Active Disasters" value={visibleDisasters.length} icon={<AlertTriangle size={18} />} color="danger" subtitle="Current incident records" onClick={() => navigate('/user/disasters')} />
            <StatCard title="My Requests" value={requests.length} icon={<HandHeart size={18} />} color="warning" subtitle={`${requests.filter(item => item.status === 'Pending').length} pending`} onClick={() => navigate('/user/my-requests')} />
            <StatCard title="Approved Requests" value={requests.filter(item => item.status === 'Approved').length} icon={<Activity size={18} />} color="info" subtitle="Ready for response" onClick={() => navigate('/user/my-requests')} />
            <StatCard title="Resources Available" value={resources.length} icon={<MapPin size={18} />} color="success" subtitle="Current inventory" onClick={() => navigate('/user/resources')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="card"><div className="card-header"><span>Active Disasters</span><button onClick={() => navigate('/user/disasters')} className="btn btn-secondary">View All <ChevronRight size={14} /></button></div><div className="card-body">{visibleDisasters.map(disaster => <div key={disaster.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{disaster.name}</strong><StatusBadge status={disaster.status} /></div><p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.5rem 0' }}>{disaster.location || 'Location not provided'} {disaster.affected ? `• ${disaster.affected} affected` : ''}</p><button onClick={() => navigate('/user/disasters')} className="btn btn-secondary"><Navigation size={14} /> View Routes</button></div>)}{!visibleDisasters.length && <p style={{ color: 'var(--text-secondary)' }}>No active disasters reported.</p>}</div></div>
            <div className="card"><div className="card-header"><span>Latest Request</span><button onClick={() => navigate('/user/my-requests')} className="btn btn-secondary">View All</button></div><div className="card-body">{latestRequest ? <><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{latestRequest.code}</strong><StatusBadge status={latestRequest.status} /></div><h4 style={{ margin: '0.75rem 0' }}>{latestRequest.type}</h4><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{latestRequest.location}</p><button onClick={() => navigate('/user/my-requests')} className="btn btn-primary">Open Request</button></> : <p style={{ color: 'var(--text-secondary)' }}>No requests submitted yet.</p>}</div></div>
        </div>
    </div>;
};

export default UserDashboard;
