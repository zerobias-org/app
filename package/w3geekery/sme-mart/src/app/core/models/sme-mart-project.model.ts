/**
 * SmeMartProject model interfaces
 *
 * SmeMartProject is the top-level container for Project Bloom work.
 */

export interface SmeMartProject {
  id: string;
  name: string;
  description?: string | null;
  status: string; // 'draft', 'active', 'completed', 'archived'
  startDate: string; // ISO 8601
  targetEndDate?: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateSmeMartProjectRequest {
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  targetEndDate?: string;
}

export interface UpdateSmeMartProjectRequest {
  name?: string;
  description?: string;
  status?: string;
  targetEndDate?: string;
}
