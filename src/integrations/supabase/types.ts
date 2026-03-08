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
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          admin_user_id: string
          created_at: string
          group_name: string
          id: string
          invite_code: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          group_name: string
          id?: string
          invite_code?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          group_name?: string
          id?: string
          invite_code?: string
        }
        Relationships: []
      }
      hangouts: {
        Row: {
          created_at: string
          created_by_user_id: string
          group_id: string
          id: string
          restaurant_image: string | null
          restaurant_name: string
          scheduled_date: string
          scheduled_time: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          group_id: string
          id?: string
          restaurant_image?: string | null
          restaurant_name: string
          scheduled_date: string
          scheduled_time: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          group_id?: string
          id?: string
          restaurant_image?: string | null
          restaurant_name?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hangouts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          caption: string | null
          created_at: string
          hangout_id: string
          id: string
          image_url: string
          uploaded_by_user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          hangout_id: string
          id?: string
          image_url: string
          uploaded_by_user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          hangout_id?: string
          id?: string
          image_url?: string
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_hangout_id_fkey"
            columns: ["hangout_id"]
            isOneToOne: false
            referencedRelation: "hangouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          profile_image: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          profile_image?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          profile_image?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_restaurants: {
        Row: {
          cuisine_tag: string | null
          custom_tags: string[] | null
          highlight_tag: string | null
          id: string
          link: string | null
          price_category: string | null
          price_range: string | null
          restaurant_image: string | null
          restaurant_name: string
          session_id: string
          wishlist_item_id: string
        }
        Insert: {
          cuisine_tag?: string | null
          custom_tags?: string[] | null
          highlight_tag?: string | null
          id?: string
          link?: string | null
          price_category?: string | null
          price_range?: string | null
          restaurant_image?: string | null
          restaurant_name: string
          session_id: string
          wishlist_item_id: string
        }
        Update: {
          cuisine_tag?: string | null
          custom_tags?: string[] | null
          highlight_tag?: string | null
          id?: string
          link?: string | null
          price_category?: string | null
          price_range?: string | null
          restaurant_image?: string | null
          restaurant_name?: string
          session_id?: string
          wishlist_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_restaurants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_restaurants_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "wishlist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          started_by_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          started_by_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          started_by_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          session_id: string
          user_id: string
          vote_type: string
          wishlist_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          user_id: string
          vote_type: string
          wishlist_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
          vote_type?: string
          wishlist_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "wishlist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string
          cuisine_tag: string | null
          custom_tags: string[] | null
          google_maps_link: string | null
          highlight_tag: string | null
          id: string
          price_category: string | null
          price_range: string | null
          restaurant_image: string | null
          restaurant_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cuisine_tag?: string | null
          custom_tags?: string[] | null
          google_maps_link?: string | null
          highlight_tag?: string | null
          id?: string
          price_category?: string | null
          price_range?: string | null
          restaurant_image?: string | null
          restaurant_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          cuisine_tag?: string | null
          custom_tags?: string[] | null
          google_maps_link?: string | null
          highlight_tag?: string | null
          id?: string
          price_category?: string | null
          price_range?: string | null
          restaurant_image?: string | null
          restaurant_name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
