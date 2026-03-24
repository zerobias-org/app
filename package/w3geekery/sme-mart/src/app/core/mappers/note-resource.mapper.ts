import type { Note, NoteFolder, SmeMartResource } from '../models';

/** Map a Note to SmeMartResource */
export function noteToResource(note: Note): SmeMartResource {
  return {
    id: note.id,
    name: note.title,
    type: 'sme-mart:note',
    ownerId: note.author_zerobias_user_id,
    created: note.created_at,
    updated: note.updated_at,
    description: note.body?.slice(0, 500) ?? null,
    parentId: note.folder_id,
    deleted: note.archived ? note.updated_at : null,
    boundaryId: note.boundary_id,
    engagementId: note.engagement_id,
    projectId: note.project_id,
  };
}

/** Map a NoteFolder to SmeMartResource */
export function noteFolderToResource(folder: NoteFolder): SmeMartResource {
  return {
    id: folder.id,
    name: folder.name,
    type: 'sme-mart:note-folder',
    ownerId: folder.created_by_zerobias_user_id,
    created: folder.created_at,
    updated: folder.updated_at,
    description: folder.description,
    parentId: folder.parent_id,
    deleted: null,
    boundaryId: null,
    engagementId: folder.engagement_id,
    projectId: null,
  };
}
