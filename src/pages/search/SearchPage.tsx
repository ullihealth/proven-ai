import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toolsData } from "@/data/toolsData";
import { directoryTools } from "@/data/directoryToolsData";
import { glossaryTerms } from "@/data/glossaryData";
import { courses } from "@/data/coursesData";
import type { Guide } from "@/lib/guides/types";
import type { DailyFlowPost } from "@/lib/dailyflow/types";
import { BookOpen, Wrench, BookMarked, SearchX, Lightbulb, LayoutGrid, CalendarDays, GraduationCap } from "lucide-react";

// Smart normalisation: strips ALL non-alphanumeric chars + lowercases
// "Chat GPT" → "chatgpt" matches "ChatGPT" → "chatgpt"
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/gi, "");

const matches = (text: string, q: string) => {
  const nt = norm(text);
  const nq = norm(q);
  return nt.includes(nq) || text.toLowerCase().includes(q.toLowerCase());
};

const promptItems = [
  { title: "Email Writing Prompts", description: "Ready-to-use prompts for drafting professional emails in various contexts.", href: "/learn/prompts" },
  { title: "Research & Analysis Prompts", description: "Prompts for summarizing, analyzing, and extracting insights from documents.", href: "/learn/prompts" },
  { title: "Meeting & Notes Prompts", description: "Prompts for preparing agendas, summarizing meetings, and organizing notes.", href: "/learn/prompts" },
  { title: "Creative Writing Prompts", description: "Prompts for brainstorming, storytelling, and creative projects.", href: "/learn/prompts" },
];

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-blue-500/20 text-blue-300 rounded px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-400">{icon}</span>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,.45)]">{label}</h2>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function ResultCard({ to, title, subtitle, tag, query }: { to: string; title: string; subtitle?: string; tag?: string; query: string }) {
  return (
    <Link to={to} className="block bg-[var(--cc-card)] border border-[rgba(255,255,255,.05)] rounded-lg px-4 py-3 hover:border-blue-500/30 hover:bg-[rgba(59,130,246,.05)] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white leading-snug"><Highlight text={title} query={query} /></p>
        {tag && <span className="text-[10px] text-[rgba(255,255,255,.35)] shrink-0 mt-0.5">{tag}</span>}
      </div>
      {subtitle && <p className="text-xs text-[rgba(255,255,255,.45)] mt-0.5 line-clamp-2"><Highlight text={subtitle} query={query} /></p>}
    </Link>
  );
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [dailyPosts, setDailyPosts] = useState<DailyFlowPost[]>([]);

  useEffect(() => {
    fetch("/api/guides", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.guides && setGuides(d.guides))
      .catch(() => null);
    fetch("/api/daily-flow", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.posts && setDailyPosts(d.posts.filter((p: DailyFlowPost) => p.status === "published")))
      .catch(() => null);
  }, []);

  if (!q) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center gap-3 py-32 text-center">
          <p className="text-[rgba(255,255,255,.35)] text-sm">Use the search bar above to find courses, guides, tools and more.</p>
        </div>
      </AppLayout>
    );
  }

  const courseResults   = courses.filter(c => matches(c.title, q) || (c.description && matches(c.description, q)));
  const guideResults    = guides.filter(g => matches(g.title, q) || matches(g.description, q) || g.tags?.some(t => matches(t, q)));
  const dailyResults    = dailyPosts.filter(p => matches(p.title, q) || (p.description && matches(p.description, q)));
  const promptResults   = promptItems.filter(p => matches(p.title, q) || matches(p.description, q));
  const toolResults     = toolsData.filter(t => matches(t.name, q) || matches(t.category, q) || matches(t.sections.whatProblemSolves, q));
  const dirResults      = directoryTools.filter(t => matches(t.name, q) || matches(t.primaryCategory, q) || (t.bestFor && matches(t.bestFor, q)));
  const glossaryResults = glossaryTerms.filter(g => matches(g.term, q) || matches(g.definition, q));

  // Deduplicate directory results that already appear in toolsData
  const toolIds = new Set(toolResults.map(t => norm(t.name)));
  const filteredDirResults = dirResults.filter(t => !toolIds.has(norm(t.name)));

  const total = courseResults.length + guideResults.length + dailyResults.length + promptResults.length + toolResults.length + filteredDirResults.length + glossaryResults.length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Results for <span className="text-blue-400">"{q}"</span></h1>
          <p className="text-[rgba(255,255,255,.45)] text-sm">{total} result{total !== 1 ? "s" : ""} across courses, guides, tools &amp; more</p>
        </div>

        {total === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <SearchX className="h-10 w-10 text-[rgba(255,255,255,.2)]" />
            <p className="text-[rgba(255,255,255,.55)] text-sm">Nothing found for <span className="text-white">"{q}"</span></p>
            <p className="text-[rgba(255,255,255,.35)] text-xs mt-1">Try <Link to="/learn/courses" className="text-blue-400 hover:underline">Courses</Link>, <Link to="/tools/directory" className="text-blue-400 hover:underline">Tools Directory</Link>, or the <Link to="/glossary" className="text-blue-400 hover:underline">Glossary</Link>.</p>
          </div>
        )}

        {courseResults.length > 0 && (
          <Section icon={<BookOpen className="h-4 w-4" />} label="Courses">
            {courseResults.map(c => <ResultCard key={c.id} to={`/learn/courses/${c.slug || c.id}`} title={c.title} subtitle={c.description} query={q} />)}
          </Section>
        )}

        {guideResults.length > 0 && (
          <Section icon={<GraduationCap className="h-4 w-4" />} label="Guides">
            {guideResults.map(g => <ResultCard key={g.id} to="/learn/guides" title={g.title} subtitle={g.description} tag={g.difficulty} query={q} />)}
          </Section>
        )}

        {promptResults.length > 0 && (
          <Section icon={<Lightbulb className="h-4 w-4" />} label="Prompts">
            {promptResults.map(p => <ResultCard key={p.title} to={p.href} title={p.title} subtitle={p.description} query={q} />)}
          </Section>
        )}

        {dailyResults.length > 0 && (
          <Section icon={<CalendarDays className="h-4 w-4" />} label="Daily Flow">
            {dailyResults.map(p => <ResultCard key={p.id} to={`/daily/${p.day}`} title={p.title} subtitle={p.description} tag={p.day} query={q} />)}
          </Section>
        )}

        {toolResults.length > 0 && (
          <Section icon={<Wrench className="h-4 w-4" />} label="Tools">
            {toolResults.map(t => <ResultCard key={t.id} to={`/tools/${t.id}`} title={t.name} subtitle={t.sections.whatProblemSolves} tag={t.category} query={q} />)}
          </Section>
        )}

        {filteredDirResults.length > 0 && (
          <Section icon={<LayoutGrid className="h-4 w-4" />} label="Tools Directory">
            {filteredDirResults.slice(0, 8).map(t => <ResultCard key={t.id} to="/tools/directory" title={t.name} subtitle={t.bestFor} tag={t.primaryCategory} query={q} />)}
          </Section>
        )}

        {glossaryResults.length > 0 && (
          <Section icon={<BookMarked className="h-4 w-4" />} label="Glossary">
            {glossaryResults.slice(0, 8).map(g => <ResultCard key={g.term} to="/glossary" title={g.term} subtitle={g.definition} query={q} />)}
          </Section>
        )}
      </div>
    </AppLayout>
  );
}
