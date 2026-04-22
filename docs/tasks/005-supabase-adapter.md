# 005 - Supabase Adapter

## Objective

Implement a Supabase-backed provider for the MVP journey without breaking the existing backend
contract layer or coupling the frontend to Supabase directly.

This branch adds a new adapter implementation while keeping the local adapter as the default and
safe fallback.

## Schema Used

Current MVP schema uses one main table:

`mvp_journey_state`

Columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id text not null`
- `state jsonb not null`
- `updated_at timestamptz not null`
- `created_at timestamptz not null`

Recommended SQL shape:

```sql
create table if not exists public.mvp_journey_state (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);
```

The adapter stores the full `MvpState` JSON in `state` for the MVP.

## Adapter Behavior

New files:

- `src/services/mvpJourney/supabaseAdapter.ts`
- `src/services/mvpJourney/supabaseClient.ts`

The Supabase adapter implements the same contract as the local adapter:

- `loadJourneyState`
- `saveJourneyState`
- `saveProfile`
- `saveMascot`
- `saveAnalysis`
- `appendScoreEvent`
- `saveActions`

Behavior details:

- loads the latest row for the resolved user id
- normalizes JSON before returning it to the app
- returns default local journey state if no row exists
- updates the latest row when one already exists
- inserts a new row when one does not exist yet
- keeps the full state JSON as the persisted payload for now

## How To Switch Providers

Service selection still happens in `src/services/mvpJourney/index.ts`.

Provider choices:

- `local`
- `supabase`

Environment flag:

- `VITE_MVP_JOURNEY_PROVIDER=supabase`

Current selection rule:

- default is `local`
- `supabase` is used only when the provider flag requests it and Supabase env vars are configured
- otherwise the app stays on the local adapter

Supabase env vars used by the adapter-internal client:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Developer note:

- use the project root URL, for example `https://your-project.supabase.co`
- do not append `/rest/v1/` to `VITE_SUPABASE_URL`
- use the browser publishable key, not a secret key

## Limitations

- no auth integration yet
- the adapter falls back to a mock user id when no user id is provided
- the full `MvpState` is stored as one JSON blob instead of normalized records
- row selection is still simple MVP logic based on the latest record for the user
- local adapter remains the default provider

## Why This Is Safe

- components do not import Supabase
- hooks do not import Supabase
- the frontend still talks only to the journey service boundary
- local provider behavior remains available and unchanged by default

## Recommended Next Step

`feat/journey-provider-supabase-auth-and-migrations`

Recommended focus:

- add authenticated user id resolution
- create tracked SQL migrations for the journey table
- decide whether to keep blob storage or split entities over time
- add provider-level tests for local and Supabase adapters
