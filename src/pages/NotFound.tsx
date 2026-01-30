import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-4xl font-semibold text-foreground">Page Not Found</h1>
        <p className="mt-4 text-lg text-pai-text-secondary max-w-md">
          This page doesn't exist yet, or the content has moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </AppLayout>
  );
};

export default NotFound;
