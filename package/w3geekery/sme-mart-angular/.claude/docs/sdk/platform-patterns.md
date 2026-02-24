# Platform SDK Patterns

Access via `sdk.platform`. Full API: `node_modules/@zerobias-com/platform-sdk/generated/USAGE.md`

## Boundary Operations (Read-Only)

SME Mart only READS boundaries. Creation/invitations happen in ZeroBias Platform.

```typescript
// List user's boundaries
const boundaries = await sdk.platform.getBoundaryApi().list(1, 50);

// Get boundary details
const boundary = await sdk.platform.getBoundaryApi().get(boundaryId);

// List boundary members
const parties = await sdk.platform.getBoundaryApi().listParties(boundaryId, 1, 100);
```

## Tag Operations (Engagement Tags)

Each SME Mart engagement gets a unique Tag for aggregating all related assets.

```typescript
// Create engagement tag
const tag = await sdk.platform.getTagApi().create({
  name: 'SME-Mart-Engagement',
  code: 'ENG-A7K9M2',
  metadata: {
    smeMartRequestId: workRequest.id,
    boundaryId: boundary.id,
  }
});

// Search resources by tag (Transparency Center aggregation)
const assets = await sdk.platform.getResourceApi().search({
  tagIds: [engagementTagId],
  types: ['Task', 'Comment', 'File', 'TimeEntry'],
});
```

## Task Operations

Tasks live within a Boundary and can be tagged with Engagement Tag.

```typescript
// Create task in boundary
const task = await sdk.platform.getTaskApi().create({
  boundaryId: boundary.id,
  title: 'SOC 2 Readiness Assessment',
  assigneeId: provider.zerobiasUserId,
  tags: [engagementTagId],
});

// List tasks in boundary
const tasks = await sdk.platform.getTaskApi().list({ boundaryId, page: 1, pageSize: 50 });

// Update task status
await sdk.platform.getTaskApi().update(taskId, { status: 'completed' });
```

## Comment Operations (Messaging)

Comments with engagement tag = messages in Transparency Center.

```typescript
// Create message
const comment = await sdk.platform.getCommentApi().create({
  content: messageText,
  tags: [engagementTagId],
  resourceType: 'Task',
  resourceId: taskId,
});

// Reply (threaded)
const reply = await sdk.platform.getCommentApi().create({
  content: replyText,
  parentId: originalCommentId,
  tags: [engagementTagId]
});
```

## Time Entry Operations

```typescript
// Log time against task
const timeEntry = await sdk.platform.getTimeEntryApi().create({
  taskId: taskId,
  duration: 90, // minutes
  description: 'Gap analysis review',
  tags: [engagementTagId]
});
```
