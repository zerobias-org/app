/**
 * Field Mapping Constants for SME Mart Entity Migration
 *
 * Maps Neon PostgreSQL column names (snake_case) to GraphQL response field names (camelCase).
 * Used during Neon → AuditgraphDB pipeline ingestion and GQL response parsing.
 *
 * Schema Source: zerobias-org/schema PR #7 (w3geekery.sme-mart.schema)
 * Last Verified: 2026-03-18
 */

/**
 * Engagement field mapping (formerly WorkRequest in Neon)
 *
 * Neon table: work_requests (columns in snake_case)
 * GQL entity: Engagement (fields in camelCase)
 * Key rename: WorkRequest → Engagement (business alignment with "Engagement" terminology)
 * Field rename: title → name (GQL entity uses 'name' field inherited from Object base class)
 */
export const ENGAGEMENT_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    title: 'name', // WorkRequest.title → Engagement.name (Object inherited field)
    description: 'description',
    category: 'category',
    buyer_zerobias_user_id: 'buyerZerobiasUserId',
    buyer_zerobias_org_id: 'buyerZerobiasOrgId',
    budget_type: 'budgetType',
    budget_min: 'budgetMin',
    budget_max: 'budgetMax',
    timeline: 'timeline',
    status: 'status',
    engagement_tag: 'engagementTag',
    zerobias_tag_id: 'zerobiasTagId',
    zerobias_boundary_id: 'zerobiasTagId', // Link to platform boundary
    zerobias_task_id: 'zerobiasTaskId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    name: 'title',
    description: 'description',
    category: 'category',
    buyerZerobiasUserId: 'buyer_zerobias_user_id',
    buyerZerobiasOrgId: 'buyer_zerobias_org_id',
    budgetType: 'budget_type',
    budgetMin: 'budget_min',
    budgetMax: 'budget_max',
    timeline: 'timeline',
    status: 'status',
    engagementTag: 'engagement_tag',
    zerobiasTagId: 'zerobias_tag_id',
    zerobiasTaskId: 'zerobias_task_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // Object base class date fields (GQL uses these names)
    dateCreated: 'created_at',
    dateLastModified: 'updated_at',
  },
  sourceSchema: 'zerobias-org/schema PR #7',
  lastVerified: '2026-03-18',
} as const;

/**
 * Bid field mapping
 *
 * Neon table: bids (columns in snake_case)
 * GQL entity: Bid (formerly called Proposal in schema, but code uses Bid)
 * JSON fields: pricing_breakdown → needs JSON.parse() on read, JSON.stringify() on write
 */
export const BID_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    request_id: 'engagementId', // Foreign key to Engagement
    provider_id: 'providerId',
    cover_letter: 'coverLetter',
    proposed_price: 'proposedPrice',
    proposed_timeline: 'proposedTimeline',
    executive_summary: 'executiveSummary',
    team_description: 'teamDescription',
    total_estimated_hours: 'totalEstimatedHours',
    pricing_breakdown: 'pricingBreakdown', // JSON array — needs parsing
    status: 'status',
    wizard_data: 'wizardData', // JSON object — needs parsing
    wizard_step: 'wizardStep',
    ai_assisted: 'aiAssisted',
    ai_model: 'aiModel',
    ai_generated_at: 'aiGeneratedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    engagementId: 'request_id',
    providerId: 'provider_id',
    coverLetter: 'cover_letter',
    proposedPrice: 'proposed_price',
    proposedTimeline: 'proposed_timeline',
    executiveSummary: 'executive_summary',
    teamDescription: 'team_description',
    totalEstimatedHours: 'total_estimated_hours',
    pricingBreakdown: 'pricing_breakdown',
    status: 'status',
    wizardData: 'wizard_data',
    wizardStep: 'wizard_step',
    aiAssisted: 'ai_assisted',
    aiModel: 'ai_model',
    aiGeneratedAt: 'ai_generated_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  sourceSchema: 'zerobias-org/schema PR #7',
  lastVerified: '2026-03-18',
} as const;

/**
 * BidResponse field mapping
 *
 * Neon table: bid_responses (columns in snake_case)
 * GQL entity: BidResponse (response to a requirement in a bid)
 * Enum field: compliance_status (values: 'met', 'partially_met', 'not_met', 'not_applicable', 'planned')
 */
export const BID_RESPONSE_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    bid_id: 'bidId',
    requirement_id: 'requirementId',
    compliance_status: 'complianceStatus',
    response_text: 'responseText',
    estimated_hours: 'estimatedHours',
    estimated_cost: 'estimatedCost',
    certification_ref: 'certificationRef',
    ready_date: 'readyDate',
    responded_at: 'respondedAt',
    updated_at: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    bidId: 'bid_id',
    requirementId: 'requirement_id',
    complianceStatus: 'compliance_status',
    responseText: 'response_text',
    estimatedHours: 'estimated_hours',
    estimatedCost: 'estimated_cost',
    certificationRef: 'certification_ref',
    readyDate: 'ready_date',
    respondedAt: 'responded_at',
    updatedAt: 'updated_at',
  },
  sourceSchema: 'zerobias-org/schema PR #7',
  lastVerified: '2026-03-18',
} as const;

/**
 * Note field mapping
 *
 * Neon table: notes (columns in snake_case)
 * GQL entity: Note
 * Access level enum: 'personal' | 'boundary' | 'project'
 * Relationship: folder_id → folder (bidirectional linkTo NoteFolder.id.notes)
 */
export const NOTE_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    engagement_id: 'engagementId',
    folder_id: 'folderId',
    title: 'title', // Note uses 'title' (not 'name' like Engagement)
    body: 'body', // Note content stored as 'body'
    author_zerobias_user_id: 'authorZerobiasUserId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    updated_by_zerobias_user_id: 'updatedByZerobiasUserId',
    archived: 'archived',
    access_level: 'accessLevel',
    meeting_date: 'meetingDate',
    meeting_duration_minutes: 'meetingDurationMinutes',
    backing_task_id: 'backingTaskId',
    injected_to_task_id: 'injectedToTaskId',
    injected_comment_id: 'injectedCommentId',
    injected_at: 'injectedAt',
    is_meeting_minutes: 'isMeetingMinutes',
    boundary_id: 'boundaryId',
    project_id: 'projectId',
  },
  gqlToNeon: {
    id: 'id',
    engagementId: 'engagement_id',
    folderId: 'folder_id',
    title: 'title',
    body: 'body',
    authorZerobiasUserId: 'author_zerobias_user_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    updatedByZerobiasUserId: 'updated_by_zerobias_user_id',
    archived: 'archived',
    accessLevel: 'access_level',
    meetingDate: 'meeting_date',
    meetingDurationMinutes: 'meeting_duration_minutes',
    backingTaskId: 'backing_task_id',
    injectedToTaskId: 'injected_to_task_id',
    injectedCommentId: 'injected_comment_id',
    injectedAt: 'injected_at',
    isMeetingMinutes: 'is_meeting_minutes',
    boundaryId: 'boundary_id',
    projectId: 'project_id',
  },
  sourceSchema: 'zerobias-org/schema PR #7',
  lastVerified: '2026-03-18',
} as const;

/**
 * NoteFolder field mapping
 *
 * Neon table: note_folders (columns in snake_case)
 * GQL entity: NoteFolder (hierarchical structure for notes)
 * Relationship: parent_id → parent (bidirectional linkTo NoteFolder.id.children)
 * Relationship: children (reverse of parent_id, multi: true)
 */
export const NOTE_FOLDER_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    engagement_id: 'engagementId',
    parent_id: 'parentId',
    name: 'name',
    description: 'description',
    created_by_zerobias_user_id: 'createdByZerobiasUserId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    access_level: 'accessLevel',
    sort_order: 'sortOrder',
    color: 'color',
  },
  gqlToNeon: {
    id: 'id',
    engagementId: 'engagement_id',
    parentId: 'parent_id',
    name: 'name',
    description: 'description',
    createdByZerobiasUserId: 'created_by_zerobias_user_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    accessLevel: 'access_level',
    sortOrder: 'sort_order',
    color: 'color',
  },
  sourceSchema: 'zerobias-org/schema PR #7',
  lastVerified: '2026-03-18',
} as const;

/**
 * ServiceOffering field mapping
 *
 * Neon table: service_offerings (columns in snake_case)
 * GQL entity: ServiceOffering (provider catalog listing)
 * Key rename: title → name (GQL entity uses 'name' field inherited from Object base class)
 * Enum field: pricing_type (PricingType enum)
 * Array field: includes (string array of service inclusions)
 */
export const SERVICE_OFFERING_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    provider_id: 'providerId',
    title: 'name', // ServiceOffering.title → name (Object inherited field)
    description: 'description',
    category: 'category',
    subcategory: 'subcategory',
    pricing_type: 'pricingType',
    price: 'price',
    delivery_time: 'deliveryTime',
    includes: 'includes', // Array of strings
    requirements: 'requirements',
    is_active: 'isActive',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    providerId: 'provider_id',
    name: 'title',
    description: 'description',
    category: 'category',
    subcategory: 'subcategory',
    pricingType: 'pricing_type',
    price: 'price',
    deliveryTime: 'delivery_time',
    includes: 'includes',
    requirements: 'requirements',
    isActive: 'is_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  sourceSchema: 'zerobias-org/schema PR #7',
  lastVerified: '2026-03-18',
} as const;

/**
 * Review field mapping
 *
 * Neon table: reviews (columns in snake_case)
 * GQL entity: Review (post-engagement provider review/rating)
 * Relationship: request_id → engagement (linkTo Engagement.id.reviews)
 */
export const REVIEW_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    provider_id: 'providerId',
    reviewer_zerobias_user_id: 'reviewerZerobiasUserId',
    request_id: 'engagementId',
    rating: 'rating',
    review_text: 'reviewText',
    approved: 'approved',
    approved_at: 'approvedAt',
    approved_by: 'approvedBy',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    providerId: 'provider_id',
    reviewerZerobiasUserId: 'reviewer_zerobias_user_id',
    engagementId: 'request_id',
    rating: 'rating',
    reviewText: 'review_text',
    approved: 'approved',
    approvedAt: 'approved_at',
    approvedBy: 'approved_by',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  sourceSchema: 'zerobias-org/schema PR #7',
  lastVerified: '2026-03-18',
} as const;

/**
 * SmeMartDocument field mapping
 *
 * Neon table: engagement_documents (columns in snake_case)
 * GQL entity: SmeMartDocument (extends File — inherits fileVersionId, size, mimeType, downloadUrl)
 * Relationship: engagement_id → engagement (linkTo Engagement.id.documents)
 * File identity: zb_file_id, zb_file_version_id (from ZB FileService)
 */
export const DOCUMENT_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    engagement_id: 'engagementId',
    zb_file_id: 'zbFileId',
    zb_file_version_id: 'zbFileVersionId',
    filename: 'filename',
    mime_type: 'mimeType',
    file_size_bytes: 'fileSizeBytes',
    document_type: 'documentType',
    display_name: 'displayName',
    description: 'description',
    zb_task_id: 'zbTaskId',
    zb_task_attachment_id: 'zbTaskAttachmentId',
    uploaded_by_zerobias_user_id: 'uploadedByZerobiasUserId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    archived: 'archived',
  },
  gqlToNeon: {
    id: 'id',
    engagementId: 'engagement_id',
    zbFileId: 'zb_file_id',
    zbFileVersionId: 'zb_file_version_id',
    filename: 'filename',
    mimeType: 'mime_type',
    fileSizeBytes: 'file_size_bytes',
    documentType: 'document_type',
    displayName: 'display_name',
    description: 'description',
    zbTaskId: 'zb_task_id',
    zbTaskAttachmentId: 'zb_task_attachment_id',
    uploadedByZerobiasUserId: 'uploaded_by_zerobias_user_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    archived: 'archived',
  },
  sourceSchema: 'zerobias-org/schema PR #7',
  lastVerified: '2026-03-18',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions for Bidirectional Mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a Neon model (snake_case fields) to a GQL response shape (camelCase fields).
 *
 * @param neonModel The Neon database entity with snake_case field names
 * @param fieldMapping The neonToGql mapping from a FIELD_MAPPING constant
 * @returns The transformed object with GQL camelCase field names
 *
 * @example
 * const neonWorkRequest = { id: '123', title: 'HIPAA Review', budget_min: '1000' };
 * const gqlData = mapNeonToGql<GqlEngagementResponse>(
 *   neonWorkRequest,
 *   ENGAGEMENT_FIELD_MAPPING.neonToGql
 * );
 * // gqlData.name === 'HIPAA Review', gqlData.budgetMin === '1000'
 */
export function mapNeonToGql<T = Record<string, unknown>>(
  neonModel: unknown,
  fieldMapping: Record<string, string>,
): T {
  const gqlData: Record<string, unknown> = {};
  const model = neonModel as Record<string, unknown>;

  for (const [neonField, gqlField] of Object.entries(fieldMapping)) {
    if (neonField in model) {
      gqlData[gqlField] = model[neonField];
    }
  }

  return gqlData as T;
}

/**
 * Maps a GQL response (camelCase fields) back to a Neon model shape (snake_case fields).
 *
 * Used during the roundtrip validation: GQL → Neon to ensure no field loss.
 *
 * @param gqlModel The GQL response with camelCase field names
 * @param fieldMapping The gqlToNeon mapping from a FIELD_MAPPING constant
 * @returns The transformed object with Neon snake_case field names
 *
 * @example
 * const gqlData = { id: '123', name: 'HIPAA Review', budgetMin: '1000' };
 * const neonData = mapGqlToNeon(gqlData, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
 * // neonData.title === 'HIPAA Review', neonData.budget_min === '1000'
 */
export function mapGqlToNeon<T = Record<string, unknown>>(
  gqlModel: unknown,
  fieldMapping: Record<string, string>,
): T {
  const neonData: Record<string, unknown> = {};
  const model = gqlModel as Record<string, unknown>;

  for (const [gqlField, neonField] of Object.entries(fieldMapping)) {
    if (gqlField in model) {
      neonData[neonField] = model[gqlField];
    }
  }

  return neonData as T;
}

/**
 * SmeMartProject field mapping (greenfield — no Neon table)
 *
 * GQL entity: SmeMartProject (container entity for Project Bloom)
 * Model type: SmeMartProject (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const SME_MART_PROJECT_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    name: 'name',
    description: 'description',
    status: 'status',
    startDate: 'startDate',
    targetEndDate: 'targetEndDate',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    name: 'name',
    description: 'description',
    status: 'status',
    startDate: 'startDate',
    targetEndDate: 'targetEndDate',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-19',
} as const;

/**
 * SmeMartBoard field mapping (greenfield — no Neon table)
 *
 * GQL entity: SmeMartBoard (structural container within Project)
 * Model type: SmeMartBoard (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const SME_MART_BOARD_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    code: 'code',
    name: 'name',
    scope: 'scope',
    partition: 'partition',
    parentId: 'parentId',
    description: 'description',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    code: 'code',
    name: 'name',
    scope: 'scope',
    partition: 'partition',
    parentId: 'parentId',
    description: 'description',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-19',
} as const;

/**
 * SmeMartActivity field mapping (greenfield — no Neon table)
 *
 * GQL entity: SmeMartActivity (work type blueprint within Board)
 * Model type: SmeMartActivity (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const SME_MART_ACTIVITY_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    name: 'name',
    type: 'type',
    workflowId: 'workflowId',
    customFields: 'customFields',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    name: 'name',
    type: 'type',
    workflowId: 'workflowId',
    customFields: 'customFields',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-19',
} as const;

/**
 * SmeMartWorkflow field mapping (greenfield — no Neon table)
 *
 * GQL entity: SmeMartWorkflow (statuses and transitions template)
 * Model type: SmeMartWorkflow (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const SME_MART_WORKFLOW_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    name: 'name',
    statuses: 'statuses',
    transitions: 'transitions',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    name: 'name',
    statuses: 'statuses',
    transitions: 'transitions',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-19',
} as const;

/**
 * SmeMartTask field mapping (greenfield — no Neon table)
 *
 * GQL entity: SmeMartTask (hierarchical tasks within Board)
 * Model type: SmeMartTask (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const SME_MART_TASK_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    boardId: 'boardId',
    parentId: 'parentId',
    name: 'name',
    code: 'code',
    status: 'status',
    rank: 'rank',
    priority: 'priority',
    description: 'description',
    dueDate: 'dueDate',
    activityId: 'activityId',
    customFields: 'customFields',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    boardId: 'boardId',
    parentId: 'parentId',
    name: 'name',
    code: 'code',
    status: 'status',
    rank: 'rank',
    priority: 'priority',
    description: 'description',
    dueDate: 'dueDate',
    activityId: 'activityId',
    customFields: 'customFields',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-19',
} as const;

/**
 * ProjectPrd field mapping (greenfield — no Neon table)
 *
 * GQL entity: ProjectPrd (project requirements document container)
 * Model type: ProjectPrd (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const PROJECT_PRD_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    parentId: 'parentId',
    title: 'title',
    summary: 'summary',
    sourceDocuments: 'sourceDocuments',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    parentId: 'parentId',
    title: 'title',
    summary: 'summary',
    sourceDocuments: 'sourceDocuments',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-19',
} as const;

/**
 * PrdSection field mapping (greenfield — no Neon table)
 *
 * GQL entity: PrdSection (section within a ProjectPrd)
 * Model type: PrdSection (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const PRD_SECTION_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    parentId: 'parentId',
    type: 'type',
    content: 'content',
    sortOrder: 'sortOrder',
    sourceDocuments: 'sourceDocuments',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    parentId: 'parentId',
    type: 'type',
    content: 'content',
    sortOrder: 'sortOrder',
    sourceDocuments: 'sourceDocuments',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-19',
} as const;

/**
 * ProjectPlan field mapping (greenfield — no Neon table)
 *
 * GQL entity: ProjectPlan (project execution plan container)
 * Model type: ProjectPlan (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const PROJECT_PLAN_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    parentId: 'parentId',
    title: 'title',
    approach: 'approach',
    estimatedDuration: 'estimatedDuration',
    teamStructure: 'teamStructure',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    parentId: 'parentId',
    title: 'title',
    approach: 'approach',
    estimatedDuration: 'estimatedDuration',
    teamStructure: 'teamStructure',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-19',
} as const;

/**
 * PlanMilestone field mapping (greenfield — no Neon table)
 *
 * GQL entity: PlanMilestone (milestone within a ProjectPlan)
 * Model type: PlanMilestone (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const PLAN_MILESTONE_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    parentId: 'parentId',
    name: 'name',
    targetDate: 'targetDate',
    status: 'status',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    parentId: 'parentId',
    name: 'name',
    targetDate: 'targetDate',
    status: 'status',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-19',
} as const;

/**
 * All field mapping constants exported as a single object for easier iteration.
 */
export const ALL_FIELD_MAPPINGS = {
  Engagement: ENGAGEMENT_FIELD_MAPPING,
  Bid: BID_FIELD_MAPPING,
  BidResponse: BID_RESPONSE_FIELD_MAPPING,
  Note: NOTE_FIELD_MAPPING,
  NoteFolder: NOTE_FOLDER_FIELD_MAPPING,
  ServiceOffering: SERVICE_OFFERING_FIELD_MAPPING,
  Review: REVIEW_FIELD_MAPPING,
  SmeMartDocument: DOCUMENT_FIELD_MAPPING,
  SmeMartProject: SME_MART_PROJECT_FIELD_MAPPING,
  SmeMartBoard: SME_MART_BOARD_FIELD_MAPPING,
  SmeMartActivity: SME_MART_ACTIVITY_FIELD_MAPPING,
  SmeMartWorkflow: SME_MART_WORKFLOW_FIELD_MAPPING,
  SmeMartTask: SME_MART_TASK_FIELD_MAPPING,
  ProjectPrd: PROJECT_PRD_FIELD_MAPPING,
  PrdSection: PRD_SECTION_FIELD_MAPPING,
  ProjectPlan: PROJECT_PLAN_FIELD_MAPPING,
  PlanMilestone: PLAN_MILESTONE_FIELD_MAPPING,
} as const;
