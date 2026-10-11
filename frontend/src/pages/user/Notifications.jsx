import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import ErrorNote from '../../components/ErrorNote';
import { Bell } from 'lucide-react';
import { deleteNotification, errorMessage, getNotifications } from '../../services/backend';
import { useApi } from '../../services/useApi';

const Notifications = () => {
    const { data: notifications, error, reload } = useApi(getNotifications);
    const [actionError, setActionError] = useState('');
    const remove = async id => {
        try {
            setActionError('');
            await deleteNotification(id);
            await reload();
        } catch (err) {
            setActionError(errorMessage(err));
        }
    };
    return <div><PageHeader title="System Notifications" description="Recent alerts, warnings, and updates." /><ErrorNote message={error || actionError} /><div className="card"><div className="card-header"><Bell size={18} style={{ marginRight: '0.5rem', display: 'inline-block' }} />Alert Feed</div><div className="card-body" style={{ padding: 0 }}>{notifications.map(notification => <div key={notification.id} style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div style={{ flex: 1, textAlign: 'left' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ fontSize: '0.75rem', color: 'var(--color-info)', fontWeight: 700, textTransform: 'uppercase' }}>{notification.severity}</span><span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(notification.createdAt).toLocaleString()}</span></div><h4 style={{ fontWeight: 600, fontSize: '1rem', color: '#fff', marginBottom: '0.25rem' }}>{notification.title}</h4><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{notification.message}</p></div><button onClick={() => remove(notification.id)} className="btn btn-secondary" style={{ alignSelf: 'flex-start', color: 'var(--color-danger)' }}>Delete</button></div>)}{!notifications.length && <p style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>No notifications available.</p>}</div></div></div>;
};

export default Notifications;
