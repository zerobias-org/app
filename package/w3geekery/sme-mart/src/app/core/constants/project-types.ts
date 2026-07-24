/**
 * Platform `project-type` tag IDs — what `platform.Project.projectTypeId`
 * references (validated as a project-type tag in `app.upsert_project`).
 *
 * These REPLACE the old `SME_MART_TIER_PROJECT_TAG_ID` marketplace-tag cruft
 * (see tier-tags.ts). Per Nic (2026-07-01): a project's tier IS its project
 * type — `projectTypeId` on the row, resolved as `projectType: TagView` on
 * `ProjectExtended`.
 *
 * Values are the GLOBAL System-Org tags (ownerId `00000000-…`, scope `global`),
 * verified via ZB MCP `hydra.Tag.searchTags({ types: ['project-type'] })` on
 * 2026-07-02 (UAT). Global seeded tags are expected identical across envs (as
 * the `task-type` tags are) — verify prod parity before a prod deploy.
 *
 * ⚠️ RECONCILE-TAG-AXES — THIS FILE IS ON A SHIFTING FOUNDATION (umd note, DIRECTOR-PARKS-CHANNEL 2026-07-02).
 * `zerobias-com/tag` PR #8 introduces an orthogonal AXIS model, and these UUIDs/semantics WILL change:
 *   - `project-type` (positional nesting): program / project / workspace / aperture / thread
 *   - `project-role`  (multi-valued, any-tier): ENGAGEMENT / transparency-entangled / template
 *   - `project-archetype`: readiness / delivery / portfolio
 *   - `project-domain`: compliance / legal / financial / clinical (being minted NOW, not deferred)
 *   - `project-tier` is being RETIRED (Chris owns the deprecation).
 * TWO breaks for SME Mart when #8 lands + Nic reconciles the project-type UUIDs to his live SQL IDs:
 *   1. `engagement` becomes a project-ROLE, not a project-type — the engagement node's identity must move
 *      from `projectTypeId == engagement` to `project-role == engagement` (positional projectType = program/project).
 *      Affects: platform-engagement-provisioner (detect/create) + engagements.service tier filter.
 *   2. These UUIDs may change on #8 merge — re-verify against Nic's SQL before relying on them past that.
 * Grep `RECONCILE-TAG-AXES` when #8 merges. Tracked: backlog 042.
 */
export const PROJECT_TYPE_ID = {
  engagement: '4a7993d8-7576-11f1-abdb-b3f23cffdeb2',
  project: '4a7b806c-7576-11f1-abdc-6f225ffd7331',
  workspace: '4a7b83be-7576-11f1-abdd-6b8b72597c67',
  aperture: '4a7b8468-7576-11f1-abde-6f0f1b67b2bd',
  thread: '4a7b8512-7576-11f1-abdf-032dc198af03',
} as const;
