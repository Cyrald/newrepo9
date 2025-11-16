import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@shared/schema";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  authInitialized: boolean;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      authInitialized: false,

      login: (token: string, user: User) => {
        localStorage.setItem("auth_token", token);
        set({
          token,
          user,
          isAuthenticated: true,
          authInitialized: true,
        });
      },

      logout: () => {
        localStorage.removeItem("auth_token");
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          authInitialized: true,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      checkAuth: async () => {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          set({ authInitialized: true });
          get().logout();
          return;
        }

        try {
          const user = await authApi.me();
          set({
            token,
            user,
            isAuthenticated: true,
            authInitialized: true,
          });
        } catch (error) {
          set({ authInitialized: true });
          get().logout();
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
