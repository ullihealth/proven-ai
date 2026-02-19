import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getUserPreference, saveUserPreference } from "@/lib/storage/userPreferencesStore";

const ONBOARDING_DISMISSED_KEY = "onboarding_dismissed";

export const OnboardingBanner = () => {
  const { isAuthenticated, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show for authenticated members who haven't dismissed
    if (!isAuthenticated || !user) {
      setIsVisible(false);
      return;
    }

    const dismissed = getUserPreference<boolean>(ONBOARDING_DISMISSED_KEY);
    if (dismissed) {
      setIsVisible(false);
      return;
    }

    // Show the banner for authenticated users who haven't dismissed
    setIsVisible(true);
  }, [isAuthenticated, user]);

  const handleDismiss = async () => {
    setIsVisible(false);
    await saveUserPreference(ONBOARDING_DISMISSED_KEY, true);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-foreground">
              New here? Start with the Proven AI orientation to understand how everything fits together.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/orientation">Start Orientation</Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
          aria-label="Dismiss onboarding banner"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
