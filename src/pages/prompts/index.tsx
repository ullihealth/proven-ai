/**
 * /prompts — Public standalone landing page for the Health & Fitness Prompt Sheet.
 *
 * Completely standalone: no AppLayout, no nav, no auth guards, no links to the platform.
 * Safe to share publicly without any login requirement.
 */

const COVER_IMAGE_URL =
  "https://assets.provenai.app/attachments/Screenshot%202026-04-04%20at%2012.46.07.png";

const PDF_URL =
  "https://assets.provenai.app/Proven_AI_Health_Fitness_Over40_Prompt_Sheet.pdf";

export default function PublicPromptsPage() {
  return (
    <div
      style={{ background: "#0d1117", minHeight: "100vh" }}
      className="flex flex-col items-center justify-center px-4 py-12"
    >
      {/* Wordmark */}
      <p
        className="text-sm font-semibold tracking-widest uppercase mb-10"
        style={{ color: "#00bcd4" }}
      >
        Proven AI
      </p>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ border: "1px solid #21262d" }}
      >
        {/* Cover image */}
        <img
          src={COVER_IMAGE_URL}
          alt="Health and Fitness Over 40 Prompt Sheet cover"
          className="w-full block"
          style={{ display: "block" }}
        />

        {/* Content beneath image */}
        <div
          className="px-6 py-6 flex flex-col gap-5"
          style={{ background: "#161b22" }}
        >
          <p
            className="text-base leading-relaxed"
            style={{ color: "#c9d1d9" }}
          >
            25 strategic AI prompts for health and fitness after 40. Free from Proven AI.
          </p>

          <a
            href={PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center rounded-lg py-3 px-6 font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              background: "#00bcd4",
              color: "#0d1117",
              textDecoration: "none",
              display: "block",
            }}
          >
            Download the free prompt sheet
          </a>
        </div>
      </div>
    </div>
  );
}
