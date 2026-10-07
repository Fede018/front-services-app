
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "availability_status": {
                  Row: {
                    "note": string | null,"provider_id": string,"state": Database["public"]['Enums']["availability_state"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "note"?: string | null,"provider_id": string,"state"?: Database["public"]['Enums']["availability_state"],"updated_at"?: string
                  }
                  Update: {
                    "note"?: string | null,"provider_id"?: string,"state"?: Database["public"]['Enums']["availability_state"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "availability_status_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: true
      referencedRelation: "providers"
      referencedColumns: ["id"]
    }
                  ]
                },"business_hours": {
                  Row: {
                    "closes_at": string,"created_at": string,"id": string,"opens_at": string,"provider_id": string,"updated_at": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "closes_at": string,"created_at"?: string,"id"?: string,"opens_at": string,"provider_id": string,"updated_at"?: string,"weekday": number
                  }
                  Update: {
                    "closes_at"?: string,"created_at"?: string,"id"?: string,"opens_at"?: string,"provider_id"?: string,"updated_at"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_hours_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
      referencedRelation: "providers"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"icon": string | null,"id": string,"is_active": boolean,"name": string,"parent_id": string | null,"slug": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"parent_id"?: string | null,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"parent_id"?: string | null,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"locations": {
                  Row: {
                    "created_at": string,"id": string,"is_active": boolean,"kind": Database["public"]['Enums']["location_kind"],"lat": number | null,"lng": number | null,"name": string,"parent_id": string | null,"slug": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"kind": Database["public"]['Enums']["location_kind"],"lat"?: number | null,"lng"?: number | null,"name": string,"parent_id"?: string | null,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"kind"?: Database["public"]['Enums']["location_kind"],"lat"?: number | null,"lng"?: number | null,"name"?: string,"parent_id"?: string | null,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "locations_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"full_name": string | null,"id": string,"role": Database["public"]['Enums']["user_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"full_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"full_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"provider_categories": {
                  Row: {
                    "category_id": string,"provider_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"provider_id": string
                  }
                  Update: {
                    "category_id"?: string,"provider_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "provider_categories_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "provider_categories_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
      referencedRelation: "providers"
      referencedColumns: ["id"]
    }
                  ]
                },"provider_coverage_areas": {
                  Row: {
                    "location_id": string,"provider_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "location_id": string,"provider_id": string
                  }
                  Update: {
                    "location_id"?: string,"provider_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "provider_coverage_areas_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "provider_coverage_areas_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
      referencedRelation: "providers"
      referencedColumns: ["id"]
    }
                  ]
                },"provider_images": {
                  Row: {
                    "alt": string | null,"created_at": string,"id": string,"is_cover": boolean,"provider_id": string,"sort_order": number,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string | null,"created_at"?: string,"id"?: string,"is_cover"?: boolean,"provider_id": string,"sort_order"?: number,"storage_path": string
                  }
                  Update: {
                    "alt"?: string | null,"created_at"?: string,"id"?: string,"is_cover"?: boolean,"provider_id"?: string,"sort_order"?: number,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "provider_images_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
      referencedRelation: "providers"
      referencedColumns: ["id"]
    }
                  ]
                },"providers": {
                  Row: {
                    "business_name": string,"created_at": string,"description": string | null,"id": string,"is_demo": boolean,"location_id": string | null,"offers_delivery": boolean,"offers_home_visit": boolean,"owner_id": string,"phone": string | null,"provider_type": Database["public"]['Enums']["provider_type"],"published_at": string | null,"search_vector": unknown,"slug": string,"status": Database["public"]['Enums']["provider_status"],"updated_at": string,"verified_at": string | null,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_name": string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_demo"?: boolean,"location_id"?: string | null,"offers_delivery"?: boolean,"offers_home_visit"?: boolean,"owner_id": string,"phone"?: string | null,"provider_type": Database["public"]['Enums']["provider_type"],"published_at"?: string | null,"search_vector"?: unknown,"slug": string,"status"?: Database["public"]['Enums']["provider_status"],"updated_at"?: string,"verified_at"?: string | null,"whatsapp"?: string | null
                  }
                  Update: {
                    "business_name"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_demo"?: boolean,"location_id"?: string | null,"offers_delivery"?: boolean,"offers_home_visit"?: boolean,"owner_id"?: string,"phone"?: string | null,"provider_type"?: Database["public"]['Enums']["provider_type"],"published_at"?: string | null,"search_vector"?: unknown,"slug"?: string,"status"?: Database["public"]['Enums']["provider_status"],"updated_at"?: string,"verified_at"?: string | null,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "providers_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "providers_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"services": {
                  Row: {
                    "created_at": string,"currency": string,"description": string | null,"id": string,"is_active": boolean,"name": string,"price_from": number | null,"price_to": number | null,"price_unit": string | null,"provider_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"currency"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"price_from"?: number | null,"price_to"?: number | null,"price_unit"?: string | null,"provider_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"currency"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"price_from"?: number | null,"price_to"?: number | null,"price_unit"?: string | null,"provider_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
      referencedRelation: "providers"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "compute_provider_search_vector":
{ Args: { "p_description": string,"p_id": string,"p_name": string }; Returns: unknown
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "availability_state": "available_now"|"available_today"|"unavailable","location_kind": "province"|"city"|"zone","provider_status": "draft"|"pending_review"|"published"|"suspended","provider_type": "professional"|"business","user_role": "client"|"provider"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "availability_state": ["available_now", "available_today", "unavailable"],"location_kind": ["province", "city", "zone"],"provider_status": ["draft", "pending_review", "published", "suspended"],"provider_type": ["professional", "business"],"user_role": ["client", "provider", "admin"]
          }
        }
} as const
