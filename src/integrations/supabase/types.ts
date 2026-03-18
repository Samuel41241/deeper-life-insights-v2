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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          card_id: string | null
          check_in_time: string
          created_at: string
          date: string
          id: string
          location_id: string
          member_id: string
          service_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          card_id?: string | null
          check_in_time?: string
          created_at?: string
          date?: string
          id?: string
          location_id: string
          member_id: string
          service_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          card_id?: string | null
          check_in_time?: string
          created_at?: string
          date?: string
          id?: string
          location_id?: string
          member_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_trends: {
        Row: {
          attendance_rate: number | null
          attended: number
          created_at: string
          id: string
          member_id: string
          period_end: string
          period_start: string
          total_services: number
          trend: string | null
        }
        Insert: {
          attendance_rate?: number | null
          attended?: number
          created_at?: string
          id?: string
          member_id: string
          period_end: string
          period_start: string
          total_services?: number
          trend?: string | null
        }
        Update: {
          attendance_rate?: number | null
          attended?: number
          created_at?: string
          id?: string
          member_id?: string
          period_end?: string
          period_start?: string
          total_services?: number
          trend?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_trends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          card_number: string
          created_at: string
          id: string
          issued_date: string
          member_id: string
          qr_code_value: string
          status: Database["public"]["Enums"]["card_status"]
        }
        Insert: {
          card_number: string
          created_at?: string
          id?: string
          issued_date?: string
          member_id: string
          qr_code_value: string
          status?: Database["public"]["Enums"]["card_status"]
        }
        Update: {
          card_number?: string
          created_at?: string
          id?: string
          issued_date?: string
          member_id?: string
          qr_code_value?: string
          status?: Database["public"]["Enums"]["card_status"]
        }
        Relationships: [
          {
            foreignKeyName: "cards_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          created_at: string
          group_district_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_district_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_district_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_group_district_id_fkey"
            columns: ["group_district_id"]
            isOneToOne: false
            referencedRelation: "group_districts"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          id: string
          is_read: boolean
          member_id: string
          message: string | null
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          id?: string
          is_read?: boolean
          member_id: string
          message?: string | null
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          id?: string
          is_read?: boolean
          member_id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_alerts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_flags: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          member_id: string
          notes: string | null
          reason: string
          status: Database["public"]["Enums"]["followup_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          reason: string
          status?: Database["public"]["Enums"]["followup_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          reason?: string
          status?: Database["public"]["Enums"]["followup_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_flags_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_districts: {
        Row: {
          created_at: string
          id: string
          name: string
          region_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_districts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          district_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          district_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          district_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["member_category"]
          created_at: string
          date_joined: string
          full_name: string
          gender: string
          id: string
          location_id: string
          passport_photo_url: string | null
          phone: string | null
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          category: Database["public"]["Enums"]["member_category"]
          created_at?: string
          date_joined?: string
          full_name: string
          gender: string
          id?: string
          location_id: string
          passport_photo_url?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["member_category"]
          created_at?: string
          date_joined?: string
          full_name?: string
          gender?: string
          id?: string
          location_id?: string
          passport_photo_url?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      newcomers: {
        Row: {
          attendance_date: string
          children_count: number
          created_at: string
          created_by: string
          female_count: number
          id: string
          location_id: string
          male_count: number
          notes: string | null
          service_id: string | null
          total_count: number
          updated_at: string
          youth_count: number
        }
        Insert: {
          attendance_date?: string
          children_count?: number
          created_at?: string
          created_by: string
          female_count?: number
          id?: string
          location_id: string
          male_count?: number
          notes?: string | null
          service_id?: string | null
          total_count?: number
          updated_at?: string
          youth_count?: number
        }
        Update: {
          attendance_date?: string
          children_count?: number
          created_at?: string
          created_by?: string
          female_count?: number
          id?: string
          location_id?: string
          male_count?: number
          notes?: string | null
          service_id?: string | null
          total_count?: number
          updated_at?: string
          youth_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "newcomers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newcomers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
          state_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          state_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          state_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          day_of_week: string
          id: string
          location_id: string | null
          name: string
          service_type: string
          start_time: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: string
          id?: string
          location_id?: string | null
          name: string
          service_type: string
          start_time?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: string
          id?: string
          location_id?: string | null
          name?: string
          service_type?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          district_id: string | null
          email: string | null
          group_district_id: string | null
          id: string
          is_active: boolean
          location_id: string | null
          must_change_password: boolean
          region_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          state_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          district_id?: string | null
          email?: string | null
          group_district_id?: string | null
          id?: string
          is_active?: boolean
          location_id?: string | null
          must_change_password?: boolean
          region_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          state_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          district_id?: string | null
          email?: string | null
          group_district_id?: string | null
          id?: string
          is_active?: boolean
          location_id?: string | null
          must_change_password?: boolean
          region_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          state_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_group_district_id_fkey"
            columns: ["group_district_id"]
            isOneToOne: false
            referencedRelation: "group_districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
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
      mark_password_changed: { Args: never; Returns: undefined }
    }
    Enums: {
      alert_type:
        | "absent_warning"
        | "absent_critical"
        | "new_member_check"
        | "trend_decline"
      app_role:
        | "super_admin"
        | "state_admin"
        | "region_admin"
        | "group_admin"
        | "district_admin"
        | "location_admin"
        | "data_officer"
      attendance_status: "present" | "late" | "absent"
      card_status: "active" | "lost" | "replaced" | "inactive"
      followup_status: "pending" | "in_progress" | "completed" | "cancelled"
      member_category:
        | "adult_male"
        | "adult_female"
        | "youth_boy"
        | "youth_girl"
        | "children_boy"
        | "children_girl"
      member_status: "active" | "inactive" | "transferred" | "deceased"
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
      alert_type: [
        "absent_warning",
        "absent_critical",
        "new_member_check",
        "trend_decline",
      ],
      app_role: [
        "super_admin",
        "state_admin",
        "region_admin",
        "group_admin",
        "district_admin",
        "location_admin",
        "data_officer",
      ],
      attendance_status: ["present", "late", "absent"],
      card_status: ["active", "lost", "replaced", "inactive"],
      followup_status: ["pending", "in_progress", "completed", "cancelled"],
      member_category: [
        "adult_male",
        "adult_female",
        "youth_boy",
        "youth_girl",
        "children_boy",
        "children_girl",
      ],
      member_status: ["active", "inactive", "transferred", "deceased"],
    },
  },
} as const
