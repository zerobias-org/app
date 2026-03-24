/**
 * SmeMartBoard model interfaces
 *
 * SmeMartBoard is a structural container within SmeMartProject.
 */

export interface SmeMartBoard {
  id: string;
  code: string;
  name: string;
  scope: string;
  partition: string;
  parentId: string; // Reference to SmeMartProject
  description?: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateSmeMartBoardRequest {
  code: string;
  name: string;
  scope: string;
  partition: string;
  parentId: string; // Project ID
  description?: string;
}

export interface UpdateSmeMartBoardRequest {
  code?: string;
  name?: string;
  scope?: string;
  partition?: string;
  description?: string;
}
