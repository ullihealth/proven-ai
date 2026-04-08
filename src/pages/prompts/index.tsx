/**
 * /prompts — Public standalone prompt sheet library page.
 *
 * Completely standalone: no AppLayout, no nav, no auth guards, no links to the platform.
 * Safe to share publicly without any login requirement.
 */

const CARDS = [
  {
    image: "https://assets.provenai.app/attachments/Screenshot%202026-04-04%20at%2012.45.50.png",
    alt: "Prompt Sheet 1 — Getting Started with AI cover",
    title: "Prompt Sheet 1 — Getting Started with AI",
    pdf: "https://assets.provenai.app/Proven%20AI%20Prompt%20Sheet%201.pdf",
  },
  {
    image: "https://assets.provenai.app/attachments/Screenshot%202026-04-04%20at%2012.46.07.png",
    alt: "Prompt Sheet 2 — Health and Fitness Over 40 cover",
    title: "Prompt Sheet 2 — Health and Fitness Over 40",
    pdf: "https://assets.provenai.app/Proven_AI_Health_Fitness_Over40_Prompt_Sheet.pdf",
  },
  {
    image: "https://assets.provenai.app/attachments/Screenshot%202026-04-08%20at%2023.02.37.png",
    alt: "Prompt Sheet 3 — Money and Finance Over 40 cover",
    title: "Prompt Sheet 3 — Money and Finance Over 40",
    pdf: "https://assets.provenai.app/Proven_AI_Money_Finance_Over40_Prompt_Sheet%20(6).pdf",
  },
];

export default function PublicPromptsPage() {
  return (
    <div
      style={{ background: "#0d1117", minHeight: "100vh" }}
      className="flex flex-col items-center px-4 py-12"
    >
      {/* Wordmark */}
      <p
        className="text-sm font-semibold tracking-widest uppercase mb-10"
        style={{ color: "#00bcd4" }}
      >
        Proven AI
      </p>

      {/* Heading */}
      <div className="w-full max-w-2xl text-center mb-10">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>
          The Proven AI Prompt Sheet Library
        </h1>
        <p className="text-sm" style={{ color: "#a0aab8" }}>
          Free resources for the over 40s, growing every month.
        </p>
      </div>

      {/* Card grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {CARDS.map((card) => (
          <div
            key={card.pdf}
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "#1c2128",
              border: "1px solid rgba(0, 188, 212, 0.2)",
            }}
          >
            {/* Cover image */}
            <img
              src={card.image}
              alt={card.alt}
              className="w-full block"
              style={{ display: "block" }}
            />

            {/* Content */}
            <div className="px-5 py-5 flex flex-col gap-4 flex-1">
              <p
                className="text-sm font-semibold leading-snug flex-1"
                style={{ color: "#c9d1d9" }}
              >
                {card.title}
              </p>

              <a
                href={card.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center rounded-lg py-2.5 px-5 font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80 mt-auto"
                style={{
                  background: "#00bcd4",
                  color: "#0d1117",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                Download free
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
