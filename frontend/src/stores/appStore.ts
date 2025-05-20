import { create } from 'zustand';

interface Notification {
    id: string;
    severity?: 'success' | 'info' | 'warning' | 'error';
    message: string;
    timeout?: number;
    keepOnNavigate?: boolean;
}

interface AppState {
    loading: boolean;
    title: string;
    notifications: Notification[];
    hooks_initialized: boolean;
    hasError: boolean;

    // Actions
    setLoading: (loading: boolean) => void;
    setTitle: (title: string) => void;
    initializeHooks: () => void;
    addNotification: (notification: Omit<Notification, 'id'> & { id?: string }) => void;
    removeNotification: (id: string) => void;
    removeNotificationsOnNavigate: () => void;
}

// Store for UI state (not persisted)
const useAppStore = create<AppState>((set) => ({
    loading: false,
    title: "",
    notifications: [],
    hooks_initialized: false,
    hasError: false,

    setLoading: (loading) => set({ loading }),
    setTitle: (title) => set({ title }),
    initializeHooks: () => set({ hooks_initialized: true }),

    addNotification: (notification: Notification) => set((state) => {
        const id = notification.id || (Math.random() + 1).toString(36).substring(7);
        const notifications = [...state.notifications, { 'severity': 'success', ...notification, id } as Notification]
        const hasError = notifications.some(n => n.severity === 'error');
        return { notifications: notifications, hasError: hasError }
    }),

    removeNotification: (id) => set((state) => {
        const notifications = state.notifications.filter(notification => notification.id !== id)
        const hasError = notifications.some(n => n.severity === 'error');
        return { notifications: notifications, hasError: hasError }
    }),
    removeNotificationsOnNavigate: () => set((state) => {
        const notifications = state.notifications.filter(notification => notification.keepOnNavigate);
        return { notifications: notifications }
    })
}));

export default useAppStore;