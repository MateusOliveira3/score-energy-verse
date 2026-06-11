# 003 - MVP Persistence Layer

## Objective of This Branch

Introduce a clear persistence boundary for the MVP journey so profile context, mascot choices,
invoice analysis, score events, and next actions are stored through one structured module instead
of ad hoc local browser storage access.

## Data Model Structure

The MVP journey now persists one root object: `MvpState`.

### Root shape

- `profile`
  - minimum personalization context for the user journey
- `mascot`
  - mascot name, emoji, palette, and border effect
- `analysis`
  - explicit invoice-analysis state for the latest interpreted bill
- `scoreEvents`
  - append-only score event history used to derive score and level
- `actions`
  - prioritized next actions plus action-view state
- `journeyStage`
  - current visible stage in the MVP flow
- `lastActiveAt`
  - timestamp used to restore return-visit guidance

### Profile

`Profile` stores:

- `consumerType`
- `location`
- `propertySize`
- `peopleCount`
- `energyPreference`

### Mascot

`Mascot` stores:

- `name`
- `emoji`
- `colorPalette`
- `borderEffect`

### Analysis

`AnalysisState` stores:

- `status`
  - `idle`, `processing`, or `ready`
- `latestInvoice`
  - deterministic interpreted invoice payload
- `summary`
  - analysis summary used by the dashboard cards
- `lastCompletedAt`
  - timestamp of the latest completed analysis

### Score Events

`ScoreEvent` continues to store:

- `id`
- `type`
- `label`
- `points`
- `occurredAt`

This keeps the score traceable and leaves room for future backend event ingestion.

### Next Actions

`NextActionsState` stores:

- `items`
  - up to 3 prioritized actions
- `viewedActionIds`
  - simple working-state tracking for the MVP
- `lastUpdatedAt`
  - refresh timestamp for the current action set

Each `NextAction` can now also carry:

- `status`
- `source`

This remains lightweight, but it is closer to a backend-friendly action record.

## Persistence Strategy

Persistence now lives in `src/lib/mvpPersistence.ts`.

### What the module does

- defines versioned storage keys
- owns the default state for the journey
- normalizes stored data before reuse
- loads and saves one root journey object
- exposes state transition helpers such as:
  - `loadState()`
  - `saveState()`
  - `updateProfile()`
  - `updateMascot()`
  - `setAnalysis()`
  - `addScoreEvent()`
  - `updateActions()`

### Key structure

The current key format is:

- `score-energy:mvp-journey:v1:<user-id-or-anonymous>`

This is intentionally versioned so we can evolve the schema later without silently mixing payload
shapes.

### Migration behavior

The module also reads the previous MVP journey key:

- `score-energy-mvp-core-flow:<user-id-or-anonymous>`

If legacy state is found, it is normalized into the new `MvpState` shape, saved into the new key,
and the legacy key is removed.

## How Data Flows Now

The flow is now explicit:

1. `useMvpJourney` loads state through `loadState()`.
2. The hook updates the in-memory `MvpState` through persistence helpers.
3. A single save effect writes the normalized root object through `saveState()`.
4. On reload, `loadState()` rehydrates the full journey from the same source of truth.

This keeps storage concerns out of UI components and makes the journey state easier to reason
about.

## What Stayed the Same

- no UI changes were introduced
- no user-flow changes were introduced
- no backend was added
- invoice interpretation remains deterministic and local for the MVP
- score behavior remains event-based and user-visible

## Limitations

- persistence is still localStorage only
- the model is still centered on the latest invoice, not a full invoice timeline
- invoice history outside the MVP journey continues to use the existing invoice hook
- browser storage is still user-device specific and not cross-device

## Backend Readiness

This refactor prepares the MVP for backend integration because:

- the journey now has a single root state model
- storage keys are versioned
- normalization and migration live in one place
- state transitions are named and isolated
- score events and actions are structured enough to map to future tables or APIs

The next backend step can replace or augment `loadState()` and `saveState()` without rewriting the
UI flow itself.
