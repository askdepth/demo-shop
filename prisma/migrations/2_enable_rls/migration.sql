-- Enable Row-Level Security on every table in the public schema.
--
-- Supabase exposes the public schema through PostgREST. Without RLS anyone with the
-- project URL and the (public) anon key can read/modify/delete every row. This app
-- never uses the Supabase REST API: all access goes through Prisma, which connects
-- as the `postgres` role (BYPASSRLS), so enabling RLS with NO policies denies the
-- REST API entirely and leaves the app unaffected.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END
$$;

-- Defence in depth: also remove API-role privileges (these roles only exist on Supabase).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
  END IF;
END
$$;
