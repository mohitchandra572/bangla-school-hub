export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          marked_by: string | null
          remarks: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year: string | null
          class: string
          created_at: string
          end_date: string | null
          exam_type: string
          id: string
          name: string
          name_bn: string | null
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          class: string
          created_at?: string
          end_date?: string | null
          exam_type: string
          id?: string
          name: string
          name_bn?: string | null
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          class?: string
          created_at?: string
          end_date?: string | null
          exam_type?: string
          id?: string
          name?: string
          name_bn?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fees: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          fee_type: string
          id: string
          paid_date: string | null
          payment_method: string | null
          remarks: string | null
          status: string | null
          student_id: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          fee_type: string
          id?: string
          paid_date?: string | null
          payment_method?: string | null
          remarks?: string | null
          status?: string | null
          student_id: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          fee_type?: string
          id?: string
          paid_date?: string | null
          payment_method?: string | null
          remarks?: string | null
          status?: string | null
          student_id?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_published: boolean | null
          title: string
          title_bn: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_published?: boolean | null
          title: string
          title_bn?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_published?: boolean | null
          title?: string
          title_bn?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string | null
          sender_id: string | null
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          category: string | null
          content: string
          content_bn: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          title: string
          title_bn: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          content_bn?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          title: string
          title_bn?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          content_bn?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          title?: string
          title_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          full_name_bn: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          full_name_bn?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          full_name_bn?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          created_at: string
          exam_id: string
          grade: string | null
          id: string
          marks_obtained: number | null
          remarks: string | null
          student_id: string
          subject: string
          total_marks: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          remarks?: string | null
          student_id: string
          subject: string
          total_marks?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          remarks?: string | null
          student_id?: string
          subject?: string
          total_marks?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_date: string | null
          class: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          full_name_bn: string | null
          gender: string | null
          id: string
          parent_id: string | null
          phone: string | null
          roll_number: string
          section: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          class: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          full_name_bn?: string | null
          gender?: string | null
          id?: string
          parent_id?: string | null
          phone?: string | null
          roll_number: string
          section?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          class?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          full_name_bn?: string | null
          gender?: string | null
          id?: string
          parent_id?: string | null
          phone?: string | null
          roll_number?: string
          section?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          designation: string | null
          email: string | null
          employee_id: string
          full_name: string
          full_name_bn: string | null
          gender: string | null
          id: string
          joining_date: string | null
          phone: string | null
          qualification: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_id: string
          full_name: string
          full_name_bn?: string | null
          gender?: string | null
          id?: string
          joining_date?: string | null
          phone?: string | null
          qualification?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_id?: string
          full_name?: string
          full_name_bn?: string | null
          gender?: string | null
          id?: string
          joining_date?: string | null
          phone?: string | null
          qualification?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_admin"
        | "teacher"
        | "parent"
        | "student"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "school_admin", "teacher", "parent", "student"],
    },
  },
} as const
