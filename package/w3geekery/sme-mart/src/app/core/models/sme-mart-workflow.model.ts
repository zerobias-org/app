/**
 * SmeMartWorkflow model interfaces
 *
 * SmeMartWorkflow defines statuses and transitions for activities.
 */

import type { SmeMartWorkflowStatus, SmeMartWorkflowTransition } from '../gql-types/sme-mart-workflow.types';

export interface SmeMartWorkflow {
  id: string;
  name: string;
  statuses?: SmeMartWorkflowStatus[];
  transitions?: SmeMartWorkflowTransition[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateSmeMartWorkflowRequest {
  name: string;
  statuses?: SmeMartWorkflowStatus[];
  transitions?: SmeMartWorkflowTransition[];
}

export interface UpdateSmeMartWorkflowRequest {
  name?: string;
  statuses?: SmeMartWorkflowStatus[];
  transitions?: SmeMartWorkflowTransition[];
}
