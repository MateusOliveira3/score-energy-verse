# 004 - Backend Contracts

## Objective

Introduce a backend integration contract layer for the MVP journey so the frontend can keep the
same user flow while the data boundary becomes ready for future real providers such as Supabase, a
custom API, or Google-based services.

This branch does not introduce a real backend provider yet. It creates the service boundary that a
real provider can implement later.

## Service Boundary Created

The new service boundary lives in `src/services/mvpJourney/`.

Main files:

- `contracts.ts`
  - backend-facing operation contracts and entity aliases
- `localAdapter.ts`
  - current local implementation of the contract
- `index.ts`
  - service entry point used by the frontend

The existing storage-specific code remains in `src/lib/mvpPersistence.ts`, but it is now consumed
through the local adapter instead of directly by the frontend hook.

## Contracts Introduced

The service contract now defines backend-facing shapes for:

- `JourneyProfileContract`
- `JourneyMascotContract`
- `JourneyAnalysisContract`
- `JourneyScoreEventContract`
- `JourneyActionsContract`
- `JourneyStateContract`

And the following operations:

- `loadJourneyState`
- `saveJourneyState`
- `saveProfile`
- `saveMascot`
- `saveAnalysis`
- `appendScoreEvent`
- `saveActions`

These operations return the normalized root journey state so the frontend can keep one coherent
source of truth after each interaction.

## Local Adapter Role

`localAdapter.ts` is the current provider implementation.

Its job is to:

- satisfy the backend contract interface
- use the existing local persistence layer underneath
- translate service calls into local load/save operations
- preserve current MVP behavior while hiding storage details from the frontend

This means the app behaves exactly like before from the user perspective, but the persistence
mechanism is now behind a replaceable adapter.

## Frontend Integration

`useMvpJourney` now talks to the service layer through `getMvpJourneyService()`.

Current flow:

1. The hook loads the journey through `loadJourneyState`.
2. The hook applies journey rules and state transitions through provider-agnostic state helpers.
3. The hook persists the resulting root state through `saveJourneyState`.

This keeps the frontend focused on journey behavior while the adapter decides how and where the
state is stored.

## Supporting State Module

Pure journey-state logic now lives in `src/lib/mvpJourneyState.ts`.

That module owns:

- defaults
- normalization
- migration-friendly shape handling
- pure state transitions such as profile, mascot, analysis, score-event, and action updates

This separation is important because future backend adapters should not need to own or duplicate
frontend state rules.

## How This Prepares Real Backend Integration

This branch prepares the project for real backend work because:

- the frontend now depends on a service interface instead of a storage implementation
- the local adapter already behaves like a provider implementation
- the contract names map directly to future API or database operations
- the root journey state can still be loaded and saved coherently
- provider replacement can happen inside `src/services/mvpJourney/` without rewriting the UI flow

## What Is Still Local or Mocked

- journey persistence still resolves to localStorage through the local adapter
- invoice interpretation is still deterministic mock logic
- analysis generation is still local rule-based logic
- score rules are still local event-based logic
- auth fallback and invoice history behavior outside the MVP journey are unchanged

## Recommended Next Backend Branch

`feat/journey-provider-supabase-adapter`

Recommended focus for that branch:

- implement a second adapter that satisfies the same `MvpJourneyService` contract
- map journey entities to real persisted records
- decide how to split root-state saves versus entity-specific saves
- keep the local adapter available as development fallback until the new provider is stable
