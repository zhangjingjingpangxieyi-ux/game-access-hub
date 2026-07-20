# BaaS Migration Notes

## Current conclusion

The source that matches the current Cloudflare Pages production site is:

- Original local source: `C:\Users\zhangjing\WorkBuddy\20260424222043\game-access-hub`
- Temporary BaaS migration baseline: `C:\Users\zhangjing\Documents\New project\game-access-hub-prod-source`
- Clean Git worktree/branch for continuing work: `C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline`
- Branch name: `feat/baas-prod-source-migration`
- Current production URL: `https://game-access-hub.pages.dev/`
- Local BaaS preview URL used for verification: `https://cli-chat.q1.com:8888/`

The existing Git checkout at `C:\Users\zhangjing\Documents\New project\game-access-hub` is not the production-matching source. It was an earlier wrong-base migration attempt and should not be used as the UI baseline.

## Evidence for source match

The original local source contains production-matching files and strings:

- `dist/index.html` references `/assets/index-CZ9fgVcy.js`, same as production.
- `src/components/Layout.jsx` contains the production app title and guide navigation.
- `src/pages/ProjectList.jsx` contains production list UI strings, paused-project UI, and drag-sort helper text.
- `src/pages/ProjectDetail.jsx` contains the production progress-sync action.

## Migration scope completed in this baseline

The migration is intentionally limited to infrastructure and data access so the production UI remains unchanged:

- Replaced Supabase client implementation in `src/lib/supabase.js` with a Glacier BaaS compatibility adapter.
- Added BaaS SSO gate in `src/components/AuthGate.jsx`.
- Added auth context in `src/lib/auth.js`.
- Updated `src/main.jsx` to wrap the app with `AuthGate`.
- Updated `index.html` to load the Glacier BaaS SDK before bootstrapping React.
- Updated `vite.config.js` for HTTPS local development on `https://cli-chat.q1.com:8888/` and SDK proxying.
- Added `src/components/UserGuide.jsx` local iframe compatibility fix, using `/user-guide.html`.
- Added stage-id compatibility mapping so old UI logic can still treat stage IDs as numeric Supabase-style IDs while BaaS keeps its real document IDs.
- Created a clean Git worktree/branch from `origin/main` and copied the production-matching baseline into it.

## BaaS app/data already used

The real local value lives in `.env.local` in the temporary preview directory and is intentionally not committed. The Git branch contains only `.env.example` placeholders.

Previously migrated record counts:

- `stages`: 4
- `access_steps`: 8
- `features`: 79
- `documents`: 107
- `projects`: 21
- `project_features`: 409
- `project_global_steps`: 128
- `project_timeline`: 387
- `system_config`: 1

## Verification done

Build:

- `npm run build` passed in the temporary preview directory.
- `npm run build` passed in the clean Git worktree branch.

Runtime:

- Local HTTPS dev server on `https://cli-chat.q1.com:8888/` opens with BaaS data.
- Home page shows production-matching title/nav/list text.
- Home page pulls BaaS project statistics: 21 total, 6 accessing, 3 completed, 12 paused.
- Stage labels no longer show `NaN`.
- A project detail page opens and reads BaaS data.
- Document center opens and shows 107 documents.
- User guide iframe loads the local static HTML after the `/user-guide.html` fix.

## Known follow-up checks

Before replacing or deploying production, manually compare these flows against `https://game-access-hub.pages.dev/`:

- Home page filters, search, status switch, drag sorting.
- New project creation flow.
- Edit project flow.
- Project detail status change, kanban/list switch, sync progress image export.
- Admin feature/document CRUD.
- SSO behavior in normal Chrome and incognito/private browser.

## Recommended next step

Continue from the clean Git worktree:

- `C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline`

Recommended path:

1. Review the branch diff.
2. Copy local-only env/cert files into this worktree if you want to run this exact branch locally with SSO.
3. Run the manual interactive checks listed above.
4. Commit the branch after review.
5. Deploy to Cloudflare only after manual checks pass.
