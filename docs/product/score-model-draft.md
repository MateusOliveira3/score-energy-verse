# Score Model Draft

## Purpose

The Score Energy score should represent meaningful progress in a user's energy journey, not just raw consumption volume.

It should make users feel that:

- their effort is visible
- improvement is possible
- engagement matters
- the system is fair enough to trust

This document defines the product philosophy of the score without locking the team into premature formulas.

## Score Philosophy

The score should reward three things together:

1. efficiency
2. improvement over time
3. engagement with the journey

This balance matters because a purely consumption-based score would be unfair, while a purely activity-based score would feel disconnected from real outcomes.

## What the Score Should Reward

## 1. Efficiency

The score should recognize signals that the user is operating more efficiently relative to their context.

Possible examples:

- lower waste patterns
- healthier consumption behavior
- better use of available resources
- adoption of efficient practices or upgrades

Efficiency should matter because the product is not only educational. It is supposed to help users consume energy more intelligently.

## 2. Improvement Over Time

The score should reward progress relative to the user's own baseline, not only absolute performance.

Possible examples:

- month-over-month improvement
- reduction in avoidable inefficiencies
- consistency in following through on recommendations

This is important because users starting from a weaker position should still feel they can progress. Improvement is one of the main retention engines of the product.

## 3. Engagement

The score should also reward productive participation in the journey.

Possible examples:

- completing profile setup
- uploading invoices regularly
- reviewing guidance
- confirming completed actions
- returning for the next cycle

Engagement matters because the system only becomes useful when users keep contributing data and acting on what they learn.

## Suggested Structure

At a high level, the score can eventually combine:

- a performance component tied to efficiency
- an improvement component tied to trend
- an engagement component tied to participation

The exact weights do not need to be finalized yet. The current priority is to keep the model understandable and product-aligned.

## Fairness Challenges

Fairness is a major design constraint.

The same absolute consumption should not mean the same thing for:

- residential users
- commercial users
- restaurants
- schools
- industrial operations

Key fairness challenges include:

- different operating hours
- different property sizes
- different numbers of occupants or employees
- different equipment intensity
- regional and tariff differences

Because of this, the score should not be designed as a single rigid formula applied equally to all user types.

## Practical Fairness Direction

The product should move toward normalization by context, not raw comparison alone.

That means future score logic should likely consider:

- consumer type
- baseline history
- scale of operation
- available profile context

In the MVP, it is acceptable to keep the scoring model simple as long as the team explicitly treats it as provisional.

## Anti-Goals

The score should not:

- punish users so harshly that they stop engaging
- pretend to be a certified technical audit
- compare incompatible user types as if they were equivalent
- become so complex that users cannot understand why it changed

## Working Rule for Engineering

When implementing score features, the team should prefer:

- simple logic that can be explained to users
- visible progression over hidden complexity
- provisional rules that can be revised after real usage data

The correct next step is not to finalize a perfect formula. The correct next step is to build a transparent first scoring model that can evolve safely.
