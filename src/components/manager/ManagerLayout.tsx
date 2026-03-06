import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import QuickAddFAB from "./QuickAddFAB";
import {
  LayoutDashboard, FileText, Rocket, Mail, Handshake, Brain,
  Sparkles, Settings, Menu, X, LogOut, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

const boards = [
  { id: "content", label: "Content Pipeline", icon: FileText, path: "/manage/board/content" },
  { id: "platform", label: "ProvenAI Platform", icon: Rocket, path: "/manage/board/platform" },
  { id: "funnel", label: "Funnel & Email", icon: Mail, path: "/manage/board/funnel" },
  { id: "bizdev", label: "Business Dev", icon: Handshake, path: "/manage/board/bizdev" },
  { id: "strategy", label: "Strategy & Horizon", icon: Brain, path: "/manage/board/strategy" },
];

export default function ManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors",
      isActive
        ? "bg-[#1c2128] text-[#00bcd4] border-l-2 border-[#00bcd4]"
        : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
    );

  const sidebar = (
    <aside className="w-64 h-screen flex flex-col bg-[#0d1117] border-r border-[#30363d] fixed lg:sticky top-0 z-40">
      {/* Logo */}
      <div className="p-5 border-b border-[#30363d]">
        <span className="text-lg font-bold text-[#00bcd4] font-mono tracking-tight">
          ProvenAI Manager
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <NavLink to="/manage" end className={linkClass}>
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>

        <div className="pt-4 pb-1 px-4">
          <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Boards</span>
        </div>

        {boards.map((b) => (
          <NavLink key={b.id} to={b.path} className={linkClass} onClick={() => setSidebarOpen(false)}>
            <b.icon className="h-4 w-4" />
            {b.label}
          </NavLink>
        ))}

        <NavLink to="/manage/calendar" className={linkClass} onClick={() => setSidebarOpen(false)}>
          <Calendar className="h-4 w-4" />
          Calendar
        </NavLink>
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#30363d] p-3 space-y-1">
        <NavLink to="/manage/ai" className={({ isActive }) =>
          cn(linkClass({ isActive }), "text-[#e91e8c] hover:text-[#e91e8c]")
        }>
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </NavLink>

        <NavLink to="/manage/settings" className={linkClass}>
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>

        <div className="flex items-center justify-between px-4 py-2 text-sm text-[#8b949e]">
          <span className="truncate">{user?.email ?? "User"}</span>
          <button onClick={handleSignOut} className="hover:text-[#f85149] transition-colors" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#1c2128] text-[#c9d1d9] border border-[#30363d]"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "lg:block",
        sidebarOpen ? "block" : "hidden"
      )}>
        {sidebar}
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen lg:ml-0">
        <Outlet />
      </main>

      {/* Quick Add FAB */}
      <QuickAddFAB />
    </div>
  );
}
