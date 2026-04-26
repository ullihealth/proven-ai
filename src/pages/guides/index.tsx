/**
 * /guides — Public standalone guide library page.
 *
 * Completely standalone: no AppLayout, no nav, no auth guards, no links to the platform.
 * Safe to share publicly without any login requirement.
 *
 * Cards are loaded dynamically from /api/guides (managed via admin/guides).
 */

import { useState, useEffect } from "react";

interface Guide {
  id: number;
  title: string;
  image_url: string;
  pdf_url: string;
  sort_order: number;
}

export default function PublicGuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/guides")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setGuides(data.guides);
      })
      .catch(() => {/* silently fail — page just shows nothing */})
      .finally(() => setLoading(false));
  }, []);

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
          The Proven AI Guide Library
        </h1>
        <p className="text-sm" style={{ color: "#a0aab8" }}>
          Practical guides to help you get more from AI, growing every month.
        </p>
      </div>

      {/* Card grid */}
      {loading ? (
        <p className="text-sm" style={{ color: "#a0aab8" }}>Loading…</p>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "#1c2128",
                border: "1px solid rgba(0, 188, 212, 0.2)",
              }}
            >
              {/* Cover image */}
              <img
                src={guide.image_url}
                alt={`${guide.title} cover`}
                className="w-full block"
                style={{ display: "block" }}
              />

              {/* Content */}
              <div className="px-5 py-5 flex flex-col gap-4 flex-1">
                <p
                  className="text-sm font-semibold leading-snug flex-1"
                  style={{ color: "#c9d1d9" }}
                >
                  {guide.title}
                </p>

                <a
                  href={guide.pdf_url}
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
      )}
    </div>
  );
}
