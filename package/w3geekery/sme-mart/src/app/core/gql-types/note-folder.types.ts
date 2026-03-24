/**
 * GQL Response Types for NoteFolder entity
 *
 * NoteFolder provides hierarchical organization for notes within an engagement.
 * Supports parent-child relationships (nested folders) and contains Note children.
 */

// Forward declare to avoid circular dependency
type GqlNoteResponse = any;

/**
 * GQL NoteFolder response type
 *
 * Extends Object base class (inherited fields: id, description, tags, links, dates)
 * Links to: NoteFolder (parent), NoteFolder (children), Note (contained notes)
 */
export interface GqlNoteFolderResponse {
  // Object inherited fields
  id: string;
  name: string; // Folder name/title
  description?: string;

  // NoteFolder-specific fields
  engagementId: string; // Foreign key to Engagement
  parentId?: string | null; // Parent folder (for nested structure)
  createdByZerobiasUserId: string;
  accessLevel: string; // Same as Note access level
  sortOrder: number; // Display order within parent
  color?: string | null; // Folder display color (hex code)

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  parent?: GqlNoteFolderResponse; // Parent folder (if queried)
  children?: GqlNoteFolderResponse[]; // Child folders (if queried, multi)
  notes?: GqlNoteResponse[]; // Contained notes (if queried, multi)
}
