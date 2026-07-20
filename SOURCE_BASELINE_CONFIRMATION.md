# Source Baseline Confirmation

Confirmation date: 2026-07-20

## Confirmed Production-Matching Source

Use this directory as the old production UI/source baseline:

```text
C:\Users\zhangjing\WorkBuddy\20260424222043\game-access-hub
```

Use this directory as the active BaaS migration worktree:

```text
C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline
```

Active branch:

```text
feat/baas-prod-source-migration
```

## Do Not Use As UI Baseline

Do not use this directory as the production UI baseline:

```text
C:\Users\zhangjing\Documents\New project\game-access-hub
```

Reason: it was an earlier wrong-base migration attempt and does not match the deployed Cloudflare Pages UI.

## Evidence

The confirmed source matches production on these key signals:

- Its built `dist/index.html` references `/assets/index-CZ9fgVcy.js`, matching the deployed production asset observed for `https://game-access-hub.pages.dev/`.
- It contains the production-facing app title and navigation strings.
- It contains production project-list behavior and copy, including paused project handling and the drag-sort hint.
- It contains the project detail progress-sync action.
- A BaaS migration worktree built from this source renders production-matching home, document center, guide, and project detail pages.

## Migration Principle

Keep the old production UI and interaction model as the baseline. BaaS migration changes should be limited to:

- authentication and SSO gate,
- BaaS SDK loading,
- data-access compatibility layer,
- local HTTPS dev configuration,
- compatibility fixes required for local/BaaS runtime behavior.

Avoid UI redesign or interaction changes unless a parity bug requires a minimal fix.

## Current Verification Artifacts

- `BAAS_MIGRATION_NOTES.md`
- `PRODUCTION_PARITY_VERIFICATION.md`
- `SMOKE_READONLY_VERIFICATION.md`
- `MIGRATION_CHANGED_FILES.md`
- `WRITE_FLOW_VERIFICATION.md`
- `COMPLETION_AUDIT.md`
- `REVIEW_HANDOFF.md`
- `UI_PARITY_MANIFEST.md`

