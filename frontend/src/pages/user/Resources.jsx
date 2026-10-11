import React from 'react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ErrorNote from '../../components/ErrorNote';
import { Package, Droplets, Zap, Baby } from 'lucide-react';
import { getResources } from '../../services/backend';
import { useApi } from '../../services/useApi';

const Resources = () => {
    const { data: resources, error } = useApi(getResources);
    return (
        <div>
            <PageHeader
                title="Resources & Supplies"
                description="Check inventory availability at local hubs."
            />
            <ErrorNote message={error} />

            <div className="card">
                <div className="card-header">
                    Current Arsenal @ Base Hub
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {resources.map((item, i) => (
                            <div key={i} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                                    {i === 0 ? <Droplets size={24} color="var(--color-info)" /> : i === 1 ? <Zap size={24} color="var(--color-warning)" /> : i === 2 ? <Package size={24} color="var(--color-danger)" /> : <Baby size={24} color="var(--color-success)" />}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>{item.name}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Qty: {item.qty}</p>
                                    <StatusBadge status={item.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Resources;
