import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { initializeAuth } from "@/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setAuthInitialized = useAuthStore((state) => state.setAuthInitialized);
  const initCallCount = useRef(0);
  const hasInitialized = useRef(false);

  useEffect(() => {
    initCallCount.current += 1;
    const callNumber = initCallCount.current;
    
    console.log(`🔐 AuthProvider useEffect CALLED #${callNumber}`, {
      timestamp: new Date().toISOString(),
      hasInitialized: hasInitialized.current
    });
    
    if (hasInitialized.current) {
      console.log(`🔐 AuthProvider SKIPPED (already initialized) #${callNumber}`);
      return;
    }
    hasInitialized.current = true;
    
    const initAuth = async () => {
      console.log(`🔐 initAuth START #${callNumber}`, { timestamp: new Date().toISOString() });
      
      const hasValidToken = await initializeAuth();
      console.log(`🔐 initializeAuth DONE #${callNumber}`, { hasValidToken, timestamp: new Date().toISOString() });
      
      if (hasValidToken) {
        console.log(`🔐 checkAuth START #${callNumber}`);
        await checkAuth();
        console.log(`🔐 checkAuth DONE #${callNumber}`);
      } else {
        setAuthInitialized(true);
        console.log(`🔐 setAuthInitialized(true) #${callNumber}`);
      }
    };
    
    initAuth();
  }, [checkAuth, setAuthInitialized]);

  return <>{children}</>;
}
