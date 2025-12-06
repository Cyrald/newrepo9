import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { initializeAuth } from "@/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setAuthInitialized = useAuthStore((state) => state.setAuthInitialized);

  useEffect(() => {
    const initAuth = async () => {
      const hasValidToken = await initializeAuth();
      
      if (hasValidToken) {
        await checkAuth();
      } else {
        setAuthInitialized(true);
      }
    };
    
    initAuth();
  }, [checkAuth, setAuthInitialized]);

  return <>{children}</>;
}
