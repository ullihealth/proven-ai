import { createContext, useCallback, useContext, useRef, useState } from "react";

export interface CardDragState {
  isDragging: boolean;
  dragX: number;
  dragY: number;
  cardId: string | null;
  cardTitle: string | null;
}

interface CardDragContextValue {
  dragState: CardDragState;
  setDragState: (state: { isDragging: true; dragX: number; dragY: number; cardId: string; cardTitle: string | null }) => void;
  clearDragState: () => void;
  /** Always-current ref — safe to read in async handlers without stale closures */
  dragStateRef: React.MutableRefObject<CardDragState>;
  /** Set by ManagerLayout based on which board nav item dragY falls over */
  hoveredBoardId: string | null;
  hoveredBoardName: string | null;
  setHoveredBoard: (id: string | null, name: string | null) => void;
}

const DEFAULT: CardDragState = { isDragging: false, dragX: 0, dragY: 0, cardId: null, cardTitle: null };

const CardDragContext = createContext<CardDragContextValue>({
  dragState: DEFAULT,
  setDragState: () => {},
  clearDragState: () => {},
  dragStateRef: { current: DEFAULT },
  hoveredBoardId: null,
  hoveredBoardName: null,
  setHoveredBoard: () => {},
});

export function CardDragProvider({ children }: { children: React.ReactNode }) {
  const [dragState, setDragStateRaw] = useState<CardDragState>(DEFAULT);
  const dragStateRef = useRef<CardDragState>(DEFAULT);
  const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);
  const [hoveredBoardName, setHoveredBoardName] = useState<string | null>(null);

  const setDragState = useCallback((partial: { isDragging: true; dragX: number; dragY: number; cardId: string; cardTitle: string | null }) => {
    const next: CardDragState = { ...DEFAULT, ...partial };
    dragStateRef.current = next;
    setDragStateRaw(next);
  }, []);

  const clearDragState = useCallback(() => {
    dragStateRef.current = DEFAULT;
    setDragStateRaw(DEFAULT);
    setHoveredBoardId(null);
    setHoveredBoardName(null);
  }, []);

  const setHoveredBoard = useCallback((id: string | null, name: string | null) => {
    setHoveredBoardId(id);
    setHoveredBoardName(name);
  }, []);

  return (
    <CardDragContext.Provider value={{ dragState, setDragState, clearDragState, dragStateRef, hoveredBoardId, hoveredBoardName, setHoveredBoard }}>
      {children}
    </CardDragContext.Provider>
  );
}

export function useCardDrag() {
  return useContext(CardDragContext);
}
