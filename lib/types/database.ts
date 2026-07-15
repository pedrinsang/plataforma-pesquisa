// Tipos escritos à mão para acompanhar supabase/migrations/*.sql.
// Depois de conectar um projeto Supabase real, regenerar com:
//   npx supabase gen types typescript --local > lib/types/database.ts
// (mantendo esse arquivo em sincronia com as migrations a cada fase nova).

export type ProjectMemberRole = "owner" | "editor" | "viewer";
export type ProjectMemberStatus = "accepted" | "pending";

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
    };
    Views: Record<string, never>;
    Functions: {
      is_project_member: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
