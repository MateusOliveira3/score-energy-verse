# 009 - Ranking Real Users

## Objective

Replace the `/ranking` placeholder with a real MVP ranking experience backed by persisted journey
data without breaking the current journey flow or bypassing the service and adapter architecture.

## Ranking Data Source Used

The first ranking version uses the current persisted MVP journey state as its source of truth.

Derived fields:

- `score` from persisted `scoreEvents`
- `level` from the existing score calculation rule
- profile context from persisted `profile`
  - `consumerType`
  - `location`
  - `energyPreference`

Only journeys with at least one score event are included. This keeps the ranking meaningful and
avoids listing empty persisted rows that have no real progress yet.

## Service Path

The implementation keeps ranking isolated from the existing journey hook.

New path:

- `src/services/ranking/contracts.ts`
- `src/services/ranking/index.ts`
- `src/services/ranking/localAdapter.ts`
- `src/services/ranking/supabaseAdapter.ts`
- `src/hooks/useRanking.ts`

This mirrors the current service plus adapter approach:

- local provider reads persisted MVP journey rows from browser storage
- Supabase provider reads the current user's persisted MVP journey row

Components still do not import Supabase directly.

## Security Limitations

Current RLS on `public.mvp_journey_state` is user-scoped:

- authenticated users can read only rows where `auth.uid()::text = user_id`

Because of that, the browser cannot safely build a real cross-user leaderboard directly from the
same table in secured mode.

Under the current model, the ranking page in Supabase mode therefore shows:

- real persisted ranking data for the current user
- current visible position inside the accessible dataset
- an explicit limitation message explaining why the shared leaderboard is not yet available

This is intentional and does not weaken the current security assumptions.

## Fallback Behavior When Cross-User Ranking Is Restricted

### Local provider

- ranking can aggregate all locally persisted MVP journeys visible in the same browser
- this provides a shared development and demo experience when multiple local journeys exist

### Supabase provider with current RLS

- ranking falls back to the authenticated user's own persisted journey row
- no fake users or synthetic leaderboard entries are shown
- the page clearly explains that shared ranking requires additional backend setup

## Next Recommended Step

Create a secure shared ranking read model in Supabase, for example:

- a minimal public leaderboard table updated from journey state
- or a read-only RPC / view that exposes only safe ranking fields

Recommended next branch:

`feat/ranking-shared-read-model`
