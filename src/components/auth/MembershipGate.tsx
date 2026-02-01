import { Link } from "react-router-dom";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MembershipGateProps {
  title?: string;
  description?: string;
}

/**
 * Displayed when a logged-out user tries to access member content
 * Encourages sign-up/sign-in without aggressive language
 * 
 * Ready for BetterAuth backend enforcement
 */
export function MembershipGate({ 
  title = "Member Content",
  description = "This content is available to Proven AI members."
}: MembershipGateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link to="/auth">
              <Sparkles className="h-4 w-4 mr-2" />
              Sign In or Create Account
            </Link>
          </Button>
          
          <Button variant="ghost" asChild className="w-full">
            <Link to="/free-vs-paid">
              Learn about membership
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground">
          Already a member? Sign in to access all content.
        </p>
      </div>
    </div>
  );
}
