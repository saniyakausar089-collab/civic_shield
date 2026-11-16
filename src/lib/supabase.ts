import { createClient } from "@supabase/supabase-js";

// Read from Vite environment variables with graceful fallback to provided project credentials
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://trrggaiakntmikkbazbd.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_OydP5ykoZ55JWzEzq0tVxQ_VlYqdSMX";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Synchronous check whether a valid Supabase auth token exists in browser localStorage
 */
export function hasStoredSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("sb-") || key.includes("supabase.auth")) &&
        key.endsWith("-auth-token")
      ) {
        const val = localStorage.getItem(key);
        if (val && val.includes("access_token")) {
          return true;
        }
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole =
  | "admin"
  | "incident_commander"
  | "lead_engineer"
  | "analyst"
  | "observer";

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
  organization?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SimulationRunRecord {
  id?: string;
  user_id?: string | null;
  scenario_id: string;
  scenario_name: string;
  trigger_nodes: string[];
  affected_pop_hours: number;
  peak_affected_pop: number;
  hospital_downtime_h: number;
  final_failed_count: number;
  failed_asset_ids: string[];
  timeline_frames?: any;
  created_at?: string;
}

export interface IncidentReportRecord {
  id?: string;
  user_id?: string | null;
  scenario_id: string;
  title: string;
  facts: Record<string, any>;
  narrative: string;
  verified: boolean;
  source: string;
  model?: string;
  created_at?: string;
}

/**
 * Fetch user profile from public.profiles table
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch profile from Supabase:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Profile fetch error:", err);
    return null;
  }
}

/**
 * Upsert user profile in public.profiles table
 */
export async function upsertProfile(profile: Partial<Profile> & { id: string; email: string }): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          ...profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.warn("Could not upsert profile:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Profile upsert error:", err);
    return null;
  }
}

/**
 * Save a completed simulation run to Supabase
 */
export async function saveSimulationRun(run: SimulationRunRecord): Promise<SimulationRunRecord | null> {
  try {
    const { data, error } = await supabase
      .from("simulation_runs")
      .insert([run])
      .select()
      .single();

    if (error) {
      console.warn("Could not save simulation run to Supabase:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Simulation run save error:", err);
    return null;
  }
}

/**
 * Save an AI-generated forensic incident report to Supabase
 */
export async function saveIncidentReport(report: IncidentReportRecord): Promise<IncidentReportRecord | null> {
  try {
    const { data, error } = await supabase
      .from("incident_reports")
      .insert([report])
      .select()
      .single();

    if (error) {
      console.warn("Could not save incident report to Supabase:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Incident report save error:", err);
    return null;
  }
}

