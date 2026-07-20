# Read-Only Smoke Verification

Verification date: 2026-07-20

## Scope

Target:

- Local BaaS preview: `https://cli-chat.q1.com:8888/`
- Worktree: `C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline`

This smoke check is read-only. It does not save forms, delete records, drag-sort projects, create projects, or change task status.

## Results

| Area | Result | Evidence |
| --- | --- | --- |
| Home page load | PASS | Rendered app shell, title, navigation, project table, and stats. |
| BaaS login gate | PASS | No login failure message found. |
| Project statistics | PASS | Home page shows 21 total, 6 accessing, 3 completed, 12 paused. |
| Home search filter | PASS | The project search input filters the list with a project-name keyword, and clearing it restores the page state. |
| Project detail route | PASS | Opened `/project/d_9154509ff1264da19359e940`; detail data, stage route, status cards, timeline, task list, and logs rendered. |
| Detail list/kanban toggle | PASS | Switched from list to kanban and back; no NaN or login error appeared. |
| Document center | PASS | `/docs` rendered 107 documents and module/type controls. |
| User guide | PASS | `/guide` visually renders guide content; `/user-guide.html` direct route contains 2661 visible characters and expected guide sections. |
| Admin entry | PASS | `/admin` loads the admin password gate; no CRUD action was performed. |
| Console errors | PASS | No browser console errors captured during the smoke flow. |

## Notes

- The guide iframe is visible and renders correctly in Chrome. Direct DOM access to `iframe.contentDocument` returned empty/null in one automation read, so the result was verified by direct `/user-guide.html` access and screenshot inspection.
- The project detail route uses BaaS document IDs such as `d_9154509ff1264da19359e940`; this is expected after backend migration.
- Interactive write flows still require confirmation/manual testing before production deployment: new project, edit project, task status update, drag sorting persistence, sync image export, and admin CRUD.

## Post-Adapter Patch Regression

Regression date: 2026-07-20

Additional read-only regression was completed after updating `src/lib/supabase.js` to support `.in()` and chained `.order(...)` calls.

- Home page still renders app shell, navigation, project table, and stats.
- Home page still shows 21 total, 6 accessing, 3 completed, 12 paused.
- First visible project ordering is stable after the adapter patch.
- Search input still filters the project list with a project-name keyword.
- Project detail route `/project/d_9154509ff1264da19359e940` still renders stage route, task list, timeline, and logs.
- Project detail list/kanban toggle still works.
- `/docs` still renders 107 documents.
- `/user-guide.html` still contains expected guide sections.
- No login failure, `NaN`, or browser console errors were observed.

## Adapter Runtime Read Query Verification

Verification date: 2026-07-20

The current browser runtime successfully imported `src/lib/supabase.js` and ran read-only queries against BaaS data.

- `.in()` filtering returned matching rows without error.
- Chained `.order(...)` returned 6 projects without error.
- `order + limit + single` returned a max feature sort row.
- `project_features` relation hydration returned feature data.
- Stage compatibility returned legacy numeric stage IDs `[1, 2, 3, 4]`.
- No browser console errors were observed.
