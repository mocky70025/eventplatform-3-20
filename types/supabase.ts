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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      event_applications: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          event_id: string | null
          exhibitor_id: string | null
          expired_at: string | null
          form_answers: Json | null
          id: string
          message: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          event_id?: string | null
          exhibitor_id?: string | null
          expired_at?: string | null
          form_answers?: Json | null
          id?: string
          message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          event_id?: string | null
          exhibitor_id?: string | null
          expired_at?: string | null
          form_answers?: Json | null
          id?: string
          message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_applications_exhibitor_id_fkey"
            columns: ["exhibitor_id"]
            isOneToOne: false
            referencedRelation: "exhibitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_applications_exhibitor_id_fkey"
            columns: ["exhibitor_id"]
            isOneToOne: false
            referencedRelation: "exhibitors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          event_id: string
          id: string
          rating: number
          reviewee_id: string
          reviewee_type: string
          reviewer_id: string
          reviewer_type: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          rating: number
          reviewee_id: string
          reviewee_type: string
          reviewer_id: string
          reviewer_type: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewee_type?: string
          reviewer_id?: string
          reviewer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          application_period_end: string | null
          application_period_start: string | null
          booth_content: string | null
          booth_qualification: string | null
          cancel_policy: string | null
          category_slots: Json | null
          created_at: string | null
          description: string | null
          event_day_settings: Json | null
          event_end_date: string | null
          event_name: string
          event_name_furigana: string | null
          event_schedule: Json | null
          event_start_date: string | null
          event_time: string | null
          exhibitor_form_fields: Json | null
          exhibitor_list_visibility: string | null
          expected_visitors: number | null
          fee: string | null
          gallery_images: string[] | null
          genre: string | null
          id: string
          lead_text: string | null
          loading_info: string | null
          location_lat: number | null
          location_lng: number | null
          main_image_url: string | null
          max_exhibitors: number | null
          meeting_info_sent: boolean | null
          offered_equipment: Json | null
          organizer_email: string | null
          organizer_id: string | null
          organizer_name: string | null
          organizer_phone: string | null
          postponed_date: string | null
          postponed_dates: Json | null
          postponed_note: string | null
          power_supply: boolean | null
          privacy_policy: string | null
          recruit_count: number | null
          requirements: string | null
          restrictions: Json | null
          status: string | null
          target_audience: Json | null
          terms_compliance: string | null
          updated_at: string | null
          venue_layout_url: string | null
          venue_name: string | null
          venue_rules: string | null
          visibility: string | null
          water_supply: boolean | null
        }
        Insert: {
          address?: string | null
          application_period_end?: string | null
          application_period_start?: string | null
          booth_content?: string | null
          booth_qualification?: string | null
          cancel_policy?: string | null
          category_slots?: Json | null
          created_at?: string | null
          description?: string | null
          event_day_settings?: Json | null
          event_end_date?: string | null
          event_name: string
          event_name_furigana?: string | null
          event_schedule?: Json | null
          event_start_date?: string | null
          event_time?: string | null
          exhibitor_form_fields?: Json | null
          exhibitor_list_visibility?: string | null
          expected_visitors?: number | null
          fee?: string | null
          gallery_images?: string[] | null
          genre?: string | null
          id?: string
          lead_text?: string | null
          loading_info?: string | null
          location_lat?: number | null
          location_lng?: number | null
          main_image_url?: string | null
          max_exhibitors?: number | null
          meeting_info_sent?: boolean | null
          offered_equipment?: Json | null
          organizer_email?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          postponed_date?: string | null
          postponed_dates?: Json | null
          postponed_note?: string | null
          power_supply?: boolean | null
          privacy_policy?: string | null
          recruit_count?: number | null
          requirements?: string | null
          restrictions?: Json | null
          status?: string | null
          target_audience?: Json | null
          terms_compliance?: string | null
          updated_at?: string | null
          venue_layout_url?: string | null
          venue_name?: string | null
          venue_rules?: string | null
          visibility?: string | null
          water_supply?: boolean | null
        }
        Update: {
          address?: string | null
          application_period_end?: string | null
          application_period_start?: string | null
          booth_content?: string | null
          booth_qualification?: string | null
          cancel_policy?: string | null
          category_slots?: Json | null
          created_at?: string | null
          description?: string | null
          event_day_settings?: Json | null
          event_end_date?: string | null
          event_name?: string
          event_name_furigana?: string | null
          event_schedule?: Json | null
          event_start_date?: string | null
          event_time?: string | null
          exhibitor_form_fields?: Json | null
          exhibitor_list_visibility?: string | null
          expected_visitors?: number | null
          fee?: string | null
          gallery_images?: string[] | null
          genre?: string | null
          id?: string
          lead_text?: string | null
          loading_info?: string | null
          location_lat?: number | null
          location_lng?: number | null
          main_image_url?: string | null
          max_exhibitors?: number | null
          meeting_info_sent?: boolean | null
          offered_equipment?: Json | null
          organizer_email?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          postponed_date?: string | null
          postponed_dates?: Json | null
          postponed_note?: string | null
          power_supply?: boolean | null
          privacy_policy?: string | null
          recruit_count?: number | null
          requirements?: string | null
          restrictions?: Json | null
          status?: string | null
          target_audience?: Json | null
          terms_compliance?: string | null
          updated_at?: string | null
          venue_layout_url?: string | null
          venue_name?: string | null
          venue_rules?: string | null
          visibility?: string | null
          water_supply?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibitors: {
        Row: {
          address: string | null
          age: number | null
          allow_photo_usage: boolean | null
          automobile_inspection_image_url: string | null
          avatar_url: string | null
          building: string | null
          business_license_expiry: string | null
          business_license_image_url: string | null
          business_permit_expiry: string | null
          business_permit_image_url: string | null
          business_styles: string[] | null
          city_address: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          email: string
          fire_equipment_layout_image_url: string | null
          fire_manager_expiry: string | null
          gallery_images: string[] | null
          gender: string | null
          genre: string | null
          genre_free_text: string | null
          genres: string[] | null
          id: string
          name: string | null
          notification_settings: Json | null
          phone_number: string | null
          pl_insurance_expiry: string | null
          pl_insurance_image_url: string | null
          postal_code: string | null
          prefecture: string | null
          shop_name: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_inspection_expiry: string | null
          vehicle_inspection_image_url: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          allow_photo_usage?: boolean | null
          automobile_inspection_image_url?: string | null
          avatar_url?: string | null
          building?: string | null
          business_license_expiry?: string | null
          business_license_image_url?: string | null
          business_permit_expiry?: string | null
          business_permit_image_url?: string | null
          business_styles?: string[] | null
          city_address?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          fire_equipment_layout_image_url?: string | null
          fire_manager_expiry?: string | null
          gallery_images?: string[] | null
          gender?: string | null
          genre?: string | null
          genre_free_text?: string | null
          genres?: string[] | null
          id?: string
          name?: string | null
          notification_settings?: Json | null
          phone_number?: string | null
          pl_insurance_expiry?: string | null
          pl_insurance_image_url?: string | null
          postal_code?: string | null
          prefecture?: string | null
          shop_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_inspection_expiry?: string | null
          vehicle_inspection_image_url?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          allow_photo_usage?: boolean | null
          automobile_inspection_image_url?: string | null
          avatar_url?: string | null
          building?: string | null
          business_license_expiry?: string | null
          business_license_image_url?: string | null
          business_permit_expiry?: string | null
          business_permit_image_url?: string | null
          business_styles?: string[] | null
          city_address?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          fire_equipment_layout_image_url?: string | null
          fire_manager_expiry?: string | null
          gallery_images?: string[] | null
          gender?: string | null
          genre?: string | null
          genre_free_text?: string | null
          genres?: string[] | null
          id?: string
          name?: string | null
          notification_settings?: Json | null
          phone_number?: string | null
          pl_insurance_expiry?: string | null
          pl_insurance_image_url?: string | null
          postal_code?: string | null
          prefecture?: string | null
          shop_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_inspection_expiry?: string | null
          vehicle_inspection_image_url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_application_id: string | null
          related_event_id: string | null
          title: string
          type: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_application_id?: string | null
          related_event_id?: string | null
          title: string
          type: string
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_application_id?: string | null
          related_event_id?: string | null
          title?: string
          type?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_application_id_fkey"
            columns: ["related_application_id"]
            isOneToOne: false
            referencedRelation: "event_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          address: string | null
          age: number | null
          avatar_url: string | null
          building: string | null
          city_address: string | null
          company_name: string | null
          created_at: string | null
          description: string | null
          email: string
          gender: string | null
          id: string
          name: string | null
          notification_settings: Json | null
          phone_number: string | null
          postal_code: string | null
          prefecture: string | null
          social_links: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          building?: string | null
          city_address?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          gender?: string | null
          id?: string
          name?: string | null
          notification_settings?: Json | null
          phone_number?: string | null
          postal_code?: string | null
          prefecture?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          building?: string | null
          city_address?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          gender?: string | null
          id?: string
          name?: string | null
          notification_settings?: Json | null
          phone_number?: string | null
          postal_code?: string | null
          prefecture?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          event_id: string | null
          from_exhibitor_id: string | null
          from_organizer_id: string | null
          id: string
          rating: number
          to_exhibitor_id: string | null
          to_organizer_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          event_id?: string | null
          from_exhibitor_id?: string | null
          from_organizer_id?: string | null
          id?: string
          rating: number
          to_exhibitor_id?: string | null
          to_organizer_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          event_id?: string | null
          from_exhibitor_id?: string | null
          from_organizer_id?: string | null
          id?: string
          rating?: number
          to_exhibitor_id?: string | null
          to_organizer_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      exhibitors_public: {
        Row: {
          age: number | null
          allow_photo_usage: boolean | null
          avatar_url: string | null
          business_styles: string[] | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          gallery_images: string[] | null
          gender: string | null
          genre_free_text: string | null
          genres: string[] | null
          id: string | null
          name: string | null
          shop_name: string | null
        }
        Insert: {
          age?: number | null
          allow_photo_usage?: boolean | null
          avatar_url?: string | null
          business_styles?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          gallery_images?: string[] | null
          gender?: string | null
          genre_free_text?: string | null
          genres?: string[] | null
          id?: string | null
          name?: string | null
          shop_name?: string | null
        }
        Update: {
          age?: number | null
          allow_photo_usage?: boolean | null
          avatar_url?: string | null
          business_styles?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          gallery_images?: string[] | null
          gender?: string | null
          genre_free_text?: string | null
          genres?: string[] | null
          id?: string | null
          name?: string | null
          shop_name?: string | null
        }
        Relationships: []
      }
      organizers_public: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          social_links: Json | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          social_links?: Json | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          social_links?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: {
        Args: { p_older_than_seconds?: number }
        Returns: number
      }
      get_user_id_by_email: { Args: { user_email: string }; Returns: string }
      storage_object_user_id: { Args: { obj: unknown }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
