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
      admit_cards: {
        Row: {
          admit_number: string
          created_at: string | null
          documents_complete: boolean | null
          downloaded_at: string | null
          eligibility_reason: string | null
          eligibility_status: string | null
          exam_id: string
          fees_cleared: boolean | null
          generated_at: string | null
          generated_by: string | null
          id: string
          is_downloaded: boolean | null
          qr_code_data: string | null
          student_id: string
        }
        Insert: {
          admit_number: string
          created_at?: string | null
          documents_complete?: boolean | null
          downloaded_at?: string | null
          eligibility_reason?: string | null
          eligibility_status?: string | null
          exam_id: string
          fees_cleared?: boolean | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_downloaded?: boolean | null
          qr_code_data?: string | null
          student_id: string
        }
        Update: {
          admit_number?: string
          created_at?: string | null
          documents_complete?: boolean | null
          downloaded_at?: string | null
          eligibility_reason?: string | null
          eligibility_status?: string | null
          exam_id?: string
          fees_cleared?: boolean | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_downloaded?: boolean | null
          qr_code_data?: string | null
          student_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          approval_status: string | null
          biometric_timestamp: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          device_id: string | null
          id: string
          is_late: boolean | null
          late_minutes: number | null
          marked_by: string | null
          remarks: string | null
          source: string | null
          status: string
          student_id: string
        }
        Insert: {
          approval_status?: string | null
          biometric_timestamp?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          device_id?: string | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          marked_by?: string | null
          remarks?: string | null
          source?: string | null
          status?: string
          student_id: string
        }
        Update: {
          approval_status?: string | null
          biometric_timestamp?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          device_id?: string | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          marked_by?: string | null
          remarks?: string | null
          source?: string | null
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
      attendance_approvals: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attendance_id: string
          created_at: string | null
          id: string
          notes: string | null
          rejection_reason: string | null
          submitted_at: string | null
          submitted_by: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attendance_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          submitted_by: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attendance_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          submitted_by?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      biometric_devices: {
        Row: {
          assigned_classes: string[] | null
          assigned_sections: string[] | null
          auth_key: string | null
          created_at: string | null
          created_by: string | null
          device_id: string
          device_name: string
          device_name_bn: string | null
          device_type: string | null
          error_count: number | null
          firmware_version: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_error: string | null
          last_error_at: string | null
          last_heartbeat_at: string | null
          last_sync_at: string | null
          location: string | null
          location_bn: string | null
          port: number | null
          school_id: string | null
          status: string | null
          sync_interval_minutes: number | null
          total_synced_records: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_classes?: string[] | null
          assigned_sections?: string[] | null
          auth_key?: string | null
          created_at?: string | null
          created_by?: string | null
          device_id: string
          device_name: string
          device_name_bn?: string | null
          device_type?: string | null
          error_count?: number | null
          firmware_version?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_heartbeat_at?: string | null
          last_sync_at?: string | null
          location?: string | null
          location_bn?: string | null
          port?: number | null
          school_id?: string | null
          status?: string | null
          sync_interval_minutes?: number | null
          total_synced_records?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_classes?: string[] | null
          assigned_sections?: string[] | null
          auth_key?: string | null
          created_at?: string | null
          created_by?: string | null
          device_id?: string
          device_name?: string
          device_name_bn?: string | null
          device_type?: string | null
          error_count?: number | null
          firmware_version?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_heartbeat_at?: string | null
          last_sync_at?: string | null
          location?: string | null
          location_bn?: string | null
          port?: number | null
          school_id?: string | null
          status?: string | null
          sync_interval_minutes?: number | null
          total_synced_records?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biometric_devices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      device_sync_logs: {
        Row: {
          created_at: string | null
          device_id: string
          error_details: Json | null
          error_message: string | null
          id: string
          initiated_by: string | null
          records_failed: number | null
          records_fetched: number | null
          records_processed: number | null
          sync_completed_at: string | null
          sync_started_at: string | null
          sync_status: string
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          records_failed?: number | null
          records_fetched?: number | null
          records_processed?: number | null
          sync_completed_at?: string | null
          sync_started_at?: string | null
          sync_status: string
          sync_type: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          records_failed?: number | null
          records_fetched?: number | null
          records_processed?: number | null
          sync_completed_at?: string | null
          sync_started_at?: string | null
          sync_status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_sync_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "biometric_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_papers: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          exam_id: string | null
          id: string
          instructions: string | null
          instructions_bn: string | null
          status: string | null
          subject: string
          subject_bn: string | null
          title: string
          title_bn: string | null
          total_marks: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          exam_id?: string | null
          id?: string
          instructions?: string | null
          instructions_bn?: string | null
          status?: string | null
          subject: string
          subject_bn?: string | null
          title: string
          title_bn?: string | null
          total_marks?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          exam_id?: string | null
          id?: string
          instructions?: string | null
          instructions_bn?: string | null
          status?: string | null
          subject?: string
          subject_bn?: string | null
          title?: string
          title_bn?: string | null
          total_marks?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_papers_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          id: string
          marks: number
          options: Json | null
          order_index: number | null
          paper_id: string | null
          question_text: string
          question_text_bn: string | null
          question_type: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          marks?: number
          options?: Json | null
          order_index?: number | null
          paper_id?: string | null
          question_text: string
          question_text_bn?: string | null
          question_type: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          marks?: number
          options?: Json | null
          order_index?: number | null
          paper_id?: string | null
          question_text?: string
          question_text_bn?: string | null
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "exam_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_routines: {
        Row: {
          created_at: string | null
          end_time: string
          exam_date: string
          exam_id: string
          id: string
          room_no: string | null
          start_time: string
          subject: string
          subject_bn: string | null
          total_marks: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          exam_date: string
          exam_id: string
          id?: string
          room_no?: string | null
          start_time: string
          subject: string
          subject_bn?: string | null
          total_marks?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          exam_date?: string
          exam_id?: string
          id?: string
          room_no?: string | null
          start_time?: string
          subject?: string
          subject_bn?: string | null
          total_marks?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          section: string | null
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
          section?: string | null
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
          section?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fee_receipts: {
        Row: {
          amount_paid: number
          created_at: string | null
          fee_id: string | null
          id: string
          payment_date: string | null
          payment_method: string | null
          receipt_number: string
          received_by: string | null
          remarks: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          fee_id?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          receipt_number: string
          received_by?: string | null
          remarks?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          fee_id?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          receipt_number?: string
          received_by?: string | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_receipts_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string | null
          amount: number
          class: string | null
          created_at: string | null
          fee_type: string
          id: string
          is_active: boolean | null
          name: string
          name_bn: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          amount: number
          class?: string | null
          created_at?: string | null
          fee_type: string
          id?: string
          is_active?: boolean | null
          name: string
          name_bn?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          amount?: number
          class?: string | null
          created_at?: string | null
          fee_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_bn?: string | null
          updated_at?: string | null
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
      generated_credentials: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          first_login_at: string | null
          id: string
          sent_at: string | null
          sent_via: string | null
          temporary_password: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          first_login_at?: string | null
          id?: string
          sent_at?: string | null
          sent_via?: string | null
          temporary_password?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          first_login_at?: string | null
          id?: string
          sent_at?: string | null
          sent_via?: string | null
          temporary_password?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      grading_rules: {
        Row: {
          created_at: string | null
          display_order: number | null
          grade_code: string
          grade_name_bn: string | null
          grade_point: number
          id: string
          is_active: boolean | null
          is_passing: boolean | null
          max_marks: number
          min_marks: number
          name: string
          name_bn: string | null
          remarks_bn: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          grade_code: string
          grade_name_bn?: string | null
          grade_point: number
          id?: string
          is_active?: boolean | null
          is_passing?: boolean | null
          max_marks: number
          min_marks: number
          name: string
          name_bn?: string | null
          remarks_bn?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          grade_code?: string
          grade_name_bn?: string | null
          grade_point?: number
          id?: string
          is_active?: boolean | null
          is_passing?: boolean | null
          max_marks?: number
          min_marks?: number
          name?: string
          name_bn?: string | null
          remarks_bn?: string | null
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
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          message_bn: string | null
          title: string
          title_bn: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_bn?: string | null
          title: string
          title_bn?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_bn?: string | null
          title?: string
          title_bn?: string | null
          type?: string | null
          user_id?: string | null
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
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
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
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
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
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
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
      school_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          period_end: string
          period_start: string
          school_id: string
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          period_end: string
          period_start: string
          school_id: string
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          school_id?: string
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_users: {
        Row: {
          created_at: string | null
          id: string
          is_admin: boolean | null
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          code: string
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_suspended: boolean | null
          logo_url: string | null
          name: string
          name_bn: string | null
          phone: string | null
          subscription_end: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_start: string | null
          suspension_reason: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_suspended?: boolean | null
          logo_url?: string | null
          name: string
          name_bn?: string | null
          phone?: string | null
          subscription_end?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_start?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_suspended?: boolean | null
          logo_url?: string | null
          name?: string
          name_bn?: string | null
          phone?: string | null
          subscription_end?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_start?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          academic_year: string | null
          address: string | null
          admission_date: string | null
          admission_id: string | null
          alternative_contact: string | null
          birth_certificate_no: string | null
          blood_group: string | null
          class: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          father_name: string | null
          father_name_bn: string | null
          full_name: string
          full_name_bn: string | null
          gender: string | null
          group_stream: string | null
          guardian_mobile: string | null
          guardian_name: string | null
          guardian_name_bn: string | null
          guardian_occupation: string | null
          guardian_relation: string | null
          id: string
          mother_name: string | null
          mother_name_bn: string | null
          nationality: string | null
          parent_id: string | null
          permanent_address: string | null
          permanent_district: string | null
          permanent_upazila: string | null
          phone: string | null
          photo_url: string | null
          present_address: string | null
          present_district: string | null
          present_upazila: string | null
          previous_school: string | null
          religion: string | null
          roll_number: string
          school_id: string | null
          section: string | null
          shift: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          version: string | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          admission_date?: string | null
          admission_id?: string | null
          alternative_contact?: string | null
          birth_certificate_no?: string | null
          blood_group?: string | null
          class: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          father_name?: string | null
          father_name_bn?: string | null
          full_name: string
          full_name_bn?: string | null
          gender?: string | null
          group_stream?: string | null
          guardian_mobile?: string | null
          guardian_name?: string | null
          guardian_name_bn?: string | null
          guardian_occupation?: string | null
          guardian_relation?: string | null
          id?: string
          mother_name?: string | null
          mother_name_bn?: string | null
          nationality?: string | null
          parent_id?: string | null
          permanent_address?: string | null
          permanent_district?: string | null
          permanent_upazila?: string | null
          phone?: string | null
          photo_url?: string | null
          present_address?: string | null
          present_district?: string | null
          present_upazila?: string | null
          previous_school?: string | null
          religion?: string | null
          roll_number: string
          school_id?: string | null
          section?: string | null
          shift?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          version?: string | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          admission_date?: string | null
          admission_id?: string | null
          alternative_contact?: string | null
          birth_certificate_no?: string | null
          blood_group?: string | null
          class?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          father_name?: string | null
          father_name_bn?: string | null
          full_name?: string
          full_name_bn?: string | null
          gender?: string | null
          group_stream?: string | null
          guardian_mobile?: string | null
          guardian_name?: string | null
          guardian_name_bn?: string | null
          guardian_occupation?: string | null
          guardian_relation?: string | null
          id?: string
          mother_name?: string | null
          mother_name_bn?: string | null
          nationality?: string | null
          parent_id?: string | null
          permanent_address?: string | null
          permanent_district?: string | null
          permanent_upazila?: string | null
          phone?: string | null
          photo_url?: string | null
          present_address?: string | null
          present_district?: string | null
          present_upazila?: string | null
          previous_school?: string | null
          religion?: string | null
          roll_number?: string
          school_id?: string | null
          section?: string | null
          shift?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_storage_mb: number | null
          max_students: number
          max_teachers: number
          name: Database["public"]["Enums"]["subscription_plan"]
          name_bn: string | null
          price_monthly: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_storage_mb?: number | null
          max_students: number
          max_teachers: number
          name: Database["public"]["Enums"]["subscription_plan"]
          name_bn?: string | null
          price_monthly?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_storage_mb?: number | null
          max_students?: number
          max_teachers?: number
          name?: Database["public"]["Enums"]["subscription_plan"]
          name_bn?: string | null
          price_monthly?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      teacher_attendance: {
        Row: {
          approval_status: string | null
          biometric_timestamp: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          date: string
          device_id: string | null
          id: string
          is_late: boolean | null
          late_minutes: number | null
          marked_by: string | null
          remarks: string | null
          source: string | null
          status: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          biometric_timestamp?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          date: string
          device_id?: string | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          marked_by?: string | null
          remarks?: string | null
          source?: string | null
          status?: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          biometric_timestamp?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          date?: string
          device_id?: string | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          marked_by?: string | null
          remarks?: string | null
          source?: string | null
          status?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          address: string | null
          assigned_classes: string[] | null
          assigned_sections: string[] | null
          bank_account: string | null
          bank_name: string | null
          blood_group: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          designation: string | null
          education_details: Json | null
          email: string | null
          emergency_contact: string | null
          emergency_contact_relation: string | null
          employee_id: string
          employment_type: string | null
          experience_years: number | null
          full_name: string
          full_name_bn: string | null
          gender: string | null
          id: string
          joining_date: string | null
          national_id: string | null
          nationality: string | null
          phone: string | null
          qualification: string | null
          religion: string | null
          salary_grade: string | null
          school_id: string | null
          status: string | null
          subjects_taught: string[] | null
          training_details: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_classes?: string[] | null
          assigned_sections?: string[] | null
          bank_account?: string | null
          bank_name?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          education_details?: Json | null
          email?: string | null
          emergency_contact?: string | null
          emergency_contact_relation?: string | null
          employee_id: string
          employment_type?: string | null
          experience_years?: number | null
          full_name: string
          full_name_bn?: string | null
          gender?: string | null
          id?: string
          joining_date?: string | null
          national_id?: string | null
          nationality?: string | null
          phone?: string | null
          qualification?: string | null
          religion?: string | null
          salary_grade?: string | null
          school_id?: string | null
          status?: string | null
          subjects_taught?: string[] | null
          training_details?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_classes?: string[] | null
          assigned_sections?: string[] | null
          bank_account?: string | null
          bank_name?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          education_details?: Json | null
          email?: string | null
          emergency_contact?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string
          employment_type?: string | null
          experience_years?: number | null
          full_name?: string
          full_name_bn?: string | null
          gender?: string | null
          id?: string
          joining_date?: string | null
          national_id?: string | null
          nationality?: string | null
          phone?: string | null
          qualification?: string | null
          religion?: string | null
          salary_grade?: string | null
          school_id?: string | null
          status?: string | null
          subjects_taught?: string[] | null
          training_details?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
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
      check_school_limit: {
        Args: { _entity_type: string; _school_id: string }
        Returns: Json
      }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_school_admin: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_admin"
        | "teacher"
        | "parent"
        | "student"
      subscription_plan: "basic" | "standard" | "premium" | "enterprise"
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
      subscription_plan: ["basic", "standard", "premium", "enterprise"],
    },
  },
} as const
