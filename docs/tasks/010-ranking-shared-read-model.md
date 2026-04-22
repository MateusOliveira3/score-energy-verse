# 010 - Ranking Shared Read Model

## Objective

Create a dedicated shared ranking read model so the frontend can show a real multi-user leaderboard
without exposing the private `public.mvp_journey_state` JSON blob.

## Why The Shared Read Model Exists

`public.mvp_journey_state` is intentionally private and user-scoped through RLS.

That is the right security model for the full MVP journey payload, but it prevents the browser from
reading other users' progress directly for leaderboard purposes.

The shared read model solves that by exposing only safe derived fields through a dedicated table:

- public display label
- score
- level
- lightweight consumer context
- update timestamp

The app still never reads other users' private journey JSON.

## Table Shape

Table:

- `public.ranking_entries`

Columns:

- `user_id text primary key`
- `display_name text not null`
- `score integer not null default 0`
- `level integer not null default 1`
- `consumer_type text`
- `updated_at timestamptz not null default timezone('utc', now())`

Only leaderboard-safe fields are stored here.

## Policy Strategy

RLS is enabled and forced on `public.ranking_entries`.

Policies:

- authenticated users can `select` leaderboard rows
- authenticated users can `insert` only their own row
- authenticated users can `update` only their own row

Ownership rule for writes:

- `auth.uid()::text = user_id`

This keeps the private journey table protected while allowing a shared leaderboard read path.

## Write And Update Strategy

Chosen MVP tradeoff:

- the browser may upsert the current user's own `ranking_entries` row
- this happens inside the existing Supabase journey persistence adapter after a successful journey save
- the row is derived from the already persisted journey state, not from component-level Supabase code

Why this was chosen:

- it is practical for the MVP
- it keeps Supabase isolated in adapter code
- it keeps the shared read model fresh as users progress through the journey
- it does not weaken `mvp_journey_state`

Migration behavior:

- the SQL migration also backfills existing ranking rows from the latest `mvp_journey_state` row per user
- only rows with score greater than zero are inserted into the shared leaderboard

## Supabase Ranking Behavior Now

In Supabase mode the ranking adapter now reads from `public.ranking_entries`, not from other users'
private journey rows.

This means:

- the leaderboard can show real multi-user entries
- the current user is still highlighted and positioned in the shared ranking
- the shared page no longer depends on cross-user access to `mvp_journey_state`

## Limitations

- leaderboard derivation is still performed client-side on each user's own save path
- an authenticated user can still tamper with their own public ranking row if they tamper with their own browser requests
- integrity is therefore still MVP-grade and not yet backed by a server-side trusted derivation flow
- old users who never trigger another save after migration rely on the migration backfill snapshot until they update again

## Next Recommended Branch

`feat/ranking-server-side-sync-hardening`

Recommended focus:

- move ranking row derivation into a trusted backend flow or database-side sync path
- add validation rules for allowed display labels and derived score updates
- decide whether ranking updates should come from SQL triggers, Edge Functions, or a protected server path
