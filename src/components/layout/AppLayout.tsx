import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      <div className="pl-64">
        <TopBar />
        
        <main className="p-8">
          <div className="max-w-4xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
