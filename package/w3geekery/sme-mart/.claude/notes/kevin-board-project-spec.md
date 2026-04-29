# Kevin's Board / Project / Scoped Roles Spec

**Source:** Kevin McCarthy, 2026-03-17 (Slack/doc shared with Clark)
**Updated:** 2026-03-25 — additional context from standup

### Additional context (Kevin, 2026-03-25 standup)

> "That is still accurate. If we have Engagements it would be a similar construct."
> "Engagements could link to Projects but not own them or be owned by them."
> "Projects probably would be their own app like Boundary Manager. They won't likely need space in Governance if we can avoid it."

**Key implications:**
- Engagements are a similar Resource+RoleScope construct to Projects
- Projects will be a **standalone ZB platform app** (like Boundary Manager)
- SME Mart handles the marketplace/engagement side; Project management is a separate app
- Everything must have an owner traceable to an Org
- Project ↔ Engagement is `relates_to` (many-to-many), neither owns the other
- Project owners: Org or Boundary (per this doc). Standup also mentioned User for private projects — needs clarification.

---

## Board
New resource type that is the structural anchor for Tasks.
- Every task is owned by a board or another task (subtask model)
- Every task has an Activity (that can extend another Activity)
- The board tells the UI the superset of Activities so it can make UI
    - list of statuses
    - list of phases
    - list of transitions
- Every task has a rank that applies to the board and the phase
    - Rank is OID/arbitrary precision so there is always space between 2 tasks
    - Dragging up and down inside column is rank inside phase
    - Dragging left to right runs transition and sets rank inside new phase
- Every task has a code that comes from the activity and board
    - Activity declares prefix (bug-, vendor-, task-)
    - Counter is org-scoped (bug-12345 is unique inside org)
- The parent of the Board is either:
    - An Org
    - A Boundary
    - A Project
    - A User
- Boards don't have their own roles. They use the roles of their parent.
- Boards need optimized list/search tasks for UI use
    - Subtasks not usually shown on board
    - Get tasks by phase (paged)

## Project
A project is a Resource that creates a chain of sub-resources and provides a RoleScope.
Its children will not (normally) exceed the permissions given to the Project. If you can
see the project, you can see its children.

Its children may be:
 - Plans
 - Files
 - Boards
 - Timelines
 - Notes
 - Chatrooms / message boards
 - Whiteboards
 [...]

Projects can be owned by an Org or a Boundary.

Things in the project can link to things outside the project but won't give permissions to those
things. Project permissions act only on the Project and resources owned by the project directly
or indirectly.

## Scoped Roles
Some (all) roles can be scoped to a certain area. "I am the Lead for Project X" does not mean
I lead all projects. What I do in one Boundary may be what I do in another. Right now the only
scope that can be applied to a Role is a boundary, but we will extend this scope model to include:

- org (to be consistent? it is implied when scope=null)
- boundary
- project
- [...] future

Every Project can therefore leverage Roles (Member, Leader, Owner, etc) to map different
principals into roles for each project that will drive the permissions for that project
and its related (sub) resources.
