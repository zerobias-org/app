import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi, ZerobiasClientSessionId } from '@zerobias-com/zerobias-client';
import { ZerobiasClientOrgIdService } from '@zerobias-com/zerobias-angular-client';
import { PlatformEngagementProvisioner } from './platform-engagement-provisioner.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simulated caller's starting scope — assertions check that the recipe flips
// to MARKETPLACE_OPERATOR_ORG_ID for tag operations and to the target orgId
// for Project operations (errata 040 + 041), then restores this value in
// finally.
const STARTING_ORG_ID = 'starting-org-id';

// UAT bootstrap value mirrored from provisioner.service.ts (D-50 tier-tag).
const SME_MART_TIER_PROJECT_TAG_ID_UAT = '420b0753-e72c-4b81-8929-70508a119bf0';

describe('PlatformEngagementProvisioner', () => {
  let service: PlatformEngagementProvisioner;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };
  type ApiMock = ReturnType<typeof vi.fn>;
  let clientApiMock: {
    toUUID: ApiMock;
    reconnectWithOrgId: ApiMock;
    hydraClient: {
      getTagApi: () => { searchTags: ApiMock; createTag: ApiMock };
    };
    platformClient: {
      getProjectApi: () => { list: ApiMock; create: ApiMock };
    };
  };
  let orgIdServiceMock: {
    getCurrentOrgId: ApiMock;
    setCurrrenOrgId: ApiMock;
  };

  const testOrgId = 'org-123';
  const testOrgName = 'Test Org Inc.';
  const testOrgSlug = 'testorginc';
  const testTagId = 'tag-123';
  const testEngagementProjectId = 'engagement-project-123';
  const testProjectTierProjectId = 'project-tier-123';

  // D-49 namespace constants mirrored from provisioner.service.ts.
  const NEW_NAMESPACE_TAG_NAME = `sme-mart.engagement.zerobias-to-${testOrgSlug}`;
  const LEGACY_NAMESPACE_TAG_NAME = `sme-mart.eng.zerobias-to-${testOrgSlug}`;

  const validInput = () => ({
    currentOrgId: testOrgId,
    currentOrgName: testOrgName,
    currentOrgSlug: testOrgSlug,
  });

  beforeEach(() => {
    snackBarMock = { open: vi.fn() };

    // Build a minimal mock of ZerobiasClientApi for v3 recipe (3 SDK calls).
    clientApiMock = {
      toUUID: vi.fn((id: string) => id), // Identity function for test
      reconnectWithOrgId: vi.fn().mockResolvedValue(undefined),
      hydraClient: {
        getTagApi: vi.fn().mockReturnValue({
          searchTags: vi.fn(),
          createTag: vi.fn(),
        }),
      },
      platformClient: {
        getProjectApi: vi.fn().mockReturnValue({
          list: vi.fn(),
          create: vi.fn(),
        }),
      },
    };

    // ZerobiasClientOrgIdService mock. getCurrentOrgId returns STARTING_ORG_ID
    // by default to simulate a caller in some non-operator scope; assertions
    // check that the provisioner flips to operator/target scope as needed and
    // restores STARTING_ORG_ID in finally.
    orgIdServiceMock = {
      getCurrentOrgId: vi.fn().mockReturnValue(STARTING_ORG_ID),
      setCurrrenOrgId: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PlatformEngagementProvisioner,
        { provide: ZerobiasClientApi, useValue: clientApiMock },
        { provide: ZerobiasClientOrgIdService, useValue: orgIdServiceMock },
        { provide: ZerobiasClientSessionId, useValue: { getCurrentSessionId: () => null } },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    service = TestBed.inject(PlatformEngagementProvisioner);
  });

  describe('ensurePlatformEngagement (v3 recipe — 3 SDK calls)', () => {
    it('Happy path: all 3 steps succeed → returns created: true with engagement + project-tier IDs', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();

      // isOrgProvisioned dual-namespace probe + ensureTag probe all return empty.
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });

      // Step C: Engagement Project probe and create
      projectApi.list.mockResolvedValueOnce({ items: [] });
      projectApi.create.mockResolvedValueOnce({ id: testEngagementProjectId });

      // Step D: Project-tier Project probe and create
      projectApi.list.mockResolvedValueOnce({ items: [] });
      projectApi.create.mockResolvedValueOnce({ id: testProjectTierProjectId });

      const result = await service.ensurePlatformEngagement(validInput());

      expect(tagApi.searchTags).toHaveBeenCalled();
      expect(tagApi.createTag).toHaveBeenCalled();
      expect(projectApi.list).toHaveBeenCalledTimes(2); // Steps C and D both probe
      expect(projectApi.create).toHaveBeenCalledTimes(2); // Steps C and D both create

      expect(result.created).toBe(true);
      expect(result.engagementProjectId).toBe(testEngagementProjectId);
      expect(result.projectTierProjectId).toBe(testProjectTierProjectId);
    });

    it('Idempotency: org already provisioned → returns created: false with empty IDs', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();

      // isOrgProvisioned probe: tag exists in both namespaces (mockResolvedValue applies to all calls)
      tagApi.searchTags.mockResolvedValue({ items: [{ id: testTagId }] });
      // Engagement Project exists with matching tagId — verification check passes.
      projectApi.list.mockResolvedValue({
        items: [{ id: testEngagementProjectId, parentId: null, tagId: testTagId }],
      });

      const result = await service.ensurePlatformEngagement(validInput());

      expect(tagApi.searchTags).toHaveBeenCalled();
      expect(tagApi.createTag).not.toHaveBeenCalled(); // recipe skipped
      expect(projectApi.list).toHaveBeenCalledTimes(1); // only the isOrgProvisioned verify call
      expect(projectApi.create).not.toHaveBeenCalled();

      expect(result.created).toBe(false);
      expect(result.engagementProjectId).toBe('');
      expect(result.projectTierProjectId).toBe('');
    });

    it('Step C idempotency: engagement project exists → probe returns it, skip create', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();

      // isOrgProvisioned: tags don't exist; ensureTag probe also empty.
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });

      // Step C probe finds existing Engagement Project tagged with testTagId.
      projectApi.list.mockResolvedValueOnce({
        items: [{ id: testEngagementProjectId, parentId: null, tagId: testTagId }],
      });
      // Step D probe finds nothing → creates new.
      projectApi.list.mockResolvedValueOnce({ items: [] });
      projectApi.create.mockResolvedValueOnce({ id: testProjectTierProjectId });

      const result = await service.ensurePlatformEngagement(validInput());

      expect(projectApi.list).toHaveBeenCalledTimes(2); // C probe + D probe
      expect(projectApi.create).toHaveBeenCalledTimes(1); // D create only

      expect(result.created).toBe(true);
      expect(result.engagementProjectId).toBe(testEngagementProjectId);
      expect(result.projectTierProjectId).toBe(testProjectTierProjectId);
    });

    it('Step A error: tag create fails → console.warn + snackbar + re-throw', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const testError = new Error('Tag creation failed');

      // All tag probes return empty (not-provisioned + no existing tag to reuse).
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockRejectedValue(testError);

      const warnSpy = vi.spyOn(console, 'warn');

      let caught = false;
      try {
        await service.ensurePlatformEngagement(validInput());
      } catch (err) {
        caught = true;
        expect(err).toBe(testError);
      }

      expect(caught).toBe(true);

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Setup in progress — please retry in a moment.',
        'Dismiss',
        { duration: 5000 },
      );

      expect(warnSpy).toHaveBeenCalledWith(
        '[PLATFORM_ENGAGEMENT_FAILURE]',
        expect.objectContaining({
          step: 'A',
          callSiteTag: 'platform-engagement:ensure-tag',
        }),
      );

      warnSpy.mockRestore();
    });

    it('Step C error: project create fails → console.warn + snackbar + re-throw', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();
      const testError = new Error('Project creation failed');

      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });
      // Step C probe returns empty → triggers create which fails.
      projectApi.list.mockResolvedValueOnce({ items: [] });
      projectApi.create.mockRejectedValue(testError);

      const warnSpy = vi.spyOn(console, 'warn');

      let caught = false;
      try {
        await service.ensurePlatformEngagement(validInput());
      } catch (err) {
        caught = true;
        expect(err).toBe(testError);
      }

      expect(caught).toBe(true);

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Setup in progress — please retry in a moment.',
        'Dismiss',
        { duration: 5000 },
      );

      expect(warnSpy).toHaveBeenCalledWith(
        '[PLATFORM_ENGAGEMENT_FAILURE]',
        expect.objectContaining({
          step: 'C',
          callSiteTag: 'platform-engagement:ensure-engagement-project',
        }),
      );

      warnSpy.mockRestore();
    });
  });

  describe('v3 recipe parameter validation', () => {
    beforeEach(() => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();

      // Default successful path: empty everywhere → recipe runs fully.
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });
      projectApi.list.mockResolvedValue({ items: [] });
      // Use mockResolvedValueOnce to return different values for each create call
      projectApi.create.mockResolvedValueOnce({ id: testEngagementProjectId });
      projectApi.create.mockResolvedValueOnce({ id: testProjectTierProjectId });
    });

    it('Step C: creates engagement project with locked verbiage (D-32, D-33), no boundaryId, no ownerId field', async () => {
      const projectApi = clientApiMock.platformClient.getProjectApi();

      await service.ensurePlatformEngagement(validInput());

      const createCalls = projectApi.create.mock.calls;
      expect(createCalls.length).toBeGreaterThanOrEqual(1);

      // First create is engagement project (Step C). Constructed via new NewProject(...).
      const engagementProjectCall = createCalls[0][0];
      expect(engagementProjectCall.name).toBe('Engagement with provider ZeroBias Platform'); // D-32 superseded 2026-05-15
      expect(engagementProjectCall.description).toBe(`Platform services engagement provided by ZeroBias Platform for ${testOrgName}.`); // D-33 superseded 2026-05-15
      expect(engagementProjectCall.status).toBe('active'); // D-29
      expect(engagementProjectCall.visibility).toBe('internal'); // D-29
      expect(engagementProjectCall.membershipPolicy).toBe('private'); // D-29
      expect(engagementProjectCall.parentId).toBeNull(); // D-04 (top-level)
      expect(engagementProjectCall.tagId).toBe(testTagId); // D-01
      // boundaryId intentionally omitted (ENGAGEMENT-BOUNDARY-SCOPE-REVISIT-1)
      expect(engagementProjectCall.boundaryId).toBeUndefined();
      // ownerId field NOT set on NewProject — server derives from session (errata 036 (b))
      expect((engagementProjectCall as { ownerId?: unknown }).ownerId).toBeUndefined();
    });

    it('Step D: creates project-tier project with locked verbiage (D-34, D-35) and tier tag (D-50)', async () => {
      const projectApi = clientApiMock.platformClient.getProjectApi();

      await service.ensurePlatformEngagement(validInput());

      const createCalls = projectApi.create.mock.calls;
      // Second create is project-tier project (Step D)
      const projectTierCall = createCalls[1][0];
      expect(projectTierCall.name).toBe('ZeroBias Platform'); // D-34 (locked; depth-2 NOT "Workspace")
      expect(projectTierCall.description).toBe(`${testOrgName}'s gateway into ZeroBias — tasks, notes, and communication tied to the platform services engagement with ZeroBias Platform live here.`); // D-35 superseded 2026-05-15
      expect(projectTierCall.parentId).toBe(testEngagementProjectId); // D-01
      expect(projectTierCall.tagId).toBe(SME_MART_TIER_PROJECT_TAG_ID_UAT); // D-50: tier-identity tag
      expect((projectTierCall as { ownerId?: unknown }).ownerId).toBeUndefined();
    });
  });

  describe('Tag naming: D-49 NEW namespace + slug source', () => {
    beforeEach(() => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();

      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });
      projectApi.list.mockResolvedValue({ items: [] });
      projectApi.create.mockResolvedValue({ id: testEngagementProjectId });
    });

    it('Tag created in NEW namespace (sme-mart.engagement.*) — uses platform-canonical orgSlug when provided', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      await service.ensurePlatformEngagement({
        currentOrgId: testOrgId,
        currentOrgName: 'Brian Hierholzer Inc.',
        currentOrgSlug: 'brianhierholzer',
      });
      const createBody = tagApi.createTag.mock.calls[0][0];
      // D-49: full-word "engagement" namespace for new tags.
      expect(createBody.name).toBe('sme-mart.engagement.zerobias-to-brianhierholzer');
    });

    it('Tag name falls back to slugify(orgName) when orgSlug missing', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      await service.ensurePlatformEngagement({
        currentOrgId: testOrgId,
        currentOrgName: 'Brian Hierholzer Inc.',
        currentOrgSlug: undefined,
      });
      const createBody = tagApi.createTag.mock.calls[0][0];
      // slugify("Brian Hierholzer Inc.") -> "brian-hierholzer-inc"
      expect(createBody.name).toBe('sme-mart.engagement.zerobias-to-brian-hierholzer-inc');
    });

    it('Tag ownerId is the marketplace operator org (W3Geekery), not the target customer org', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      await service.ensurePlatformEngagement({
        currentOrgId: 'd6810036-fbc1-54c2-b01d-1496fc14ed32', // target customer
        currentOrgName: 'Brian Hierholzer Inc.',
        currentOrgSlug: 'brianhierholzer',
      });
      const createBody = tagApi.createTag.mock.calls[0][0];
      expect(createBody.ownerId).toBe('cd7105df-523d-5392-9f9a-3f83d3f30107'); // W3Geekery
      expect(createBody.ownerId).not.toBe('d6810036-fbc1-54c2-b01d-1496fc14ed32');
    });

    it('ensureTag probe scans NEW namespace only — legacy orphan tags ignored on create path', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      // Simulate: legacy tag exists, new namespace empty → probe should still create new.
      tagApi.searchTags.mockImplementation((_p, _ps, _u, body: { name: string }) => {
        if (body.name.startsWith('sme-mart.engagement.')) return Promise.resolve({ items: [] });
        if (body.name.startsWith('sme-mart.eng.')) return Promise.resolve({ items: [{ id: 'legacy-tag-id' }] });
        return Promise.resolve({ items: [] });
      });

      await service.ensurePlatformEngagement(validInput());

      // createTag fires (legacy orphan ignored by ensureTag); new tag created in NEW namespace.
      expect(tagApi.createTag).toHaveBeenCalledTimes(1);
      const createdName = tagApi.createTag.mock.calls[0][0].name;
      expect(createdName).toMatch(/^sme-mart\.engagement\./);
    });
  });

  describe('isOrgProvisioned (dual-namespace probe + Project verification)', () => {
    const newTagId = 'new-tag-id-uuid';
    const legacyTagId = 'legacy-tag-id-uuid';

    // Helper: route searchTags by namespace prefix.
    function mockSearchTagsByNamespace(opts: {
      new?: Array<{ id: string }>;
      legacy?: Array<{ id: string }>;
    }) {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      tagApi.searchTags.mockImplementation((_p, _ps, _u, body: { name: string }) => {
        if (body.name === NEW_NAMESPACE_TAG_NAME) {
          return Promise.resolve({ items: opts.new || [] });
        }
        if (body.name === LEGACY_NAMESPACE_TAG_NAME) {
          return Promise.resolve({ items: opts.legacy || [] });
        }
        return Promise.resolve({ items: [] });
      });
    }

    it('NEW namespace tag exists AND Engagement Project exists → true', async () => {
      mockSearchTagsByNamespace({ new: [{ id: newTagId }] });
      clientApiMock.platformClient.getProjectApi().list.mockResolvedValue({
        items: [{ id: 'eng-id', parentId: null, tagId: newTagId }],
      });
      const result = await service.isOrgProvisioned(testOrgId, testOrgName, testOrgSlug);
      expect(result).toBe(true);
    });

    it('NEW namespace tag exists but Engagement Project missing → false (orphan tag)', async () => {
      mockSearchTagsByNamespace({ new: [{ id: newTagId }] });
      clientApiMock.platformClient.getProjectApi().list.mockResolvedValue({ items: [] });
      const result = await service.isOrgProvisioned(testOrgId, testOrgName, testOrgSlug);
      expect(result).toBe(false);
    });

    it('LEGACY namespace tag exists AND Engagement Project exists → true', async () => {
      mockSearchTagsByNamespace({ legacy: [{ id: legacyTagId }] });
      clientApiMock.platformClient.getProjectApi().list.mockResolvedValue({
        items: [{ id: 'eng-id', parentId: null, tagId: legacyTagId }],
      });
      const result = await service.isOrgProvisioned(testOrgId, testOrgName, testOrgSlug);
      expect(result).toBe(true);
    });

    it("LEGACY namespace tag exists but Engagement Project missing → false (Brian's-Org orphan case)", async () => {
      mockSearchTagsByNamespace({ legacy: [{ id: legacyTagId }] });
      clientApiMock.platformClient.getProjectApi().list.mockResolvedValue({ items: [] });
      const result = await service.isOrgProvisioned(testOrgId, testOrgName, testOrgSlug);
      expect(result).toBe(false);
    });

    it('Neither namespace has a tag → false (and Project list NOT called)', async () => {
      mockSearchTagsByNamespace({});
      const result = await service.isOrgProvisioned(testOrgId, testOrgName, testOrgSlug);
      expect(result).toBe(false);
      expect(clientApiMock.platformClient.getProjectApi().list).not.toHaveBeenCalled();
    });

    it('searchTags throws → false (no crash; warns)', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      tagApi.searchTags.mockRejectedValue(new Error('Hub timeout'));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const result = await service.isOrgProvisioned(testOrgId, testOrgName, testOrgSlug);
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        '[PLATFORM_ENGAGEMENT_PROBE_FAILED]',
        expect.objectContaining({ orgId: testOrgId }),
      );
      warnSpy.mockRestore();
    });

    it('Empty orgId or orgName → false (no SDK calls)', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      expect(await service.isOrgProvisioned('', testOrgName)).toBe(false);
      expect(await service.isOrgProvisioned(testOrgId, '')).toBe(false);
      expect(tagApi.searchTags).not.toHaveBeenCalled();
    });

    it('Probes BOTH namespaces with the provided orgSlug', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      mockSearchTagsByNamespace({});
      await service.isOrgProvisioned(testOrgId, 'Some Org Name', 'customslug');
      const probedNames = tagApi.searchTags.mock.calls.map((c) => c[3].name);
      expect(probedNames).toEqual([
        'sme-mart.engagement.zerobias-to-customslug',
        'sme-mart.eng.zerobias-to-customslug',
      ]);
    });

    it('Falls back to slugify(orgName) when orgSlug missing', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      mockSearchTagsByNamespace({});
      await service.isOrgProvisioned(testOrgId, 'Some Org Name');
      const probedNames = tagApi.searchTags.mock.calls.map((c) => c[3].name);
      expect(probedNames).toEqual([
        'sme-mart.engagement.zerobias-to-some-org-name',
        'sme-mart.eng.zerobias-to-some-org-name',
      ]);
    });
  });
});
