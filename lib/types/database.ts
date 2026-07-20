// Tipos escritos à mão para acompanhar supabase/migrations/*.sql.
// Depois de conectar um projeto Supabase real, regenerar com:
//   npx supabase gen types typescript --local > lib/types/database.ts
// (mantendo esse arquivo em sincronia com as migrations a cada fase nova).

export type ProjectMemberRole = "owner" | "editor" | "viewer";
export type ProjectMemberStatus = "accepted" | "pending";
export type DatasetColumnType = "text" | "number" | "integer" | "date" | "boolean" | "categorical";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
        };
        Update: {
          full_name?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          invited_email: string | null;
          role: ProjectMemberRole;
          status: ProjectMemberStatus;
          invited_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          invited_email?: string | null;
          role?: ProjectMemberRole;
          status?: ProjectMemberStatus;
        };
        Update: {
          role?: ProjectMemberRole;
          status?: ProjectMemberStatus;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          content_json: unknown;
          template_type: string | null;
          word_goal: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title?: string;
          content_json?: unknown;
          template_type?: string | null;
          word_goal?: number | null;
          created_by: string;
        };
        Update: {
          title?: string;
          content_json?: unknown;
          template_type?: string | null;
          word_goal?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      datasets: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          created_by: string;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "datasets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      dataset_columns: {
        Row: {
          id: string;
          dataset_id: string;
          project_id: string;
          name: string;
          data_type: DatasetColumnType;
          options: unknown;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          dataset_id: string;
          project_id: string;
          name: string;
          data_type?: DatasetColumnType;
          options?: unknown;
          position?: number;
        };
        Update: {
          name?: string;
          data_type?: DatasetColumnType;
          options?: unknown;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "dataset_columns_dataset_id_fkey";
            columns: ["dataset_id"];
            isOneToOne: false;
            referencedRelation: "datasets";
            referencedColumns: ["id"];
          },
        ];
      };
      dataset_rows: {
        Row: {
          id: string;
          dataset_id: string;
          project_id: string;
          position: number;
          data: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dataset_id: string;
          project_id: string;
          position?: number;
          data?: Record<string, unknown>;
        };
        Update: {
          position?: number;
          data?: Record<string, unknown>;
        };
        Relationships: [
          {
            foreignKeyName: "dataset_rows_dataset_id_fkey";
            columns: ["dataset_id"];
            isOneToOne: false;
            referencedRelation: "datasets";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: string;
          project_id: string;
          actor_id: string | null;
          action: "insert" | "update" | "delete";
          entity_type: string;
          entity_id: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "audit_log_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_project_member: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      is_project_editor: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      is_project_owner: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      invite_project_member: {
        Args: { p_project_id: string; p_email: string; p_role?: ProjectMemberRole };
        Returns: {
          id: string;
          project_id: string;
          user_id: string | null;
          invited_email: string | null;
          role: ProjectMemberRole;
          status: ProjectMemberStatus;
          invited_at: string;
          accepted_at: string | null;
          created_at: string;
        };
      };
      accept_project_invite: {
        Args: { p_project_id: string };
        Returns: void;
      };
      decline_project_invite: {
        Args: { p_project_id: string };
        Returns: void;
      };
      remove_project_member: {
        Args: { p_member_id: string };
        Returns: void;
      };
      update_member_role: {
        Args: { p_member_id: string; p_role: ProjectMemberRole };
        Returns: void;
      };
      create_project: {
        Args: { p_title: string; p_description?: string | null };
        Returns: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      check_login_rate_limit: {
        Args: { p_email: string };
        Returns: { allowed: boolean; retry_after_seconds: number }[];
      };
      register_login_failure: {
        Args: { p_email: string };
        Returns: void;
      };
      register_login_success: {
        Args: { p_email: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
