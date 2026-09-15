import type { Task, TaskStatus, TaskUrgency } from "@/lib/types";

type TaskRow = Task;
type TaskInsert = {
  id?: string;
  description: string;
  requester: string;
  urgency: TaskUrgency;
  observations?: string | null;
  status?: TaskStatus;
  position?: number;
  created_at?: string;
  updated_at?: string;
};
type TaskUpdate = Partial<TaskInsert>;

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: TaskRow;
        Insert: TaskInsert;
        Update: TaskUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
