import { useEffect, useSyncExternalStore } from 'react';
import Loader from '../Loader/Loader';

// A full-screen "saving" indicator that lives outside the page that triggers it. Showing it only re-renders this tiny
// component, so it can reach the screen before a heavy page (e.g. a quiz with hundreds of question cards) re-renders.
let message: string | null = null;
const listeners = new Set<() => void>();

const setMessage = (next: string | null) => {
    if (message === next) return;
    message = next;
    listeners.forEach((listener) => listener());
};

export const savingOverlay = {
    show: (text = 'Saving...') => setMessage(text),
    hide: () => setMessage(null),
};

// Resolves after the browser has painted what was rendered so far, so work started after it can't delay that paint
export const waitForPaint = () =>
    new Promise<void>((resolve) => {
        requestAnimationFrame(() => setTimeout(resolve, 0));
    });

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

// Mount once on a page that uses `savingOverlay`; leaving the page always clears it
const SavingOverlay = () => {
    const text = useSyncExternalStore(subscribe, () => message);

    useEffect(() => () => savingOverlay.hide(), []);

    if (text === null) return null;
    return <Loader fullScreen tip={text} />;
};

export default SavingOverlay;
