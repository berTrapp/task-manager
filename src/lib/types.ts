export const TASK_STATUSES = ["aberto", "desenvolvimento", "concluido"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_URGENCIES = ["baixa", "media", "alta"] as const;
export type TaskUrgency = (typeof TASK_URGENCIES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  aberto: "Aberto",
  desenvolvimento: "Desenvolvimento",
  concluido: "Concluído",
};

export const URGENCY_LABELS: Record<TaskUrgency, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export type Task = {
  id: string;
  description: string;
  requester: string;
  urgency: TaskUrgency;
  observations: string | null;
  status: TaskStatus;
  position: number;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  description: string;
  requester: string;
  urgency: TaskUrgency;
  observations: string | null;
  status: TaskStatus;
};
