import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface RequireMemberProps {
  children: React.ReactNode;
}

/**
 * Protects routes that require member or admin role
 * Redirects unauthenticated users to /auth with return path
 * 
 * Ready for BetterAuth backend enforcement
 */
export function RequireMember({ children }: RequireMemberProps) {
  const { isMember, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated at all - redirect to auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Authenticated but not member/admin (e.g., if we add more roles later)
  if (!isMember) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
