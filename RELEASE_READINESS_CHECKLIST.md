# Release Readiness Checklist

Target worktree:

```text
C:\Users\zhangjing\Documents\New project\game-access-hub-baas-prod-baseline
```

Local preview:

```text
https://cli-chat.q1.com:8888/
```

Production reference:

```text
https://game-access-hub.pages.dev/
```

## Already Verified

- [x] Production-matching source baseline identified.
- [x] BaaS migration worktree created from the production-matching baseline.
- [x] Local HTTPS preview opens through `https://cli-chat.q1.com:8888/`.
- [x] BaaS SSO gate loads without login failure in normal Chrome.
- [x] Home page renders app shell, navigation, project table, and stats.
- [x] Home page shows 21 total, 6 accessing, 3 completed, 12 paused.
- [x] Home search filter works in read-only smoke check.
- [x] Project detail route loads with BaaS document ID.
- [x] Project detail list/kanban toggle works in read-only smoke check.
- [x] Document center renders 107 documents.
- [x] User guide renders visually and `/user-guide.html` loads directly.
- [x] Admin entry loads the password gate without entering a key.
- [x] No `NaN`, login failure, or browser console errors observed in read-only smoke flow.
- [x] `npm run build` passes.
- [x] Core UI files are byte-identical to the production-matching old source baseline; UI parity manifest generated in `UI_PARITY_MANIFEST.md`.
- [x] Write-flow static audit found no unsupported Supabase-style method in old UI write paths.
- [x] BaaS adapter static audit covers old Supabase query patterns, including in() and chained order() calls.
- [x] BaaS adapter runtime read verification passes for in(), chained order(), order plus limit plus single, relation hydration, and stage compatibility.
- [x] Local-only `.env.local`, certs, logs, `node_modules`, and `dist` are ignored by Git.
- [x] Controlled UI write verification passed for project creation, project editing, feature status persistence, and global-step persistence.
- [x] Temporary verification project and all associated BaaS records were deleted; home statistics returned to 21 total, 6 accessing, 3 completed, 12 paused.

## Must Verify Before Production Deployment

These flows can mutate BaaS data. Run them only after confirming test data or an acceptable rollback path. Detailed execution plan: `WRITE_FLOW_VERIFICATION.md`. Completion audit: `COMPLETION_AUDIT.md`. Review handoff: `REVIEW_HANDOFF.md`.

- [x] Create a test project, verify required fields, stage selection, feature selection, and resulting detail page.
- [x] Edit a test project, verify changes persist and do not affect unrelated fields.
- [x] Change one project feature/task status, verify progress and logs update correctly.
- [x] Toggle one global access step, verify progress and logs update correctly.
- [x] Clean up the controlled test project and associated records after verification.
- [ ] Switch project status if needed, verify home statistics update correctly.
- [ ] Drag-sort projects, verify order persistence and paused projects remain at the bottom.
- [x] Trigger sync-progress image generation; no browser console error observed.
- [ ] Admin feature CRUD: create/edit/delete or use a safe test item, then verify document center and project flows.
- [ ] Admin document CRUD: create/edit/delete or use a safe test item, then verify document center.
- [ ] Normal Chrome SSO: open local preview and confirm login/session behavior.
- [ ] Incognito/private SSO: open local preview and confirm first-time login redirect/return behavior.
- [ ] Compare production and local preview for at least one active project, one completed project, and one paused project.

## Recommended Rollout Path

1. Keep the existing production Pages deployment unchanged until write-flow checks pass.
2. Review the branch diff from `feat/baas-prod-source-migration`.
3. Run the mutating checklist against test data or a controlled BaaS dataset.
4. Commit the migration branch after review.
5. Deploy to a preview/staging Pages environment if available.
6. Run the same smoke and write-flow checks on the deployed preview.
7. Switch production only after preview verification passes.

## Rollback Notes

- The current production site is still available at `https://game-access-hub.pages.dev/`.
- The old production-matching local source remains at `C:\Users\zhangjing\WorkBuddy\20260424222043\game-access-hub`.
- Keep the wrong-base migration directory untouched for reference, but do not use it as rollback source.







