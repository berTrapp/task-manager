import type {
  Group,
  GroupInvite,
  GroupMember,
  GroupRole,
  Profile,
  Task,
  TaskStatus,
  TaskUrgency,
} from "@/lib/types";

type TaskInsert = {
  id?: string;
  group_id: string;
  description: string;
  requester: string;
  assignee_id?: string | null;
  urgency: TaskUrgency;
  observations?: string | null;
  status?: TaskStatus;
  position?: number;
  created_at?: string;
  updated_at?: string;
};
type TaskUpdate = Partial<TaskInsert>;

type ProfileInsert = {
  id: string;
  email: string;
  full_name?: string | null;
  created_at?: string;
};
type ProfileUpdate = Partial<ProfileInsert>;

type GroupInsert = {
  id?: string;
  name: string;
  created_by?: string | null;
  created_at?: string;
};
type GroupUpdate = Partial<GroupInsert>;

type GroupMemberRow = Omit<GroupMember, "profile">;
type GroupMemberInsert = {
  group_id: string;
  user_id: string;
  role?: GroupRole;
  joined_at?: string;
};
type GroupMemberUpdate = Partial<GroupMemberInsert>;

type GroupInviteInsert = {
  id?: string;
  group_id: string;
  created_by?: string | null;
  created_at?: string;
  expires_at?: string;
  max_uses?: number | null;
  uses_count?: number;
  revoked_at?: string | null;
};
type GroupInviteUpdate = Partial<GroupInviteInsert>;

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: TaskInsert;
        Update: TaskUpdate;
        Relationships: [
          {
            foreignKeyName: "tasks_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      groups: {
        Row: Group;
        Insert: GroupInsert;
        Update: GroupUpdate;
        Relationships: [];
      };
      group_members: {
        Row: GroupMemberRow;
        Insert: GroupMemberInsert;
        Update: GroupMemberUpdate;
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      group_invites: {
        Row: GroupInvite;
        Insert: GroupInviteInsert;
        Update: GroupInviteUpdate;
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
