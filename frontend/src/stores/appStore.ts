import { create } from 'zustand';

interface Notification {
    id: string;
    severity: 'success' | 'info' | 'warning' | 'error';
    message: string;
    timeout?: number;
}

interface AppState {
    loading: boolean;
    title: string;
    notifications: Notification[];
    hooks_initialized: boolean;

    // Actions
    setLoading: (loading: boolean) => void;
    setTitle: (title: string) => void;
    initializeHooks: () => void;
    addNotification: (notification: Omit<Notification, 'id'> & { id?: string }) => void;
    removeNotification: (id: string) => void;
}

// Store for UI state (not persisted)
const useAppStore = create<AppState>((set) => ({
    loading: false,
    title: "",
    notifications: [],
    hooks_initialized: false,

    setLoading: (loading) => set({ loading }),
    setTitle: (title) => set({ title }),
    initializeHooks: () => set({ hooks_initialized: true }),

    addNotification: (notification) => set((state) => {
        const id = notification.id || (Math.random() + 1).toString(36).substring(7);
        return {
            notifications: [...state.notifications, { ...notification, id }]
        };
    }),

    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notification => notification.id !== id)
    })),
}));

export default useAppStore;