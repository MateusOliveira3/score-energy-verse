-- Shared MVP ranking read model
-- Purpose:
-- - keep public.mvp_journey_state private behind per-user RLS
-- - expose only safe leaderboard fields through public.ranking_entries
-- - allow authenticated users to read the leaderboard
-- - allow each authenticated user to upsert only their own derived ranking row

create table if not exists public.ranking_entries (
  user_id text primary key,
  display_name text not null,
  score integer not null default 0 check (score >= 0),
  level integer not null default 1 check (level >= 1),
  consumer_type text,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ranking_entries_score_updated_idx
  on public.ranking_entries (score desc, updated_at desc);

comment on table public.ranking_entries is
  'Shared leaderboard read model with safe derived fields only. Does not expose private journey JSON.';

comment on column public.ranking_entries.display_name is
  'Public-facing leaderboard label derived from the user journey profile context.';

comment on column public.ranking_entries.consumer_type is
  'Optional lightweight profile context shown in the leaderboard.';

with latest_journey_rows as (
  select distinct on (user_id)
    user_id,
    state,
    updated_at
  from public.mvp_journey_state
  order by user_id, updated_at desc
),
derived_ranking as (
  select
    user_id,
    case
      when coalesce(nullif(state #>> '{profile,location}', ''), '') <> '' then
        coalesce(nullif(state #>> '{profile,consumerType}', ''), 'Usuario') || ' em ' || (state #>> '{profile,location}')
      else
        'Usuario ' || left(user_id, 6)
    end as display_name,
    coalesce(
      (
        select sum(coalesce((event ->> 'points')::integer, 0))
        from jsonb_array_elements(coalesce(state -> 'scoreEvents', '[]'::jsonb)) as event
      ),
      0
    ) as score,
    coalesce(nullif(state #>> '{profile,consumerType}', ''), null) as consumer_type,
    updated_at
  from latest_journey_rows
)
insert into public.ranking_entries (
  user_id,
  display_name,
  score,
  level,
  consumer_type,
  updated_at
)
select
  user_id,
  display_name,
  score,
  greatest(1, floor(score / 200.0)::integer + 1) as level,
  consumer_type,
  updated_at
from derived_ranking
where score > 0
on conflict (user_id) do update
set
  display_name = excluded.display_name,
  score = excluded.score,
  level = excluded.level,
  consumer_type = excluded.consumer_type,
  updated_at = excluded.updated_at;

alter table public.ranking_entries enable row level security;

alter table public.ranking_entries force row level security;

drop policy if exists "ranking_entries_select_authenticated" on public.ranking_entries;
create policy "ranking_entries_select_authenticated"
on public.ranking_entries
for select
to authenticated
using (true);

drop policy if exists "ranking_entries_insert_own" on public.ranking_entries;
create policy "ranking_entries_insert_own"
on public.ranking_entries
for insert
to authenticated
with check (auth.uid()::text = user_id);

drop policy if exists "ranking_entries_update_own" on public.ranking_entries;
create policy "ranking_entries_update_own"
on public.ranking_entries
for update
to authenticated
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);
