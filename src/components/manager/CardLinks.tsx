import { useState, useEffect, useCallback } from "react";
import { Link2, Trash2, Plus, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchLinks, addLink, deleteLink } from "@/lib/manager/managerApi";
import type { CardLink } from "@/lib/manager/types";

interface Props { cardId: string }

export default function CardLinks({ cardId }: Props) {
  const [items, setItems] = useState<CardLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchLinks(cardId)
      .then((d) => setItems(d.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [cardId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!url.trim()) return;
    setAdding(true);
    try {
      const { item } = await addLink(cardId, label.trim() || url.trim(), url.trim());
      setItems((prev) => [...prev, item]);
      setUrl("");
      setLabel("");
      setShowForm(false);
    } catch {} finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((l) => l.id !== id));
    try { await deleteLink(cardId, id); } catch { load(); }
  };

  const inputClass = "w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#00bcd4] focus:outline-none";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          Links
          {items.length > 0 && <span className="text-[var(--text-primary)]">({items.length})</span>}
        </label>
        <button onClick={() => setShowForm(!showForm)} className="text-xs font-mono text-[#00bcd4] hover:bg-[#00bcd4]/10 px-2 py-1 rounded transition-colors">
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((link) => (
            <div key={link.id} className="group flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00bcd4]/10 border border-[#00bcd4]/30 text-xs">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#00bcd4] hover:underline flex items-center gap-1">
                {link.label}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <button onClick={() => handleDelete(link.id)} className="text-[#f85149] opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {items.length === 0 && !showForm && <p className="text-xs text-[var(--text-muted)]">No links yet.</p>}
        </div>
      )}

      {showForm && (
        <div className="mt-2 space-y-2 p-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)]">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={inputClass} />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" className={inputClass} />
          <button
            onClick={handleAdd}
            disabled={adding || !url.trim()}
            className="px-3 py-1.5 rounded-md bg-[#00bcd4] text-[#0d1117] text-xs font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add Link"}
          </button>
        </div>
      )}
    </div>
  );
}
