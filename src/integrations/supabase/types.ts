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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          options: Json | null
          product_id: string | null
          quantity: number
          session_id: string | null
          unit_price: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json | null
          product_id?: string | null
          quantity?: number
          session_id?: string | null
          unit_price?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json | null
          product_id?: string | null
          quantity?: number
          session_id?: string | null
          unit_price?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order: number | null
          type: string | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order?: number | null
          type?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order?: number | null
          type?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      customer_tax_exemptions: {
        Row: {
          certificate_number: string | null
          created_at: string
          exemption_type: string | null
          expires_at: string | null
          id: string
          is_verified: boolean | null
          state: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string
          exemption_type?: string | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          certificate_number?: string | null
          created_at?: string
          exemption_type?: string | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      design_templates: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string
          description: string | null
          design_data: Json | null
          file_type: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_images: Json | null
          product_id: string | null
          sizes: Json | null
          sort_order: number | null
          source_file_url: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          design_data?: Json | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_images?: Json | null
          product_id?: string | null
          sizes?: Json | null
          sort_order?: number | null
          source_file_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          design_data?: Json | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_images?: Json | null
          product_id?: string | null
          sizes?: Json | null
          sort_order?: number | null
          source_file_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number | null
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          order_id: string | null
          paid_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          order_id?: string | null
          paid_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          order_id?: string | null
          paid_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      name_badge_designs: {
        Row: {
          created_at: string
          design_data: Json | null
          id: string
          name: string
          session_id: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          design_data?: Json | null
          id?: string
          name: string
          session_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          design_data?: Json | null
          id?: string
          name?: string
          session_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      name_badge_orders: {
        Row: {
          created_at: string
          design_id: string | null
          id: string
          names: Json | null
          options: Json | null
          quantity: number | null
          session_id: string | null
          status: string | null
          total: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          design_id?: string | null
          id?: string
          names?: Json | null
          options?: Json | null
          quantity?: number | null
          session_id?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          design_id?: string | null
          id?: string
          names?: Json | null
          options?: Json | null
          quantity?: number | null
          session_id?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "name_badge_orders_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "name_badge_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          id: string
          items: Json | null
          notes: string | null
          order_number: string
          payment_intent_id: string | null
          payment_status: string | null
          session_id: string | null
          shipping: number | null
          shipping_address: Json | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          id?: string
          items?: Json | null
          notes?: string | null
          order_number: string
          payment_intent_id?: string | null
          payment_status?: string | null
          session_id?: string | null
          shipping?: number | null
          shipping_address?: Json | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          id?: string
          items?: Json | null
          notes?: string | null
          order_number?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          session_id?: string | null
          shipping?: number | null
          shipping_address?: Json | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_tiers: {
        Row: {
          created_at: string
          id: string
          max_quantity: number | null
          min_quantity: number | null
          name: string | null
          price: number | null
          product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string | null
          price?: number | null
          product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string | null
          price?: number | null
          product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          order: number | null
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          order?: number | null
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          order?: number | null
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_imports: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          import_status: string | null
          product_id: string | null
          scraped_data: Json | null
          source_name: string | null
          source_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          import_status?: string | null
          product_id?: string | null
          scraped_data?: Json | null
          source_name?: string | null
          source_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          import_status?: string | null
          product_id?: string | null
          scraped_data?: Json | null
          source_name?: string | null
          source_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_imports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          additional_category_ids: string[] | null
          allow_custom_size: boolean | null
          base_price: number | null
          category_id: string | null
          created_at: string
          default_height: number | null
          default_width: number | null
          description: string | null
          features: string[] | null
          finish_options: Json | null
          gallery_images: string[] | null
          has_design_tool: boolean | null
          hidden_options: Json | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_double_sided: boolean | null
          is_featured: boolean | null
          is_fixed_size: boolean | null
          is_on_sale: boolean | null
          is_popular: boolean | null
          long_description: string | null
          material_options: Json | null
          max_height: number | null
          max_width: number | null
          meta_description: string | null
          meta_title: string | null
          min_height: number | null
          min_width: number | null
          name: string
          options: Json | null
          order: number | null
          preset_sizes: Json | null
          price_per_sqft: number | null
          pricing_tiers: Json | null
          pricing_type: string | null
          product_options: Json | null
          sale_percentage: number | null
          sale_price: number | null
          short_description: string | null
          size_unit: string | null
          slug: string
          tax_code: string | null
          turnaround_days: number | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          additional_category_ids?: string[] | null
          allow_custom_size?: boolean | null
          base_price?: number | null
          category_id?: string | null
          created_at?: string
          default_height?: number | null
          default_width?: number | null
          description?: string | null
          features?: string[] | null
          finish_options?: Json | null
          gallery_images?: string[] | null
          has_design_tool?: boolean | null
          hidden_options?: Json | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_double_sided?: boolean | null
          is_featured?: boolean | null
          is_fixed_size?: boolean | null
          is_on_sale?: boolean | null
          is_popular?: boolean | null
          long_description?: string | null
          material_options?: Json | null
          max_height?: number | null
          max_width?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_height?: number | null
          min_width?: number | null
          name: string
          options?: Json | null
          order?: number | null
          preset_sizes?: Json | null
          price_per_sqft?: number | null
          pricing_tiers?: Json | null
          pricing_type?: string | null
          product_options?: Json | null
          sale_percentage?: number | null
          sale_price?: number | null
          short_description?: string | null
          size_unit?: string | null
          slug: string
          tax_code?: string | null
          turnaround_days?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          additional_category_ids?: string[] | null
          allow_custom_size?: boolean | null
          base_price?: number | null
          category_id?: string | null
          created_at?: string
          default_height?: number | null
          default_width?: number | null
          description?: string | null
          features?: string[] | null
          finish_options?: Json | null
          gallery_images?: string[] | null
          has_design_tool?: boolean | null
          hidden_options?: Json | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_double_sided?: boolean | null
          is_featured?: boolean | null
          is_fixed_size?: boolean | null
          is_on_sale?: boolean | null
          is_popular?: boolean | null
          long_description?: string | null
          material_options?: Json | null
          max_height?: number | null
          max_width?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_height?: number | null
          min_width?: number | null
          name?: string
          options?: Json | null
          order?: number | null
          preset_sizes?: Json | null
          price_per_sqft?: number | null
          pricing_tiers?: Json | null
          pricing_type?: string | null
          product_options?: Json | null
          sale_percentage?: number | null
          sale_price?: number | null
          short_description?: string | null
          size_unit?: string | null
          slug?: string
          tax_code?: string | null
          turnaround_days?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          id: string
          items: Json | null
          notes: string | null
          quote_number: string
          status: string | null
          subtotal: number | null
          updated_at: string
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json | null
          notes?: string | null
          quote_number: string
          status?: string | null
          subtotal?: number | null
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json | null
          notes?: string | null
          quote_number?: string
          status?: string | null
          subtotal?: number | null
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          is_verified: boolean | null
          order_id: string | null
          product_id: string | null
          rating: number
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_designs: {
        Row: {
          artwork_url: string | null
          created_at: string
          design_data: Json | null
          finish: string | null
          height: number | null
          id: string
          is_in_cart: boolean | null
          material: string | null
          name: string
          options_json: Json | null
          product_id: string | null
          product_type: string | null
          quantity: number | null
          session_id: string | null
          thumbnail_url: string | null
          unit_price: number | null
          updated_at: string
          user_id: string | null
          width: number | null
        }
        Insert: {
          artwork_url?: string | null
          created_at?: string
          design_data?: Json | null
          finish?: string | null
          height?: number | null
          id?: string
          is_in_cart?: boolean | null
          material?: string | null
          name: string
          options_json?: Json | null
          product_id?: string | null
          product_type?: string | null
          quantity?: number | null
          session_id?: string | null
          thumbnail_url?: string | null
          unit_price?: number | null
          updated_at?: string
          user_id?: string | null
          width?: number | null
        }
        Update: {
          artwork_url?: string | null
          created_at?: string
          design_data?: Json | null
          finish?: string | null
          height?: number | null
          id?: string
          is_in_cart?: boolean | null
          material?: string | null
          name?: string
          options_json?: Json | null
          product_id?: string | null
          product_type?: string | null
          quantity?: number | null
          session_id?: string | null
          thumbnail_url?: string | null
          unit_price?: number | null
          updated_at?: string
          user_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_designs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_products: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_imported: boolean | null
          name: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_imported?: boolean | null
          name?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_imported?: boolean | null
          name?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sticker_orders: {
        Row: {
          created_at: string
          design_data: Json | null
          id: string
          options: Json | null
          quantity: number | null
          session_id: string | null
          status: string | null
          total: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          design_data?: Json | null
          id?: string
          options?: Json | null
          quantity?: number | null
          session_id?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          design_data?: Json | null
          id?: string
          options?: Json | null
          quantity?: number | null
          session_id?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tax_nexus: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          rate: number | null
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          rate?: number | null
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          rate?: number | null
          state?: string
          updated_at?: string
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
