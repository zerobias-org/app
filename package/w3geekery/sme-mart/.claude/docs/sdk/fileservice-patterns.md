# FileService SDK Patterns

Access via `sdk.fileService` (from `@zerobias-com/fileservice-sdk`).

**SDK source:** `~/Projects/zb/clients/packages/sdks/fileservice/generated/`
**ZB UI reference:** `~/Projects/zb/ui/projects/neverfail-lib/src/lib/`

---

## Architecture Overview

File operations in ZeroBias span **two separate services**:

1. **File Service** (`/file-service`) — file metadata, folders, binary storage (S3), versioning, sharing
2. **Platform API** (`/platform`) — task attachments (links a file version to a task via a comment)

```
User selects file
    |
    v
[1] FileApi.create()          POST /file-service/files
    returns FileView { id }
    |
    v
[2] Raw HTTP upload           POST /file-service/files/{id}/upload?checksum={md5}
    returns FileVersion { id }
    |
    v
[3] TaskApi.addAttachment()   PUT  /platform/app/tasks/{taskId}/attachments
    returns TaskAttachment { id, commentId, fileVersionId, fileMetadata }
    |
    v
[4] View/Download
    GET /file-service/files/{fileVersionId}/view      (iframe preview)
    GET /file-service/files/{fileVersionId}/download   (browser download)
```

---

## Available SDK APIs

### FileApi — `sdk.fileService.getFileApi()`

| Method | HTTP | Path | Notes |
|--------|------|------|-------|
| `create(createFile)` | POST | `/files` | Creates file metadata record |
| `get(id)` | GET | `/files/{id}` | Get file metadata |
| `delete(id, deleteContents?)` | DELETE | `/files/{id}` | Delete file |
| `update(id, updateFile)` | PUT | `/files/{id}` | Update metadata |
| `copy(copyFile)` | PUT | `/copyFile` | Idempotent remote copy |
| `download(id)` | GET | `/files/{id}/download` | Download binary |
| `view(id)` | GET | `/files/{id}/view` | View (beautified) |
| `viewRaw(id)` | GET | `/files/{id}/view?raw=true` | View raw content |
| `getFileStatus(id)` | GET | `/files/{id}/status` | Processing status |
| `listVersions(id, page, pageSize)` | GET | `/files/{id}/versions` | File version history |
| `listShares(id, page, pageSize, filter?)` | GET | `/files/{id}/shares` | Shares for a file |

**Source:** [`~/Projects/zb/clients/packages/sdks/fileservice/generated/api/FileApi.ts`](file:///Users/cstacer/Projects/zb/clients/packages/sdks/fileservice/generated/api/FileApi.ts)

### FolderApi — `sdk.fileService.getFolderApi()`

| Method | HTTP | Path | Notes |
|--------|------|------|-------|
| `create(createFolder)` | POST | `/folders` | Create folder |
| `get(id)` | GET | `/folders/{id}` | Get folder details |
| `delete(id, recursive?, deleteContents?)` | DELETE | `/folders/{id}` | Delete folder |
| `listChildren(id, page, pageSize)` | GET | `/folders/{id}/children` | List folder contents |
| `listRootChildren()` | GET | `/folders/root/children` | List root level |

### ResourceApi — `sdk.fileService.getResourceApi()`

| Method | HTTP | Path | Notes |
|--------|------|------|-------|
| `searchResources(page, pageSize, keywords?, tags?, types?, inflate?)` | GET | `/resources` | Search files/folders |
| `getResource(id, inflate?)` | GET | `/resources/{id}` | Get resource |
| `getPath(id, inflated?)` | GET | `/resources/{id}/path` | Parent hierarchy |
| `getResourceTypes()` | GET | `/resources/types` | Available resource types |
| `tagResource(resourceId, tagIds[])` | PUT | `/resources/{id}/tags` | Tag a resource |
| `untagResource(resourceId, tagId)` | DELETE | `/resources/{id}/tags/{tagId}` | Remove tag |
| `getTagsForResource(id)` | GET | `/resources/{id}/tags` | List tags on resource |
| `listTaggedResources(tagId, page, pageSize, inflate?, type?)` | GET | `/tags/{id}/resources` | Find by tag |

### ShareApi — `sdk.fileService.getShareApi()`

| Method | HTTP | Path |
|--------|------|------|
| `create(createShare)` | POST | `/shares` |
| `get(id)` | GET | `/shares/{id}` |

---

## Binary Upload — NOT in SDK

The actual file upload is an **undocumented endpoint** not wrapped by the SDK. From the `FileApi.create()` JSDoc:

> "Once created, a file can be uploaded manually via the undocumented endpoint `/files/{id}/upload`."

ZB UI handles this with raw `HttpClient`:

```typescript
// From ~/Projects/zb/ui/.../file-upload/file-upload.component.ts:146-180
const fileView = await filesService.create({
  name: file.name,
  description: '',
  folderId: folderId,
  retentionPolicy: {},
  syncPolicy: {},
});

const url = `${fileServiceUrl}/files/${fileView.id}/upload?checksum=${md5Checksum}`;
this.http.post(url, arrayBuffer, {
  headers: { 'content-type': actualMimeType },
  reportProgress: true,
  observe: 'events',
  withCredentials: true,
}).subscribe(event => {
  if (event.type === HttpEventType.UploadProgress) {
    progress = Math.round(100 * event.loaded / event.total);
  } else if (event.type === HttpEventType.Response) {
    fileVersion = event.body;  // FileVersion with id for attachment
  }
});
```

**Key details:**
- Body is raw `ArrayBuffer`, NOT `FormData`
- `Content-Type` header is the file's actual MIME type
- `checksum` query param is MD5 hex string
- Response body is a `FileVersion` object (has `.id` for attachment)
- `withCredentials: true` for session cookies
- ZB UI uses `ts-md5` npm package for client-side MD5

**Source:** [`~/Projects/zb/ui/projects/neverfail-lib/src/lib/components/file-upload/file-upload.component.ts`](file:///Users/cstacer/Projects/zb/ui/projects/neverfail-lib/src/lib/components/file-upload/file-upload.component.ts)

---

## Task Attachments — Platform SDK

### TaskApi attachment methods — `sdk.platform.getTaskApi()`

| Method | HTTP | Path | Notes |
|--------|------|------|-------|
| `addAttachment(taskId, newTaskAttachment)` | PUT | `/app/tasks/{id}/attachments` | Idempotent |
| `listAttachments(taskId, page?, pageSize?, sort?)` | GET | `/app/tasks/{id}/attachments` | Paged results |

**Source:** [`~/Projects/zb/clients/packages/sdks/platform/generated/api/TaskApi.ts`](file:///Users/cstacer/Projects/zb/clients/packages/sdks/platform/generated/api/TaskApi.ts)

### Data Models

```typescript
// NewTaskAttachment — input for addAttachment()
// Source: ~/Projects/zb/clients/packages/sdks/platform/generated/model/NewTaskAttachment.ts
{
  fileVersionId: UUID;       // REQUIRED — from file upload response
  commentTxt?: string;       // Optional plain text comment
  commentMarkdown?: string;  // Optional markdown comment
  commentId?: UUID;          // Optional — attach to existing comment
}

// TaskAttachment — returned from addAttachment() and listAttachments()
// Source: ~/Projects/zb/clients/packages/sdks/platform/generated/model/TaskAttachment.ts
{
  id: UUID;
  commentId: UUID;           // Every attachment belongs to a comment
  fileVersionId: UUID;       // Reference to file service
  fileMetadata: {            // AttachmentFileMetadata
    name?: string;
    description?: string;
    size?: number;           // bytes
    mimeType?: MimeType;
    checksum?: string;       // MD5
  };
  created: Date;
  updated: Date;
  ownerId?: UUID;
  taskId?: UUID;
  deleted?: Date;
}
```

**Source:** [`~/Projects/zb/clients/packages/sdks/platform/generated/model/AttachmentFileMetadata.ts`](file:///Users/cstacer/Projects/zb/clients/packages/sdks/platform/generated/model/AttachmentFileMetadata.ts)

### Attachment = Comment + File

Every `TaskAttachment` is linked to a `TaskComment`. When calling `addAttachment`:
- Provide `commentId` → attaches to that existing comment
- Provide `commentTxt` or `commentMarkdown` → creates a **new** comment
- Provide **neither** → platform auto-creates a default comment

This is **idempotent**: if an attachment already exists for the same `fileVersionId` + `taskId`, the existing record is updated and returned.

---

## ZB UI Reference Implementation

### File Upload Component

**Path:** `~/Projects/zb/ui/projects/neverfail-lib/src/lib/components/file-upload/`

- `file-upload.component.ts` — drag-drop, FileReader, MD5 checksum, raw HTTP upload with progress
- `file-upload.component.html` — drop zone + file list with progress bars
- `file-upload.component.scss` — styling

**Key patterns:**
- Folder setup: `filesService.ensureFolder('TaskAttachments')` (search + create-if-missing)
- File read: `FileReader.readAsArrayBuffer()` → MD5 via `ts-md5`
- Upload: two-step (create metadata → POST binary)
- Progress: `HttpClient` with `reportProgress: true, observe: 'events'`
- Cancel: `Subscription.unsubscribe()` on in-flight upload
- MIME detection: browser `File.type` with extension-based fallback

**Source:** [`~/Projects/zb/ui/projects/neverfail-lib/src/lib/components/file-upload/file-upload.component.ts`](file:///Users/cstacer/Projects/zb/ui/projects/neverfail-lib/src/lib/components/file-upload/file-upload.component.ts)

### Task Attachments Panel

**Path:** `~/Projects/zb/ui/projects/neverfail-lib/src/lib/components/auditmation-task-components/task-panel/task-attachements-panel/`

- Lists attachments with file icons by MIME type
- Preview via iframe (`/file-service/files/{fvId}/view`)
- Download link
- Resizable preview panel (100px–800px, default 250px)

**Previewable types (browser-native):** `image/*`, `video/*`, `audio/*`, `application/pdf`, `text/*`
**Previewable types (file-service beautified):** JSON, YAML, XML, Excel (`.xlsx`)

**Source:** [`~/Projects/zb/ui/projects/neverfail-lib/src/lib/components/auditmation-task-components/task-panel/task-attachements-panel/task-attachements-panel.component.ts`](file:///Users/cstacer/Projects/zb/ui/projects/neverfail-lib/src/lib/components/auditmation-task-components/task-panel/task-attachements-panel/task-attachements-panel.component.ts)

### FilesService (UI wrapper)

**Path:** `~/Projects/zb/ui/projects/neverfail-lib/src/lib/auditmation-services/files/files.service.ts`

Wraps `ZbClientApiService.fileClient` (same SDK we have access to). Key methods:
- `create(createFile)` — file metadata
- `ensureFolder(name)` — search for folder by name, create if missing
- `download(id)` — trigger download
- `getViewUrl(fileVersionId)` — construct view URL
- `getFileServiceEnvironmentUrl()` — base URL for raw upload endpoint

**Source:** [`~/Projects/zb/ui/projects/neverfail-lib/src/lib/auditmation-services/files/files.service.ts`](file:///Users/cstacer/Projects/zb/ui/projects/neverfail-lib/src/lib/auditmation-services/files/files.service.ts)

---

## SME Mart Access

SME Mart gets `fileService` via the `zerobias-sdk` client chain:

```
@zerobias-com/zerobias-angular-client
  → @zerobias-com/zerobias-client
    → @zerobias-com/zerobias-sdk
      → sdk.fileService (FileServiceAppClient from @zerobias-com/fileservice-sdk)
      → sdk.platform    (PlatformApiClient from @zerobias-com/platform-sdk)
```

**Confirmed available:**
- `sdk.fileService.getFileApi()` — create, get, delete, download, view
- `sdk.fileService.getFolderApi()` — create, list, get
- `sdk.fileService.getResourceApi()` — search, tag
- `sdk.fileService.getShareApi()` — create, get
- `sdk.platform.getTaskApi().addAttachment()` — link file to task
- `sdk.platform.getTaskApi().listAttachments()` — list task files

**Not in SDK (manual HTTP required):**
- `POST /file-service/files/{id}/upload?checksum={md5}` — binary upload

**File service base URL** is available via the client:
```typescript
// In ZB UI: this.clientApi.getFileServiceEnvironmentUrl()
// SME Mart equivalent: construct from environment
// Pattern: https://{env}.zerobias.com/api/file-service
```

**Source:** [`~/Projects/zb/clients/packages/sdk/src/index.ts`](file:///Users/cstacer/Projects/zb/clients/packages/sdk/src/index.ts) (SDK wiring), [`~/Projects/zb/clients/packages/client/src/lib/services/zerobias-client-api.ts`](file:///Users/cstacer/Projects/zb/clients/packages/client/src/lib/services/zerobias-client-api.ts) (fileClient property)

---

## SDK Feature Request Candidates

| Feature | Current Workaround | Priority | Status |
|---------|-------------------|----------|--------|
| `FileApi.upload(id, buffer, checksum, contentType)` | Raw HttpClient POST (same as ZB UI) | Nice-to-have | Chris Scarola said he can likely add it (2026-02-26). Meeting to discuss tomorrow. |

**Nothing is blocking.** We can build file upload + task attachments today using the same patterns ZB UI uses. If Chris adds `upload()` to the SDK we can swap out the raw HTTP call later.

---

## Dependencies

| Package | Purpose | Used By |
|---------|---------|---------|
| `ts-md5` | MD5 checksum for file upload verification | ZB UI FileUploadComponent |
| `@zerobias-com/fileservice-sdk` | File service client (already installed via zerobias-sdk) | Transitive dep |
| `@zerobias-com/platform-sdk` | Task attachment API (already installed via zerobias-sdk) | Transitive dep |
