# 007 - Journey Auth User Binding

## Objective

Bind the MVP journey state to a resolved user identity instead of relying on a hardcoded mock
identifier inside the adapter layer.

This keeps the current journey service boundary intact while making journey persistence explicitly
user-scoped.

## Identity Strategy

Journey identity is now resolved in one place before the provider is called.

Resolution order:

1. authenticated user id from the existing auth context
2. local auth fallback user id when the app is running in local auth mode
3. stable development fallback identity stored in local browser storage when no user exists yet

The adapter no longer invents the critical-path fallback user id on its own.

## Authenticated vs Fallback Behavior

### Authenticated

- when a real authenticated user exists, `user.id` is used directly
- Supabase and local journey adapters both persist against that resolved id

### Local Auth Fallback

- when the existing local auth mode produces a mock user, the mock user id is still used
- this preserves current MVP behavior while making the fallback explicit

### Development Fallback

- when no user session exists yet, the app creates or reuses a stable local fallback identity
- this fallback is stored in local browser storage and clearly marked as development-only

## Files Changed

- `src/lib/journeyIdentity.ts`
- `src/hooks/useJourneyIdentity.ts`
- `src/hooks/useMvpJourney.ts`
- `src/services/mvpJourney/supabaseAdapter.ts`

## Limitations

- auth is still not fully unified across every feature area
- development fallback identity is still browser-local
- the journey state still persists as one JSON blob
- adapters still accept optional `userId` at the contract level for compatibility, even though the
  main journey flow now resolves identity explicitly before calling them

## Next Recommended Branch

`feat/journey-user-migration-and-merge`

Recommended focus:

- define how to migrate or merge development fallback journey state into a real authenticated user
- add explicit ownership rules and row-level policies in Supabase
- consider surfacing identity diagnostics for development builds only
