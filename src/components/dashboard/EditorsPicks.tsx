import { Link } from "react-router-dom";
import { getEditorsPicks, type EditorPick } from "@/lib/editorsPicks/editorsPicksStore";

/**
 * EditorsPicks — Two curated video picks in alternating editorial rows.
 * Row 1: image left / text right.  Row 2: image right / text left.
 * Stacks vertically on mobile (image on top).
 * Data sourced from localStorage via editorsPicksStore.
 */

/* ── Gradient placeholder when no image is set ── */
const Placeholder = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-[#1E293B] to-[#0F172A]" />
);

/* ── Single editorial row ── */
const PickRow = ({
  pick,
  reversed,
}: {
  pick: EditorPick;
  reversed: boolean;
}) => (
  <Link
    to={pick.href}
    className={`group flex flex-col md:flex-row gap-4 md:gap-5 ${
      reversed ? "md:flex-row-reverse" : ""
    }`}
  >
    {/* Thumbnail — always first on mobile via flex-col order */}
    <div className="w-full md:w-[40%] flex-shrink-0">
      <div
        className="relative w-full overflow-hidden rounded-[4px] transition-transform duration-150 ease-out group-hover:scale-[1.02]"
        style={{ paddingBottom: "56.25%" }}
      >
        {pick.thumbnailUrl ? (
          <img
            src={pick.thumbnailUrl}
            alt={pick.headline}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Placeholder />
        )}
      </div>
    </div>

    {/* Text */}
    <div className="w-full md:w-[60%] flex flex-col justify-start pt-0.5">
      <h3 className="text-[18px] font-semibold leading-snug text-[#111827] group-hover:underline underline-offset-2 decoration-[#111827]/30">
        {pick.headline}
      </h3>
      <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280] line-clamp-3">
        {pick.summary}
      </p>
      {pick.meta && (
        <span className="mt-1.5 text-[12px] text-[#9CA3AF]">
          {pick.meta}
        </span>
      )}
    </div>
  </Link>
);

export const EditorsPicks = () => {
  const picks = getEditorsPicks();

  return (
    <section className="mt-6">
      <h2 className="text-[16px] font-bold uppercase tracking-[0.02em] text-[#111827] mb-1.5">
        Editor's Picks
      </h2>
      <div className="h-px bg-[#E5E7EB] mb-1" />

      <div className="flex flex-col gap-0">
        {picks.map((pick, i) => (
          <div key={pick.id}>
            {i > 0 && <div className="h-px bg-[#E5E7EB] my-5" />}
            <PickRow pick={pick} reversed={i % 2 !== 0} />
          </div>
        ))}
      </div>
    </section>
  );
};
