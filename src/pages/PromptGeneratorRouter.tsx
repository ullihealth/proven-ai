import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import PromptGeneratorPage from "./PromptGeneratorPage";
import { Loader2 } from "lucide-react";

type RouteState =
  | { status: "loading" }
  | { status: "generator"; userType: "paid_member" | "free_subscriber"; email: string; token?: string; isAnonymous?: boolean };

const PromptGeneratorRouter = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [routeState, setRouteState] = useState<RouteState>({ status: "loading" });

  useEffect(() => {
    if (authLoading) return;

    // Logged-in member — grant access directly
    if (user) {
      setRouteState({
        status: "generator",
        userType: "paid_member",
        email: user.email,
      });
      return;
    }

    // Token present — validate it
    if (token) {
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(
            `/api/prompt-generator/validate-token?token=${encodeURIComponent(token)}`,
            { credentials: "include" }
          );
          const data = (await res.json()) as {
            valid: boolean;
            email?: string;
            user_type?: "free_subscriber";
          };

          if (!cancelled) {
            if (data.valid && data.email) {
              setRouteState({
                status: "generator",
                userType: "free_subscriber",
                email: data.email,
                token,
              });
            } else {
              navigate("/promptgenerator/access?expired=true", { replace: true });
            }
          }
        } catch {
          if (!cancelled) navigate("/promptgenerator/access", { replace: true });
        }
      })();

      return () => { cancelled = true; };
    }

    // No session, no token — redirect to access page
    navigate("/promptgenerator/access", { replace: true });
  }, [authLoading, user, token, navigate]);

  if (routeState.status === "loading") {
    return (
      <div
        style={{ backgroundColor: "#0d1117", minHeight: "100vh" }}
        className="flex items-center justify-center"
      >
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#00bcd4" }} />
      </div>
    );
  }

  return (
    <PromptGeneratorPage
      userType={routeState.userType}
      userEmail={routeState.email}
      guestToken={routeState.token}
      isAnonymous={routeState.isAnonymous}
    />
  );
};

export default PromptGeneratorRouter;
