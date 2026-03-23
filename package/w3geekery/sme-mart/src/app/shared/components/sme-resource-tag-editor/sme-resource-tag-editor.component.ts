import {
  Component, Input, Output, EventEmitter, ViewChild, ElementRef,
  ChangeDetectionStrategy, inject, signal, computed, OnInit, OnChanges, SimpleChanges,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { startWith, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { TagView } from '@zerobias-com/platform-sdk';
import { SmeMartResourceService } from '../../../core/services/sme-mart-resource.service';
import { EngagementHierarchyService } from '../../../core/services/engagement-hierarchy.service';
import type { SmeMartResourceType, SmeMartResourceTag } from '../../../core/models';

let nextInstanceId = 0;

/**
 * Tag editor for SME Mart resources (Notes, WorkRequests, etc.).
 *
 * Uses real ZB platform tags (TagView) for the catalog — same search and
 * create as ResourceTagEditor — but stores assignments in Neon
 * sme_resource_tags via SmeMartResourceService.
 *
 * On migration day, replace with ResourceTagEditor (ZB platform assignments).
 */
@Component({
  selector: 'app-sme-resource-tag-editor',
  standalone: true,
  host: { '(click)': '$event.stopPropagation()' },
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatTooltipModule,
  ],
  templateUrl: './sme-resource-tag-editor.component.html',
  styleUrl: './sme-resource-tag-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmeResourceTagEditor implements OnInit, OnChanges {
  private readonly resourceService = inject(SmeMartResourceService);
  private readonly hierarchyService = inject(EngagementHierarchyService);

  readonly instanceId = `sme-tag-${nextInstanceId++}`;

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  @Input({ required: true }) resourceId!: string;
  @Input({ required: true }) resourceType!: SmeMartResourceType;
  @Input() readonly = false;

  @Output() tagsChanged = new EventEmitter<SmeMartResourceTag[]>();

  readonly tagCtrl = new FormControl('');
  readonly separatorKeyCodes = [ENTER, COMMA] as const;

  readonly assignedTags = signal<SmeMartResourceTag[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  /** Suggestions from ZB platform tag search */
  private readonly suggestions = signal<TagView[]>([]);

  private readonly inputValue = toSignal(
    this.tagCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' },
  );

  /** Filtered: suggestions minus already-assigned */
  readonly filteredSuggestions = computed(() => {
    const assignedIds = new Set(this.assignedTags().map(t => t.zbTagId));
    return this.suggestions().filter(t => !assignedIds.has(t.id?.toString()));
  });

  async ngOnInit(): Promise<void> {
    await this.loadAssignedTags();
    this.setupSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resourceId'] && !changes['resourceId'].firstChange) {
      this.loadAssignedTags();
    }
  }

  private async loadAssignedTags(): Promise<void> {
    this.loading.set(true);
    try {
      const tags = await this.resourceService.getTagsForResource(
        this.resourceId, this.resourceType,
      );
      this.assignedTags.set(tags);
    } catch {
      // TODO: migrate SmeMartResourceService.getTagsForResource from Neon to hydra/GQL
      this.assignedTags.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private setupSearch(): void {
    this.tagCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(async (value) => {
      const search = (typeof value === 'string' ? value : '').trim();
      if (!search) {
        this.suggestions.set([]);
        return;
      }
      try {
        const tags = await this.hierarchyService.searchTagsByName(search);
        this.suggestions.set(tags);
      } catch {
        this.suggestions.set([]);
      }
    });
  }

  async onSelected(event: MatAutocompleteSelectedEvent): Promise<void> {
    const tag = event.option.value as TagView;
    this.saving.set(true);
    try {
      await this.resourceService.tagResource(
        this.resourceId, this.resourceType,
        [{ zbTagId: tag.id?.toString()!, zbTagName: tag.name?.toString()! }],
      );
      const assigned: SmeMartResourceTag = {
        resourceId: this.resourceId,
        resourceType: this.resourceType,
        zbTagId: tag.id?.toString()!,
        zbTagName: tag.name?.toString()!,
        displayName: tag.name?.toString()!,
        assignedAt: new Date().toISOString(),
        assignedBy: '',
      };
      this.assignedTags.update(tags => [...tags, assigned]);
      this.tagInput.nativeElement.value = '';
      this.tagCtrl.setValue('');
      this.tagsChanged.emit(this.assignedTags());
    } finally {
      this.saving.set(false);
    }
  }

  async onChipInput(event: MatChipInputEvent): Promise<void> {
    const name = (event.value || '').trim();
    if (!name) return;

    this.saving.set(true);
    try {
      // Check if already assigned
      if (this.assignedTags().some(t => t.zbTagName.toLowerCase() === name.toLowerCase())) {
        event.chipInput.clear();
        this.tagCtrl.setValue('');
        return;
      }

      // Create tag in ZB platform, then assign in Neon
      const tag = await this.hierarchyService.createTag(name, '');
      if (tag) {
        await this.resourceService.tagResource(
          this.resourceId, this.resourceType,
          [{ zbTagId: tag.id?.toString()!, zbTagName: tag.name?.toString()! }],
        );
        const assigned: SmeMartResourceTag = {
          resourceId: this.resourceId,
          resourceType: this.resourceType,
          zbTagId: tag.id?.toString()!,
          zbTagName: tag.name?.toString()!,
          displayName: tag.name?.toString()!,
          assignedAt: new Date().toISOString(),
          assignedBy: '',
        };
        this.assignedTags.update(tags => [...tags, assigned]);
        this.tagsChanged.emit(this.assignedTags());
      }

      event.chipInput.clear();
      this.tagCtrl.setValue('');
    } finally {
      this.saving.set(false);
    }
  }

  async onChipRemoved(tag: SmeMartResourceTag): Promise<void> {
    this.saving.set(true);
    try {
      await this.resourceService.untagResource(this.resourceId, tag.zbTagId);
      this.assignedTags.update(tags => tags.filter(t => t.zbTagId !== tag.zbTagId));
      this.tagsChanged.emit(this.assignedTags());
    } finally {
      this.saving.set(false);
    }
  }

  displayFn(tag: TagView): string {
    return tag?.name?.toString() ?? '';
  }

  tagColor(tag: TagView): string {
    return (tag as any).color || '';
  }
}
