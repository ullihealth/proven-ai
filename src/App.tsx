import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ToolsProvider } from "@/lib/tools";
import { RequireAdmin, RequireMember } from "@/components/auth";

// Pages
import Dashboard from "./pages/Dashboard";
import Orientation from "./pages/start/Orientation";
import HowItWorks from "./pages/start/HowItWorks";
import FreeVsPaid from "./pages/start/FreeVsPaid";
import Glossary from "./pages/glossary/Glossary";
import MondayFlow from "./pages/daily/Monday";
import TuesdayFlow from "./pages/daily/Tuesday";
import WednesdayFlow from "./pages/daily/Wednesday";
import ThursdayFlow from "./pages/daily/Thursday";
import FridayFlow from "./pages/daily/Friday";
import FreeCourses from "./pages/learn/FreeCourses";
import CourseLandingPage from "./pages/learn/CourseLandingPage";
import LessonPage from "./pages/learn/LessonPage";
import Guides from "./pages/learn/Guides";
import GuidesDiscovery from "./pages/learn/GuidesDiscovery";
import Prompts from "./pages/learn/Prompts";
import LearnTools from "./pages/learn/LearnTools";
import CoreTools from "./pages/tools/CoreTools";
import ToolsDirectory from "./pages/tools/ToolsDirectory";
import ToolDetail from "./pages/tools/ToolDetail";
import DirectoryToolDetail from "./pages/directory/DirectoryToolDetail";
import PaidCourses from "./pages/courses/PaidCourses";
import Support from "./pages/support/Support";
import AuthPage from "./pages/auth/AuthPage";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminOverview from "./pages/admin/AdminOverview";
import AddTool from "./pages/admin/AddTool";
import ToolCardCustomization from "./pages/admin/tools/ToolCardCustomization";
import ReviewQueue from "./pages/admin/ReviewQueue";
import TrustLadderRules from "./pages/admin/governance/TrustLadderRules";
import ReviewChecklist from "./pages/admin/governance/ReviewChecklist";
import StatusExpiryRules from "./pages/admin/governance/StatusExpiryRules";
import AuditLog from "./pages/admin/AuditLog";
import MemberProfiles from "./pages/admin/members/MemberProfiles";
import AccessRoles from "./pages/admin/members/AccessRoles";
import TeamMembers from "./pages/admin/team/TeamMembers";
import Permissions from "./pages/admin/team/Permissions";
import Analytics from "./pages/admin/Analytics";
import Integrations from "./pages/admin/Integrations";
import AppLogs from "./pages/admin/system/AppLogs";
import DeveloperSettings from "./pages/admin/system/DeveloperSettings";
import AppCustomisation from "./pages/admin/system/AppCustomisation";
import Finance from "./pages/admin/Finance";
import CourseManagement from "./pages/admin/content/CourseManagement";
import GuideManagement from "./pages/admin/content/GuideManagement";
import DailyFlowManagement from "./pages/admin/content/DailyFlowManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToolsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Auth */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Start Here - Public */}
              <Route path="/orientation" element={<Orientation />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/free-vs-paid" element={<FreeVsPaid />} />
              
              {/* Glossary - Member only */}
              <Route path="/glossary" element={
                <RequireMember><Glossary /></RequireMember>
              } />
              
              {/* Daily Flow - Member only */}
              <Route path="/daily/monday" element={
                <RequireMember><MondayFlow /></RequireMember>
              } />
              <Route path="/daily/tuesday" element={
                <RequireMember><TuesdayFlow /></RequireMember>
              } />
              <Route path="/daily/wednesday" element={
                <RequireMember><WednesdayFlow /></RequireMember>
              } />
              <Route path="/daily/thursday" element={
                <RequireMember><ThursdayFlow /></RequireMember>
              } />
              <Route path="/daily/friday" element={
                <RequireMember><FridayFlow /></RequireMember>
              } />
              
              {/* Learn - Member only */}
              <Route path="/learn/courses" element={
                <RequireMember><FreeCourses /></RequireMember>
              } />
              <Route path="/learn/guides" element={
                <RequireMember><Guides /></RequireMember>
              } />
              <Route path="/learn/guides/discover" element={
                <RequireMember><GuidesDiscovery /></RequireMember>
              } />
              <Route path="/learn/prompts" element={
                <RequireMember><Prompts /></RequireMember>
              } />
              <Route path="/learn/tools" element={
                <RequireMember><LearnTools /></RequireMember>
              } />
              
              {/* Core Tools - Member only */}
              <Route path="/core-tools" element={
                <RequireMember><CoreTools /></RequireMember>
              } />
              
              {/* Tools Directory - Member only */}
              <Route path="/tools/directory" element={
                <RequireMember><ToolsDirectory /></RequireMember>
              } />
              <Route path="/tools/:toolId" element={
                <RequireMember><ToolDetail /></RequireMember>
              } />
              <Route path="/directory/:toolId" element={
                <RequireMember><DirectoryToolDetail /></RequireMember>
              } />
              {/* Redirect old /tools to new location */}
              <Route path="/tools" element={<Navigate to="/core-tools" replace />} />
              
              {/* Admin Console - Protected */}
              <Route path="/admin" element={
                <RequireAdmin><AdminOverview /></RequireAdmin>
              } />
              
              {/* Admin > Tools */}
              <Route path="/admin/tools/add" element={
                <RequireAdmin><AddTool /></RequireAdmin>
              } />
              <Route path="/admin/tools/review-queue" element={
                <RequireAdmin><ReviewQueue /></RequireAdmin>
              } />
              <Route path="/admin/tools/customize" element={
                <RequireAdmin><ToolCardCustomization /></RequireAdmin>
              } />
              {/* Redirect old routes */}
              <Route path="/admin/add-tool" element={<Navigate to="/admin/tools/add" replace />} />
              <Route path="/admin/review-queue" element={<Navigate to="/admin/tools/review-queue" replace />} />
              
              {/* Admin > Content */}
              <Route path="/admin/content/daily-flow" element={
                <RequireAdmin><DailyFlowManagement /></RequireAdmin>
              } />
              <Route path="/admin/content/courses" element={
                <RequireAdmin><CourseManagement /></RequireAdmin>
              } />
              <Route path="/admin/content/guides" element={
                <RequireAdmin><GuideManagement /></RequireAdmin>
              } />
              
              {/* Admin > Governance */}
              <Route path="/admin/governance/trust-ladder" element={
                <RequireAdmin><TrustLadderRules /></RequireAdmin>
              } />
              <Route path="/admin/governance/review-checklist" element={
                <RequireAdmin><ReviewChecklist /></RequireAdmin>
              } />
              <Route path="/admin/governance/status-expiry" element={
                <RequireAdmin><StatusExpiryRules /></RequireAdmin>
              } />
              <Route path="/admin/audit-log" element={
                <RequireAdmin><AuditLog /></RequireAdmin>
              } />
              
              {/* Admin > Members */}
              <Route path="/admin/members/profiles" element={
                <RequireAdmin><MemberProfiles /></RequireAdmin>
              } />
              <Route path="/admin/members/roles" element={
                <RequireAdmin><AccessRoles /></RequireAdmin>
              } />
              
              {/* Admin > Team */}
              <Route path="/admin/team/members" element={
                <RequireAdmin><TeamMembers /></RequireAdmin>
              } />
              <Route path="/admin/team/permissions" element={
                <RequireAdmin><Permissions /></RequireAdmin>
              } />
              
              {/* Admin > Analytics & Integrations */}
              <Route path="/admin/analytics" element={
                <RequireAdmin><Analytics /></RequireAdmin>
              } />
              <Route path="/admin/integrations" element={
                <RequireAdmin><Integrations /></RequireAdmin>
              } />
              
              {/* Admin > System */}
              <Route path="/admin/system/logs" element={
                <RequireAdmin><AppLogs /></RequireAdmin>
              } />
              <Route path="/admin/system/developer" element={
                <RequireAdmin><DeveloperSettings /></RequireAdmin>
              } />
              <Route path="/admin/system/customisation" element={
                <RequireAdmin><AppCustomisation /></RequireAdmin>
              } />
              
              {/* Admin > Finance */}
              <Route path="/admin/finance" element={
                <RequireAdmin><Finance /></RequireAdmin>
              } />
              
              {/* Go Deeper - Member only */}
              <Route path="/courses/paid" element={
                <RequireMember><PaidCourses /></RequireMember>
              } />
              
              {/* Support */}
              <Route path="/support" element={<Support />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ToolsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
