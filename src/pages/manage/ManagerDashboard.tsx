import { useEffect, useState } from "react";
import { fetchAllCards, type Card } from "@/lib/manager";
import { getRagStatus, ragDotColor } from "@/lib/manager/ragStatus";
import { AlertTriangle, Clock, Zap, CheckCircle2, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { SkeletonStatCard, SkeletonRow } from "@/components/manager/Skeletons";
import { cn } from "@/lib/utils";

const boardNames: Record<string, string> = {
  content: "Content Pipeline",
  platform: "ProvenAI Platform",
  funnel: "Funnel & Email",
  bizdev: "Business Dev",
  strategy: "Strategy & Horizon",
};

const priorityColors: Record<string, string> = {
  critical: "text-[#f85149]",
  this_week: "text-[#00bcd4]",
  backlog: "text-[#a0aab8]",
};

const priorityBg: Record<string, string> = {
  critical: "bg-[#f85149]/10 border-[#f85149]/30",
  this_week: "bg-[#00bcd4]/10 border-[#00bcd4]/30",
  backlog: "bg-[#a0aab8]/10 border-[#a0aab8]/30",
};

export default function ManagerDashboard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchAllCards()
      .then((d) => setCards(d.cards))
      .catch((e) => setError(e?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const in3days = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);

  const doneColumns = ["content-published", "platform-live", "funnel-active", "funnel-archived", "bizdev-active", "strategy-decided", "strategy-archived"];

  const overdue = cards.filter((c) => c.due_date && c.due_date < todayStr && !doneColumns.includes(c.column_id));
  const critical = cards.filter((c) => c.priority === "critical" && !doneColumns.includes(c.column_id));
  const thisWeek = cards.filter((c) => c.priority === "this_week" && !doneColumns.includes(c.column_id));
  const comingUp = cards.filter((c) => c.due_date && c.due_date >= todayStr && c.due_date <= in3days && !doneColumns.includes(c.column_id));
  const totalActive = cards.filter((c) => !doneColumns.includes(c.column_id)).length;
  const totalDone = cards.filter((c) => doneColumns.includes(c.column_id)).length;

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[#e0e7ef]">Dashboard</h1>
          <p className="text-sm text-[#a0aab8] mt-1">Your business at a glance</p>
        </div>
        <Link
          to="/manage/board/content"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Quick Add
        </Link>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-lg border-2 border-[#f85149]/40 bg-[#f85149]/5 p-8 text-center max-w-md">
            <AlertTriangle className="h-8 w-8 text-[#f85149] mx-auto mb-3" />
            <p className="text-[#e0e7ef] font-semibold mb-1">Failed to load dashboard</p>
            <p className="text-sm text-[#a0aab8] mb-4">{error}</p>
            <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#f85149]/20 text-[#f85149] text-sm font-semibold hover:bg-[#f85149]/30 transition-colors">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<AlertTriangle className="h-5 w-5 text-[#f85149]" />} label="Overdue" value={overdue.length} />
            <StatCard icon={<Zap className="h-5 w-5 text-[#f85149]" />} label="Critical" value={critical.length} />
            <StatCard icon={<Clock className="h-5 w-5 text-[#00bcd4]" />} label="Active" value={totalActive} />
            <StatCard icon={<CheckCircle2 className="h-5 w-5 text-[#3fb950]" />} label="Done" value={totalDone} />
          </div>

          {/* Today's Focus */}
          <section>
            <h2 className="text-lg font-semibold font-mono text-[#e0e7ef] mb-3">Today's Focus</h2>
            <div className="space-y-2">
              {[...overdue, ...critical.filter((c) => !overdue.includes(c))].slice(0, 8).map((card) => (
                <CardRow key={card.id} card={card} />
              ))}
              {overdue.length === 0 && critical.length === 0 && (
                <p className="text-sm text-[#a0aab8]">Nothing urgent — nice work! 🎉</p>
              )}
            </div>
          </section>

          {/* Coming Up */}
          <section>
            <h2 className="text-lg font-semibold font-mono text-[#e0e7ef] mb-3">Coming Up (3 days)</h2>
            <div className="space-y-2">
              {comingUp.length === 0 ? (
                <p className="text-sm text-[#a0aab8]">No upcoming deadlines</p>
              ) : (
                comingUp.map((card) => <CardRow key={card.id} card={card} />)
              )}
            </div>
          </section>

          {/* This Week */}
          <section>
            <h2 className="text-lg font-semibold font-mono text-[#e0e7ef] mb-3">This Week Priority</h2>
            <div className="space-y-2">
              {thisWeek.slice(0, 10).map((card) => (
                <CardRow key={card.id} card={card} />
              ))}
              {thisWeek.length === 0 && (
                <p className="text-sm text-[#a0aab8]">No this-week tasks</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-[#242b35] rounded-lg border border-[#30363d] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-2xl font-bold font-mono text-[#e0e7ef]">{value}</div>
          <div className="text-xs text-[#a0aab8]">{label}</div>
        </div>
      </div>
    </div>
  );
}

function CardRow({ card }: { card: Card }) {
  const rag = getRagStatus(card);
  return (
    <Link
      to={`/manage/board/${card.board_id}`}
      className="flex items-center gap-3 p-3 rounded-lg bg-[#242b35] border border-[#30363d] hover:border-[#00bcd4]/40 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
    >
      {/* RAG dot */}
      <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", ragDotColor[rag])} />
      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${priorityBg[card.priority]}`}>
        <span className={priorityColors[card.priority]}>
          {card.priority === "critical" ? "CRITICAL" : card.priority === "this_week" ? "THIS WEEK" : "BACKLOG"}
        </span>
      </span>
      <span className="flex-1 text-sm text-[#e0e7ef] truncate">{card.title}</span>
      <span className="text-xs text-[#a0aab8]">{boardNames[card.board_id]}</span>
      {card.due_date && (
        <span className="text-xs text-[#a0aab8]">{card.due_date}</span>
      )}
    </Link>
  );
}
