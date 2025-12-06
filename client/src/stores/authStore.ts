import { create } from "zustand";
import type { User } from "@shared/schema";
import { authApi, setAccessToken } from "@/lib/api";
import { useCartStore } from "./cartStore";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authInitialized: boolean;
  
  login: (user: User) => void;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  setAuthInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  authInitialized: false,

  login: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      authInitialized: true,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      useCartStore.getState().clear();
      
      set({
        user: null,
        isAuthenticated: false,
        authInitialized: true,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  checkAuth: async () => {
    try {
      const { user } = await authApi.me();
      set({
        user,
        isAuthenticated: true,
        authInitialized: true,
      });
    } catch (error) {
      setAccessToken(null);
      set({
        user: null,
        isAuthenticated: false,
        authInitialized: true,
      });
    }
  },

  setAuthInitialized: (initialized: boolean) => {
    set({ authInitialized: initialized });
  },
}));
