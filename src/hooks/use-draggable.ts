import { useState, useRef, useEffect } from "react";

export interface DragPos { x: number; y: number }

/**
 * Adds drag-to-reposition behaviour to a fixed/floating element.
 * Position is persisted to localStorage under `storageKey`.
 * `getDefault()` is called once (on mount) when no stored position exists.
 *
 * Returns:
 *   pos        – current { x, y } (left/top in px) to spread into `style`
 *   elRef      – attach to the root element so size can be read for clamping
 *   onDragStart – attach to onMouseDown + onTouchStart of the draggable element
 *   wasDragged – call in onClick to suppress click after a real drag
 */
export function useDraggable<T extends HTMLElement = HTMLElement>(
  storageKey: string,
  getDefault: () => DragPos,
) {
  const [pos, setPos] = useState<DragPos>(() => {
    try {
      const s = localStorage.getItem(storageKey);
      if (s) {
        const p = JSON.parse(s) as DragPos;
        if (typeof p.x === "number" && typeof p.y === "number") {
          // Clamp in case viewport shrank since last save
          return {
            x: Math.max(0, Math.min(window.innerWidth - 40, p.x)),
            y: Math.max(0, Math.min(window.innerHeight - 40, p.y)),
          };
        }
      }
    } catch {}
    return getDefault();
  });

  const elRef = useRef<T | null>(null);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const origin = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });
  // Keep latest pos accessible inside global event handlers without stale closure
  const posRef = useRef(pos);
  posRef.current = pos;

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      if (e.cancelable) e.preventDefault();
      const pt = "touches" in e ? (e as TouchEvent).touches[0] : (e as MouseEvent);
      const dx = pt.clientX - origin.current.mx;
      const dy = pt.clientY - origin.current.my;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
      const w = elRef.current?.offsetWidth ?? 56;
      const h = elRef.current?.offsetHeight ?? 56;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - w, origin.current.ex + dx)),
        y: Math.max(0, Math.min(window.innerHeight - h, origin.current.ey + dy)),
      });
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      if (didDrag.current) {
        try { localStorage.setItem(storageKey, JSON.stringify(posRef.current)); } catch {}
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [storageKey]);

  function onDragStart(e: React.MouseEvent | React.TouchEvent) {
    const pt = "touches" in e ? e.touches[0] : e;
    dragging.current = true;
    didDrag.current = false;
    origin.current = { mx: pt.clientX, my: pt.clientY, ex: posRef.current.x, ey: posRef.current.y };
  }

  /** Returns true if the last pointer-down ended in a real drag (suppresses click). */
  function wasDragged() { return didDrag.current; }

  return { pos, setPos, elRef, onDragStart, wasDragged };
}
