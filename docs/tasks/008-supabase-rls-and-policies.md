# 008 - Supabase RLS And Policies

## Objective

Prepare `public.mvp_journey_state` for safer per-user Supabase access by defining the intended Row
Level Security model and keeping the app code compatible with that secured mode.

## Intended Access Model

Secured mode should work like this:

- browser app uses the publishable key only
- each authenticated user can read only their own journey rows
- each authenticated user can insert only their own journey rows
- each authenticated user can update only their own journey rows
- there should be no broad public read or write policy in the intended production-like mode

The ownership rule is:

- `auth.uid()::text = user_id`

This matches the current journey schema, where `user_id` is stored as text.

## SQL Needed

The RLS-ready migration for the MVP journey table is in:

- `supabase/migrations/20260422_mvp_journey_state_rls.sql`

Main SQL shape:

```sql
alter table public.mvp_journey_state enable row level security;
alter table public.mvp_journey_state force row level security;

create policy "mvp_journey_state_select_own"
on public.mvp_journey_state
for select
to authenticated
using (auth.uid()::text = user_id);

create policy "mvp_journey_state_insert_own"
on public.mvp_journey_state
for insert
to authenticated
with check (auth.uid()::text = user_id);

create policy "mvp_journey_state_update_own"
on public.mvp_journey_state
for update
to authenticated
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);
```

## Development Fallback Behavior

Current journey identity resolution still supports:

- authenticated Supabase user ids
- local auth fallback ids
- development fallback ids

Important interaction with secured mode:

- authenticated Supabase users are compatible with the intended RLS model
- local auth fallback and development fallback identities are not compatible with strict Supabase
  RLS policies based on `auth.uid()`
- for those fallback modes, the local adapter should remain the practical development path

This means secure Supabase mode should be used when the app has a real Supabase-authenticated user
session. Otherwise, development should prefer the local adapter.

## App Compatibility Notes

App code changes in this branch were intentionally small.

The journey request context now carries identity metadata:

- `userId`
- `identitySource`
- `isFallbackIdentity`

The Supabase adapter uses that metadata only for clearer diagnostics. It does not leak Supabase
into components or hooks.

Current diagnostics behavior:

- warns when no resolved journey identity is provided
- warns when a fallback identity is used while Supabase secured mode is expected
- explains that RLS policies based on `auth.uid()::text = user_id` will block fallback identities

## Limitations

- this branch documents and prepares the secured model but does not rewrite auth
- local auth fallback mode still exists and is not RLS-compatible for Supabase
- development fallback identity is still browser-local
- the journey table still stores one JSON blob instead of normalized records

## Next Recommended Branch

`feat/supabase-authenticated-journey-session-hardening`

Recommended focus:

- ensure the main MVP flow consistently runs under a real Supabase auth session in secured mode
- add developer-facing provider guidance when fallback identities are active
- validate end-to-end RLS behavior with authenticated user sessions and policy tests
