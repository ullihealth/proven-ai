import { Link } from "react-router-dom";
import { Lock, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/lib/courses/types";
import { formatInclusionDate, getPriceTierLabel } from "@/lib/courses/entitlements";

interface CourseAccessGateProps {
  course: Course;
}

/**
 * Displayed when a member tries to access a paid course they don't have
 * Calm, informative - no urgency language or countdown timers
 * 
 * Ready for Stripe integration
 */
export function CourseAccessGate({ course }: CourseAccessGateProps) {
  const { title, description, estimatedTime, priceTier, releaseDate } = course;
  const priceLabel = getPriceTierLabel(priceTier);
  const inclusionDate = formatInclusionDate(releaseDate);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        {/* Back link */}
        <Link 
          to="/learn/courses" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 flex-shrink-0">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {estimatedTime}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground">
            {description}
          </p>

          {/* Pricing info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current price</span>
              <Badge variant="secondary" className="font-medium">
                {priceLabel}
              </Badge>
            </div>
            
            {inclusionDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Included for members on: {inclusionDate}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full" size="lg" disabled>
              Purchase Access — Coming Soon
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Stripe integration will be available soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
