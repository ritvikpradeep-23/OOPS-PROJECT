import { AxiosError } from 'axios';

/*
 * Browser-only stand-in for the Spring Boot API, used when the site is deployed
 * without a backend (see api.js). It answers the same routes with the same JSON
 * shapes and rules as the Java services, and keeps the data in this browser's
 * localStorage, so each device has its own copy.
 */

const DB_KEY = 'resilio-browser-db';
const SEED_ADMIN = { name: 'System Admin', email: 'admin@disasterrelief.local', password: 'Admin@123' };
const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;

const ALLOWED_TRANSITIONS = {
    SUBMITTED: ['VERIFIED', 'REJECTED'],
    VERIFIED: ['ASSIGNED', 'REJECTED'],
    ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['RESOLVED']
};
const COMPLETABLE = ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS'];
const DEFAULT_TITLES = {
    REQUEST_STATUS_CHANGE: 'Request update',
    ASSIGNMENT: 'Assignment update',
    EMERGENCY_ALERT: 'Emergency alert',
    GENERAL: 'Notice'
};

/* ---------- storage ---------- */

const emptyDb = () => ({
    seq: 0, users: [], disasters: [], centers: [], resources: [],
    requests: [], volunteers: [], assignments: [], notifications: []
});

const load = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(DB_KEY));
        if (stored && typeof stored === 'object') return { ...emptyDb(), ...stored };
    } catch {
        // fall through to a fresh database
    }
    return emptyDb();
};

const save = db => localStorage.setItem(DB_KEY, JSON.stringify(db));
const nextId = db => ++db.seq;
const now = () => new Date().toISOString();

const hash = async text => {
    if (!globalThis.crypto?.subtle) return `plain:${text}`;
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
};

const ensureSeedAdmin = async db => {
    if (db.users.some(u => u.role === 'ADMIN')) return;
    db.users.push({
        id: nextId(db), name: SEED_ADMIN.name, email: SEED_ADMIN.email, phone: null, location: null,
        role: 'ADMIN', passwordHash: await hash(SEED_ADMIN.password), createdAt: now()
    });
};

/* ---------- errors ---------- */

class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const REASONS = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict' };
const notFound = (entity, id) => new ApiError(404, `${entity} not found with id ${id}`);
const badRequest = message => new ApiError(400, message);
const blank = value => value === undefined || value === null || String(value).trim() === '';

/* ---------- response shapes (mirror the Java DTOs) ---------- */

const userResponse = u => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone, location: u.location, role: u.role, createdAt: u.createdAt
});

const authResponse = u => ({ token: `browser-${u.id}`, id: u.id, name: u.name, email: u.email, role: u.role });

const requestResponse = (db, r) => {
    const citizen = db.users.find(u => u.id === r.citizenId) || {};
    return {
        id: r.id, citizenId: r.citizenId, citizenName: citizen.name, citizenEmail: citizen.email,
        disasterId: r.disasterId ?? null, requestType: r.requestType, description: r.description,
        priority: r.priority, latitude: r.latitude, longitude: r.longitude, locationText: r.locationText,
        peopleAffected: r.peopleAffected, status: r.status, createdAt: r.createdAt
    };
};

const volunteerResponse = (db, v) => {
    const user = db.users.find(u => u.id === v.userId) || {};
    const latest = db.assignments
        .filter(a => a.volunteerId === v.id)
        .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt) || b.id - a.id)[0];
    const request = latest && db.requests.find(r => r.id === latest.requestId);
    const disaster = request?.disasterId && db.disasters.find(d => d.id === request.disasterId);
    return {
        id: v.id, userId: v.userId, userName: user.name, userEmail: user.email, skills: v.skills,
        location: v.location, availability: v.availability, status: v.status || 'PENDING', createdAt: v.createdAt,
        assignment: latest && request ? {
            id: latest.id, requestId: request.id, requestType: request.requestType,
            disasterName: disaster ? disaster.name : null, location: request.locationText,
            latitude: request.latitude, longitude: request.longitude,
            scheduledAt: latest.scheduledAt, status: latest.status
        } : null
    };
};

const resourceResponse = r => ({ ...r, lowStock: r.quantity < r.minimumRequired });
const centerResponse = c => ({ ...c, hasSpace: c.occupied < c.capacity });

/* ---------- notifications ---------- */

const notify = (db, user, title, message, severity, type) => {
    if (!user) return;
    db.notifications.push({
        id: nextId(db), userId: user.id, title: title || DEFAULT_TITLES[type], severity: severity || 'Update',
        message, type, isRead: false, createdAt: now()
    });
};

const notifyAdmins = (db, title, message, type) =>
    db.users.filter(u => u.role === 'ADMIN').forEach(admin => notify(db, admin, title, message, 'Update', type));

const userById = (db, id) => db.users.find(u => u.id === id);

/* ---------- route helpers ---------- */

const requireAdmin = actor => {
    if (actor.role !== 'ADMIN') throw new ApiError(403, 'You do not have permission to perform this action');
};

const findOr404 = (list, id, entity) => {
    const item = list.find(x => x.id === id);
    if (!item) throw notFound(entity, id);
    return item;
};

const requireOwnerOrAdmin = (actor, request) => {
    if (request.citizenId !== actor.id && actor.role !== 'ADMIN') {
        throw new ApiError(403, 'You can only access your own relief requests');
    }
};

const deleteRequestWithDependents = (db, id) => {
    db.assignments = db.assignments.filter(a => a.requestId !== id);
    db.requests = db.requests.filter(r => r.id !== id);
};

const disasterFields = body => {
    if (blank(body.type)) throw badRequest('Validation failed');
    if (blank(body.severity)) throw badRequest('Validation failed');
    return {
        name: body.name ?? null, location: body.location ?? null, affected: body.affected ?? null,
        camps: body.camps ?? null, type: body.type, description: body.description ?? null,
        severity: body.severity, status: body.status || 'ACTIVE',
        latitude: body.latitude ?? null, longitude: body.longitude ?? null
    };
};

const centerFields = body => {
    if (blank(body.name) || body.capacity === null || body.capacity === undefined || body.capacity < 0) {
        throw badRequest('Validation failed');
    }
    return {
        name: body.name, location: body.location ?? null, capacity: body.capacity, occupied: body.occupied ?? 0,
        facilities: body.facilities ?? null, availability: body.availability ?? true,
        latitude: body.latitude ?? null, longitude: body.longitude ?? null
    };
};

const resourceFields = body => {
    if (blank(body.name) || blank(body.category) || !(body.quantity >= 0) || !(body.minimumRequired >= 0)) {
        throw badRequest('Validation failed');
    }
    return {
        name: body.name, category: body.category, quantity: body.quantity, location: body.location ?? null,
        minimumRequired: body.minimumRequired, latitude: body.latitude ?? null, longitude: body.longitude ?? null
    };
};

const requestFields = body => {
    if (blank(body.requestType) || blank(body.priority)) throw badRequest('Validation failed');
    return {
        requestType: body.requestType, description: body.description ?? null, priority: body.priority,
        latitude: body.latitude ?? null, longitude: body.longitude ?? null,
        locationText: body.locationText ?? null, peopleAffected: body.peopleAffected ?? null
    };
};

/* ---------- routes ---------- */

const PUBLIC = true;

const routes = [
    ['POST', '/auth/login', PUBLIC, async ({ db, body }) => {
        const user = db.users.find(u => u.email.toLowerCase() === String(body.email || '').trim().toLowerCase());
        if (!user || user.passwordHash !== await hash(String(body.password || ''))) {
            throw new ApiError(401, 'Invalid email or password');
        }
        return authResponse(user);
    }],
    ['POST', '/auth/register', PUBLIC, async ({ db, body }) => {
        if (blank(body.name) || blank(body.email) || !/^\S+@\S+\.\S+$/.test(String(body.email))) {
            throw badRequest('Validation failed');
        }
        if (!body.password || String(body.password).length < 6) {
            throw badRequest('Password must be at least 6 characters');
        }
        const email = String(body.email).trim();
        if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new ApiError(409, `An account with email '${email}' already exists`);
        }
        const user = {
            id: nextId(db), name: body.name.trim(), email, phone: body.phone || null, location: body.location || null,
            role: body.role === 'ADMIN' ? 'ADMIN' : 'CITIZEN', passwordHash: await hash(String(body.password)),
            createdAt: now()
        };
        db.users.push(user);
        return [201, authResponse(user)];
    }],
    ['GET', '/public/stats', PUBLIC, ({ db }) => ({
        centers: db.centers.length,
        assisted: db.requests.filter(r => r.status === 'RESOLVED').length,
        resolvedDisasters: db.disasters.filter(d => d.status === 'RESOLVED').length,
        activeVolunteers: db.volunteers.filter(v => v.status === 'ACTIVE').length
    })],

    ['GET', '/users/me', ({ actor }) => userResponse(actor)],
    ['PUT', '/users/me', ({ actor, body }) => {
        if (blank(body.name)) throw badRequest('Validation failed');
        Object.assign(actor, { name: body.name, phone: body.phone ?? null, location: body.location ?? null });
        return userResponse(actor);
    }],
    ['GET', '/admin/users', ({ db, actor }) => {
        requireAdmin(actor);
        return db.users.map(userResponse);
    }],
    ['DELETE', '/admin/users/:id', ({ db, actor, id }) => {
        requireAdmin(actor);
        if (actor.id === id) throw new ApiError(403, 'You cannot delete your own account');
        findOr404(db.users, id, 'User');
        db.notifications = db.notifications.filter(n => n.userId !== id);
        const profile = db.volunteers.find(v => v.userId === id);
        if (profile) {
            db.assignments = db.assignments.filter(a => a.volunteerId !== profile.id);
            db.volunteers = db.volunteers.filter(v => v !== profile);
        }
        db.requests.filter(r => r.citizenId === id).forEach(r => deleteRequestWithDependents(db, r.id));
        db.users = db.users.filter(u => u.id !== id);
        return [204, null];
    }],

    ['GET', '/disasters', ({ db }) => db.disasters],
    ['POST', '/disasters', ({ db, actor, body }) => {
        requireAdmin(actor);
        const disaster = { id: nextId(db), ...disasterFields(body), createdAt: now() };
        db.disasters.push(disaster);
        return [201, disaster];
    }],
    ['PUT', '/disasters/:id', ({ db, actor, body, id }) => {
        requireAdmin(actor);
        return Object.assign(findOr404(db.disasters, id, 'Disaster'), disasterFields(body));
    }],
    ['DELETE', '/disasters/:id', ({ db, actor, id }) => {
        requireAdmin(actor);
        findOr404(db.disasters, id, 'Disaster');
        db.disasters = db.disasters.filter(d => d.id !== id);
        db.requests.forEach(r => { if (r.disasterId === id) r.disasterId = null; });
        return [204, null];
    }],

    ['GET', '/relief-centers', ({ db }) => db.centers.map(centerResponse)],
    ['POST', '/relief-centers', ({ db, actor, body }) => {
        requireAdmin(actor);
        const center = { id: nextId(db), ...centerFields(body) };
        db.centers.push(center);
        return [201, centerResponse(center)];
    }],
    ['PUT', '/relief-centers/:id', ({ db, actor, body, id }) => {
        requireAdmin(actor);
        return centerResponse(Object.assign(findOr404(db.centers, id, 'ReliefCenter'), centerFields(body)));
    }],
    ['DELETE', '/relief-centers/:id', ({ db, actor, id }) => {
        requireAdmin(actor);
        findOr404(db.centers, id, 'ReliefCenter');
        db.centers = db.centers.filter(c => c.id !== id);
        return [204, null];
    }],

    ['GET', '/resources', ({ db }) => db.resources.map(resourceResponse)],
    ['POST', '/resources', ({ db, actor, body }) => {
        requireAdmin(actor);
        const resource = { id: nextId(db), ...resourceFields(body) };
        db.resources.push(resource);
        return [201, resourceResponse(resource)];
    }],
    ['PUT', '/resources/:id', ({ db, actor, body, id }) => {
        requireAdmin(actor);
        return resourceResponse(Object.assign(findOr404(db.resources, id, 'Resource'), resourceFields(body)));
    }],

    ['GET', '/requests', ({ db, actor }) => db.requests
        .filter(r => actor.role === 'ADMIN' || r.citizenId === actor.id)
        .map(r => requestResponse(db, r))],
    ['POST', '/requests', ({ db, actor, body }) => {
        const fields = requestFields(body);
        const disasterId = body.disasterId ?? null;
        if (disasterId !== null) findOr404(db.disasters, disasterId, 'Disaster');
        const since = Date.now() - DUPLICATE_WINDOW_MS;
        const duplicate = db.requests.some(r => r.citizenId === actor.id && r.requestType === fields.requestType
            && (r.disasterId ?? null) === disasterId && new Date(r.createdAt).getTime() > since);
        if (duplicate) {
            throw new ApiError(409, `A similar ${fields.requestType} request was already submitted recently`);
        }
        const request = { id: nextId(db), citizenId: actor.id, disasterId, ...fields, status: 'SUBMITTED', createdAt: now() };
        db.requests.push(request);
        notifyAdmins(db, 'New relief request', `${actor.name} submitted a ${request.requestType} request`, 'REQUEST_STATUS_CHANGE');
        return [201, requestResponse(db, request)];
    }],
    ['PUT', '/requests/:id', ({ db, actor, body, id }) => {
        const request = findOr404(db.requests, id, 'ReliefRequest');
        requireOwnerOrAdmin(actor, request);
        if (request.status !== 'SUBMITTED') throw badRequest('Only pending requests can be edited');
        return requestResponse(db, Object.assign(request, requestFields(body)));
    }],
    ['DELETE', '/requests/:id', ({ db, actor, id }) => {
        requireOwnerOrAdmin(actor, findOr404(db.requests, id, 'ReliefRequest'));
        deleteRequestWithDependents(db, id);
        return [204, null];
    }],
    ['PUT', '/requests/:id/complete', ({ db, actor, id }) => {
        const request = findOr404(db.requests, id, 'ReliefRequest');
        requireOwnerOrAdmin(actor, request);
        if (!COMPLETABLE.includes(request.status)) {
            throw badRequest(`Cannot complete a request that is ${request.status}`);
        }
        request.status = 'RESOLVED';
        if (actor.role === 'ADMIN' && request.citizenId !== actor.id) {
            notify(db, userById(db, request.citizenId), null,
                `Your ${request.requestType} request is now RESOLVED`, 'Update', 'REQUEST_STATUS_CHANGE');
        }
        return requestResponse(db, request);
    }],
    ['PUT', '/requests/:id/status', ({ db, actor, body, id }) => {
        requireAdmin(actor);
        const request = findOr404(db.requests, id, 'ReliefRequest');
        const next = body.status;
        if (blank(next)) throw badRequest('Validation failed');
        if (request.status !== next && !(ALLOWED_TRANSITIONS[request.status] || []).includes(next)) {
            throw badRequest(`Cannot move relief request from ${request.status} to ${next}`);
        }
        request.status = next;
        notify(db, userById(db, request.citizenId), null,
            `Your ${request.requestType} request is now ${next}`, 'Update', 'REQUEST_STATUS_CHANGE');
        return requestResponse(db, request);
    }],
    ['PUT', '/requests/:id/assign', ({ db, actor, body, id }) => {
        requireAdmin(actor);
        const request = findOr404(db.requests, id, 'ReliefRequest');
        if (request.disasterId == null && body.disasterId != null) {
            request.disasterId = findOr404(db.disasters, body.disasterId, 'Disaster').id;
        }
        const volunteer = body.volunteerId != null ? findOr404(db.volunteers, body.volunteerId, 'Volunteer') : null;
        const assignment = {
            id: nextId(db), requestId: request.id, volunteerId: volunteer?.id ?? null,
            status: 'ASSIGNED', scheduledAt: body.scheduledAt ?? null, assignedAt: now()
        };
        db.assignments.push(assignment);
        if (request.status === 'VERIFIED') request.status = 'ASSIGNED';
        notify(db, userById(db, request.citizenId), null,
            `A responder has been assigned to your ${request.requestType} request`, 'Update', 'ASSIGNMENT');
        if (volunteer) {
            notify(db, userById(db, volunteer.userId), 'New volunteer assignment',
                `You were assigned to relief request RH-${request.id}`, 'Volunteer Assignment', 'ASSIGNMENT');
        }
        return {
            id: assignment.id, requestId: request.id, rescueTeamId: null, volunteerId: assignment.volunteerId,
            status: assignment.status, scheduledAt: assignment.scheduledAt, assignedAt: assignment.assignedAt
        };
    }],

    ['GET', '/volunteers', ({ db, actor }) => {
        requireAdmin(actor);
        return db.volunteers.map(v => volunteerResponse(db, v));
    }],
    ['GET', '/volunteers/me', ({ db, actor }) => {
        const mine = db.volunteers.find(v => v.userId === actor.id);
        return mine ? volunteerResponse(db, mine) : [204, ''];
    }],
    ['POST', '/volunteers/register', ({ db, actor, body }) => {
        if (db.volunteers.some(v => v.userId === actor.id)) {
            throw new ApiError(409, 'You are already registered as a volunteer');
        }
        const profile = {
            id: nextId(db), userId: actor.id, skills: body.skills ?? null, location: body.location ?? null,
            availability: 'AVAILABLE', status: 'PENDING', createdAt: now()
        };
        db.volunteers.push(profile);
        notifyAdmins(db, 'Volunteer application', `${actor.name} applied to volunteer`, 'GENERAL');
        return [201, volunteerResponse(db, profile)];
    }],
    ['PUT', '/volunteers/:id/status', ({ db, actor, body, id }) => {
        requireAdmin(actor);
        const profile = findOr404(db.volunteers, id, 'Volunteer');
        if (blank(body.status)) throw badRequest('Validation failed');
        profile.status = body.status;
        notify(db, userById(db, profile.userId), `Application ${body.status}`,
            `Your volunteer application is ${String(body.status).toLowerCase()}`, 'Volunteer Application', 'GENERAL');
        return volunteerResponse(db, profile);
    }],
    ['PUT', '/volunteers/assignments/:id/respond', ({ db, actor, body, id }) => {
        const assignment = findOr404(db.assignments, id, 'Assignment');
        const owner = db.volunteers.find(v => v.id === assignment.volunteerId);
        if (!owner || owner.userId !== actor.id) {
            throw new ApiError(403, 'This assignment belongs to another volunteer');
        }
        assignment.status = body.accepted ? 'ACCEPTED' : 'CANCELLED';
        const verdict = body.accepted ? 'accepted' : 'declined';
        notifyAdmins(db, `Assignment ${verdict}`, `${actor.name} ${verdict} assignment RH-${assignment.requestId}`, 'ASSIGNMENT');
        return volunteerResponse(db, owner);
    }],

    ['GET', '/notifications', ({ db, actor }) => db.notifications
        .filter(n => n.userId === actor.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
        .map(n => ({ id: n.id, title: n.title, severity: n.severity, message: n.message, type: n.type, isRead: n.isRead, createdAt: n.createdAt }))],
    ['DELETE', '/notifications/:id', ({ db, actor, id }) => {
        const notification = db.notifications.find(n => n.id === id && n.userId === actor.id);
        if (!notification) throw notFound('Notification', id);
        db.notifications = db.notifications.filter(n => n !== notification);
        return [204, null];
    }],
    ['POST', '/notifications/broadcast', ({ db, actor, body }) => {
        requireAdmin(actor);
        if (blank(body.title) || blank(body.message)) throw badRequest('Validation failed');
        const severity = blank(body.severity) ? 'General Update' : body.severity;
        db.users.forEach(u => notify(db, u, body.title, body.message, severity, 'EMERGENCY_ALERT'));
        return { recipients: db.users.length };
    }]
].map(([method, path, ...rest]) => {
    const isPublic = rest[0] === PUBLIC;
    const handler = rest[rest.length - 1];
    const pattern = new RegExp(`^${path.replace(':id', '(\\d+)')}$`);
    return { method, pattern, isPublic, handler };
});

/* ---------- axios adapter ---------- */

const respond = (config, status, data) => ({
    data, status, statusText: status < 400 ? 'OK' : REASONS[status] || 'Error', headers: {}, config, request: {}
});

const currentUser = (db, config) => {
    const header = config.headers?.Authorization || config.headers?.authorization || '';
    const match = /^Bearer browser-(\d+)$/.exec(header);
    return match ? userById(db, Number(match[1])) : null;
};

export const browserAdapter = async config => {
    const method = (config.method || 'get').toUpperCase();
    const path = (config.url || '').split('?')[0].replace(/\/+$/, '');
    let body = config.data;
    if (typeof body === 'string' && body) {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const db = load();
    await ensureSeedAdmin(db);

    try {
        const route = routes.find(r => r.method === method && r.pattern.test(path));
        if (!route) throw new ApiError(404, `No endpoint ${method} /api${path}`);
        const actor = currentUser(db, config);
        if (!route.isPublic && !actor) throw new ApiError(401, 'Authentication required');
        const idMatch = route.pattern.exec(path);
        const result = await route.handler({ db, actor, body, id: idMatch[1] ? Number(idMatch[1]) : undefined });
        save(db);
        const [status, data] = Array.isArray(result) && typeof result[0] === 'number' && result.length === 2
            ? result : [200, result];
        return respond(config, status, data);
    } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        save(db);
        const response = respond(config, error.status, {
            timestamp: now(), status: error.status, error: REASONS[error.status] || 'Error', message: error.message
        });
        throw new AxiosError(error.message, AxiosError.ERR_BAD_REQUEST, config, response.request, response);
    }
};
