# Score Energy User Journey

## Journey Goal

The core journey of Score Energy is:

1. attract a user with a clear promise
2. collect enough context to personalize guidance
3. use the electricity bill as the main analysis trigger
4. translate analysis into actions
5. keep the user engaged through score, level, and follow-up guidance

This document describes the target user flow for the MVP while staying aligned with the long-term platform vision.

## Journey Overview

The MVP should support this sequence:

1. Landing
2. Signup or login
3. Profile setup
4. Invoice upload
5. Analysis
6. Mascot guidance
7. Score evolution
8. Next actions

## 1. Landing

### User need

The user wants to quickly understand what Score Energy does and why it is worth trying.

### MVP experience

The landing page should communicate:

- "upload your bill and understand your energy use"
- "receive simple recommendations"
- "track your progress with score and level"
- "get guidance from a recurring assistant"

The landing experience should reduce uncertainty and make the first action obvious.

### Primary CTA

The main CTA should push the user toward account creation and eventual bill upload.

## System State Evolution

This section describes the practical MVP system state that should be created, updated, or checked as the user moves through the journey.

The purpose is not to define a final data model. The purpose is to make future engineering work explicit about what the product must remember between steps.

### Landing

At landing, the system should mainly track anonymous session context and entry intent.

Useful MVP state includes:

- visit source or campaign context when available
- whether the user has already seen the landing experience
- CTA clicks that indicate intent to start signup

This step does not need heavy persistence, but it is useful for understanding activation flow.

### Signup or Login

At signup or login, the system should establish identity and access state.

Useful MVP state includes:

- user account record
- authentication status
- first access timestamp
- last login timestamp
- whether onboarding has started

This is the point where the journey becomes personalized.

### Profile Setup

At profile setup, the system should store the minimum context needed for later personalization.

Useful MVP state includes:

- consumer type
- location
- property size
- people or employee count
- energy preference when collected
- profile completion status

The MVP should treat profile completion as editable state, not a one-time form.

### Invoice Upload

At invoice upload, the system should create a bill record and track processing state.

Useful MVP state includes:

- uploaded file reference when storage is enabled
- upload timestamp
- file processing status
- extracted invoice fields used by the MVP
- association between the invoice and the authenticated user

The system should clearly separate "file received," "file processed," and "analysis available."

### Analysis

At analysis, the system should persist the result that will drive recommendations and guidance.

Useful MVP state includes:

- analysis completion status
- key consumption summary values
- top findings selected for display
- recommendation set generated for that invoice
- timestamp of the latest completed analysis

This allows the product to show the same result consistently across sessions.

### Score Evolution

At score evolution, the system should record both current value and why it changed.

Useful MVP state includes:

- current score
- current level
- score events tied to user actions
- last score update timestamp
- basic progress history over time

Even in the MVP, score changes should be traceable enough to explain them later.

### Next Actions

At the next actions step, the system should store a short, active set of recommendations rather than an unlimited list.

Useful MVP state includes:

- current prioritized actions
- action status such as new, viewed, started, or completed
- action source such as profile-based or invoice-based
- last action refresh timestamp

The MVP should treat next actions as a focused working list, not as a broad content feed.

## 2. Signup or Login

### User need

The user needs a fast and low-friction way to enter the product.

### MVP experience

The product should support:

- new account creation
- returning user login
- simple recovery path for access issues

At this stage, signup should ask only for what is needed to establish identity and access. It should not overload the user with energy-specific questions too early.

## 3. Profile Setup

### User need

The system needs enough context to make later analysis and recommendations more relevant.

### MVP profile fields

The MVP can collect lightweight profile data such as:

- consumer type
- city or region
- property size
- number of people or employees
- energy preference or interest

### Why this step matters

This data helps frame future analysis and prevents one-size-fits-all guidance. It also lays the groundwork for fairness in scoring by acknowledging that different user types should not be judged by identical consumption expectations.

### Product constraint

Profile setup should feel helpful, not bureaucratic. It must stay short and support later editing.

## 4. Invoice Upload

### User need

The user wants the product to analyze real data, not generic assumptions.

### MVP experience

The bill upload step should:

- accept common bill formats such as PDF and image files
- clearly explain what will be extracted
- reassure the user that the upload is the source of personalized guidance
- provide visible processing feedback

### Product meaning

Invoice upload is the transition from generic onboarding to personalized product value. It is the most important activation step in the MVP.

## 5. Analysis

### User need

The user wants the bill translated into simple, meaningful conclusions.

### MVP analysis output

The MVP should focus on a practical summary rather than advanced diagnostics. The analysis should answer:

- how much energy was consumed
- whether the bill suggests inefficient patterns
- which observations matter most right now
- what the user can do next

### Product constraint

The analysis must stay understandable. If the system exposes too much raw detail too early, the user loses trust and momentum.

## 6. Mascot Guidance

### User need

The user needs a friendly layer that makes the product feel guided rather than mechanical.

### MVP role in the journey

The mascot should:

- explain what is happening during onboarding
- encourage bill upload before analysis exists
- summarize insights after upload
- point the user toward the next best action

The mascot should reduce friction, not compete with the core content.

### Mascot Trigger Logic (MVP)

In the MVP, the mascot should act at a small number of predictable moments tied to user progress.

Recommended trigger moments:

- during onboarding, when the user first enters the authenticated product
- before invoice upload, to explain why upload is the next important step
- during upload or processing, to confirm what the system is doing
- after upload and after analysis, to summarize the result and point to the next best action
- after inactivity or return visit, to help the user resume the journey without confusion

The mascot should not trigger on every screen interaction. In the MVP, it should appear when context-setting or next-step guidance meaningfully improves user clarity.

## 7. Score Evolution

### User need

The user needs proof that progress is happening over time, not just in a single session.

### MVP scoring behavior

The score should evolve through:

- completing foundational steps such as profile completion and bill upload
- engaging with recommended actions
- showing signs of efficient behavior
- improving over time relative to the user's own baseline

### Score Inputs (MVP)

For the MVP, the first score inputs should be concrete and observable.

Recommended practical inputs:

- completing profile setup
- uploading an invoice successfully
- viewing or engaging with recommended actions
- returning to the platform in a later session
- showing signs of progress over time based on repeated invoices or completed actions

These inputs should be implemented as explicit score events or checkpoints, even if the underlying scoring logic remains simple.

### Why it matters

The score creates continuity between monthly bill cycles. It helps users come back because they are not only checking data, they are advancing in a journey.

## 8. Next Actions

### User need

The user wants a short list of realistic next steps, not an overwhelming catalog.

### MVP action model

After analysis, the product should present a limited set of prioritized actions, such as:

- simple behavior changes
- quick efficiency upgrades
- follow-up tasks for the next bill cycle

These actions should be clearly tied to:

- expected benefit
- effort level
- possible score gain

The MVP should show only a small number of prioritized actions at once, preferably up to 3. This constraint is important so the product remains actionable and does not overwhelm the user immediately after analysis.

## MVP Journey Summary

In the MVP, the core loop should be:

1. user enters through the landing page
2. user creates an account
3. user adds minimal profile context
4. user uploads a bill
5. product generates simple analysis
6. mascot explains what it means
7. user receives prioritized actions
8. score and level reflect progress

This is enough to validate the central experience without requiring the full future ecosystem.

## Long-Term Journey Extension

After the MVP proves the core loop, the journey can expand toward:

- recurring monthly tracking
- richer comparisons over time
- consultant referrals for complex cases
- company or provider matches for concrete solutions
- ecosystem interactions mediated by Score Energy

The key rule is that long-term expansion must strengthen the core journey, not distract from it.
