export interface Board {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  sort_order: number;
}

export interface Card {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string;
  due_date: string | null;
  priority: "critical" | "this_week" | "backlog";
  assignee: "jeff" | "wife";
  content_type: string;
  platform: string;
  card_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  card_id: string;
  text: string;
  done: boolean;
  sort_order: number;
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
}

export type ViewMode = "kanban" | "list" | "calendar";

export type Priority = Card["priority"];
export type Assignee = Card["assignee"];
