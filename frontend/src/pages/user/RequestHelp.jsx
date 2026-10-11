import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { HandHeart, Send } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { createRequest, errorMessage } from '../../services/backend';

const LocationSelector = ({ position, onSelect }) => {
    useMapEvents({ click: event => onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng }) });
    return position ? <Marker position={[position.latitude, position.longitude]} /> : null;
};

const RequestHelp = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ type: 'Medical Assistance', priority: 'high', location: '', people: '1', details: '', latitude: '', longitude: '' });
    const [message, setMessage] = useState('');

    const update = event => setForm({ ...form, [event.target.name]: event.target.value });
    const setPosition = position => setForm(current => ({ ...current, ...position, location: current.location || `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` }));
    const captureLocation = () => {
        if (!navigator.geolocation) {
            setMessage('Location capture is not available in this browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            position => setPosition({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            () => setMessage('Unable to capture your location. Select a point on the map instead.')
        );
    };
    const handleSubmit = async event => {
        event.preventDefault();
        if (!form.location.trim() || !form.people || Number(form.people) < 1) {
            setMessage('Add a location and at least one affected person.');
            return;
        }
        try {
            await createRequest(form);
            setMessage('Request submitted and added to your request pipeline.');
            setForm({ type: 'Medical Assistance', priority: 'high', location: '', people: '1', details: '', latitude: '', longitude: '' });
        } catch (error) {
            setMessage(errorMessage(error));
        }
    };
    return (
        <div>
            <PageHeader
                title="Request Help or SOS"
                description="Submit an emergency request for medical, food, or evacuation assistance."
            />

            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card-header">
                    <HandHeart size={18} style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                    Emergency Assistance Form
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Type of Emergency</label>
                                <select name="type" value={form.type} onChange={update} className="form-input">
                                    <option>Medical Assistance</option>
                                    <option>Food & Water Ration</option>
                                    <option>Evacuation Support</option>
                                    <option>Shelter Required</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Priority Level</label>
                                <select name="priority" value={form.priority} onChange={update} className="form-input">
                                    <option value="high">Critical (Life Threatening)</option>
                                    <option value="medium">High (Needs immediate attention)</option>
                                    <option value="low">Standard</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Specific Location / Landmark</label>
                            <input name="location" value={form.location} onChange={update} type="text" className="form-input" placeholder="e.g. Near St. Mary's Church, North Block" />
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                                <button type="button" onClick={captureLocation} className="btn btn-secondary">Use My Location</button>
                                {form.latitude && <span style={{ alignSelf: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}</span>}
                            </div>
                            <MapContainer center={[10.8505, 76.2711]} zoom={7} style={{ height: '180px', width: '100%', marginTop: '0.75rem', zIndex: 0 }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                <LocationSelector position={form.latitude ? { latitude: Number(form.latitude), longitude: Number(form.longitude) } : null} onSelect={setPosition} />
                            </MapContainer>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Number of People Affected</label>
                            <input name="people" value={form.people} onChange={update} type="number" min="1" className="form-input" placeholder="e.g. 4" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Additional Details / Needs</label>
                            <textarea name="details" value={form.details} onChange={update} className="form-input" rows="4" placeholder="Describe specific needs (e.g. require insulin, infant formula, etc.)"></textarea>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" onClick={() => navigate('/user/dashboard')} className="btn btn-secondary">Cancel</button>
                            <button type="submit" className="btn btn-primary"><Send size={16} /> Submit SOS</button>
                        </div>
                        {message && <p role="status" style={{ marginTop: '1rem', color: 'var(--color-info-text)' }}>{message}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestHelp;
