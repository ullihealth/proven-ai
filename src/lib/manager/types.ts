export interface Board {
  id: string;
  name: string;
  icon: string;
  color: string;
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
  warning_hours: number;
  start_date: string | null;
  color: string | null;
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

export interface CardAttachment {
  id: string;
  card_id: string;
  filename: string;
  file_type: string;
  file_url: string;
  r2_key: string;
  created_at: string;
}

export interface CardLink {
  id: string;
  card_id: string;
  label: string;
  url: string;
  created_at: string;
}

export interface CardRelation {
  id: string;
  card_id: string;
  related_card_id: string;
  created_at: string;
  // joined fields
  related_title?: string;
  related_board_id?: string;
  related_board_name?: string;
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_at: string;
}

export type ViewMode = "kanban" | "list" | "calendar" | "timeline";

export type Priority = Card["priority"];
export type Assignee = Card["assignee"];
