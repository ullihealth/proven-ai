import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

interface PromptPack {
  id: number;
  title: string;
  description: string;
  image_url: string;
  pdf_url: string;
  sort_order: number;
}

const Prompts = () => {
  const [packs, setPacks] = useState<PromptPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/learn/prompt-packs")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setPacks(data.packs);
        } else {
          setError("Failed to load prompt packs.");
        }
      })
      .catch(() => setError("Failed to load prompt packs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Prompt Packs</h1>
        <p style={{ color: "#a0aab8" }} className="text-sm">
          Ready-to-use prompt collections. Click any cover to open the PDF.
        </p>
      </div>

      {loading && (
        <p style={{ color: "#a0aab8" }} className="text-sm">
          Loading…
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && packs.length === 0 && (
        <p style={{ color: "#a0aab8" }} className="text-sm">
          No prompt packs available yet.
        </p>
      )}

      {!loading && !error && packs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="rounded-xl overflow-hidden hover:-translate-y-1 transition-transform duration-200"
              style={{ background: "#1c2128", border: "1px solid #30363d" }}
            >
              <a href={pack.pdf_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={pack.image_url}
                  alt={pack.title}
                  className="w-full object-cover"
                  style={{ height: "200px" }}
                />
              </a>
              <div className="p-4">
                <h2 className="font-semibold text-white text-sm mb-1">
                  {pack.title}
                </h2>
                <p
                  className="text-xs mb-3 leading-relaxed"
                  style={{ color: "#a0aab8" }}
                >
                  {pack.description}
                </p>
                <a
                  href={pack.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "#00bcd4" }}
                >
                  Download PDF →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Prompts;
