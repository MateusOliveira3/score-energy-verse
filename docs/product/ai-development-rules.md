# AI Development Rules

## Purpose

These rules define how AI-assisted work must be conducted in the `score-energy-verse` repository.

They exist to reduce context contamination, improve task traceability, and keep implementation decisions grounded in the actual repository.

## Core Repository Rule

From this task onward, all future development must follow this rule:

"Always ignore context from other projects and work only within the current repository context."

This rule is mandatory for Codex and any other AI tool used on this project.

## Required Rules

## 1. Always Ignore Context From Other Projects

Every task must be executed using only the current repository as the working context.

This means:

- do not import assumptions from unrelated codebases
- do not mix product decisions from other projects
- do not rely on prior project memory if it is not present in this repository

## 2. Always Explicitly Define Repository Context in Prompts

Prompts should clearly state the target repository and task scope.

Minimum prompt expectation:

- repository name
- branch or task scope
- whether the task is documentation, code, review, or bug fixing
- constraints about what must not be changed

This reduces ambiguity and prevents accidental drift.

## 3. Always Use One Branch Per Task

Each task should have its own branch.

This makes it easier to:

- review changes
- isolate mistakes
- revert safely if needed
- understand the purpose of a branch from its name

## 4. Always Document Each Task Before and After Implementation

Before implementation:

- define the objective
- define scope
- define constraints

After implementation:

- record what changed
- record what was intentionally not changed
- record next recommended steps

This rule applies to documentation tasks and code tasks.

## 5. Prefer Small, Safe, Incremental Changes

AI-assisted work should move in controlled steps.

Prefer:

- one focused branch per task
- limited scope per change
- clear validation after edits

Avoid large mixed changes unless there is a strong reason.

## 6. Avoid Unnecessary Refactors

Do not refactor broadly when the task does not require it.

This protects:

- delivery speed
- review clarity
- code stability
- product focus

Refactors should only happen when they directly support the current objective.

## 7. Keep Prompts Structured and Explicit

Prompts should define:

- objective
- files to create or edit
- constraints
- output expectations
- final reporting requirements

Structured prompts consistently produce safer outcomes than vague requests.

## 8. Treat Codex as Executor, Not Decision-Maker

Codex should implement and organize work, but product direction must come from explicit project decisions.

This means:

- AI should not invent strategy without instruction
- AI should not silently change scope
- AI should not make hidden architectural decisions
- important tradeoffs should be documented and reviewed by humans

## Practical Prompt Template

When using Codex or another AI tool, prompts should include language similar to:

1. Work only in the repository `score-energy-verse`.
2. Ignore context from all other projects.
3. Use or create a dedicated branch for this task.
4. State exactly which files may be changed.
5. State what must not be changed.
6. Require a final summary of work completed.

## Enforcement Mindset

If an AI tool begins to drift beyond repository context or task scope, the task should be corrected immediately.

The goal is not maximum autonomy. The goal is reliable execution within clear product and repository boundaries.
