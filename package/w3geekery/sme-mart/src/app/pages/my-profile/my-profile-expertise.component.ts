import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { ZbSimpleAutocompleteComponent, ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { CatalogService } from '../../core/services/catalog.service';
import type { CatalogItem, ProviderDetailView, ExpertiseItem } from '../../core/models';

interface ExpertiseSection {
  title: string;
  type: 'skills' | 'roles' | 'products' | 'frameworks' | 'segments' | 'serviceSegments';
  items: ExpertiseItem[];
}

@Component({
  selector: 'app-my-profile-expertise',
  standalone: true,
  imports: [
    MatChipsModule,
    MatIconModule,
    MatSnackBarModule,
    ZbSimpleAutocompleteComponent,
    ZbResourceStatusComponent,
  ],
  templateUrl: './my-profile-expertise.component.html',
  styleUrl: './my-profile-expertise.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfileExpertise implements OnInit {
  private readonly impersonation = inject(ImpersonationService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly catalog = inject(CatalogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly profile = signal<ProviderDetailView | null>(null);
  readonly sections = signal<ExpertiseSection[]>([]);

  // Search functions for autocomplete
  readonly skillSearch = (term: string): Observable<CatalogItem[]> =>
    of(this.catalog.filterItems(this.catalog.skills(), term));
  readonly roleSearch = (term: string): Observable<CatalogItem[]> =>
    of(this.catalog.filterItems(this.catalog.roles(), term));
  readonly productSearch = (term: string): Observable<CatalogItem[]> =>
    of(this.catalog.filterItems(this.catalog.products(), term));
  readonly frameworkSearch = (term: string): Observable<CatalogItem[]> =>
    of(this.catalog.filterItems(this.catalog.frameworks(), term));
  readonly segmentSearch = (term: string): Observable<CatalogItem[]> =>
    of(this.catalog.filterItems(this.catalog.segments(), term));
  readonly serviceSegmentSearch = (term: string): Observable<CatalogItem[]> =>
    of(this.catalog.filterItems(this.catalog.serviceSegments(), term));

  async ngOnInit() {
    try {
      const userId = this.impersonation.effectiveUserId();
      const detail = await this.providerProfiles.getProviderByUserId(userId);
      if (detail) {
        this.profile.set(detail);
        this.buildSections(detail);
      }
    } catch (err) {
      console.warn('[Expertise] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  getSearchFn(type: string): (term: string) => Observable<CatalogItem[]> {
    switch (type) {
      case 'skills': return this.skillSearch;
      case 'roles': return this.roleSearch;
      case 'products': return this.productSearch;
      case 'frameworks': return this.frameworkSearch;
      case 'segments': return this.segmentSearch;
      case 'serviceSegments': return this.serviceSegmentSearch;
      default: return () => of([]);
    }
  }

  async onAdd(section: ExpertiseSection, selected: CatalogItem, autocomplete?: ZbSimpleAutocompleteComponent): Promise<void> {
    const p = this.profile();
    if (!p || !selected) return;

    try {
      switch (section.type) {
        case 'skills':
          await this.providerProfiles.addSkill(p.orgId, {
            orgId: p.orgId,
            skillId: selected.id,
            proficiencyLevel: 'intermediate',
            yearsExperience: 0,
            verified: false,
            verificationSource: null,
          });
          break;
        case 'roles':
          await this.providerProfiles.addRole(p.orgId, {
            orgId: p.orgId,
            roleId: selected.id,
            isPrimary: false,
            yearsInRole: 0,
            verified: false,
            verificationSource: null,
          });
          break;
        case 'products':
          await this.providerProfiles.addProduct(p.orgId, {
            orgId: p.orgId,
            productId: selected.id,
            proficiencyLevel: 'intermediate',
            yearsExperience: 0,
            certified: false,
            certificationDetails: null,
            verified: false,
            verificationSource: null,
          });
          break;
        case 'frameworks':
          await this.providerProfiles.addFramework(p.orgId, {
            orgId: p.orgId,
            frameworkId: selected.id,
            proficiencyLevel: 'intermediate',
            yearsExperience: 0,
            assessorCertified: false,
            implementationExperience: false,
            auditExperience: false,
            verified: false,
            verificationSource: null,
          });
          break;
        case 'segments':
          await this.providerProfiles.addSegment(p.orgId, {
            orgId: p.orgId,
            segmentId: selected.id,
            isPrimary: false,
            verified: false,
            verificationSource: null,
          });
          break;
        case 'serviceSegments':
          await this.providerProfiles.addServiceSegment(p.orgId, {
            orgId: p.orgId,
            serviceSegmentId: selected.id,
            isPrimary: false,
            verified: false,
            verificationSource: null,
          });
          break;
      }
      section.items.push({ id: crypto.randomUUID(), name: selected.name, verified: false, verificationSource: null });
      this.sections.set([...this.sections()]);
      autocomplete?.writeValue(null);
    } catch (err) {
      console.error('[Expertise] Add failed:', err);
      this.snackBar.open('Failed to add', 'OK', { duration: 3000 });
    }
  }

  async onRemove(section: ExpertiseSection, item: ExpertiseItem): Promise<void> {
    try {
      switch (section.type) {
        case 'skills': await this.providerProfiles.deleteSkill(item.id); break;
        case 'roles': await this.providerProfiles.deleteRole(item.id); break;
        case 'products': await this.providerProfiles.deleteProduct(item.id); break;
        case 'frameworks': await this.providerProfiles.deleteFramework(item.id); break;
        case 'segments': await this.providerProfiles.deleteSegment(item.id); break;
        case 'serviceSegments': await this.providerProfiles.deleteServiceSegment(item.id); break;
      }
      section.items = section.items.filter((i) => i.id !== item.id);
      this.sections.set([...this.sections()]);
      this.snackBar.open(`Removed ${item.name}`, 'OK', { duration: 2000 });
    } catch (err) {
      console.error('[Expertise] Remove failed:', err);
      this.snackBar.open('Failed to remove', 'OK', { duration: 3000 });
    }
  }

  private buildSections(detail: ProviderDetailView): void {
    this.sections.set([
      {
        title: 'Skills',
        type: 'skills',
        items: detail.skills || [],
      },
      {
        title: 'Roles',
        type: 'roles',
        items: detail.roles || [],
      },
      {
        title: 'Products',
        type: 'products',
        items: detail.products || [],
      },
      {
        title: 'Frameworks',
        type: 'frameworks',
        items: detail.frameworks || [],
      },
      {
        title: 'Segments',
        type: 'segments',
        items: detail.segments || [],
      },
      {
        title: 'Service Segments',
        type: 'serviceSegments',
        items: detail.serviceSegments || [],
      },
    ]);
  }
}
