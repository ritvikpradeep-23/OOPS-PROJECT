import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ErrorNote from '../../components/ErrorNote';
import { Package, Droplets, Zap, Baby, Plus } from 'lucide-react';
import { RESOURCE_CATEGORIES, createResource, errorMessage, getResources, setResourceQuantity } from '../../services/backend';
import { useApi } from '../../services/useApi';

const emptyShipment = { name: '', category: 'food', quantity: '', location: '', lat: '', lng: '' };

const AdminResources = () => {
    const { data: resources, error, reload } = useApi(getResources);
    const [shipmentOpen, setShipmentOpen] = useState(false);
    const [shipment, setShipment] = useState(emptyShipment);
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
    const adjust = item => {
        const value = window.prompt(`Enter updated quantity for ${item.name}:`, String(item.quantity));
        if (value === null || !value.trim()) return;
        if (!/^\d+$/.test(value.trim())) { setActionError('Quantity must be a whole number.'); return; }
        run(() => setResourceQuantity(item, Number(value.trim())));
    };
    const saveShipment = event => {
        event.preventDefault();
        if (!shipment.name.trim() || !String(shipment.quantity).trim()) return;
        run(async () => {
            await createResource(shipment);
            setShipment(emptyShipment);
            setShipmentOpen(false);
        });
    };
    return (
        <div>
            <PageHeader
                title="Global Asset Inventory"
                description="Manage logistics, incoming donations, and dispatch capabilities."
                action={<button onClick={() => setShipmentOpen(value => !value)} className="btn btn-primary"><Plus size={16} /> Log Incoming Shipment</button>}
            />
            <ErrorNote message={error || actionError} />
            {shipmentOpen && <form onSubmit={saveShipment} className="card" style={{ marginBottom: '1.5rem' }}><div className="card-body"><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><input className="form-input" placeholder="Resource name" value={shipment.name} onChange={event => setShipment({ ...shipment, name: event.target.value })} required /><select className="form-input" value={shipment.category} onChange={event => setShipment({ ...shipment, category: event.target.value })}>{RESOURCE_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select><input className="form-input" type="number" min="0" placeholder="Quantity" value={shipment.quantity} onChange={event => setShipment({ ...shipment, quantity: event.target.value })} required /><input className="form-input" placeholder="Location" value={shipment.location} onChange={event => setShipment({ ...shipment, location: event.target.value })} /><input className="form-input" type="number" step="any" placeholder="Latitude" value={shipment.lat} onChange={event => setShipment({ ...shipment, lat: event.target.value })} /><input className="form-input" type="number" step="any" placeholder="Longitude" value={shipment.lng} onChange={event => setShipment({ ...shipment, lng: event.target.value })} /></div><div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}><button type="submit" className="btn btn-primary">Save Shipment</button><button type="button" onClick={() => setShipmentOpen(false)} className="btn btn-secondary">Cancel</button></div></div></form>}

            <div className="card">
                <div className="card-header">
                    Base Hub Stock Levels
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {resources.map((item, i) => (
                            <div key={item.id} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                                    {i % 4 === 0 ? <Droplets size={24} color="var(--color-info)" /> : i % 4 === 1 ? <Zap size={24} color="var(--color-warning)" /> : i % 4 === 2 ? <Package size={24} color="var(--color-danger)" /> : <Baby size={24} color="var(--color-success)" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>{item.name}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Qty: {item.qty} · {item.category}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <StatusBadge status={item.status} />
                                        <button onClick={() => adjust(item)} style={{ color: 'var(--brand-primary)', fontSize: '0.8rem', fontWeight: 600 }}>Adjust</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {!resources.length && <p style={{ color: 'var(--text-secondary)' }}>No inventory recorded.</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminResources;
