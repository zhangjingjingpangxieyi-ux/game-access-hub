# BaaS Adapter Static Audit

Audit date: 2026-07-20

## Scope

Checked all old UI `supabase.from(...)` usage in `src/` against the Glacier BaaS compatibility adapter in `src/lib/supabase.js`.

This audit is static and read-only. It does not create, update, or delete BaaS records.

## Query Patterns Found

The old production UI uses these Supabase-style query patterns:

- `select('*')`
- `select('field_a, field_b')`
- `select('*, features(*)')`
- `select('*, stages(stage_num)')`
- `eq(field, value)`
- `in(field, values)`
- `order(field)`
- chained `order(field_a).order(field_b)`
- `limit(n)`
- `single()`
- `insert(payload)`
- `insert(payload).select().single()`
- `update(payload).eq(...)`
- `delete().eq(...)`
- awaiting the query builder directly through `.then(...)`

## Compatibility Fixes Added

The adapter now supports:

- `.in(field, values)` filtering, used by the edit-project cleanup flow.
- Multiple chained `.order(...)` calls, used by the project list sorting flow.
- Client-side ordering before `limit(n)`, preserving old Supabase behavior for max-sort lookups such as `order('sort_order', { ascending: false }).limit(1).single()`.
- `nullsFirst: false` option handling for project list ordering.

## Remaining Runtime-Only Risks

These cannot be fully proven by static inspection and still require controlled write-flow testing:

- Whether BaaS create/update/remove returns exactly the same shape in all write paths.
- Whether admin CRUD fallback writes behave correctly when optional fields are absent.
- Whether drag-sort persistence preserves paused-project ordering after reload.
- Whether generated timeline rows and progress recalculation match production after status changes.

## Verification

- `npm run build` passed after the adapter compatibility fixes.


## Runtime Read Verification

Verification date: 2026-07-20

A read-only browser runtime check was run against the local BaaS preview using the real `src/lib/supabase.js` module and current BaaS data.

Verified query shapes:

- Chained project ordering: `projects.select(...).order('sort_order', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }).limit(6)` returned 6 rows without error.
- `.in()` filtering: `project_features.select(...).in('feature_id', ids)` returned rows and every returned `feature_id` matched the seed ID set.
- `order + limit + single`: `features.select('sort_order').order('sort_order', { ascending: false }).limit(1).single()` returned `{ sort_order: 1004 }` without error.
- Relation hydration: `project_features.select('*, features(*)').limit(2)` returned feature objects, sample feature name `直充服务`.
- Stage compatibility: `stages.select('*').order('sort_order')` returned legacy numeric IDs `[1, 2, 3, 4]` with stage numbers `[0, 1, 2, 3]`.

No browser console errors were captured during this runtime read verification.

## UI Baseline Parity

Verification date: 2026-07-20

The current BaaS migration worktree was compared against the production-matching source baseline:

```text
C:\Users\zhangjing\WorkBuddy\20260424222043\game-access-hub
```

These core UI files are byte-identical to the old production source:

- `src/pages/ProjectList.jsx`
- `src/pages/ProjectDetail.jsx`
- `src/pages/NewProject.jsx`
- `src/pages/EditProject.jsx`
- `src/pages/Admin.jsx`
- `src/pages/DocCenter.jsx`
- `src/App.jsx`
- `src/components/Layout.jsx`
- `src/index.css`

This confirms the current migration has not intentionally changed the old production page layout or interaction code. Migration differences are limited to the BaaS adapter, SSO gate, local HTTPS/Vite setup, app bootstrap, environment examples, and local guide path support.

## Write Flow Static Audit

Verification date: 2026-07-20

The old UI write flows were checked against the adapter's supported methods:

- New project creation:
  - `projects.insert(...).select().single()`
  - custom `features.insert(...).select().single()`
  - bulk `project_features.insert([...])`
  - bulk `project_global_steps.insert([...])`
  - `project_timeline.insert(...)`
- Edit project:
  - `projects.update(...).eq('id', id)`
  - custom `features.insert(...).select().single()`
  - `project_features.insert([...])`
  - `project_features.update(...).eq('id', pf.id)`
  - `project_features.delete().eq('project_id', id).eq('feature_id', fid)`
  - `project_features.select('feature_id').eq(...).in(...)`
- Project detail:
  - `project_features.update(...).eq('id', pfId)`
  - `project_timeline.insert(...)`
  - `project_global_steps.update(...).eq('id', existing.id)`
  - `project_global_steps.insert(...).select().single()`
- Project list:
  - `projects.update({ status }).eq('id', projectId)`
  - `projects.update({ sort_order }).eq('id', projectId)`
- Admin:
  - `features.insert/update`
  - soft delete through `features.update({ is_active: false })`
  - `documents.insert/update/delete`

No unsupported Supabase-style method was found in these write paths. Actual write-flow verification still requires controlled test data because it will mutate BaaS records.

## Adapter Edge-Case Static Audit

Verification date: 2026-07-20

Additional static checks were run against `src/` to look for Supabase-style methods that the BaaS adapter does not implement.

Checked unsupported/unused patterns:

- `.rpc(...)`
- `.upsert(...)`
- `.neq(...)`
- `.lte(...)`
- `.gte(...)`
- `.or(...)`
- `.match(...)`
- `.is(...)`
- `.not(...)`
- `.range(...)`
- `.maybeSingle(...)`

No old UI usage of these methods was found.

Adapter behavior reviewed against write-flow dependencies:

- Multiple chained `.eq(...)` calls are represented as a combined filter object and are used by edit-project deletion checks.
- `.in(...)` is applied client-side after BaaS reads and is used by edit-project deletion verification.
- Multiple chained `.order(...)` calls are applied in sequence and support the project-list ordering flow.
- `order(...).limit(1).single()` sorts before limiting, which is required by admin max-sort lookups.
- `insert(payload).select().single()` returns the created row shape expected by old UI create flows.
- Stage IDs are normalized from BaaS document IDs to old numeric UI IDs for reads, and mapped back before writes containing `stage_id`.
- Relation hydration covers the old UI relation selections: `features -> stages` and `project_features -> features`.

No additional adapter code change was required from this audit. Mutating runtime verification is still required before production deployment.
