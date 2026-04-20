/**
 * SmeMartActivity model interfaces
 *
 * SmeMartActivity represents a work type blueprint within SmeMartBoard.
 */

import type { SmeMartCustomField } from '../gql-types/sme-mart-activity.types';

export interface SmeMartActivity {
  id: string;
  name: string;
  type: string;
  workflowId: string; // Reference to SmeMartWorkflow
  customFields?: SmeMartCustomField[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateSmeMartActivityRequest {
  name: string;
  type: string;
  workflowId: string;
  customFields?: SmeMartCustomField[];
}

export interface UpdateSmeMartActivityRequest {
  name?: string;
  type?: string;
  workflowId?: string;
  customFields?: SmeMartCustomField[];
}
