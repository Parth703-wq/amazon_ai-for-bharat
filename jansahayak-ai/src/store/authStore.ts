import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

interface User {
    id: number;
    full_name: string;
    phone: string;
    email?: string;
    preferred_language: string;
    state?: string;
    district?: string;
    annual_income?: number;
    role: string;
    is_verified: boolean;
    profile_complete: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoggedIn: boolean;
    login: (phone: string, password: string) => Promise<void>;
    register: (data: { full_name: string; phone: string; password: string; state?: string }) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoggedIn: false,

            login: async (phone, password) => {
                const res = await authApi.login(phone, password);
                authApi.saveToken(res.access_token);
                set({ token: res.access_token, isLoggedIn: true });
                const me = await authApi.getMe() as unknown as User;
                set({ user: me });
            },

            register: async (data) => {
                const res = await authApi.register(data);
                authApi.saveToken(res.access_token);
                set({ token: res.access_token, isLoggedIn: true });
                const me = await authApi.getMe() as unknown as User;
                set({ user: me });
            },

            logout: () => {
                authApi.clearToken();
                set({ user: null, token: null, isLoggedIn: false });
            },

            refreshUser: async () => {
                try {
                    const me = await authApi.getMe() as unknown as User;
                    set({ user: me });
                } catch {
                    get().logout();
                }
            },

            updateUser: (updates) => {
                const current = get().user;
                if (current) set({ user: { ...current, ...updates } });
            },
        }),
        {
            name: 'jansahayak-auth',
            partialize: (state: AuthState) => ({ token: state.token, user: state.user, isLoggedIn: state.isLoggedIn }),
        }

    )
);
