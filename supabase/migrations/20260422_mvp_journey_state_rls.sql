-- MVP journey state RLS baseline
-- Intended secured mode:
-- - browser uses publishable key only
-- - each authenticated user can select/insert/update only their own rows
-- - policies rely on auth.uid()::text = user_id

alter table public.mvp_journey_state enable row level security;

alter table public.mvp_journey_state force row level security;

drop policy if exists "mvp_journey_state_select_own" on public.mvp_journey_state;
create policy "mvp_journey_state_select_own"
on public.mvp_journey_state
for select
to authenticated
using (auth.uid()::text = user_id);

drop policy if exists "mvp_journey_state_insert_own" on public.mvp_journey_state;
create policy "mvp_journey_state_insert_own"
on public.mvp_journey_state
for insert
to authenticated
with check (auth.uid()::text = user_id);

drop policy if exists "mvp_journey_state_update_own" on public.mvp_journey_state;
create policy "mvp_journey_state_update_own"
on public.mvp_journey_state
for update
to authenticated
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

comment on table public.mvp_journey_state is
  'MVP journey state stored as a jsonb blob and scoped per user through RLS.';
