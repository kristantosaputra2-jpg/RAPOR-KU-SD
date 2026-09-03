export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          created_at: string
          created_by: string
          grade_level: number
          homeroom_teacher_id: string | null
          id: string
          name: string
          semester_id: string
          template_group:
            Database["public"]["Enums"]["class_template_group"] | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          created_by: string
          grade_level: number
          homeroom_teacher_id?: string | null
          id?: string
          name: string
          semester_id: string
          template_group?:
            Database["public"]["Enums"]["class_template_group"] | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          created_by?: string
          grade_level?: number
          homeroom_teacher_id?: string | null
          id?: string
          name?: string
          semester_id?: string
          template_group?:
            Database["public"]["Enums"]["class_template_group"] | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_homeroom_teacher_id_fkey"
            columns: ["homeroom_teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_semester_academic_year_fkey"
            columns: ["semester_id", "academic_year_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id", "academic_year_id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          id: string
          semester_id: string
          student_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          semester_id: string
          student_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          semester_id?: string
          student_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_semester_fkey"
            columns: ["class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "semester_id"]
          },
          {
            foreignKeyName: "class_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      public_school_identity: {
        Row: {
          logo_url: string | null
          school_name: string
          singleton_key: boolean
          updated_at: string
        }
        Insert: {
          logo_url?: string | null
          school_name: string
          singleton_key?: boolean
          updated_at?: string
        }
        Update: {
          logo_url?: string | null
          school_name?: string
          singleton_key?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string
          district: string | null
          email: string | null
          id: string
          logo_url: string | null
          npsn: string | null
          postal_code: string | null
          principal_name: string | null
          principal_nip: string | null
          province: string | null
          school_name: string
          singleton_key: boolean
          updated_at: string
          updated_by: string
          village: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          district?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          npsn?: string | null
          postal_code?: string | null
          principal_name?: string | null
          principal_nip?: string | null
          province?: string | null
          school_name: string
          singleton_key?: boolean
          updated_at?: string
          updated_by: string
          village?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          district?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          npsn?: string | null
          postal_code?: string | null
          principal_name?: string | null
          principal_nip?: string | null
          province?: string | null
          school_name?: string
          singleton_key?: boolean
          updated_at?: string
          updated_by?: string
          village?: string | null
        }
        Relationships: []
      }
      semesters: {
        Row: {
          academic_year_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          number: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          number: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          number?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "semesters_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string
          created_by: string
          father_name: string | null
          full_name: string
          gender: Database["public"]["Enums"]["student_gender"]
          guardian_name: string | null
          id: string
          is_active: boolean
          mother_name: string | null
          nis: string
          nisn: string | null
          religion: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          created_by: string
          father_name?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["student_gender"]
          guardian_name?: string | null
          id?: string
          is_active?: boolean
          mother_name?: string | null
          nis: string
          nisn?: string | null
          religion?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          created_by?: string
          father_name?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["student_gender"]
          guardian_name?: string | null
          id?: string
          is_active?: boolean
          mother_name?: string | null
          nis?: string
          nisn?: string | null
          religion?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          created_by: string
          display_order: number
          id: string
          is_active: boolean
          is_local_content: boolean
          name: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by: string
          display_order: number
          id?: string
          is_active?: boolean
          is_local_content?: boolean
          name: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_local_content?: boolean
          name?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          created_at: string
          created_by: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          nip: string | null
          nuptk: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          updated_by: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          nip?: string | null
          nuptk?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          nip?: string | null
          nuptk?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_active_academic_year: {
        Args: { p_academic_year_id: string }
        Returns: undefined
      }
      set_active_semester: {
        Args: { p_semester_id: string }
        Returns: undefined
      }
    }
    Enums: {
      class_template_group: "lower_primary" | "upper_primary"
      student_gender: "male" | "female"
      user_role: "admin" | "homeroom_teacher" | "subject_teacher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer Row
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row
      }
      ? Row
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      class_template_group: ["lower_primary", "upper_primary"],
      student_gender: ["male", "female"],
      user_role: ["admin", "homeroom_teacher", "subject_teacher"],
    },
  },
} as const
