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
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      combo_items: {
        Row: {
          combo_product_id: string
          created_at: string
          id: string
          included_product_id: string
          quantity: number
        }
        Insert: {
          combo_product_id: string
          created_at?: string
          id?: string
          included_product_id: string
          quantity?: number
        }
        Update: {
          combo_product_id?: string
          created_at?: string
          id?: string
          included_product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "combo_items_combo_product_id_fkey"
            columns: ["combo_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_items_included_product_id_fkey"
            columns: ["included_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_products: {
        Row: {
          created_at: string
          feature_type: string
          id: string
          is_active: boolean
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_type: string
          id?: string
          is_active?: boolean
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_type?: string
          id?: string
          is_active?: boolean
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_reviews: {
        Row: {
          avatar_url: string | null
          created_at: string
          customer_location: string | null
          customer_name: string
          id: string
          is_active: boolean
          rating: number
          review_text: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          customer_location?: string | null
          customer_name: string
          id?: string
          is_active?: boolean
          rating?: number
          review_text: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          customer_location?: string | null
          customer_name?: string
          id?: string
          is_active?: boolean
          rating?: number
          review_text?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null
          id: string
          invoice_date: string | null
          invoice_number: string
          order_id: string
          pdf_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number: string
          order_id: string
          pdf_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          order_id?: string
          pdf_url?: string | null
          updated_at?: string | null
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
      order_items: {
        Row: {
          cgst_amount: number | null
          created_at: string
          gst_percentage: number | null
          hsn_code: string | null
          id: string
          igst_amount: number | null
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          sgst_amount: number | null
          taxable_amount: number | null
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          igst_amount?: number | null
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          sgst_amount?: number | null
          taxable_amount?: number | null
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          igst_amount?: number | null
          order_id?: string
          price_at_purchase?: number
          product_id?: string
          quantity?: number
          sgst_amount?: number | null
          taxable_amount?: number | null
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
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cgst_total: number | null
          created_at: string
          discount_amount: number | null
          id: string
          igst_total: number | null
          is_intrastate: boolean | null
          payment_method: string | null
          payment_status: string | null
          sgst_total: number | null
          shipping_address: string | null
          shipping_charges: number | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number | null
          total_amount: number
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cgst_total?: number | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          igst_total?: number | null
          is_intrastate?: boolean | null
          payment_method?: string | null
          payment_status?: string | null
          sgst_total?: number | null
          shipping_address?: string | null
          shipping_charges?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total_amount: number
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cgst_total?: number | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          igst_total?: number | null
          is_intrastate?: boolean | null
          payment_method?: string | null
          payment_status?: string | null
          sgst_total?: number | null
          shipping_address?: string | null
          shipping_charges?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_videos: {
        Row: {
          created_at: string
          id: string
          product_id: string
          sort_order: number
          title: string | null
          video_type: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          title?: string | null
          video_type: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          title?: string | null
          video_type?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          concentration: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          gst_percentage: number | null
          hsn_code: string | null
          id: string
          image_url: string | null
          is_combo: boolean
          name: string
          price: number
          size: string | null
          stock_quantity: number
          stock_status: Database["public"]["Enums"]["stock_status"]
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          concentration?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          is_combo?: boolean
          name: string
          price: number
          size?: string | null
          stock_quantity?: number
          stock_status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          concentration?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          is_combo?: boolean
          name?: string
          price?: number
          size?: string | null
          stock_quantity?: number
          stock_status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_pincode: string | null
          billing_state: string | null
          created_at: string
          email: string
          full_name: string | null
          gstin: string | null
          id: string
          is_active: boolean
          mobile: string | null
          role: Database["public"]["Enums"]["user_role"]
          shipping_address: string | null
          shipping_city: string | null
          shipping_pincode: string | null
          shipping_state: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          gstin?: string | null
          id: string
          is_active?: boolean
          mobile?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_pincode?: string | null
          shipping_state?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          mobile?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_pincode?: string | null
          shipping_state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_settings: {
        Row: {
          address: string
          bank_account: string | null
          bank_ifsc: string | null
          bank_name: string | null
          city: string
          company_name: string
          created_at: string | null
          email: string | null
          gstin: string
          id: string
          logo_url: string | null
          pan: string | null
          phone: string | null
          pincode: string
          state: string
          updated_at: string | null
        }
        Insert: {
          address: string
          bank_account?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          city: string
          company_name: string
          created_at?: string | null
          email?: string | null
          gstin: string
          id?: string
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode: string
          state: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          bank_account?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          city?: string
          company_name?: string
          created_at?: string | null
          email?: string | null
          gstin?: string
          id?: string
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string
          state?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      slideshow_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slideshow_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      stock_status: "in_stock" | "out_of_stock" | "low_stock"
      user_role: "user" | "admin"
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
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      stock_status: ["in_stock", "out_of_stock", "low_stock"],
      user_role: ["user", "admin"],
    },
  },
} as const
