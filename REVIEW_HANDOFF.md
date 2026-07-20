# Review Handoff

Date: 2026-07-20

## One-Line Summary

The BaaS migration is based on the confirmed old production source, keeps the old UI/business interaction code unchanged, and replaces only the data-access/auth/local-runtime layers needed for Glacier BaaS.

## Correct Source And Worktree

Old production-matching source:

```text
C:\Users\zhangjing\WorkBuddy\20260424222043\game-access-hub
```

Active BaaS migration worktree:

```text
C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline
```

Active branch:

```text
feat/baas-prod-source-migration
```

Do not use this wrong-base directory as UI baseline:

```text
C:\Users\zhangjing\Documents\New project\game-access-hub
```

## What Changed

Expected migration changes:

- `src/lib/supabase.js`: Glacier BaaS compatibility adapter preserving old `supabase.from(...)` calls.
- `src/components/AuthGate.jsx`: enterprise SSO gate.
- `src/lib/auth.js`: auth context.
- `src/main.jsx`: app wrapped with `AuthGate`.
- `index.html`: loads Glacier BaaS SDK before app bootstrap.
- `vite.config.js`: HTTPS local preview on `https://cli-chat.q1.com:8888/` and SDK proxy.
- `src/components/UserGuide.jsx`: local guide iframe path changed from `/user-guide` to `/user-guide.html`.
- `.env.example`: documents required env keys without committing `.env.local`.

## What Did Not Change

Core business UI files are byte-identical to the old production source:

- `src/App.jsx`
- `src/components/Layout.jsx`
- `src/components/PlayerFieldConfig.jsx`
- `src/components/TeamNeedsCell.jsx`
- `src/lib/featureMeta.js`
- `src/index.css`
- `src/pages/Admin.jsx`
- `src/pages/DocCenter.jsx`
- `src/pages/EditProject.jsx`
- `src/pages/NewProject.jsx`
- `src/pages/ProjectDetail.jsx`
- `src/pages/ProjectList.jsx`

This is the main parity guarantee: the migration does not redesign or rewrite page interactions. Full SHA-256 evidence is recorded in `UI_PARITY_MANIFEST.md`.

## Verified So Far

- Old production source identified and documented.
- Wrong-base migration directory identified and excluded.
- Local HTTPS preview works at `https://cli-chat.q1.com:8888/`.
- Read-only local preview renders home, project detail, docs, guide, and admin gate.
- Home stats from BaaS render as `21 total / 6 accessing / 3 completed / 12 paused`.
- Document center renders 107 documents.
- BaaS adapter read verification passed for chained order, `.in()`, `order + limit + single`, relation hydration, and stage compatibility.
- Static write-flow audit found no unsupported Supabase-style methods in old UI write paths.
- `npm run build` passes.
- `.env.local`, certs, logs, `dist`, and `node_modules` are ignored by Git.

## Not Verified Yet

These require explicit approval because they mutate BaaS data:

- Create project.
- Edit project.
- Project detail status updates.
- Global access-step updates.
- Kanban drag status update.
- Project list status/sort persistence.
- Sync progress image export.
- Admin feature CRUD.
- Admin document CRUD.

Execution plan and rollback order are documented in:

```text
WRITE_FLOW_VERIFICATION.md
```

## Recommended Review Order

1. Review `SOURCE_BASELINE_CONFIRMATION.md` to confirm the source baseline.
2. Review `MIGRATION_CHANGED_FILES.md` to confirm the scope of code changes.
3. Review `BAAS_ADAPTER_STATIC_AUDIT.md` to confirm adapter coverage.
4. Review `RELEASE_READINESS_CHECKLIST.md` for verified and unverified items.
5. Approve controlled write-flow verification with `[BAAS«®“∆—È÷§]` test data.
6. After write checks pass, deploy to a preview/staging target and rerun smoke checks.

## Suggested Commit Message

```text
feat: migrate game access hub data layer to Glacier BaaS
```

Suggested body:

```text
- Confirm production-matching source baseline and preserve old UI files
- Add Glacier BaaS compatibility adapter for existing supabase.from usage
- Add enterprise SSO gate and auth context
- Configure HTTPS local preview and BaaS SDK loading
- Document parity checks, adapter audit, release checklist, and write-flow verification plan
```
