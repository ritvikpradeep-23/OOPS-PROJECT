import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ErrorNote from '../../components/ErrorNote';
import { HeartHandshake } from 'lucide-react';
import { applyAsVolunteer, errorMessage, getMyVolunteerApplication, respondToAssignment } from '../../services/backend';
import { useApi } from '../../services/useApi';

const Volunteer = () => {
    const { data: application, loading, error, reload } = useApi(getMyVolunteerApplication, null);
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
    const apply = () => run(applyAsVolunteer);
    const respond = accepted => run(() => respondToAssignment(application.assignment.id, accepted));

    const assignment = application?.assignment;
    const assignmentResponse = assignment?.response || 'Pending';
    const applicationDate = application?.createdAt ? new Date(application.createdAt).toLocaleString() : '';
    const assignmentDate = assignment?.scheduledAt ? new Date(assignment.scheduledAt).toLocaleString() : 'Not scheduled';

    return (
        <div>
            <PageHeader title="Volunteer" description="Apply for volunteer work and manage assignments from administrators." />
            <ErrorNote message={error || actionError} />

            <div className="card">
                <div className="card-header">
                    <HeartHandshake size={18} style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                    Volunteer Application
                </div>
                <div className="card-body">
                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading your application...</p>
                    ) : !application ? (
                        <>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Submit an application to be considered for relief assignments.</p>
                            <button onClick={apply} className="btn btn-primary"><HeartHandshake size={16} /> Apply as Volunteer</button>
                        </>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>{application.role || 'Volunteer'}</strong>
                                <StatusBadge status={application.status || 'Pending'} />
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Applied: {applicationDate}</div>
                            {application.status === 'Rejected' && <p style={{ color: 'var(--color-danger-text)', margin: 0 }}>Your volunteer application was rejected.</p>}
                            {application.status === 'Pending' && <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Your application is awaiting administrator approval.</p>}
                            {application.status === 'Approved' && !assignment && <p style={{ color: 'var(--color-success)', margin: 0 }}>Approved. You will see an assigned task here when one is created.</p>}
                        </div>
                    )}
                </div>
            </div>

            {assignment && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-header">Assigned Task</div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div><strong>Assignment status:</strong> <StatusBadge status={assignmentResponse} /></div>
                            <div><strong>Request:</strong> {assignment.requestId || 'Not provided'}</div>
                            <div><strong>Requirement:</strong> {assignment.requestType || 'Not provided'}</div>
                            <div><strong>Disaster:</strong> {assignment.disasterName || 'Not linked'}</div>
                            <div><strong>Location:</strong> {assignment.location || 'Not provided'}</div>
                            <div><strong>Date/Time:</strong> {assignmentDate}</div>
                            {assignment.latitude && assignment.longitude && <div><strong>Coordinates:</strong> {assignment.latitude}, {assignment.longitude}</div>}
                            {assignmentResponse === 'Pending' && <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}><button onClick={() => respond(true)} className="btn btn-primary">Accept</button><button onClick={() => respond(false)} className="btn btn-secondary">Decline</button></div>}
                            {assignmentResponse === 'Accepted' && <p style={{ color: 'var(--color-success)', margin: 0 }}>You accepted this assignment.</p>}
                            {assignmentResponse === 'Declined' && <p style={{ color: 'var(--color-danger-text)', margin: 0 }}>You declined this assignment.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Volunteer;
