# 006 - MVP Invoice Flow Unification

## Objective

Unify the main MVP invoice experience so the dashboard no longer depends on the legacy invoices
module, the `public.invoices` table, or the `invoices` storage bucket.

The main flow now relies on the journey state only.

## Legacy Dependency Removed

The main MVP dashboard no longer depends on:

- `useInvoices.ts`
- `public.invoices`
- the `invoices` storage bucket

This removal applies to the primary invoice upload and invoice history experience shown in the MVP
dashboard.

## How Invoice-Related MVP Data Flows Now

Invoice-related data now stays inside `MvpState`.

Current flow:

1. The user uploads a file through the existing MVP upload component.
2. The upload flow interprets the file deterministically for the MVP.
3. `useMvpJourney` stores:
   - `analysis.latestInvoice`
   - `analysis.invoiceHistory`
   - `analysis.summary`
   - `actions.items`
   - `scoreEvents`
4. The service layer persists the full journey through the active provider.
5. Reload restores the same invoice-related state from `mvp_journey_state` or the local adapter.

## What Is Still Mocked

- invoice extraction is still deterministic mock logic, not OCR
- the uploaded file itself is not stored remotely
- invoice history is still a lightweight MVP list inside the journey blob
- score behavior is still driven by simple event rules
- analysis remains rule-based

## What Can Be Normalized Later

Later backend work can normalize:

- invoice records into a dedicated table
- uploaded files into a storage bucket
- analysis history into per-invoice records
- score events into append-only backend records
- relationships between journey state and a real invoice timeline

For the MVP, keeping invoice-related data inside `MvpState` keeps the flow coherent and avoids
requiring infrastructure that does not exist in the new Supabase project yet.
