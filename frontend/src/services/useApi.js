import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './backend';

/** Loads data from the API on mount; reload() refetches after a mutation. */
export const useApi = (fetcher, initial = []) => {
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;
    const [data, setData] = useState(initial);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            setError('');
            setData(await fetcherRef.current());
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return { data, setData, loading, error, reload: load };
};
