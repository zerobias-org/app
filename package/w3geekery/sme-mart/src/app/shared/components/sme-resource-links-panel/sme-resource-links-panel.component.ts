import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ZbSimplePanelComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';

import { SmeMartResourceService } from '../../../core/services/sme-mart-resource.service';
import type {
  SmeMartResource,
  SmeMartResourceLink,
  SmeMartResourceType,
  SmeMartLinkType,
} from '../../../core/models';
import {
  ALL_LINK_TYPES,
  ALL_RESOURCE_TYPES,
  LINK_TYPE_LABELS,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ICONS,
} from '../../../core/models/sme-mart-resource.model';

/** Resolved link row for display — includes the "other side" resource metadata */
export interface ResolvedLink {
  link: SmeMartResourceLink;
  /** The resource on the OTHER side of this link (relative to the host) */
  targetId: string;
  targetType: SmeMartResourceType;
  targetName: string;
  /** Relationship label from the host's perspective */
  relationLabel: string;
  /** Whether clicking this row can navigate to the target */
  navigable: boolean;
}

@Component({
  selector: 'app-sme-resource-links-panel',
  standalone: true,
  imports: [
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ZbSimplePanelComponent,
    ZbEmptyStateContainerComponent,
  ],
  templateUrl: './sme-resource-links-panel.component.html',
  styleUrl: './sme-resource-links-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmeResourceLinksPanel {
  private readonly resourceService = inject(SmeMartResourceService);
  private readonly router = inject(Router);

  // ── Inputs ──
  readonly resourceId = input.required<string>();
  readonly resourceType = input.required<SmeMartResourceType>();
  readonly readonly = input(false);

  // ── State ──
  readonly links = signal<ResolvedLink[]>([]);
  readonly loading = signal(false);
  readonly adding = signal(false);

  // ── Inline add form state ──
  readonly addStep = signal<0 | 1 | 2 | 3>(0); // 0=closed, 1=pick type, 2=pick resource, 3=pick link type
  readonly selectedType = signal<SmeMartResourceType | null>(null);
  readonly selectedResource = signal<SmeMartResource | null>(null);
  readonly selectedLinkType = signal<SmeMartLinkType>('relates_to');
  readonly searchQuery = signal('');
  readonly searchResults = signal<SmeMartResource[]>([]);
  readonly searching = signal(false);

  // ── Constants for template ──
  readonly allResourceTypes = ALL_RESOURCE_TYPES;
  readonly allLinkTypes = ALL_LINK_TYPES;
  readonly linkTypeLabels = LINK_TYPE_LABELS;
  readonly resourceTypeLabels = RESOURCE_TYPE_LABELS;
  readonly resourceTypeIcons = RESOURCE_TYPE_ICONS;

  readonly panelTitle = computed(() => 'Links');

  /** Filter out the host resource's own type from linkable types */
  readonly linkableTypes = computed(() =>
    ALL_RESOURCE_TYPES.filter(t => t !== this.resourceType()),
  );

  constructor() {
    effect(() => {
      const id = this.resourceId();
      const type = this.resourceType();
      if (id && type) {
        this.loadLinks();
      }
    });
  }

  // ── Load ──

  async loadLinks(): Promise<void> {
    this.loading.set(true);
    try {
      const raw = await this.resourceService.listResourceLinks(
        this.resourceId(),
        this.resourceType(),
      );
      const resolved = await Promise.all(raw.map(link => this.resolveLink(link)));
      this.links.set(resolved);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Inline Add Flow ──

  startAdd(): void {
    this.addStep.set(1);
    this.selectedType.set(null);
    this.selectedResource.set(null);
    this.selectedLinkType.set('relates_to');
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  cancelAdd(): void {
    this.addStep.set(0);
  }

  onTypeSelected(type: SmeMartResourceType): void {
    this.selectedType.set(type);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.addStep.set(2);
    this.doSearch('');
  }

  async doSearch(query: string): Promise<void> {
    const type = this.selectedType();
    if (!type) return;
    this.searching.set(true);
    try {
      const results = await this.resourceService.searchResourcesByType(
        type, query || undefined, 20,
      );
      // Exclude self and already-linked resources
      const linkedIds = new Set(this.links().map(l => l.targetId));
      linkedIds.add(this.resourceId());
      this.searchResults.set(results.filter(r => !linkedIds.has(r.id)));
    } finally {
      this.searching.set(false);
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.doSearch(value);
  }

  onResourceSelected(resource: SmeMartResource): void {
    this.selectedResource.set(resource);
    this.addStep.set(3);
  }

  async confirmAdd(): Promise<void> {
    const target = this.selectedResource();
    const targetType = this.selectedType();
    const linkType = this.selectedLinkType();
    if (!target || !targetType) return;

    this.adding.set(true);
    try {
      await this.resourceService.linkResources(
        this.resourceId(),
        this.resourceType(),
        target.id,
        targetType,
        linkType,
      );
      this.addStep.set(0);
      await this.loadLinks();
    } finally {
      this.adding.set(false);
    }
  }

  // ── Delete ──

  async removeLink(resolved: ResolvedLink): Promise<void> {
    await this.resourceService.deleteResourceLink(resolved.link.id);
    this.links.update(prev => prev.filter(l => l.link.id !== resolved.link.id));
  }

  // ── Navigation ──

  navigateToResource(resolved: ResolvedLink): void {
    const route = this.getRouteForResource(resolved.targetId, resolved.targetType);
    if (route) {
      this.router.navigate(route);
    }
  }

  // ── Display helpers ──

  displayResourceName(resource: SmeMartResource): string {
    return resource.name;
  }

  // ── Private ──

  private async resolveLink(link: SmeMartResourceLink): Promise<ResolvedLink> {
    const isFrom = link.fromResourceId === this.resourceId();
    const targetId = isFrom ? link.toResourceId : link.fromResourceId;
    const targetType = isFrom ? link.toResourceType : link.fromResourceType;

    // Try to resolve target name via search
    let targetName = targetId;
    try {
      const results = await this.resourceService.searchResourcesByType(targetType, undefined, 200);
      const match = results.find(r => r.id === targetId);
      if (match) targetName = match.name;
    } catch {
      // Fallback to ID
    }

    // Invert label when we're the "to" side
    const relationLabel = isFrom
      ? LINK_TYPE_LABELS[link.linkType]
      : this.invertLinkLabel(link.linkType);

    const navigable = this.getRouteForResource(targetId, targetType) !== null;
    return { link, targetId, targetType, targetName, relationLabel, navigable };
  }

  private invertLinkLabel(linkType: SmeMartLinkType): string {
    const inverses: Record<SmeMartLinkType, string> = {
      relates_to: 'Relates To',
      references: 'Referenced By',
      child_of: 'Parent Of',
      evidence_for: 'Has Evidence',
      deliverable_for: 'Has Deliverable',
      attachment_for: 'Has Attachment',
    };
    return inverses[linkType] ?? LINK_TYPE_LABELS[linkType];
  }

  private getRouteForResource(id: string, type: SmeMartResourceType): string[] | null {
    switch (type) {
      case 'sme-mart:work-request':
        return ['/engagements', id];
      case 'sme-mart:bid':
        return ['/rfps', id];
      case 'sme-mart:note':
      case 'sme-mart:note-folder':
        // Notes are typically viewed in context of an engagement
        return null;
      case 'sme-mart:review':
        return null;
      case 'sme-mart:service-offering':
        return ['/services'];
      default:
        return null;
    }
  }
}
