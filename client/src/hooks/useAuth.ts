import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { LoginInput, RegisterInput, User } from "@shared/schema";

/**
 * Retry logic with exponential backoff for CSRF token refresh
 * Ensures token is obtained even if session is still being persisted to DB
 */
async function refreshCsrfTokenWithRetry(maxAttempts = 5) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch('/api/csrf-token-init', { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        console.log(`✅ CSRF token refreshed (attempt ${attempt})`);
        return;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ CSRF token refresh attempt ${attempt} failed:`, error);
    }
    
    // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
    if (attempt < maxAttempts) {
      const delayMs = 50 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Log final failure but don't throw - let app continue
  if (lastError) {
    console.error('CSRF token refresh failed after all retries:', lastError);
  }
}

export function useLogin() {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: async (response) => {
      login(response.user);
      
      // Refresh CSRF token with retry logic
      // This ensures token is obtained even if server is slow persisting session
      await refreshCsrfTokenWithRetry();
      
      queryClient.refetchQueries({ queryKey: ["cart"] });
      queryClient.refetchQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: async () => {
      // Refresh CSRF token with retry logic
      // This ensures token is obtained even if server is slow persisting session
      await refreshCsrfTokenWithRetry();
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
  });
}

export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: ["user", "me"],
    queryFn: authApi.me,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data as User);
    }
  }, [query.data, setUser]);

  return query;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      patronymic?: string;
      phone?: string;
    }) => authApi.updateProfile(data),
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.updatePassword(data),
  });
}
