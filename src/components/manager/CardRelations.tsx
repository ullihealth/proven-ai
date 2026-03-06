import { useState, useEffect, useCallback, useRef } from "react";
import { Link, Trash2, Loader2, Search } from "lucide-react";
import { fetchRelations, addRelation, deleteRelation, searchCards } from "@/lib/manager/managerApi";
import type { Card, CardRelation, Column } from "@/lib/manager/types";

interface Props {
  cardId: string;
  onOpenRelated?: (card: Card, columns: Column[]) => void;
}

export default function CardRelations({ cardId, onOpenRelated }: Props) {
  const [items, setItems] = useState<CardRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(Card & { board_name?: string })[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(() => {
    setLoading(true);
    fetchRelations(cardId)
      .then((d) => setItems(d.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [cardId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { cards } = await searchCards(query);
        // Filter out self and already-linked
        const linked = new Set(items.map((r) => r.related_card_id));
        setResults(cards.filter((c) => c.id !== cardId && !linked.has(c.id)));
      } catch { setResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, cardId, items]);

  const handleAdd = async (relatedId: string) => {
    setAdding(true);
    try {
      const { item } = await addRelation(cardId, relatedId);
      setItems((prev) => [...prev, item]);
      setQuery("");
      setResults([]);
    } catch {} finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
    try { await deleteRelation(cardId, id); } catch { load(); }
  };

  const inputClass = "w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] placeholder-[#8b949e] focus:border-[#00bcd4] focus:outline-none";

  return (
    <div>
      <label className="text-xs font-mono text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5 mb-2">
        <Link className="h-3.5 w-3.5" />
        Related Cards
        {items.length > 0 && <span className="text-[#c9d1d9]">({items.length})</span>}
      </label>

      {loading ? (
        <div className="flex items-center gap-2 text-[#8b949e] text-sm py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((rel) => (
            <div key={rel.id} className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1c2128] border border-[#30363d] text-xs">
              <Link className="h-3 w-3 text-[#8b949e]" />
              <button
                onClick={() => onOpenRelated?.({ id: rel.related_card_id, title: rel.related_title || "", board_id: rel.related_board_id || "" } as Card, [])}
                className="text-[#c9d1d9] hover:text-[#00bcd4] transition-colors text-left"
              >
                <span className="text-[#8b949e]">{rel.related_board_name} →</span> {rel.related_title}
              </button>
              <button onClick={() => handleDelete(rel.id)} className="text-[#f85149] opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-[#8b949e]">No related cards.</p>}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards to link..."
            className={`${inputClass} pl-8`}
          />
        </div>
        {(results.length > 0 || searching) && (
          <div className="absolute z-10 w-full mt-1 rounded-md bg-[#1c2128] border border-[#30363d] max-h-40 overflow-y-auto shadow-lg">
            {searching ? (
              <div className="flex items-center gap-2 text-[#8b949e] text-xs p-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Searching...
              </div>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleAdd(c.id)}
                  disabled={adding}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#0d1117] transition-colors border-b border-[#30363d] last:border-0"
                >
                  <span className="text-[#8b949e]">{c.board_name} →</span>{" "}
                  <span className="text-[#c9d1d9]">{c.title}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
