import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { MyEngagementList } from './my-engagement-list.component';
import { EngagementsService } from '../../core/services/engagements.service';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import type { EngagementSummaryRow } from '../../core/models';
import { PagedResults } from '@zerobias-org/types-core-js';

describe('MyEngagementList — org scoping with platform.Project shape', () => {
  let component: MyEngagementList;
  let fixture: ComponentFixture<MyEngagementList>;
  let mockEngagementsService: Partial<EngagementsService>;
  let mockAppService: Partial<ZerobiasClientApp>;
  let listEngagementsSpy: ReturnType<typeof vi.fn>;
  let getCurrentOrgIdSpy: ReturnType<typeof vi.fn>;

  const now = new Date().toISOString();

  function createMockEngagement(
    id: string,
    title: string,
    orgId: string,
  ): EngagementSummaryRow {
    return {
      id,
      buyer_user_id: null,
      buyer_zerobias_user_id: 'user-1',
      buyer_zerobias_org_id: orgId,
      title,
      description: `Description for ${title}`,
      engagement_tag: 'marketplace-tag',
      status: 'in_progress',
      category: 'security',
      budget_type: null,
      budget_min: null,
      budget_max: null,
      timeline: null,
      zerobias_tag_id: null,
      zerobias_boundary_id: null,
      zerobias_task_id: null,
      bid_count: 0,
      pending_bid_count: 0,
      accepted_provider_name: null,
      accepted_provider_id: null,
      buyer_display_name: null,
      buyer_avatar_url: null,
      created_at: now,
      updated_at: now,
    };
  }

  beforeEach(async () => {
    listEngagementsSpy = vi.fn();
    getCurrentOrgIdSpy = vi.fn();

    mockEngagementsService = {
      listEngagements: listEngagementsSpy as unknown as (
        options?: unknown,
      ) => Promise<PagedResults<EngagementSummaryRow>>,
    };
    mockAppService = {
      getCurrentOrgId: getCurrentOrgIdSpy as unknown as () => string | undefined,
    };

    await TestBed.configureTestingModule({
      imports: [MyEngagementList],
      providers: [
        { provide: EngagementsService, useValue: mockEngagementsService },
        { provide: ZerobiasClientApp, useValue: mockAppService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyEngagementList);
    component = fixture.componentInstance;
  });

  it('should pass current org ID to listEngagements', async () => {
    // Arrange
    const currentOrgId = 'org-a';
    getCurrentOrgIdSpy.mockReturnValue(currentOrgId);

    const result = new PagedResults<EngagementSummaryRow>();
    result.items = [
      createMockEngagement('eng-1', 'Engagement A1', 'org-a'),
      createMockEngagement('eng-3', 'Engagement A2', 'org-a'),
    ];
    result.pageNumber = 1;
    result.pageSize = 200;
    result.count = result.items.length;

    listEngagementsSpy.mockResolvedValue(result);

    // Act
    await component.loadData();

    // Assert
    expect(listEngagementsSpy).toHaveBeenCalledWith({
      pageSize: 200,
      buyerOrgId: currentOrgId,
    });
    expect(component.items()).toEqual(result.items);
  });

  it('should handle filtered results from platform.Project query with org scoping', async () => {
    // Arrange
    const currentOrgId = 'org-b';
    getCurrentOrgIdSpy.mockReturnValue(currentOrgId);

    const result = new PagedResults<EngagementSummaryRow>();
    result.items = [createMockEngagement('eng-2', 'Engagement B1', 'org-b')];
    result.pageNumber = 1;
    result.pageSize = 200;
    result.count = 1;

    listEngagementsSpy.mockResolvedValue(result);

    // Act
    await component.loadData();

    // Assert
    expect(component.items().length).toBe(1);
    expect(component.items()[0].buyer_zerobias_org_id).toBe('org-b');
  });

  it('should work with empty result when no engagements match current org', async () => {
    // Arrange
    const currentOrgId = 'org-nonexistent';
    getCurrentOrgIdSpy.mockReturnValue(currentOrgId);

    const result = new PagedResults<EngagementSummaryRow>();
    result.items = [];
    result.pageNumber = 1;
    result.pageSize = 200;
    result.count = 0;

    listEngagementsSpy.mockResolvedValue(result);

    // Act
    await component.loadData();

    // Assert
    expect(component.items().length).toBe(0);
    expect(component.items()).toEqual([]);
  });

  it('should pass undefined buyerOrgId when getCurrentOrgId returns null', async () => {
    // Arrange
    getCurrentOrgIdSpy.mockReturnValue(null);

    const result = new PagedResults<EngagementSummaryRow>();
    result.items = [
      createMockEngagement('eng-1', 'Engagement 1', 'org-a'),
      createMockEngagement('eng-2', 'Engagement 2', 'org-b'),
    ];
    result.pageNumber = 1;
    result.pageSize = 200;
    result.count = 2;

    listEngagementsSpy.mockResolvedValue(result);

    // Act
    await component.loadData();

    // Assert
    expect(listEngagementsSpy).toHaveBeenCalledWith({
      pageSize: 200,
      buyerOrgId: undefined,
    });
    expect(component.items().length).toBe(2);
  });

  it('should maintain EngagementSummaryRow shape from platform.Project transformation', async () => {
    // Arrange
    const currentOrgId = 'org-a';
    getCurrentOrgIdSpy.mockReturnValue(currentOrgId);

    const engagement = createMockEngagement('eng-1', 'Test Engagement', 'org-a');
    const result = new PagedResults<EngagementSummaryRow>();
    result.items = [engagement];
    result.pageNumber = 1;
    result.pageSize = 200;
    result.count = 1;

    listEngagementsSpy.mockResolvedValue(result);

    // Act
    await component.loadData();

    // Assert
    const loaded = component.items()[0];
    expect(loaded.id).toBe('eng-1');
    expect(loaded.buyer_zerobias_org_id).toBe('org-a'); // D-03: maps from proj.ownerId
    expect(loaded.title).toBe('Test Engagement'); // maps from proj.name
    expect(loaded.status).toBe('in_progress'); // status field present
  });
});
