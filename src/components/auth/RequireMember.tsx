import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface RequireMemberProps {
  children: React.ReactNode;
}

/**
 * Protects routes that require paid_member or admin role.
 * - Not authenticated → /auth
 * - paid_member or admin → access granted
 * - member (registered but not paid) → /membership?registered=true
 */
export function RequireMember({ children }: RequireMemberProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (user?.role === "paid_member" || user?.role === "admin") {
    return <>{children}</>;
  }

  // Authenticated but not a paid member — send to membership page
  return <Navigate to="/membership?registered=true" replace />;
}
