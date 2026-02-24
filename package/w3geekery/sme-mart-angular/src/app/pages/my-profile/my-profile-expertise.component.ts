import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { ZbSimpleAutocompleteComponent } from '@zerobias-org/ngx-library';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { CatalogService } from '../../core/services/catalog.service';
import type { ProviderDetailRow, CatalogItem } from '../../core/models';

interface ExpertiseSection {
  title: string;
  type: 'skills' | 'roles' | 'products' | 'frameworks' | 'segments' | 'serviceSegments';
  items: { id: string; name: string; zbId: string }[];
}

@Component({
  selector: 'app-my-profile-expertise',
  standalone: true,
  imports: [MatChipsModule, MatIconModule, MatSnackBarModule, ZbSimpleAutocompleteComponent],
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
  readonly profile = signal<ProviderDetailRow | null>(null);
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
          await this.providerProfiles.addSkill(p.id, {
            zerobias_skill_id: selected.id,
            skill_name: selected.name,
            proficiency_level: null,
            years_experience: null,
            verified: false,
          });
          break;
        case 'roles':
          await this.providerProfiles.addRole(p.id, {
            zerobias_role_id: selected.id,
            role_name: selected.name,
            is_primary: false,
            years_in_role: null,
          });
          break;
        case 'products':
          await this.providerProfiles.addProduct(p.id, {
            zerobias_product_id: selected.id,
            product_name: selected.name,
            proficiency_level: null,
            years_experience: null,
            certified: false,
            certification_details: null,
          });
          break;
        case 'frameworks':
          await this.providerProfiles.addFramework(p.id, {
            zerobias_framework_id: selected.id,
            framework_name: selected.name,
            proficiency_level: null,
            years_experience: null,
            assessor_certified: false,
            implementation_experience: false,
            audit_experience: false,
          });
          break;
        case 'segments':
          await this.providerProfiles.addSegment(p.id, {
            zerobias_segment_id: selected.id,
            segment_name: selected.name,
            is_primary: false,
          });
          break;
        case 'serviceSegments':
          await this.providerProfiles.addServiceSegment(p.id, {
            zerobias_service_segment_id: selected.id,
            service_segment_name: selected.name,
            is_primary: false,
          });
          break;
      }
      section.items.push({ id: crypto.randomUUID(), name: selected.name, zbId: selected.id });
      this.sections.set([...this.sections()]);
      autocomplete?.writeValue(null);
    } catch (err) {
      console.error('[Expertise] Add failed:', err);
      this.snackBar.open('Failed to add', 'OK', { duration: 3000 });
    }
  }

  async onRemove(section: ExpertiseSection, item: { id: string; name: string; zbId: string }): Promise<void> {
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

  private buildSections(detail: ProviderDetailRow): void {
    const parse = <T>(json: unknown): T[] => {
      if (!json) return [];
      try { return typeof json === 'string' ? JSON.parse(json) : json as T[]; } catch { return []; }
    };

    this.sections.set([
      {
        title: 'Skills', type: 'skills',
        items: parse<any>(detail.skills).map((s: any) => ({ id: s.id, name: s.skill_name, zbId: s.zerobias_skill_id })),
      },
      {
        title: 'Roles', type: 'roles',
        items: parse<any>(detail.roles).map((r: any) => ({
          id: r.id, zbId: r.zerobias_role_id,
          name: r.role_name || r.zerobias_role_id,
        })),
      },
      {
        title: 'Products', type: 'products',
        items: parse<any>(detail.products).map((p: any) => ({
          id: p.id, zbId: p.zerobias_product_id,
          name: p.product_name || p.zerobias_product_id,
        })),
      },
      {
        title: 'Frameworks', type: 'frameworks',
        items: parse<any>(detail.frameworks).map((f: any) => ({
          id: f.id, zbId: f.zerobias_framework_id,
          name: f.framework_name || f.zerobias_framework_id,
        })),
      },
      {
        title: 'Segments', type: 'segments',
        items: parse<any>(detail.segments).map((s: any) => ({
          id: s.id, zbId: s.zerobias_segment_id,
          name: s.segment_name || s.zerobias_segment_id,
        })),
      },
      {
        title: 'Service Segments', type: 'serviceSegments',
        items: parse<any>(detail.service_segments).map((s: any) => ({
          id: s.id, zbId: s.zerobias_service_segment_id,
          name: s.service_segment_name || s.zerobias_service_segment_id,
        })),
      },
    ]);
  }
}
