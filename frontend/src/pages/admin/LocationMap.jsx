import React from 'react';
import PageHeader from '../../components/PageHeader';
import ErrorNote from '../../components/ErrorNote';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { getCenters, getDisasters, getRequests, getResources, getVolunteers } from '../../services/backend';
import { useApi } from '../../services/useApi';

const knownCoordinates = [
    { terms: ['wayanad', 'meppadi', 'chooralmala'], position: [11.548, 76.086] },
    { terms: ['alappuzha', 'kuttanad'], position: [9.498, 76.338] },
    { terms: ['kochi', 'ernakulam'], position: [9.9312, 76.2673] },
    { terms: ['kozhikode'], position: [11.2588, 75.7804] },
    { terms: ['changanassery'], position: [9.4422, 76.5445] },
    { terms: ['idukki', 'periyar'], position: [9.852, 76.965] }
];

const toCoordinate = value => (value === null || value === undefined || value === '' ? NaN : Number(value));

const getCoordinates = item => {
    const latitude = toCoordinate(item.lat ?? item.latitude);
    const longitude = toCoordinate(item.lng ?? item.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) return [latitude, longitude];
    const searchableText = `${item.name || ''} ${item.location || ''} ${item.address || ''}`.toLowerCase();
    return knownCoordinates.find(entry => entry.terms.some(term => searchableText.includes(term)))?.position || null;
};

const withPosition = (item, type, details = {}) => {
    const position = getCoordinates(item);
    return position ? { ...item, ...details, type, position } : null;
};

const LocationMap = () => {
    const { data: requests, error: requestError } = useApi(getRequests);
    const { data: disasters, error: disasterError } = useApi(getDisasters);
    const { data: resources, error: resourceError } = useApi(getResources);
    const { data: reliefCenters, error: centerError } = useApi(getCenters);
    const { data: volunteers, error: volunteerError } = useApi(getVolunteers);
    const disasterMarkers = disasters.map(disaster => withPosition(disaster, 'Disaster', { details: `Status: ${disaster.status || 'Unknown'}` })).filter(Boolean);
    const resourceMarkers = resources.map(resource => withPosition(resource, 'Resource Hub', { details: `Status: ${resource.status || 'Unknown'}` })).filter(Boolean);
    const centerMarkers = reliefCenters.map(center => withPosition(center, 'Relief Center', { details: `Status: ${center.status || 'Unknown'}` })).filter(Boolean);
    const requestMarkers = requests.map(request => withPosition(request, 'Help Request', { name: request.code, details: `Status: ${request.status || 'Pending'} | ${request.type || 'Assistance'}` })).filter(Boolean);
    const assignmentMarkers = volunteers.map(volunteer => volunteer.assignment && withPosition({ ...volunteer.assignment, name: volunteer.assignment.requestId }, 'Volunteer Assignment', { id: `assignment-${volunteer.id}`, details: `Volunteer: ${volunteer.userName} | Response: ${volunteer.assignment.response || 'Pending'}` })).filter(Boolean);
    const markers = [...disasterMarkers, ...centerMarkers, ...resourceMarkers, ...requestMarkers, ...assignmentMarkers];
    const mapCenter = markers.length ? markers[0].position : [0, 0];

    return (
        <div>
            <PageHeader title="Location Map" description="View active disasters, help requests, relief centers, and resource hubs." />
            <ErrorNote message={requestError || disasterError || resourceError || centerError || volunteerError} />
            {markers.length ? <div className="card" style={{ overflow: 'hidden' }}>
                <MapContainer center={mapCenter} zoom={7} style={{ height: '560px', width: '100%', zIndex: 0 }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    {markers.map(item => <Marker key={`${item.type}-${item.id}`} position={item.position}><Popup><strong>{item.name || item.id}</strong><br />{item.type}<br />{item.location || item.address || 'Location from saved coordinates'}<br />{item.details}</Popup></Marker>)}
                </MapContainer>
            </div> : <div className="card"><div className="card-body"><p style={{ color: 'var(--text-secondary)' }}>No saved locations are available yet.</p></div></div>}
        </div>
    );
};

export default LocationMap;
