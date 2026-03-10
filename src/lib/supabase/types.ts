/**
 * Supabase Database type definitions.
 *
 * These types mirror the SQL schema and give us type-safe queries.
 * Generated structure follows Supabase's Database type convention.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          meals_per_day: number;
          auto_threshold_cents: number;
          subscription_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          meals_per_day?: number;
          auto_threshold_cents?: number;
          subscription_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          meals_per_day?: number;
          auto_threshold_cents?: number;
          subscription_mode?: boolean;
          updated_at?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          items: Json;
          offset_cents: number;
          logged_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          items: Json;
          offset_cents: number;
          logged_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          items?: Json;
          offset_cents?: number;
          logged_at?: string;
        };
      };
      donations: {
        Row: {
          id: string;
          user_id: string;
          amount_cents: number;
          donated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_cents: number;
          donated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_cents?: number;
          donated_at?: string;
        };
      };
      challenges: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          meals_per_day: number;
          ended_at: string | null;
          completed: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          meals_per_day: number;
          ended_at?: string | null;
          completed?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          meals_per_day?: number;
          ended_at?: string | null;
          completed?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
