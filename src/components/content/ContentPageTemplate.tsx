import { Clock, User, AlertCircle } from "lucide-react";
interface ContentPageTemplateProps {
  title: string;
  description: string;
  whoFor: string;
  whyMatters: string;
  lastUpdated: string;
  children: React.ReactNode;
}
export const ContentPageTemplate = ({
  title,
  description,
  whoFor,
  whyMatters,
  lastUpdated,
  children
}: ContentPageTemplateProps) => {
  return <article>
      <header className="pai-page-header">
        
        

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          
          
          <div className="flex items-start gap-3 p-4 rounded-lg bg-pai-surface border border-pai-border-subtle">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Why it matters</p>
              <p className="mt-1 text-sm text-pai-text-secondary">{whyMatters}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-sm text-pai-text-muted">
          <Clock className="h-4 w-4" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </header>

      <div className="prose prose-slate max-w-none">
        {children}
      </div>
    </article>;
};