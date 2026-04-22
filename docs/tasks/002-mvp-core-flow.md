# 002 - MVP Core Flow

## Objective of This Branch

Implement the first connected Score Energy MVP loop where profile context, invoice upload, analysis summary, mascot guidance, score updates, and next actions work as one visible journey.

This branch focuses on coherence and traceability instead of technical complexity.

## What Was Implemented

### Follow-up fixes on profile and mascot state

- Profile saving now writes a full profile object back into the central journey state.
- Stored profile data is normalized when the journey is restored, which avoids partial or stale field values after reload.
- Mascot customization was moved into the same persisted journey state used by the MVP flow.
- Reload now restores mascot name, emoji, color palette, and border effect from localStorage.

### Modal usability polish

- Profile and mascot modals received focused usability improvements without changing flow logic.
- Labels, inputs, selects, and option groups now have stronger contrast and clearer spacing.
- Selected states in mascot options are now more visually obvious through stronger borders, background highlights, and rings.

### 1. Profile context became part of the journey

- The existing profile structure is now read by the core flow instead of living only as isolated local UI state.
- Profile data is stored in local browser storage through the MVP journey hook.
- Profile completion now feeds:
  - mascot guidance
  - deterministic invoice interpretation
  - score events
  - next actions

### 2. Invoice upload now leads into a deterministic journey

- The current upload UI was kept.
- Random invoice values were removed.
- A deterministic interpretation function now produces stable invoice output from:
  - file metadata
  - profile context
  - simple placeholder rules
- Upload now transitions into analysis even if remote persistence fails.

### 3. Visible analysis summary was added

- After upload, the UI now shows:
  - estimated consumption level
  - bill cost signal
  - one or two practical observations
  - what matters next
- The summary stays intentionally simple and non-technical.

### 4. Mascot guidance is now contextual

- A new mascot guidance card renders rule-based guidance text.
- Guidance reacts to the current journey state:
  - onboarding
  - before upload
  - upload completed
  - analysis ready
  - return visit
- Guidance references profile and invoice context when available.

### 5. Score logic is now event-based

- Score updates no longer depend on a single hidden bonus calculation.
- The branch now records explicit score events for:
  - profile completion
  - invoice upload
  - analysis completion
  - reviewing a prioritized next action
- The UI now exposes recent score events so changes are easier to explain.

### 6. Next actions are now prioritized and limited

- The recommendation area was reworked into a focused next-actions panel.
- The system shows up to 3 actions only.
- Actions are derived from the current analysis and profile context.

## What Remains Mocked

- Invoice extraction is still mocked. It is deterministic, but it is not OCR.
- Profile persistence is local browser storage only.
- Score persistence is local browser storage only.
- Analysis logic is rule-based and intentionally simple.
- Mascot guidance is rule-based and not backed by an AI service.
- Remote invoice saving still depends on the existing Supabase hooks and may fail independently from the local MVP journey.

## Local Development Fallback

Because the current development environment may not define Supabase environment variables, the app now supports a temporary local fallback mode instead of throwing during startup.

Current fallback behavior:

- the app boots even when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing
- auth uses a lightweight local browser-based mock flow
- invoices can be stored and removed locally in the browser for MVP testing
- the core MVP journey remains testable without backend setup

This was needed so the branch could be exercised locally while keeping future Supabase integration intact.

## How the Data Currently Flows

1. The user completes or edits profile context.
2. `useMvpJourney` stores that profile locally and checks whether profile completion should create a score event.
3. The user uploads a bill through the existing upload component.
4. Upload starts the `invoice-uploaded` journey state.
5. A deterministic invoice interpretation is created from file metadata plus profile context.
6. The same interpreted invoice is used to:
   - save invoice data remotely when possible
   - generate local analysis summary
   - generate local next actions
   - update local mascot guidance
   - append score events
7. The page renders:
   - profile context
   - analysis summary
   - mascot guidance
   - score state
   - prioritized next actions

Profile and mascot customization now persist through the same localStorage journey payload, so both are restored from one central source of truth on reload.

## Score Event Logic Used

Current MVP score events:

- `profile_completed`: +80
- `invoice_uploaded`: +120
- `analysis_completed`: +100
- `action_viewed`: +30

Current score behavior:

- score is the sum of recorded events
- level is derived from score in 200-point bands
- duplicate events are prevented by event id
- repeated uploads of the same file fingerprint do not keep stacking the same upload and analysis events

## Mascot Guidance Logic Used

Current MVP guidance rules:

- `onboarding`
  - shown when profile context is still incomplete
- `before-upload`
  - shown when profile context is ready enough and the next useful step is bill upload
- `invoice-uploaded`
  - shown while the upload step is transitioning into the summary
- `analysis-ready`
  - shown after analysis exists and can point to what matters next
- `return-visit`
  - shown when saved local journey data exists and the user returns after inactivity

Guidance uses:

- consumer type
- location when available
- latest invoice
- latest analysis summary

## Known Limitations

- The branch does not persist profile, score, or analysis to a backend yet.
- Without Supabase configuration, auth and invoice history run in local browser fallback mode only.
- The flow is centered on the latest invoice, not a true monthly history comparison.
- Invoice history still depends on the existing Supabase hook rather than the new journey state.
- Some older dashboard widgets remain outside the new journey engine and are not yet refactored into the same model.
- Build verification could not be completed in this environment because project dependencies are not installed locally.

## State Sync Fix Note

What caused the issue:

- mascot customization still lived in isolated page state
- restored journey data was not normalized before reuse
- profile save handling relied on component-local state without an explicit full-object handoff

How state is now persisted:

- profile writes through `useMvpJourney`
- mascot customization writes through `useMvpJourney`
- both are saved in the same localStorage journey payload
- reload restores both from the same persisted journey state

## Recommended Next Branch

`feat/mvp-persistence-layer`

Recommended focus for that branch:

- persist profile context safely
- persist score events or score snapshots
- persist local analysis metadata
- connect invoice history and summary views to the same stored journey model
