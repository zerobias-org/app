/**
 * GQL Response Types for Note entity
 *
 * Note represents a rich-text engagement note (comment, meeting minutes, etc.)
 * Can be organized into hierarchical folders.
 */

// Forward declare to avoid circular dependencies
type GqlNoteFolderResponse = any;
type GqlEngagementResponse = any;

/**
 * Note access level enumeration
 */
export type NoteAccessLevel = 'personal' | 'boundary' | 'project';

/**
 * GQL Note response type
 *
 * Extends Object base class (inherited fields: id, description, tags, links, dates)
 * Links to: NoteFolder (parent), Engagement, Task (backing task if applicable)
 */
export interface GqlNoteResponse {
  // Object inherited fields
  id: string;
  name: string;          // Object base class — used as note title
  description?: string;
  content: string;       // Custom property — rich-text note body
  engagementId: string; // Foreign key to Engagement
  folderId?: string | null; // Foreign key to NoteFolder (optional)
  authorZerobiasUserId: string;
  updatedByZerobiasUserId?: string | null;
  archived: boolean;
  accessLevel: NoteAccessLevel;

  // Meeting minutes metadata
  isMeetingMinutes: boolean;
  meetingDate?: string | null; // ISO 8601
  meetingDurationMinutes?: number | null;

  // Task integration (Plan 035)
  backingTaskId?: string | null; // Link to ZB Task
  injectedToTaskId?: string | null; // Task that received injected comment
  injectedCommentId?: string | null; // Task comment ID
  injectedAt?: string | null; // ISO 8601 when injected

  // Scope (future expansion)
  boundaryId?: string | null;
  projectId?: string | null;

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  folder?: GqlNoteFolderResponse; // Parent folder (if queried)
  engagement?: GqlEngagementResponse; // Engagement context (if queried)
}
