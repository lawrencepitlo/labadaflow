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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          archived_at: string | null
          clerk_user_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total_cents: number
          order_id: string
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          quantity: number
          service_id: string | null
          service_name: string
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total_cents: number
          order_id: string
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          quantity: number
          service_id?: string | null
          service_name: string
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total_cents?: number
          order_id?: string
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"]
          quantity?: number
          service_id?: string | null
          service_name?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          actor_id: string | null
          actor_name: string
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          note: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_name: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_to: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          customer_id: string
          due_at: string | null
          id: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          received_at: string
          source: Database["public"]["Enums"]["order_source"]
          status: Database["public"]["Enums"]["order_status"]
          total_cents: number
          tracking_code: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          customer_id: string
          due_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          received_at?: string
          source?: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"]
          total_cents?: number
          tracking_code: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          received_at?: string
          source?: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"]
          total_cents?: number
          tracking_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          sort_order: number
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          sort_order?: number
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"]
          sort_order?: number
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          clerk_user_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_order_status: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_from_status: Database["public"]["Enums"]["order_status"]
          p_note?: string | null
          p_order_id: string
          p_to_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: undefined
      }
      cancel_order: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_cancel_reason: string
          p_from_status: Database["public"]["Enums"]["order_status"]
          p_order_id: string
        }
        Returns: undefined
      }
      complete_order:
        | {
            Args: {
              p_actor_id: string
              p_actor_name: string
              p_order_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_actor_id: string
              p_actor_name: string
              p_order_id: string
              p_payment_method: Database["public"]["Enums"]["payment_method"]
            }
            Returns: undefined
          }
      create_order: {
        Args: {
          p_actor_name: string
          p_assigned_to?: string | null
          p_created_by: string
          p_customer_id: string
          p_due_at?: string | null
          p_items: Json
          p_notes?: string | null
          p_source?: Database["public"]["Enums"]["order_source"]
          p_tracking_code: string
        }
        Returns: Json
      }
      get_dashboard_metrics: { Args: never; Returns: Json }
      get_reports_data: { Args: never; Returns: Json }
      get_tracking: { Args: { p_code: string }; Returns: Json }
      reopen_order: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_note: string
          p_order_id: string
        }
        Returns: undefined
      }
      update_order_items: {
        Args: { p_items: Json; p_order_id: string }
        Returns: Json
      }
      update_order_total: { Args: { p_order_id: string }; Returns: undefined }
    }
    Enums: {
      order_source: "WALK_IN" | "PORTAL"
      order_status:
        | "RECEIVED"
        | "WASHING"
        | "DRYING"
        | "FOLDING"
        | "READY"
        | "COMPLETED"
        | "CANCELLED"
      payment_method: "CASH" | "GCASH" | "OTHER"
      pricing_unit: "PER_KG" | "PER_PIECE"
      user_role: "ADMIN" | "STAFF" | "CUSTOMER"
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
    Enums: {
      order_source: ["WALK_IN", "PORTAL"],
      order_status: [
        "RECEIVED",
        "WASHING",
        "DRYING",
        "FOLDING",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ],
      payment_method: ["CASH", "GCASH", "OTHER"],
      pricing_unit: ["PER_KG", "PER_PIECE"],
      user_role: ["ADMIN", "STAFF", "CUSTOMER"],
    },
  },
} as const
