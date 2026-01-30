interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export const PageHeader = ({ title, description, badge }: PageHeaderProps) => {
  return (
    <div className="pai-page-header">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1>{title}</h1>
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-2 text-lg text-pai-text-secondary max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
