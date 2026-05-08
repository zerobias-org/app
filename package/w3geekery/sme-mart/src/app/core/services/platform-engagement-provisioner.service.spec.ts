import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { PlatformEngagementProvisioner } from './platform-engagement-provisioner.service';
import { PipelineWriteService, SME_MART_CLASS_IDS } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PlatformEngagementProvisioner', () => {
  let service: PlatformEngagementProvisioner;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };
  type ApiMock = ReturnType<typeof vi.fn>;
  let clientApiMock: {
    danaClient: { getOrgApi: () => { getOrg: ApiMock } };
    hydraClient: {
      getTagApi: () => { searchTags: ApiMock; createTag: ApiMock };
      getResourceApi: () => { tagResource: ApiMock; getResource: ApiMock };
    };
    platformClient: { getTaskApi: () => { create: ApiMock } };
  };

  const testOrgId = 'org-123';
  const testUserId = 'user-123';
  const testOrgPartyId = 'org-party-123';
  const testUserPartyId = 'user-party-123';
  const testOrgName = 'Test Org Inc.';
  const testOrgSlug = 'testorginc';
  const testTagId = 'tag-123';
  const testTaskId = 'task-123';

  const validInput = () => ({
    currentOrgId: testOrgId,
    currentOrgName: testOrgName,
    currentOrgSlug: testOrgSlug,
    buyerUserId: testUserId,
    assignedPartyId: testOrgPartyId,
    accountablePartyId: testUserPartyId,
  });

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    snackBarMock = { open: vi.fn() };

    // Build a minimal mock of ZerobiasClientApi with nested getters
    clientApiMock = {
      danaClient: {
        getOrgApi: vi.fn().mockReturnValue({
          getOrg: vi.fn().mockResolvedValue({ name: testOrgName }),
        }),
      },
      hydraClient: {
        getTagApi: vi.fn().mockReturnValue({
          searchTags: vi.fn(),
          createTag: vi.fn(),
        }),
        getResourceApi: vi.fn().mockReturnValue({
          tagResource: vi.fn(),
          getResource: vi.fn(),
        }),
      },
      platformClient: {
        getTaskApi: vi.fn().mockReturnValue({
          create: vi.fn(),
        }),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        PlatformEngagementProvisioner,
        { provide: ZerobiasClientApi, useValue: clientApiMock },
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    service = TestBed.inject(PlatformEngagementProvisioner);
  });

  describe('ensurePlatformEngagement', () => {
    it('Guard fires: 0 results from discovery query → all 5 calls execute → returns created: true', async () => {
      // Setup discovery query to return 0 results
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 10 },
      });

      const tagApi = clientApiMock.hydraClient.getTagApi();
      const resourceApi = clientApiMock.hydraClient.getResourceApi();
      const taskApi = clientApiMock.platformClient.getTaskApi();

      // Step A: Tag creation
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });

      // Step B: Task creation
      taskApi.create.mockResolvedValue({ id: testTaskId });

      // Step C & E: Pipeline writes
      pipelineWrite.pushEntities.mockResolvedValue(undefined);

      // Step D: Tag resource
      resourceApi.getResource.mockResolvedValue({ tags: [] });
      resourceApi.tagResource.mockResolvedValue(undefined);

      // Execute
      const result = await service.ensurePlatformEngagement(validInput());

      // Assert all calls made
      expect(tagApi.searchTags).toHaveBeenCalled();
      expect(tagApi.createTag).toHaveBeenCalled();
      expect(taskApi.create).toHaveBeenCalled();
      expect(pipelineWrite.pushEntities).toHaveBeenCalledTimes(2);
      expect(resourceApi.tagResource).toHaveBeenCalled();

      // Assert result
      expect(result.created).toBe(true);
      expect(result.engagementId).toBeTruthy();
      expect(result.projectId).toBeTruthy();
    });

    it('Guard skips: 1 result from discovery query → ZERO bootstrap calls → returns created: false', async () => {
      const existingEngagementId = 'engagement-456';

      // Setup discovery query to return 1 engagement
      graphqlRead.query.mockResolvedValue({
        items: [{ id: existingEngagementId, tag: [{ value: testTagId }] }],
        page: { pageNumber: 1, pageSize: 10 },
      });

      // Execute
      const result = await service.ensurePlatformEngagement(validInput());

      // Assert no bootstrap calls made
      expect(clientApiMock.hydraClient.getTagApi().searchTags).not.toHaveBeenCalled();
      expect(clientApiMock.hydraClient.getTagApi().createTag).not.toHaveBeenCalled();
      expect(clientApiMock.platformClient.getTaskApi().create).not.toHaveBeenCalled();
      expect(pipelineWrite.pushEntities).not.toHaveBeenCalled();
      expect(clientApiMock.hydraClient.getResourceApi().tagResource).not.toHaveBeenCalled();

      // Assert result
      expect(result.created).toBe(false);
      expect(result.engagementId).toBe(existingEngagementId);
    });

    it('Guard idempotent resume: existing tag probe skips create', async () => {
      // Setup discovery query to return 0 (Engagement doesn't exist yet)
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 10 },
      });

      const tagApi = clientApiMock.hydraClient.getTagApi();
      const resourceApi = clientApiMock.hydraClient.getResourceApi();
      const taskApi = clientApiMock.platformClient.getTaskApi();

      // Step A: Tag exists via probe
      tagApi.searchTags.mockResolvedValue({ items: [{ id: testTagId }] });
      // Step A create should NOT be called

      // Step B: Task creation
      taskApi.create.mockResolvedValue({ id: testTaskId });

      // Steps C & E: Pipeline writes
      pipelineWrite.pushEntities.mockResolvedValue(undefined);

      // Step D: Tag resource
      resourceApi.getResource.mockResolvedValue({ tags: [] });
      resourceApi.tagResource.mockResolvedValue(undefined);

      // Execute
      const result = await service.ensurePlatformEngagement(validInput());

      // Assert Step A probe fired but NOT create
      expect(tagApi.searchTags).toHaveBeenCalled();
      expect(tagApi.createTag).not.toHaveBeenCalled();

      // Assert other steps fired
      expect(taskApi.create).toHaveBeenCalled();
      expect(pipelineWrite.pushEntities).toHaveBeenCalledTimes(2);
      expect(resourceApi.tagResource).toHaveBeenCalled();

      // Assert result
      expect(result.created).toBe(true);
    });

    it('Error handling: Step A failure → console.warn + snackbar + re-throw', async () => {
      // Setup discovery query
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 10 },
      });

      const tagApi = clientApiMock.hydraClient.getTagApi();
      const testError = new Error('Tag creation failed');

      // Step A: Tag probe succeeds but create fails
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockRejectedValue(testError);

      const warnSpy = vi.spyOn(console, 'warn');

      // Execute and expect rejection
      let caught = false;
      try {
        await service.ensurePlatformEngagement(validInput());
      } catch (err) {
        caught = true;
        expect(err).toBe(testError);
      }

      expect(caught).toBe(true);

      // Assert snackbar opened with correct message
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Setup in progress — please retry in a moment.',
        'Dismiss',
        { duration: 5000 },
      );

      // Assert console.warn called
      expect(warnSpy).toHaveBeenCalledWith(
        '[PLATFORM_ENGAGEMENT_FAILURE]',
        expect.objectContaining({
          step: 'A',
          callSiteTag: 'platform-engagement:ensure-tag',
        }),
      );

      warnSpy.mockRestore();
    });

    it('Error handling: Step C failure (Pipeline) → snackbar + re-throw', async () => {
      // Setup discovery query
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 10 },
      });

      const tagApi = clientApiMock.hydraClient.getTagApi();
      const taskApi = clientApiMock.platformClient.getTaskApi();
      const testError = new Error('Pipeline write failed');

      // Steps A and B succeed
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });
      taskApi.create.mockResolvedValue({ id: testTaskId });

      // Step C fails
      pipelineWrite.pushEntities.mockRejectedValue(testError);

      // Execute and expect rejection
      let caught = false;
      try {
        await service.ensurePlatformEngagement(validInput());
      } catch (err) {
        caught = true;
        expect(err).toBe(testError);
      }

      expect(caught).toBe(true);

      // Assert snackbar opened
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Setup in progress — please retry in a moment.',
        'Dismiss',
        { duration: 5000 },
      );
    });
  });

  describe('RACI on coordination Task', () => {
    beforeEach(() => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 10 },
      });
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const resourceApi = clientApiMock.hydraClient.getResourceApi();
      const taskApi = clientApiMock.platformClient.getTaskApi();
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });
      taskApi.create.mockResolvedValue({ id: testTaskId });
      pipelineWrite.pushEntities.mockResolvedValue(undefined);
      resourceApi.getResource.mockResolvedValue({ tags: [] });
      resourceApi.tagResource.mockResolvedValue(undefined);
    });

    it('Task.create receives org-party as assigned (R) and user-party as accountable (A)', async () => {
      const taskApi = clientApiMock.platformClient.getTaskApi();
      await service.ensurePlatformEngagement(validInput());
      expect(taskApi.create).toHaveBeenCalledOnce();
      const newTask = taskApi.create.mock.calls[0][0];
      expect(newTask.assigned).toBe(testOrgPartyId);
      expect(newTask.accountable).toBe(testUserPartyId);
    });

    it('Task.create receives empty approvers (C) and empty notified (I)', async () => {
      const taskApi = clientApiMock.platformClient.getTaskApi();
      await service.ensurePlatformEngagement(validInput());
      const newTask = taskApi.create.mock.calls[0][0];
      expect(newTask.approvers).toEqual([]);
      expect(newTask.notified).toEqual([]);
    });
  });

  describe('Slug source', () => {
    beforeEach(() => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 10 },
      });
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const resourceApi = clientApiMock.hydraClient.getResourceApi();
      const taskApi = clientApiMock.platformClient.getTaskApi();
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });
      taskApi.create.mockResolvedValue({ id: testTaskId });
      pipelineWrite.pushEntities.mockResolvedValue(undefined);
      resourceApi.getResource.mockResolvedValue({ tags: [] });
      resourceApi.tagResource.mockResolvedValue(undefined);
    });

    it('Tag name uses platform-canonical orgSlug when provided', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      await service.ensurePlatformEngagement({
        ...validInput(),
        currentOrgName: 'Brian Hierholzer Inc.',
        currentOrgSlug: 'brianhierholzer',
      });
      // First arg of createTag is the tag name (CreateTagBody first positional)
      const createBody = tagApi.createTag.mock.calls[0][0];
      expect(createBody.name).toBe('sme-mart.eng.zerobias-to-brianhierholzer');
    });

    it('Tag name falls back to slugify(orgName) when orgSlug missing', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      await service.ensurePlatformEngagement({
        ...validInput(),
        currentOrgName: 'Brian Hierholzer Inc.',
        currentOrgSlug: undefined,
      });
      const createBody = tagApi.createTag.mock.calls[0][0];
      // slugify("Brian Hierholzer Inc.") -> "brian-hierholzer-inc"
      expect(createBody.name).toBe('sme-mart.eng.zerobias-to-brian-hierholzer-inc');
    });

    it('Tag ownerId is the marketplace operator org (W3Geekery), not the target customer org', async () => {
      // Ensures the probe (which runs in the operator-admin's session scope) can
      // see the tag — fixes the cross-customer probe blindness from 2026-05-07.
      const tagApi = clientApiMock.hydraClient.getTagApi();
      await service.ensurePlatformEngagement({
        ...validInput(),
        currentOrgId: 'd6810036-fbc1-54c2-b01d-1496fc14ed32', // Brian's org (target customer)
        currentOrgName: 'Brian Hierholzer Inc.',
        currentOrgSlug: 'brianhierholzer',
      });
      const createBody = tagApi.createTag.mock.calls[0][0];
      // CreateTagBody(name, id, description, ownerId, type) — ownerId is 4th positional
      expect(createBody.ownerId).toBe('cd7105df-523d-5392-9f9a-3f83d3f30107'); // W3Geekery
      expect(createBody.ownerId).not.toBe('d6810036-fbc1-54c2-b01d-1496fc14ed32'); // not target customer
    });

    it('isOrgProvisioned uses orgSlug when provided', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      tagApi.searchTags.mockResolvedValue({ items: [] });
      await service.isOrgProvisioned('org-x', 'Brian Hierholzer Inc.', 'brianhierholzer');
      const searchBody = tagApi.searchTags.mock.calls[0][3];
      expect(searchBody.name).toBe('sme-mart.eng.zerobias-to-brianhierholzer');
    });

    it('isOrgProvisioned falls back to slugify(orgName) when orgSlug missing', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      tagApi.searchTags.mockResolvedValue({ items: [] });
      await service.isOrgProvisioned('org-x', 'Brian Hierholzer Inc.');
      const searchBody = tagApi.searchTags.mock.calls[0][3];
      expect(searchBody.name).toBe('sme-mart.eng.zerobias-to-brian-hierholzer-inc');
    });
  });

  describe('Class ID verification', () => {
    it('SME_MART_CLASS_IDS.Engagement is exported and has correct value', () => {
      expect(SME_MART_CLASS_IDS.Engagement).toBe('7711aa41-e55b-5cda-9b7a-35844a2006a1');
    });

    it('SME_MART_CLASS_IDS.SmeMartProject is exported and has correct value', () => {
      expect(SME_MART_CLASS_IDS.SmeMartProject).toBe('c66114a2-48e2-5b93-b7d6-7ccd6ef45a03');
    });
  });
});
