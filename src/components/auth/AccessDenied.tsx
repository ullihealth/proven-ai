import { Link } from "react-router-dom";
import { ShieldX, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessDeniedProps {
  isLoggedIn: boolean;
}

export function AccessDenied({ isLoggedIn }: AccessDeniedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
          <p className="text-muted-foreground">
            {isLoggedIn
              ? "You don't have permission to view this page. This area is reserved for administrators."
              : "You need to sign in with an admin account to access this page."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isLoggedIn && (
            <Button asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/tools">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Tools Directory
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
