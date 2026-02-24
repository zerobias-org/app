# FileService SDK Patterns

Access via `sdk.fileService`. Full API: `node_modules/@zerobias-com/fileservice-sdk/generated/USAGE.md`

## File Operations (Deliverables)

```typescript
// Upload file with engagement tag
const file = await sdk.fileService.getFileApi().upload({
  file: fileBuffer,
  filename: 'deliverable.pdf',
  contentType: 'application/pdf',
  tags: [engagementTagId],
});

// Get file download URL
const downloadUrl = await sdk.fileService.getFileApi().getDownloadUrl(fileId);
```
