interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}
export const PageHeader = ({
  title,
  description,
  badge
}: PageHeaderProps) => {
  return <div className="pb-8 mb-8 border-b border-border">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-pai-text-heading">{title}</h1>
            {badge && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-secondary-foreground border border-secondary/30 bg-destructive">
                {badge}
              </span>}
          </div>
          {description && <p className="mt-3 text-lg text-pai-text-secondary max-w-2xl leading-relaxed">
              {description}
            </p>}
        </div>
      </div>
    </div>;
};