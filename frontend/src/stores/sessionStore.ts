import zod from "zod";
import { create } from "zustand";

import schemas from '../../../backend/services/zod_schema';

type User = zod.infer<typeof schemas.usersSchema>

interface SessionState {
  isAuthenticated: boolean | null;
  user: User | null;
  token: string | null;
  error: string | null;
  loading: boolean;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  setError: (error: string | null) => void;
}

// Store for authentication data (persisted to localStorage)
const useSessionStore = create<SessionState>()(

  (set) => ({
    isAuthenticated: null,
    user: null,
    token: null,
    error: null,
    loading: false,

    login: (user, token) =>
      set({
        isAuthenticated: true,
        user,
        token,
        error: null,
      }),

    logout: () =>
      set({
        isAuthenticated: false,
        user: null,
        token: null,
      }),

    setError: (error) => set({ error }),
  }),

);

export default useSessionStore; 