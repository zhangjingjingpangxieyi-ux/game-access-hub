# Migration Change List

Updated: 2026-07-20

## Comparison Baseline

Old production-matching source:

```text
C:\Users\zhangjing\WorkBuddy\20260424222043\game-access-hub
```

Active BaaS migration worktree:

```text
C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline
```

Important note: `git status` is not a reliable UI-parity signal here because `origin/main` is not the old production source baseline. Use the old production-matching source path above for parity checks.

## Runtime / Migration Changes

These files differ from the old production source and are expected for the BaaS migration:

- `.gitignore`
  - ignores local secrets, certs, build output, logs, and dependencies.
- `.env.example`
  - documents required local BaaS/SSO environment variables without exposing `.env.local`.
- `index.html`
  - loads the Glacier BaaS SDK before the React app bootstrap.
- `package.json`
  - keeps the app on Vite/React dependencies required by the migrated worktree.
- `package-lock.json`
  - lockfile corresponding to the current dependency set.
- `vite.config.js`
  - configures local HTTPS preview at `https://cli-chat.q1.com:8888/` and SDK proxy support.
- `src/main.jsx`
  - wraps the app with the BaaS SSO gate.
- `src/lib/supabase.js`
  - replaces the old Supabase client with the Glacier BaaS compatibility adapter while preserving the old `supabase.from(...)` calling style.
- `src/lib/auth.js`
  - adds a lightweight auth context for BaaS SSO state.
- `src/components/AuthGate.jsx`
  - adds enterprise SSO gating and login-error UI.
- `src/components/UserGuide.jsx`
  - adjusts the guide iframe path for local Vite compatibility.

## Documentation Added

- `SOURCE_BASELINE_CONFIRMATION.md`
- `BAAS_MIGRATION_NOTES.md`
- `BAAS_ADAPTER_STATIC_AUDIT.md`
- `PRODUCTION_PARITY_VERIFICATION.md`
- `SMOKE_READONLY_VERIFICATION.md`
- `RELEASE_READINESS_CHECKLIST.md`
- `WRITE_FLOW_VERIFICATION.md`
- `MIGRATION_CHANGED_FILES.md`

## UI Parity Status

Compared with the old production source, the core UI files remain byte-identical:

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

This means the migration has not changed the old production page layout or business interaction code. Remaining production-readiness work is write-flow verification against controlled BaaS test data.
