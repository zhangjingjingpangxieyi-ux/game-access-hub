# Production Parity Verification

Verification date: 2026-07-20

## Scope

Compared the current production Cloudflare Pages app with the local BaaS migration preview:

- Production: https://game-access-hub.pages.dev/
- Local BaaS preview: https://cli-chat.q1.com:8888/
- Clean Git worktree/branch prepared for continuing work: `C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline`

This verification is read-only. It checks rendered page structure, visible copy, navigation, and key data counts. It does not submit forms or mutate project data.

## Result summary

- Home page: PASS
- Document center: PASS
- User guide: PASS after local iframe path fix
- Read-only smoke checks: PASS
- Post-adapter regression: PASS
- Build in temporary preview baseline: PASS
- Build in clean Git worktree branch: PASS
- Runtime from clean Git worktree branch: PASS
- BaaS data loading: PASS
- Stage label compatibility: PASS, no NaN stage labels found

## Home page evidence

Production and local preview both render:

- Same page title: Game Access Hub browser title
- Same main app title and nav structure
- Same top-level navigation: project management, document center, guide, admin entry
- Same primary action: new project
- Same project statistics: 21 total, 6 accessing, 3 completed, 12 paused
- Same project list structure and visible columns
- Same drag-sort helper text
- No stage NaN marker found

Observed local project links use BaaS document IDs, while production links use Supabase UUIDs. This is expected because the data backend changed; visible project names, stages, progress, and status are aligned.

## Document center evidence

Production and local preview both render:

- Same document center heading and subtitle
- Same view toggles: by module and by type
- Same document count: 107 documents
- Same module filters: all, transaction center, customer service center, data center, game center, player center, marketing center, operations center
- Same first visible module/table structure
- No stage NaN marker found

## User guide evidence

Issue found during parity check:

- Production can load the static guide through the old extensionless path.
- Local Vite preview did not load the guide body when the iframe used `/user-guide`.

Fix applied:

- Updated `src/components/UserGuide.jsx` iframe src from `/user-guide` to `/user-guide.html`.

Verification after fix:

- Local guide iframe loads the static guide HTML.
- Iframe body length: 2661 visible characters.
- Guide body contains expected content sections such as table of contents and new project instructions.

## Clean branch runtime evidence

The local HTTPS preview URL was switched from the temporary baseline directory to the clean Git worktree branch:

- Running worktree: `C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline`
- Process command line confirmed the Vite service comes from this worktree.
- `https://cli-chat.q1.com:8888/` renders the home page with BaaS data.
- `/docs` renders 107 documents.
- `/guide` renders the static guide iframe body.
- No NaN markers were found in the checked pages.

## Read-only smoke evidence

Additional read-only smoke checks were completed on 2026-07-20:

- Home search filter accepts `代号` and filters the visible project list.
- Project detail route opens with BaaS document ID `/project/d_9154509ff1264da19359e940`.
- Project detail list/kanban toggle works and can return to list view.
- `/docs` renders 107 documents.
- `/guide` visually renders the guide content; direct `/user-guide.html` contains `目录` and `新建接入项目`.
- `/admin` loads the admin password gate without entering a key.
- No `无法登录`, login failure, `NaN`, or browser console errors were observed in the smoke flow.

Detailed notes are recorded in SMOKE_READONLY_VERIFICATION.md.

Post-adapter regression after .in() and chained .order(...) support also passed for home, search, project detail, kanban toggle, docs, guide direct page, and browser console checks.

## Build evidence

Command:

- `npm run build`

Result:

- Passed with Vite 6.4.2.
- 59 modules transformed.

## Remaining manual checks before production deployment

These are interactive flows and should be tested manually before deployment because they can change data:

- Home page filters and search.
- Project status switch.
- Drag sorting and persistence.
- New project creation.
- Edit project flow.
- Project detail status transitions.
- Kanban/list switching.
- Sync progress image export.
- Admin feature/document CRUD.
- SSO behavior in normal Chrome and incognito/private browser.

## Current recommendation

Continue from the clean Git worktree branch:

- `C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline`

Do not continue from the dirty wrong-base migration branch until this branch has been reviewed.


