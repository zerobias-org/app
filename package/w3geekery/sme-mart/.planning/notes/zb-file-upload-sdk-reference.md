# ZeroBias File Upload SDK Reference

> Quick reference for building file upload features in SME Mart using the ZB FileService SDK.

## Upload Workflow

```
Browser File → FileReader (ArrayBuffer) → MD5 checksum
  → fileService.create(metadata) → POST /files (returns FileView with id)
  → POST /files/{id}/upload?checksum={md5} (binary body, Content-Type from file)
  → fileVersionId returned in response body
  → platform.Task.addAttachment({ fileVersionId }) to link to task
```

## SDK Client Access

```typescript
// From ZerobiasClientApp (via AppInitService in SME Mart)
const fileClient = zerobiasClientApi.fileClient;

// API surfaces
fileClient.getFileApi()    // FileApi — CRUD, upload, download, versions
fileClient.getFolderApi()  // FolderApi — folder hierarchy
fileClient.getResourceApi() // ResourceApi — tags, links, search
fileClient.getShareApi()   // ShareApi — token-based sharing
```

**SDK package:** `@zerobias-com/fileservice-sdk`

**Key types:**
```typescript
import {
  CreateFile, UpdateFile, FileView, FileStatus,
  CreateFolder, Folder, FolderChild,
  CreateShare, Share,
  ResourceView, ResourceType, TagView,
  RequestFile, CopyFile, CopyFileJob
} from '@zerobias-com/fileservice-sdk';
```

## FileApi Operations

### Create File Metadata

```typescript
const fileView: FileView = await fileClient.getFileApi().create({
  name: 'exhibit-f.pdf',           // required
  description: 'Security requirements document',
  folderId: toUUID(folderId),      // optional — place in folder
  retentionPolicy: {},             // required (empty = default/forever)
  syncPolicy: {},                  // required (empty = off)
  tags: ['tag-id-1'],              // optional — tag IDs at creation
  keywords: ['security', 'exhibit-f'], // optional — keyword search terms
});
// Returns: FileView { id, name, description, ... }
```

### Upload Binary Content

**Not in SDK** — use `HttpClient` directly:

```typescript
const url = `${fileServiceBaseUrl}/files/${fileView.id}/upload?checksum=${md5Hex}`;
const headers = new HttpHeaders({ 'content-type': file.type || 'application/octet-stream' });

http.post(url, arrayBuffer, {
  headers,
  reportProgress: true,
  observe: 'events',
  withCredentials: true   // sends session cookie
}).subscribe(event => {
  if (event.type === HttpEventType.UploadProgress) {
    const progress = Math.round(100 * event.loaded / event.total);
  } else if (event.type === HttpEventType.Response) {
    const fileVersion = event.body; // { id (fileVersionId), name, size, mimeType, ... }
  }
});
```

**MD5 checksum:** Use `ts-md5` library:
```typescript
import { Md5 } from 'ts-md5';
const md5 = new Md5();
md5.appendByteArray(new Uint8Array(arrayBuffer));
const checksum = md5.end() as string;
```

### Get File Service Base URL

```typescript
import { getZerobiasURL } from '@zerobias-com/zerobias-client'; // or zb-client-lib-js

const fileServiceUrl = getZerobiasURL('file-service', true, environment.isLocalDev, true);
// Returns URL object — same-origin via window.location (no CORS preflight)
```

### Other FileApi Methods

| Method | Signature | Notes |
|--------|-----------|-------|
| `get(id)` | `→ FileView` | Get metadata (name, size, mimeType, etc.) |
| `getFileStatus(id)` | `→ FileStatus` | Processing status |
| `update(id, updateFile)` | `→ FileView` | Update name, tags, keywords, folderId, retention |
| `delete(id, deleteContents?)` | `→ void` | `deleteContents=true` removes from S3 |
| `download(id)` | `→ RequestFile` | Download binary. Accepts fileId, fileVersionId, or fileContentVersionId |
| `view(id)` | `→ RequestFile` | Browser-viewable content (beautified JSON/YAML/etc.) |
| `viewRaw(id)` | `→ RequestFile` | Raw content |
| `listVersions(id, page, size)` | `→ PagedResults<FileView>` | Version history |
| `listShares(id, page, size, filter?)` | `→ PagedResults<Share>` | File shares |
| `copy(copyFile)` | `→ CopyFileJob` | Copy from remote system |

### View URL Construction

```typescript
// For iframe preview / "open in new tab"
const viewUrl = getZerobiasURL(
  `file-service/files/${fileVersionId}/view`,
  true, environment.isLocalDev, true
);
```

## FolderApi Operations

| Method | Signature | Notes |
|--------|-----------|-------|
| `create({ name, description?, folderId? })` | `→ Folder` | `folderId` = parent (omit for root) |
| `get(id)` | `→ Folder` | |
| `delete(id, recursive?, deleteContents?)` | `→ void` | |
| `listChildren(id, page, size)` | `→ PagedResults<FolderChild>` | Files + subfolders |
| `listRootChildren(page, size)` | `→ PagedResults<FolderChild>` | Org's root folder contents |

### Ensure Folder Exists (Pattern from ZB UI)

```typescript
async ensureFolder(folderName: string): Promise<UUID> {
  // Search for existing folder by name
  const folders = await fileClient.getResourceApi().searchResources(
    undefined, undefined,
    [folderName],           // keywords
    undefined,
    [new Nmtoken('folder')] // resource type filter
  );
  const existing = folders.items.find(f => f.name === folderName);
  if (existing) return existing.id;

  // Create if not found
  const folder = await fileClient.getFolderApi().create({ name: folderName });
  return folder.id;
}
```

## Task Attachment Operations

### Add Attachment to Task

```typescript
import { NewTaskAttachment } from '@zerobias-com/platform-sdk';

const attachment: TaskAttachment = await platformClient.getTaskApi().addAttachment(
  toUUID(taskId),
  {
    fileVersionId: toUUID(fileVersionId),  // required — from upload response
    commentId?: toUUID(commentId),         // optional — attach to existing comment
    commentTxt?: 'Uploaded exhibit-f.pdf', // optional — create new comment with text
    commentMarkdown?: '**Uploaded** ...',  // optional — create new comment with markdown
  }
);
// Idempotent: re-submitting same fileVersionId + taskId updates existing attachment
// If no commentId/commentTxt/commentMarkdown: auto-creates default comment
```

### List Task Attachments

```typescript
const paged: PagedResults<TaskAttachment> = await platformClient.getTaskApi().listAttachments(
  toUUID(taskId),
  1,     // pageNumber (1-indexed)
  50     // pageSize
);
// Each TaskAttachment has: { id, taskId, commentId, fileVersionId, fileMetadata, created, updated }
// fileMetadata includes: { name, size, mimeType, ... }
```

## Reference Implementation: ZB UI neverfail-lib

**Source:** `~/Projects/zb/ui/projects/neverfail-lib/src/lib/`

### Key Files

| File | Purpose |
|------|---------|
| `components/file-upload/file-upload.component.ts` | Drag-drop + browse upload with progress bars |
| `components/file-upload/file-upload.component.html` | Upload zone template (hidden input + DnD area + file list) |
| `zerobias-dialogs/file-upload-dialog/file-upload-dialog.component.ts` | Dialog wrapper around `zb-file-upload` |
| `zerobias-services/files/files.service.ts` | Angular service wrapping FileService SDK |
| `zerobias-services/types/FileUploadTypes.ts` | `ReadFile` interface, `FILE_BROWSE_MODE` enum |
| `components/zerobias-task-components/task-panel/task-attachements-panel/` | Task attachments display with preview, download, resize |

### Upload Component Pattern

The `zb-file-upload` component:
1. Hidden `<input type="file">` + "Browse" button trigger
2. `@HostListener('dragover'/'dragleave'/'drop')` for drag-and-drop
3. `FileReader.readAsArrayBuffer()` → MD5 checksum via `ts-md5`
4. `filesService.create()` → creates file metadata in FileService
5. `HttpClient.post()` to `/files/{id}/upload?checksum={md5}` with `reportProgress: true`
6. Progress tracked per file via `HttpEventType.UploadProgress`
7. On complete: emits `fileUploaded` with array of file versions
8. `filesUploading` emits boolean (true while any file still uploading)

### Task Attachments Panel Pattern

The `zb-task-attachements-panel` component:
1. Toggle upload section via "+" button in panel header
2. Embeds `<zb-file-upload [folderNames]="['TaskAttachments']">` for upload
3. On upload complete: creates task comment → calls `addAttachment()` for each file
4. Displays attachments list with: file icon (by mimeType), name, size, date
5. Actions per attachment: preview (iframe), open in new tab, download
6. Preview iframe uses `fileservice /files/{id}/view` URL with resizable height
7. `isPreviewable()` checks mimeType: images, video, audio, PDF, text/*, JSON, YAML, XML, XLSX

### File Preview Implementation

The ZB UI task-attachments panel provides in-place file preview via iframe + FileService `/view` endpoint.

**State management (per-attachment, by ID string):**

```typescript
// Toggle which attachments have their preview expanded
expandedPreviews: Record<string, boolean> = {};

// Per-attachment preview height (resizable)
previewHeights: Record<string, number> = {};

// Cached view URLs (built once on list load)
viewUrls: Record<string, string> = {};

// Cached previewable flags (checked once per attachment)
previewableCache: Record<string, boolean> = {};

readonly DEFAULT_PREVIEW_HEIGHT = 250;
private readonly MIN_PREVIEW_HEIGHT = 100;
private readonly MAX_PREVIEW_HEIGHT = 800;
```

**Build view URLs on attachment list load:**

```typescript
private rebuildViewUrls(): void {
  this.viewUrls = {};
  this.previewableCache = {};
  if (this.pagedAttachments?.items) {
    this.pagedAttachments.items.forEach((attachment) => {
      const id = attachment.id.toString();
      this.viewUrls[id] = filesService.getViewUrl(attachment.fileVersionId).toString();
      this.previewableCache[id] = this.isPreviewable(attachment.fileMetadata?.mimeType?.toString());
    });
  }
}
```

**Preview iframe template:**

```html
<!-- Toggle button (only for previewable types) -->
@if (previewableCache['' + attachment.id]) {
  <button mat-icon-button (click)="togglePreview(attachment)">
    <mat-icon class="s16">{{ expandedPreviews['' + attachment.id] ? 'visibility_off' : 'visibility' }}</mat-icon>
  </button>
  <button mat-icon-button (click)="openInNewTab(attachment)">
    <mat-icon class="s16">open_in_new</mat-icon>
  </button>
}

<!-- Preview panel with resizable iframe -->
@if (previewableCache['' + attachment.id] && expandedPreviews['' + attachment.id]) {
  <div class="preview-panel">
    <iframe
      [src]="viewUrls['' + attachment.id] | safeResourceUrl"
      class="preview-iframe"
      [style.height.px]="previewHeights['' + attachment.id] ?? DEFAULT_PREVIEW_HEIGHT">
    </iframe>
    <div class="resize-handle" (mousedown)="onResizeStart($event, attachment)">
      <div class="resize-grip"></div>
    </div>
  </div>
}
```

**Resize handle (drag to adjust preview height):**

```typescript
onResizeStart(event: MouseEvent, attachment: TaskAttachment): void {
  event.preventDefault();
  const id = attachment.id.toString();
  this.resizing = true;
  this.resizeAttachmentId = id;
  this.resizeStartY = event.clientY;
  this.resizeStartHeight = this.previewHeights[id] ?? this.DEFAULT_PREVIEW_HEIGHT;
  document.addEventListener('mousemove', this.onResizeMove);
  document.addEventListener('mouseup', this.onResizeEnd);
}

private onResizeMove = (event: MouseEvent): void => {
  if (!this.resizing) return;
  const deltaY = event.clientY - this.resizeStartY;
  let newHeight = Math.max(MIN, Math.min(MAX, this.resizeStartHeight + deltaY));
  this.previewHeights = { ...this.previewHeights, [this.resizeAttachmentId]: newHeight };
  this.cdr.detectChanges();
};

private onResizeEnd = (): void => {
  this.resizing = false;
  document.removeEventListener('mousemove', this.onResizeMove);
  document.removeEventListener('mouseup', this.onResizeEnd);
};
```

**`safeResourceUrl` pipe required** — iframe `[src]` binding needs `DomSanitizer.bypassSecurityTrustResourceUrl()`. The ZB UI uses a `safeResourceUrl` pipe for this.

**Open in new tab:**

```typescript
openInNewTab(attachment: TaskAttachment): void {
  window.open(this.viewUrls[attachment.id.toString()], '_blank');
}
```

### Previewable MIME Types

FileService beautifies: JSON, YAML, CSS, XML, Markdown, XLSX, HTML
Browser handles natively: `image/*`, `video/*`, `audio/*`, `application/pdf`, `text/*`

### File Icon Mapping (Material Icons)

| MIME Pattern | Icon |
|---|---|
| `image/*` | `image` |
| `video/*` | `videocam` |
| `audio/*` | `audiotrack` |
| `*pdf*` | `picture_as_pdf` |
| `*spreadsheet*`, `*excel*`, `*csv*` | `table_chart` |
| `*document*`, `*word*`, `*text*` | `description` |
| `*presentation*`, `*powerpoint*` | `slideshow` |
| `*zip*`, `*archive*` | `folder_zip` |
| `*json*`, `*xml*`, `*javascript*` | `code` |
| default | `insert_drive_file` |

### File Size Formatting

```typescript
formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}
```

## ZB MCP Operations (for testing/prototyping)

| Operation | MCP Path |
|---|---|
| Upload local file | `zerobias_upload_file({ filePath, name?, description?, folderId? })` |
| Create file metadata | `fileservice.File.create` |
| Get file metadata | `fileservice.File.get` |
| Update file | `fileservice.File.update` |
| Delete file | `fileservice.File.delete` |
| Download file | `fileservice.File.download` |
| View file | `fileservice.File.view` / `viewRaw` |
| List versions | `fileservice.File.listVersions` |
| Create folder | `fileservice.Folder.create` |
| List folder children | `fileservice.Folder.listChildren` |
| List root children | `fileservice.Folder.listRootChildren` |
| Get folder | `fileservice.Folder.get` |
| Delete folder | `fileservice.Folder.delete` |
| Add task attachment | `platform.Task.addAttachment` |
| List task attachments | `platform.Task.listAttachments` |
| Tag resource | `fileservice.Resource.tagResource` |
| Untag resource | `fileservice.Resource.untagResource` |
| Search resources | `fileservice.Resource.searchResources` |
