import { AppSidebar } from "./AppSidebar";
import { MobileSidebar } from "./MobileSidebar";
import { TopBar } from "./TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && <AppSidebar />}
      
      {/* Mobile header with hamburger */}
      {isMobile && <MobileSidebar />}
      
      <div className={isMobile ? "" : "pl-64"}>
        {!isMobile && <TopBar />}
        
        <main className={`p-4 sm:p-6 lg:p-8 ${isMobile ? "pt-20" : ""}`}>
          <div className="max-w-4xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
