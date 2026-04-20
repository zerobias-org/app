// ── Core entities ──

export interface Note {
  id: string;
  engagement_id: string;
  folder_id: string | null;
  title: string;
  body: string;
  author_zerobias_user_id: string;
  created_at: string;
  updated_at: string;
  updated_by_zerobias_user_id: string | null;
  archived: boolean;
  access_level: NoteAccessLevel;
  meeting_date: string | null;
  meeting_duration_minutes: number | null;
  backing_task_id: string | null;
  injected_to_task_id: string | null;
  injected_comment_id: string | null;
  injected_at: string | null;
  is_meeting_minutes: boolean;
  boundary_id: string | null;
  project_id: string | null;
}

/** View row from v_notes_with_tags */
export interface NoteWithTags extends Note {
  tags: string | null;
  tag_count: number;
  folder_color: string | null;
  folder_name: string | null;
}

export interface NoteFolder {
  id: string;
  engagement_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  created_by_zerobias_user_id: string;
  created_at: string;
  updated_at: string;
  access_level: NoteAccessLevel;
  sort_order: number;
  color: string | null;
}

/** View row from v_note_folders_with_counts */
export interface NoteFolderWithCounts extends NoteFolder {
  note_count: number;
  subfolder_count: number;
}

export interface NoteTag {
  id: string;
  engagement_id: string;
  name: string;
  created_by_zerobias_user_id: string;
  created_at: string;
  usage_count: number;
}

export interface NoteTagAssignment {
  note_id: string;
  tag_id: string;
  assigned_at: string;
}

// ── Request types ──

export type NoteAccessLevel = 'personal' | 'boundary' | 'project';

export interface CreateNoteRequest {
  title: string;
  body: string;
  folder_id?: string | null;
  access_level?: NoteAccessLevel;
  is_meeting_minutes?: boolean;
  meeting_date?: string | null;
  meeting_duration_minutes?: number | null;
  boundary_id?: string | null;
  project_id?: string | null;
}

export interface UpdateNoteRequest {
  title?: string;
  body?: string;
  folder_id?: string | null;
  access_level?: NoteAccessLevel;
  is_meeting_minutes?: boolean;
  meeting_date?: string | null;
  meeting_duration_minutes?: number | null;
}

export interface NoteFilterRequest {
  folderId?: string;
  authorIds?: string[];
  tagIds?: string[];
  dateRange?: { start: string; end: string };
  accessLevel?: NoteAccessLevel;
  isMeetingMinutes?: boolean;
}
