export const TASK_STATUSES = ["aberto", "desenvolvimento", "concluido"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_URGENCIES = ["baixa", "media", "alta"] as const;
export type TaskUrgency = (typeof TASK_URGENCIES)[number];

export const GROUP_ROLES = ["admin", "member"] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];

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

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
};

export type Task = {
  id: string;
  group_id: string;
  description: string;
  requester: string;
  assignee_id: string | null;
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
  assignee_id: string | null;
  urgency: TaskUrgency;
  observations: string | null;
  status: TaskStatus;
};

export type Group = {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profile: Profile;
};

export type GroupInvite = {
  id: string;
  group_id: string;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  max_uses: number | null;
  uses_count: number;
  revoked_at: string | null;
};

export function displayName(profile: Pick<Profile, "email" | "full_name"> | null | undefined) {
  if (!profile) return "Sem responsável";
  return profile.full_name?.trim() || profile.email;
}
