import React from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, MapPin, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import ErrorNote from '../../components/ErrorNote';
import { useNavigate } from 'react-router-dom';
import { getDisasters } from '../../services/backend';
import { useApi } from '../../services/useApi';

const Disasters = () => {
    const { data: disasters, error } = useApi(getDisasters);
    const navigate = useNavigate();
    const location = useLocation();
    const search = new URLSearchParams(location.search).get('search')?.toLowerCase() || '';
    const visibleDisasters = disasters.filter(d => `${d.name} ${d.location} ${d.status}`.toLowerCase().includes(search));
    const mappedDisasters = visibleDisasters.filter(disaster => Number.isFinite(Number(disaster.lat)) && Number.isFinite(Number(disaster.lng)));

    return (
        <div>
            <PageHeader
                title="Active Disasters"
                description="Real-time situational intelligence and active warnings across your assigned operational sectors."
                action={<button onClick={() => navigate('/user/request-help')} className="btn btn-primary"><AlertTriangle size={16} /> Report New Incident</button>}
            />

            <ErrorNote message={error} />
            {mappedDisasters.length ? <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
                <MapContainer center={[10.8505, 76.2711]} zoom={7} style={{ height: '350px', width: '100%', zIndex: 0 }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                    {mappedDisasters.map(d => (
                        <Marker key={d.id} position={[d.lat, d.lng]}>
                            <Popup>
                                <strong>{d.name}</strong><br />
                                Status: {d.status} <br />
                                Affected: {d.affected}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div> : <div className="card" style={{ marginBottom: '1.5rem' }}><div className="card-body"><p style={{ color: 'var(--text-secondary)' }}>No saved disaster locations are available.</p></div></div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {visibleDisasters.map(d => (
                    <div key={d.id} className="card" style={{ borderTop: `3px solid ${d.status === 'Critical' ? 'var(--color-danger)' : 'var(--color-warning)'}` }}>
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <StatusBadge status={d.status} />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Updated {d.updated}</span>
                            </div>
                            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '1.1rem' }}>{d.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />{d.location}</p>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1, background: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Affected</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{d.affected}</div>
                                </div>
                                <div style={{ flex: 1, background: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Camps Active</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{d.camps}</div>
                                </div>
                            </div>
                            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`, '_blank', 'noopener,noreferrer')} className="btn btn-secondary" style={{ width: '100%' }}><Navigation size={16} /> View Evacuation Routes</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Disasters;
