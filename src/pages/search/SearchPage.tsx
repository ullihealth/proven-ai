import { useSearchParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { toolsData } from "@/data/toolsData";
import { glossaryTerms } from "@/data/glossaryData";
import { courses } from "@/data/coursesData";
import { BookOpen, Wrench, BookMarked, SearchX } from "lucide-react";

function highlight(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-blue-500/20 text-blue-300 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const lq = q.toLowerCase();

  const toolResults = !lq ? [] : toolsData.filter(
    (t) =>
      t.name.toLowerCase().includes(lq) ||
      t.category.toLowerCase().includes(lq) ||
      t.sections.whatProblemSolves.toLowerCase().includes(lq)
  );

  const glossaryResults = !lq ? [] : glossaryTerms.filter(
    (g) =>
      g.term.toLowerCase().includes(lq) ||
      g.definition.toLowerCase().includes(lq)
  );

  const courseResults = !lq ? [] : courses.filter(
    (c) =>
      c.title.toLowerCase().includes(lq) ||
      (c.description && c.description.toLowerCase().includes(lq))
  );

  const total = toolResults.length + glossaryResults.length + courseResults.length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {q ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">
                Results for <span className="text-blue-400">"{q}"</span>
              </h1>
              <p className="text-[rgba(255,255,255,.45)] text-sm">
                {total} result{total !== 1 ? "s" : ""} across courses, tools &amp; glossary
              </p>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-white">Search</h1>
          )}
        </div>

        {/* No results */}
        {q && total === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <SearchX className="h-10 w-10 text-[rgba(255,255,255,.2)]" />
            <p className="text-[rgba(255,255,255,.55)] text-sm">
              Nothing found for <span className="text-white">"{q}"</span>
            </p>
            <p className="text-[rgba(255,255,255,.35)] text-xs">
              Try a different term, or browse <Link to="/learn/courses" className="text-blue-400 hover:underline">Courses</Link>,{" "}
              <Link to="/tools/directory" className="text-blue-400 hover:underline">Tools</Link>,{" "}
              or the <Link to="/glossary" className="text-blue-400 hover:underline">Glossary</Link>.
            </p>
          </div>
        )}

        {/* Courses */}
        {courseResults.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,.45)]">
                Courses
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {courseResults.map((c) => (
                <Link
                  key={c.id}
                  to={`/learn/courses/${c.slug || c.id}`}
                  className="block bg-[var(--cc-card)] border border-[rgba(255,255,255,.05)] rounded-lg px-4 py-3 hover:border-blue-500/30 hover:bg-[rgba(59,130,246,.05)] transition-colors"
                >
                  <p className="text-sm font-semibold text-white">
                    {highlight(c.title, q)}
                  </p>
                  {c.description && (
                    <p className="text-xs text-[rgba(255,255,255,.45)] mt-0.5 line-clamp-1">
                      {highlight(c.description, q)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tools */}
        {toolResults.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-blue-400" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,.45)]">
                Tools
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {toolResults.map((t) => (
                <Link
                  key={t.id}
                  to={`/tools/${t.id}`}
                  className="block bg-[var(--cc-card)] border border-[rgba(255,255,255,.05)] rounded-lg px-4 py-3 hover:border-blue-500/30 hover:bg-[rgba(59,130,246,.05)] transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">
                      {highlight(t.name, q)}
                    </p>
                    <span className="text-[10px] text-[rgba(255,255,255,.35)] shrink-0">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-xs text-[rgba(255,255,255,.45)] mt-0.5 line-clamp-1">
                    {highlight(t.sections.whatProblemSolves, q)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Glossary */}
        {glossaryResults.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <BookMarked className="h-4 w-4 text-blue-400" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,.45)]">
                Glossary
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {glossaryResults.slice(0, 8).map((g) => (
                <Link
                  key={g.term}
                  to={`/glossary`}
                  className="block bg-[var(--cc-card)] border border-[rgba(255,255,255,.05)] rounded-lg px-4 py-3 hover:border-blue-500/30 hover:bg-[rgba(59,130,246,.05)] transition-colors"
                >
                  <p className="text-sm font-semibold text-white">
                    {highlight(g.term, q)}
                  </p>
                  <p className="text-xs text-[rgba(255,255,255,.45)] mt-0.5 line-clamp-2">
                    {highlight(g.definition, q)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state — no query */}
        {!q && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-[rgba(255,255,255,.35)] text-sm">
              Use the search bar above to find courses, tools and glossary terms.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
