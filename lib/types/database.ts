// Tipos escritos à mão para acompanhar supabase/migrations/*.sql.
// Depois de conectar um projeto Supabase real, regenerar com:
//   npx supabase gen types typescript --local > lib/types/database.ts
// (mantendo esse arquivo em sincronia com as migrations a cada fase nova).

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ProjectMemberRole = "owner" | "editor" | "viewer";
export type ProjectMemberStatus = "accepted" | "pending";
export type DatasetColumnType = "text" | "number" | "integer" | "date" | "boolean" | "categorical";
export type MilestoneStatus = "pending" | "in_progress" | "done";
export type CaseStatus = "active" | "completed" | "archived";
export type FieldEntity = "case" | "sample";
export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "boolean";
export type ReferenceType =
  | "article"
  | "preprint"
  | "book"
  | "chapter"
  | "thesis"
  | "conference"
  | "report"
  | "website"
  | "dataset"
  | "software"
  | "other";

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
          project_type: string | null;
          protocol_code: string | null;
          sample_target: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          project_type?: string | null;
          protocol_code?: string | null;
          sample_target?: number | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          project_type?: string | null;
          protocol_code?: string | null;
          sample_target?: number | null;
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
          member_title: string | null;
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
          member_title?: string | null;
        };
        Update: {
          role?: ProjectMemberRole;
          status?: ProjectMemberStatus;
          member_title?: string | null;
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
          header_text: string | null;
          footer_text: string | null;
          created_by: string | null;
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
          header_text?: string | null;
          footer_text?: string | null;
          created_by: string;
        };
        Update: {
          title?: string;
          content_json?: unknown;
          template_type?: string | null;
          word_goal?: number | null;
          header_text?: string | null;
          footer_text?: string | null;
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
          created_by: string | null;
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
      project_milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          detail: string | null;
          status: MilestoneStatus;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          detail?: string | null;
          status?: MilestoneStatus;
          position?: number;
        };
        Update: {
          title?: string;
          detail?: string | null;
          status?: MilestoneStatus;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_samples: {
        Row: {
          id: string;
          project_id: string;
          case_id: string | null;
          label: string | null;
          collected_at: string;
          notes: string | null;
          custom: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          case_id?: string | null;
          label?: string | null;
          collected_at?: string;
          notes?: string | null;
          custom?: Json;
          created_by?: string | null;
        };
        Update: {
          case_id?: string | null;
          label?: string | null;
          collected_at?: string;
          notes?: string | null;
          custom?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "project_samples_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_samples_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "project_cases";
            referencedColumns: ["id"];
          },
        ];
      };
      project_cases: {
        Row: {
          id: string;
          project_id: string;
          code: string;
          description: string | null;
          status: CaseStatus;
          custom: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          code: string;
          description?: string | null;
          status?: CaseStatus;
          custom?: Json;
          created_by?: string | null;
        };
        Update: {
          code?: string;
          description?: string | null;
          status?: CaseStatus;
          custom?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "project_cases_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_field_defs: {
        Row: {
          id: string;
          project_id: string;
          entity: FieldEntity;
          field_key: string;
          label: string;
          field_type: FieldType;
          options: Json;
          required: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          entity: FieldEntity;
          field_key: string;
          label: string;
          field_type?: FieldType;
          options?: Json;
          required?: boolean;
          position?: number;
        };
        Update: {
          label?: string;
          field_type?: FieldType;
          options?: Json;
          required?: boolean;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_field_defs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_references: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          authors: string | null;
          year: number | null;
          doi: string | null;
          is_essential: boolean;
          ref_type: ReferenceType;
          url: string | null;
          container_title: string | null;
          publisher: string | null;
          volume: string | null;
          issue: string | null;
          pages: string | null;
          edition: string | null;
          abstract: string | null;
          isbn: string | null;
          issn: string | null;
          pmid: string | null;
          arxiv_id: string | null;
          accessed_at: string | null;
          citation_key: string | null;
          csl: Json;
          tags: string[];
          notes: string | null;
          file_path: string | null;
          file_name: string | null;
          file_size: number | null;
          file_mime: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          authors?: string | null;
          year?: number | null;
          doi?: string | null;
          is_essential?: boolean;
          ref_type?: ReferenceType;
          url?: string | null;
          container_title?: string | null;
          publisher?: string | null;
          volume?: string | null;
          issue?: string | null;
          pages?: string | null;
          edition?: string | null;
          abstract?: string | null;
          isbn?: string | null;
          issn?: string | null;
          pmid?: string | null;
          arxiv_id?: string | null;
          accessed_at?: string | null;
          citation_key?: string | null;
          csl?: Json;
          tags?: string[];
          notes?: string | null;
          file_path?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_mime?: string | null;
          created_by?: string | null;
        };
        Update: {
          title?: string;
          authors?: string | null;
          year?: number | null;
          doi?: string | null;
          is_essential?: boolean;
          ref_type?: ReferenceType;
          url?: string | null;
          container_title?: string | null;
          publisher?: string | null;
          volume?: string | null;
          issue?: string | null;
          pages?: string | null;
          edition?: string | null;
          abstract?: string | null;
          isbn?: string | null;
          issn?: string | null;
          pmid?: string | null;
          arxiv_id?: string | null;
          accessed_at?: string | null;
          citation_key?: string | null;
          csl?: Json;
          tags?: string[];
          notes?: string | null;
          file_path?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_mime?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_references_project_id_fkey";
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
