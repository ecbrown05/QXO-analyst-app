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
      case_audit_log: {
        Row: {
          action: string
          case_id: string
          created_at: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          case_id: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          case_id?: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_audit_log_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          analyst_notes: string | null
          branch: string | null
          case_number: string
          competitor_bid: string | null
          created_at: string
          current_deviation_percent: number | null
          current_price: number | null
          current_spend_class: Database["public"]["Enums"]["spend_class"] | null
          customer_id_ref: string | null
          customer_name: string | null
          discount_percent: number | null
          dollar_loss_per_unit: number | null
          evidence_provided: string | null
          evidence_quality: string | null
          expected_revenue: number | null
          growth_rate: number | null
          historical_revenue: number | null
          id: string
          item_description: string | null
          market_price: number | null
          order_frequency: number | null
          price_zone: string | null
          quantity: number | null
          reason_for_request: string | null
          recommendation:
            | Database["public"]["Enums"]["recommendation_type"]
            | null
          recommendation_reasons: string[] | null
          region: string | null
          request_type: Database["public"]["Enums"]["request_type"]
          requested_deviation_percent: number | null
          requested_price: number | null
          requested_spend_class:
            | Database["public"]["Enums"]["spend_class"]
            | null
          requester: string | null
          required_approvers: string[] | null
          sku_code: string | null
          source_text: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["case_status"]
          suggested_response: string | null
          target_price: number | null
          total_margin_loss: number | null
          updated_at: string
        }
        Insert: {
          analyst_notes?: string | null
          branch?: string | null
          case_number: string
          competitor_bid?: string | null
          created_at?: string
          current_deviation_percent?: number | null
          current_price?: number | null
          current_spend_class?:
            | Database["public"]["Enums"]["spend_class"]
            | null
          customer_id_ref?: string | null
          customer_name?: string | null
          discount_percent?: number | null
          dollar_loss_per_unit?: number | null
          evidence_provided?: string | null
          evidence_quality?: string | null
          expected_revenue?: number | null
          growth_rate?: number | null
          historical_revenue?: number | null
          id?: string
          item_description?: string | null
          market_price?: number | null
          order_frequency?: number | null
          price_zone?: string | null
          quantity?: number | null
          reason_for_request?: string | null
          recommendation?:
            | Database["public"]["Enums"]["recommendation_type"]
            | null
          recommendation_reasons?: string[] | null
          region?: string | null
          request_type: Database["public"]["Enums"]["request_type"]
          requested_deviation_percent?: number | null
          requested_price?: number | null
          requested_spend_class?:
            | Database["public"]["Enums"]["spend_class"]
            | null
          requester?: string | null
          required_approvers?: string[] | null
          sku_code?: string | null
          source_text?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          suggested_response?: string | null
          target_price?: number | null
          total_margin_loss?: number | null
          updated_at?: string
        }
        Update: {
          analyst_notes?: string | null
          branch?: string | null
          case_number?: string
          competitor_bid?: string | null
          created_at?: string
          current_deviation_percent?: number | null
          current_price?: number | null
          current_spend_class?:
            | Database["public"]["Enums"]["spend_class"]
            | null
          customer_id_ref?: string | null
          customer_name?: string | null
          discount_percent?: number | null
          dollar_loss_per_unit?: number | null
          evidence_provided?: string | null
          evidence_quality?: string | null
          expected_revenue?: number | null
          growth_rate?: number | null
          historical_revenue?: number | null
          id?: string
          item_description?: string | null
          market_price?: number | null
          order_frequency?: number | null
          price_zone?: string | null
          quantity?: number | null
          reason_for_request?: string | null
          recommendation?:
            | Database["public"]["Enums"]["recommendation_type"]
            | null
          recommendation_reasons?: string[] | null
          region?: string | null
          request_type?: Database["public"]["Enums"]["request_type"]
          requested_deviation_percent?: number | null
          requested_price?: number | null
          requested_spend_class?:
            | Database["public"]["Enums"]["spend_class"]
            | null
          requester?: string | null
          required_approvers?: string[] | null
          sku_code?: string | null
          source_text?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          suggested_response?: string | null
          target_price?: number | null
          total_margin_loss?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          account_status: string
          annual_revenue: number
          branch: string
          created_at: string
          current_spend_class: Database["public"]["Enums"]["spend_class"]
          customer_id: string
          customer_name: string
          growth_rate: number
          id: string
          is_new: boolean
          region: string
          updated_at: string
          weeks_ordered: number
        }
        Insert: {
          account_status?: string
          annual_revenue?: number
          branch: string
          created_at?: string
          current_spend_class?: Database["public"]["Enums"]["spend_class"]
          customer_id: string
          customer_name: string
          growth_rate?: number
          id?: string
          is_new?: boolean
          region: string
          updated_at?: string
          weeks_ordered?: number
        }
        Update: {
          account_status?: string
          annual_revenue?: number
          branch?: string
          created_at?: string
          current_spend_class?: Database["public"]["Enums"]["spend_class"]
          customer_id?: string
          customer_name?: string
          growth_rate?: number
          id?: string
          is_new?: boolean
          region?: string
          updated_at?: string
          weeks_ordered?: number
        }
        Relationships: []
      }
      deviations: {
        Row: {
          created_at: string
          customer_id: string
          deviation_percent: number
          deviation_price: number
          effective_date: string
          id: string
          sku_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          deviation_percent: number
          deviation_price: number
          effective_date?: string
          id?: string
          sku_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          deviation_percent?: number
          deviation_price?: number
          effective_date?: string
          id?: string
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deviations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_thresholds: {
        Row: {
          created_at: string
          escalation_notes: string | null
          id: string
          request_type: Database["public"]["Enums"]["request_type"]
          required_approvers: string[]
          threshold_band: string
          threshold_max: number | null
          threshold_min: number | null
        }
        Insert: {
          created_at?: string
          escalation_notes?: string | null
          id?: string
          request_type: Database["public"]["Enums"]["request_type"]
          required_approvers: string[]
          threshold_band: string
          threshold_max?: number | null
          threshold_min?: number | null
        }
        Update: {
          created_at?: string
          escalation_notes?: string | null
          id?: string
          request_type?: Database["public"]["Enums"]["request_type"]
          required_approvers?: string[]
          threshold_band?: string
          threshold_max?: number | null
          threshold_min?: number | null
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          market_price: number
          price_zone: string
          sku_id: string
          spend_class: Database["public"]["Enums"]["spend_class"]
        }
        Insert: {
          created_at?: string
          effective_date?: string
          id?: string
          market_price: number
          price_zone: string
          sku_id: string
          spend_class: Database["public"]["Enums"]["spend_class"]
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          market_price?: number
          price_zone?: string
          sku_id?: string
          spend_class?: Database["public"]["Enums"]["spend_class"]
        }
        Relationships: [
          {
            foreignKeyName: "market_prices_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      skus: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          sku_code: string
          unit_of_measure: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          sku_code: string
          unit_of_measure?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          sku_code?: string
          unit_of_measure?: string
        }
        Relationships: []
      }
      spend_class_thresholds: {
        Row: {
          avg_revenue: number
          avg_weeks: number
          class: Database["public"]["Enums"]["spend_class"]
          created_at: string
          growth_threshold: number
          id: string
          max_revenue: number
          max_weeks: number
          min_revenue: number
          min_weeks: number
          updated_at: string
          weighted_score_max: number | null
          weighted_score_min: number | null
        }
        Insert: {
          avg_revenue: number
          avg_weeks: number
          class: Database["public"]["Enums"]["spend_class"]
          created_at?: string
          growth_threshold?: number
          id?: string
          max_revenue: number
          max_weeks: number
          min_revenue: number
          min_weeks: number
          updated_at?: string
          weighted_score_max?: number | null
          weighted_score_min?: number | null
        }
        Update: {
          avg_revenue?: number
          avg_weeks?: number
          class?: Database["public"]["Enums"]["spend_class"]
          created_at?: string
          growth_threshold?: number
          id?: string
          max_revenue?: number
          max_weeks?: number
          min_revenue?: number
          min_weeks?: number
          updated_at?: string
          weighted_score_max?: number | null
          weighted_score_min?: number | null
        }
        Relationships: []
      }
      target_prices: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          price_zone: string
          sku_id: string
          target_price: number
        }
        Insert: {
          created_at?: string
          effective_date?: string
          id?: string
          price_zone: string
          sku_id: string
          target_price: number
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          price_zone?: string
          sku_id?: string
          target_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "target_prices_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      case_status: "draft" | "in_review" | "completed" | "escalated" | "blocked"
      recommendation_type: "agree" | "push_back" | "escalate"
      request_type:
        | "existing_deviation"
        | "new_deviation"
        | "spend_class_new"
        | "spend_class_existing"
        | "market_price_change"
      spend_class: "A" | "B" | "C" | "D"
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
      case_status: ["draft", "in_review", "completed", "escalated", "blocked"],
      recommendation_type: ["agree", "push_back", "escalate"],
      request_type: [
        "existing_deviation",
        "new_deviation",
        "spend_class_new",
        "spend_class_existing",
        "market_price_change",
      ],
      spend_class: ["A", "B", "C", "D"],
    },
  },
} as const
