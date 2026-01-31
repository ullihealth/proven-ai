import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { AccessDenied } from "./AccessDenied";

interface RequireAdminProps {
  children: React.ReactNode;
}

/**
 * Protects routes that require admin role
 * Shows AccessDenied page for non-admin users
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied isLoggedIn={isAuthenticated} />;
  }

  return <>{children}</>;
}
