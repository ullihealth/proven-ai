import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import Guides from "./pages/learn/Guides";
import Prompts from "./pages/learn/Prompts";
import LearnTools from "./pages/learn/LearnTools";
import ToolsDirectory from "./pages/tools/ToolsDirectory";
import ToolDetail from "./pages/tools/ToolDetail";
import PaidCourses from "./pages/courses/PaidCourses";
import Support from "./pages/support/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Start Here */}
          <Route path="/orientation" element={<Orientation />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/free-vs-paid" element={<FreeVsPaid />} />
          
          {/* Glossary */}
          <Route path="/glossary" element={<Glossary />} />
          
          {/* Daily Flow */}
          <Route path="/daily/monday" element={<MondayFlow />} />
          <Route path="/daily/tuesday" element={<TuesdayFlow />} />
          <Route path="/daily/wednesday" element={<WednesdayFlow />} />
          <Route path="/daily/thursday" element={<ThursdayFlow />} />
          <Route path="/daily/friday" element={<FridayFlow />} />
          
          {/* Learn */}
          <Route path="/learn/courses" element={<FreeCourses />} />
          <Route path="/learn/guides" element={<Guides />} />
          <Route path="/learn/prompts" element={<Prompts />} />
          <Route path="/learn/tools" element={<LearnTools />} />
          
          {/* Tools */}
          <Route path="/tools" element={<ToolsDirectory />} />
          <Route path="/tools/:toolId" element={<ToolDetail />} />
          
          {/* Go Deeper */}
          <Route path="/courses/paid" element={<PaidCourses />} />
          
          {/* Support */}
          <Route path="/support" element={<Support />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
