import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const authInitialized = useAuthStore((state) => state.authInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (authInitialized && !isAuthenticated) {
      const currentPath = window.location.pathname;
      setLocation(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [authInitialized, isAuthenticated, setLocation]);

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roles && roles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Доступ запрещён</CardTitle>
                  <CardDescription>У вас недостаточно прав для просмотра этой страницы</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Эта страница доступна только пользователям с ролями: {roles.join(", ")}
              </p>
              <Button onClick={() => setLocation("/")} className="w-full">
                Вернуться на главную
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
}
