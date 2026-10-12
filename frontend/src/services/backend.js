import api from './api';

/* ---------- helpers ---------- */

export const errorMessage = error => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.code === 'ERR_NETWORK' || (error?.request && !error?.response)) {
        return 'Cannot reach the server. Make sure the backend is running, then try again.';
    }
    return error?.message || 'Something went wrong. Please try again.';
};

const titleCase = value => String(value || '')
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const num = value => (value === '' || value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value));
const int = value => (num(value) === null ? null : Math.round(num(value)));
const coord = value => value ?? undefined;
const formatDate = value => (value ? new Date(value).toLocaleDateString() : '');

export const requestCode = id => `RH-${id}`;

/* ---------- roles ---------- */

export const toUiRole = role => (role === 'ADMIN' ? 'ADMIN' : 'USER');
export const toApiRole = role => (role === 'ADMIN' ? 'ADMIN' : 'CITIZEN');

/* ---------- disasters ---------- */

const DISASTER_TYPES = ['FLOOD', 'EARTHQUAKE', 'CYCLONE', 'LANDSLIDE', 'FIRE', 'DROUGHT'];

const disasterTypeToApi = text => {
    const upper = String(text || '').toUpperCase();
    return DISASTER_TYPES.find(type => upper.includes(type)) || 'OTHER';
};

// The UI's status labels are stored as status + severity on the backend.
const DISASTER_STATUS_TO_API = {
    Active: { status: 'ACTIVE', severity: 'MEDIUM' },
    Reported: { status: 'ACTIVE', severity: 'LOW' },
    Warning: { status: 'ACTIVE', severity: 'HIGH' },
    Critical: { status: 'ACTIVE', severity: 'CRITICAL' },
    Monitoring: { status: 'CONTAINED', severity: 'MEDIUM' },
    Resolved: { status: 'RESOLVED', severity: 'MEDIUM' }
};

const disasterStatusFromApi = disaster => {
    if (disaster.status === 'RESOLVED') return 'Resolved';
    if (disaster.status === 'CONTAINED') return 'Monitoring';
    if (disaster.severity === 'CRITICAL') return 'Critical';
    if (disaster.severity === 'HIGH') return 'Warning';
    if (disaster.severity === 'LOW') return 'Reported';
    return 'Active';
};

const disasterFromApi = disaster => ({
    id: disaster.id,
    name: disaster.name || titleCase(disaster.type),
    type: disaster.type === 'OTHER' ? (disaster.description || 'Other') : titleCase(disaster.type),
    status: disasterStatusFromApi(disaster),
    affected: disaster.affected ?? '',
    camps: disaster.camps ?? 0,
    location: disaster.location || '',
    lat: coord(disaster.latitude),
    lng: coord(disaster.longitude),
    updated: formatDate(disaster.createdAt),
    createdAt: disaster.createdAt
});

const disasterToApi = form => {
    const type = disasterTypeToApi(form.type);
    const { status, severity } = DISASTER_STATUS_TO_API[form.status] || DISASTER_STATUS_TO_API.Active;
    return {
        name: form.name?.trim(),
        location: form.location?.trim() || null,
        affected: int(form.affected),
        camps: int(form.camps),
        type,
        description: type === 'OTHER' ? form.type?.trim() : null,
        severity,
        status,
        latitude: num(form.lat),
        longitude: num(form.lng)
    };
};

export const getDisasters = async () => (await api.get('/disasters')).data.map(disasterFromApi);
export const saveDisaster = async (form, id) => {
    const res = id ? await api.put(`/disasters/${id}`, disasterToApi(form)) : await api.post('/disasters', disasterToApi(form));
    return disasterFromApi(res.data);
};
export const deleteDisaster = id => api.delete(`/disasters/${id}`);

/* ---------- relief centers ---------- */

const centerStatusFromApi = center => {
    if (center.availability === false) return 'Closed';
    if (center.capacity > 0 && center.occupied >= center.capacity) return 'Full';
    return 'Active';
};

const centerFromApi = center => ({
    id: center.id,
    name: center.name,
    location: center.location || '',
    capacity: center.capacity,
    occupied: center.occupied,
    facilities: center.facilities || '',
    status: centerStatusFromApi(center),
    lat: coord(center.latitude),
    lng: coord(center.longitude)
});

const centerToApi = (form, existing) => {
    const capacity = int(form.capacity) ?? 0;
    let occupied = existing?.occupied ?? 0;
    if (form.status === 'Full') occupied = capacity;
    else if (occupied >= capacity && capacity > 0) occupied = Math.max(capacity - 1, 0);
    return {
        name: form.name?.trim(),
        location: form.location?.trim() || null,
        capacity,
        occupied,
        facilities: form.facilities?.trim() || null,
        availability: form.status !== 'Closed',
        latitude: num(form.lat),
        longitude: num(form.lng)
    };
};

export const getCenters = async () => (await api.get('/relief-centers')).data.map(centerFromApi);
export const saveCenter = async (form, existing) => {
    const body = centerToApi(form, existing);
    const res = existing?.id ? await api.put(`/relief-centers/${existing.id}`, body) : await api.post('/relief-centers', body);
    return centerFromApi(res.data);
};
export const deleteCenter = id => api.delete(`/relief-centers/${id}`);

/* ---------- resources ---------- */

export const RESOURCE_CATEGORIES = ['food', 'water', 'medicine', 'blankets', 'clothing', 'emergency kits'];

const resourceFromApi = resource => ({
    id: resource.id,
    name: resource.name,
    category: resource.category,
    qty: resource.quantity,
    quantity: resource.quantity,
    minimumRequired: resource.minimumRequired,
    location: resource.location || '',
    lat: coord(resource.latitude),
    lng: coord(resource.longitude),
    status: resource.quantity === 0 ? 'Out of Stock' : resource.lowStock ? 'Low Stock' : 'Available'
});

const resourceToApi = form => ({
    name: form.name?.trim(),
    category: form.category || 'food',
    quantity: int(form.quantity) ?? 0,
    location: form.location?.trim() || null,
    minimumRequired: int(form.minimumRequired) ?? 10,
    latitude: num(form.lat),
    longitude: num(form.lng)
});

export const getResources = async () => (await api.get('/resources')).data.map(resourceFromApi);
export const createResource = async form => resourceFromApi((await api.post('/resources', resourceToApi(form))).data);
export const setResourceQuantity = async (resource, quantity) =>
    resourceFromApi((await api.put(`/resources/${resource.id}`, resourceToApi({ ...resource, quantity }))).data);

/* ---------- relief requests ---------- */

const REQUEST_TYPE_TO_API = {
    'Medical Assistance': 'MEDICAL_HELP',
    'Food & Water Ration': 'FOOD',
    'Evacuation Support': 'RESCUE',
    'Shelter Required': 'SHELTER'
};
const REQUEST_TYPE_FROM_API = {
    MEDICAL_HELP: 'Medical Assistance',
    MEDICINE: 'Medical Assistance',
    FOOD: 'Food & Water Ration',
    WATER: 'Food & Water Ration',
    RESCUE: 'Evacuation Support',
    SHELTER: 'Shelter Required'
};
const PRIORITY_TO_API = { high: 'CRITICAL', medium: 'HIGH', low: 'LOW' };
const PRIORITY_FROM_API = { CRITICAL: 'high', HIGH: 'medium', MEDIUM: 'low', LOW: 'low' };
const REQUEST_STATUS_FROM_API = {
    SUBMITTED: 'Pending',
    VERIFIED: 'Approved',
    ASSIGNED: 'Approved',
    IN_PROGRESS: 'Approved',
    REJECTED: 'Rejected',
    RESOLVED: 'Completed'
};

export const requestTypeLabel = type => REQUEST_TYPE_FROM_API[type] || titleCase(type);

const requestFromApi = request => ({
    id: request.id,
    code: requestCode(request.id),
    type: requestTypeLabel(request.requestType),
    priority: PRIORITY_FROM_API[request.priority] || 'low',
    location: request.locationText || '',
    people: request.peopleAffected ?? 1,
    details: request.description || '',
    latitude: coord(request.latitude),
    longitude: coord(request.longitude),
    status: REQUEST_STATUS_FROM_API[request.status] || titleCase(request.status),
    userId: request.citizenId,
    userName: request.citizenName,
    userEmail: request.citizenEmail,
    disasterId: request.disasterId,
    createdAt: request.createdAt
});

const requestToApi = form => ({
    requestType: REQUEST_TYPE_TO_API[form.type] || 'RESCUE',
    description: form.details?.trim() || null,
    priority: PRIORITY_TO_API[form.priority] || 'LOW',
    latitude: num(form.latitude),
    longitude: num(form.longitude),
    locationText: form.location?.trim() || null,
    peopleAffected: int(form.people) ?? 1
});

export const getRequests = async () => (await api.get('/requests')).data
    .map(requestFromApi)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
export const createRequest = async form => requestFromApi((await api.post('/requests', requestToApi(form))).data);
export const updateRequest = async (id, form) => requestFromApi((await api.put(`/requests/${id}`, requestToApi(form))).data);
export const deleteRequest = id => api.delete(`/requests/${id}`);
export const completeRequest = async id => requestFromApi((await api.put(`/requests/${id}/complete`)).data);
export const approveRequest = async id => requestFromApi((await api.put(`/requests/${id}/status`, { status: 'VERIFIED' })).data);
export const rejectRequest = async id => requestFromApi((await api.put(`/requests/${id}/status`, { status: 'REJECTED' })).data);
export const assignVolunteerToRequest = (id, { volunteerId, disasterId, scheduledAt }) =>
    api.put(`/requests/${id}/assign`, {
        volunteerId: Number(volunteerId),
        disasterId: disasterId ? Number(disasterId) : null,
        scheduledAt: scheduledAt || null
    });

/* ---------- volunteers ---------- */

const VOLUNTEER_STATUS_FROM_API = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', ACTIVE: 'Active' };
const ASSIGNMENT_RESPONSE_FROM_API = { ASSIGNED: 'Pending', ACCEPTED: 'Accepted', CANCELLED: 'Declined', IN_PROGRESS: 'Accepted', COMPLETED: 'Accepted' };

const volunteerFromApi = volunteer => ({
    id: volunteer.id,
    userId: volunteer.userId,
    userName: volunteer.userName,
    userEmail: volunteer.userEmail,
    role: volunteer.skills || 'Volunteer',
    status: VOLUNTEER_STATUS_FROM_API[volunteer.status] || 'Pending',
    createdAt: volunteer.createdAt,
    assignment: volunteer.assignment ? {
        id: volunteer.assignment.id,
        requestId: requestCode(volunteer.assignment.requestId),
        requestType: requestTypeLabel(volunteer.assignment.requestType),
        disasterName: volunteer.assignment.disasterName || '',
        location: volunteer.assignment.location || '',
        latitude: coord(volunteer.assignment.latitude),
        longitude: coord(volunteer.assignment.longitude),
        scheduledAt: volunteer.assignment.scheduledAt,
        response: ASSIGNMENT_RESPONSE_FROM_API[volunteer.assignment.status] || 'Pending'
    } : null
});

export const getVolunteers = async () => (await api.get('/volunteers')).data.map(volunteerFromApi);
export const getMyVolunteerApplication = async () => {
    const res = await api.get('/volunteers/me');
    return res.data ? volunteerFromApi(res.data) : null;
};
export const applyAsVolunteer = async () => volunteerFromApi((await api.post('/volunteers/register', {})).data);
export const setVolunteerStatus = async (id, status) =>
    volunteerFromApi((await api.put(`/volunteers/${id}/status`, { status: status.toUpperCase() })).data);
export const respondToAssignment = async (assignmentId, accepted) =>
    volunteerFromApi((await api.put(`/volunteers/assignments/${assignmentId}/respond`, { accepted })).data);

/* ---------- notifications ---------- */

const notificationFromApi = notification => ({
    id: notification.id,
    title: notification.title || 'Notification',
    severity: notification.severity || 'Update',
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt
});

export const getNotifications = async () => (await api.get('/notifications')).data.map(notificationFromApi);
export const deleteNotification = id => api.delete(`/notifications/${id}`);
export const broadcastNotification = ({ title, message, severity }) =>
    api.post('/notifications/broadcast', { title, message, severity });

/* ---------- users & profile ---------- */

const userFromApi = user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: toUiRole(user.role),
    apiRole: user.role
});

export const getUsers = async () => (await api.get('/admin/users')).data.map(userFromApi);
export const createUser = ({ name, email, password, role }) =>
    api.post('/auth/register', { name, email, password, role: toApiRole(role) });
export const deleteUser = id => api.delete(`/admin/users/${id}`);
export const getMyProfile = async () => (await api.get('/users/me')).data;
export const updateMyProfile = async profile => (await api.put('/users/me', profile)).data;

/* ---------- public ---------- */

export const getPublicStats = async () => (await api.get('/public/stats')).data;
