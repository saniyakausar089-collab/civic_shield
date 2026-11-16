-- ==============================================================================
-- CIVICSHIELD URBAN RESILIENCE PLATFORM
-- Supabase PostgreSQL Database Schema
-- Project: trrggaiakntmikkbazbd (https://trrggaiakntmikkbazbd.supabase.co)
-- ==============================================================================

-- 1. Enable UUID Extension (standard in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. TABLE: public.profiles
-- Linked to Supabase Auth (auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'analyst' 
        CHECK (role IN ('admin', 'incident_commander', 'lead_engineer', 'analyst', 'observer')),
    organization TEXT DEFAULT 'Hyderabad Civic Resilience Command',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast user email and role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ------------------------------------------------------------------------------
-- 3. TABLE: public.simulation_runs
-- Stores recorded cascade simulations from the Simulate tab
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scenario_id TEXT NOT NULL,
    scenario_name TEXT NOT NULL,
    trigger_nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_pop_hours BIGINT NOT NULL DEFAULT 0,
    peak_affected_pop INTEGER NOT NULL DEFAULT 0,
    hospital_downtime_h NUMERIC NOT NULL DEFAULT 0,
    final_failed_count INTEGER NOT NULL DEFAULT 0,
    failed_asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    timeline_frames JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sim_runs_user ON public.simulation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_runs_scenario ON public.simulation_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_sim_runs_created_at ON public.simulation_runs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. TABLE: public.incident_reports
-- Stores forensic AI and template reports generated from the Report tab
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scenario_id TEXT NOT NULL,
    title TEXT NOT NULL,
    facts JSONB NOT NULL DEFAULT '{}'::jsonb,
    narrative TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    source TEXT NOT NULL DEFAULT 'gemini',
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON public.incident_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_scenario ON public.incident_reports(scenario_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.incident_reports(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. TABLE: public.response_plans
-- Stores evaluated response playbooks & mitigation plans
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.response_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    scenario_id TEXT NOT NULL,
    score NUMERIC NOT NULL DEFAULT 0,
    delta_pop_hours BIGINT NOT NULL DEFAULT 0,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_plans_scenario ON public.response_plans(scenario_id);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON public.response_plans(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. TABLE: public.user_preferences
-- Saves HUD and 3D GIS state (Cesium/Three.js mode, place labels, day/night)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    viewport_mode TEXT NOT NULL DEFAULT 'cesium' CHECK (viewport_mode IN ('cesium', 'three')),
    show_place_labels BOOLEAN NOT NULL DEFAULT FALSE,
    day_night TEXT NOT NULL DEFAULT 'night' CHECK (day_night IN ('day', 'night')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. AUTOMATIC USER PROFILE PROVISIONING TRIGGER
-- Automatically creates a public.profiles row upon auth.users signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, organization)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'analyst'),
        COALESCE(new.raw_user_meta_data->>'organization', 'Hyderabad Civic Resilience Command')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on every new Supabase Auth registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Protects data so operators access their own records while allowing team sharing
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can view all profiles; users can only edit their own
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Simulation Runs: Viewable by authenticated users; users can manage their own
CREATE POLICY "Simulation runs are viewable by authenticated users"
    ON public.simulation_runs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create simulation runs"
    ON public.simulation_runs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own simulation runs"
    ON public.simulation_runs FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Incident Reports: Viewable by authenticated users; users can insert reports
CREATE POLICY "Incident reports viewable by authenticated users"
    ON public.incident_reports FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create incident reports"
    ON public.incident_reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Response Plans: Viewable by authenticated users; users can create plans
CREATE POLICY "Response plans viewable by authenticated users"
    ON public.response_plans FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can save response plans"
    ON public.response_plans FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- User Preferences: Users can only see and update their own preferences
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own preferences"
    ON public.user_preferences FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

