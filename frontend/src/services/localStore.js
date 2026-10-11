// Browser-only preferences (settings toggles). All application data lives in the backend API.
const STORE_EVENT = 'resilio-store-updated';

export const readCollectionByKey = (key, fallback = []) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        return value ?? fallback;
    } catch {
        return fallback;
    }
};

export const writeCollection = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key } }));
};
