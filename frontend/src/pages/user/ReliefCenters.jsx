import React from 'react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ErrorNote from '../../components/ErrorNote';
import { MapPin, Navigation } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { getCenters } from '../../services/backend';
import { useApi } from '../../services/useApi';

const ReliefCenters = () => {
    const { data: centers, error } = useApi(getCenters);
    return <div>
        <PageHeader title="Relief Centers" description="Verified safe shelters, camps, and hubs near your vicinity." />
        <ErrorNote message={error} />
        {centers.some(center => Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng))) ? <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}><MapContainer center={[Number(centers.find(center => Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng))).lat), Number(centers.find(center => Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng))).lng)]} zoom={7} style={{ height: '260px', width: '100%', zIndex: 0 }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />{centers.filter(center => Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng))).map(center => <Marker key={center.id} position={[Number(center.lat), Number(center.lng)]}><Popup><strong>{center.name}</strong><br />{center.status}</Popup></Marker>)}</MapContainer></div> : <div className="card" style={{ marginBottom: '1.5rem' }}><div className="card-body"><p style={{ color: 'var(--text-secondary)' }}>No saved relief-center locations are available.</p></div></div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>{centers.map(center => <div key={center.id} className="card"><div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{center.name}</span><StatusBadge status={center.status} /></div><div className="card-body"><p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}><MapPin size={14} style={{ display: 'inline', marginRight: '5px' }} />{center.location || 'Location not provided'}</p><div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}><div><span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Capacity</span><span style={{ fontSize: '1rem', fontWeight: 600 }}>{center.capacity || 'Not provided'}</span></div><div><span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Facilities</span><span style={{ fontSize: '1rem', fontWeight: 600 }}>{center.facilities || 'Not provided'}</span></div></div>{center.lat && center.lng && <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`, '_blank', 'noopener,noreferrer')} className="btn btn-secondary"><Navigation size={16} /> Get Directions</button>}</div></div>)}{!centers.length && <div className="card"><div className="card-body"><p style={{ color: 'var(--text-secondary)' }}>No relief centers have been added.</p></div></div>}</div>
    </div>;
};

export default ReliefCenters;
