import { AppSidebar } from "./AppSidebar";
import { MobileSidebar } from "./MobileSidebar";
import { TopBar } from "./TopBar";
import { SiteFooter } from "./SiteFooter";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
  /** Use wider container (e.g. Dashboard 12-col grid) */
  wide?: boolean;
}

export const AppLayout = ({ children, wide }: AppLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {!isMobile && <AppSidebar />}
      
      {/* Mobile header with hamburger */}
      {isMobile && <MobileSidebar />}
      
      <div className={`flex flex-col h-screen ${isMobile ? "" : "pl-64"}`}>
        {!isMobile && <TopBar />}
        
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
          <main className={`px-4 sm:px-6 ${wide ? "lg:px-8 pt-0" : "lg:p-8"} ${isMobile ? "pt-20" : "py-4"}`}>
            <div className={`${wide ? "max-w-[1440px]" : "max-w-4xl"} mx-auto animate-fade-in`}>
              {children}
            </div>
          </main>

          {wide && <SiteFooter />}
        </div>
      </div>
    </div>
  );
};
