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
import { ZbChipColorsDirective } from '@zerobias-org/ngx-library';
import type { TagView } from '@zerobias-com/platform-sdk';
import { EngagementHierarchyService } from '../../../core/services/engagement-hierarchy.service';
import { isProtectedTag } from '../../../core/utils/tag-prefix.util';

let nextInstanceId = 0;

/** Default filter: protect hierarchy tags (ENG-*, PROJ-*, sme-mart.eng.*, sme-mart.proj.*) from removal */
function defaultProtectedFilter(tag: TagView): boolean {
  return isProtectedTag(tag.name?.toString() || '');
}

@Component({
  selector: 'app-resource-tag-autocomplete',
  standalone: true,
  host: { '(click)': '$event.stopPropagation()' },
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatTooltipModule,
    ZbChipColorsDirective,
  ],
  templateUrl: './resource-tag-autocomplete.component.html',
  styleUrl: './resource-tag-autocomplete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceTagAutocomplete implements OnInit, OnChanges {
  private readonly hierarchyService = inject(EngagementHierarchyService);

  /** Unique ID per instance to avoid DOM id collisions across multiple editors */
  readonly instanceId = `res-tag-${nextInstanceId++}`;

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  @Input({ required: true }) resourceId!: string;
  @Input() readonly = false;

  /** Predicate that returns true for tags that cannot be removed. Default: protects ENG-* and PROJ-* tags. */
  @Input() isProtected: (tag: TagView) => boolean = defaultProtectedFilter;

  @Output() tagsChanged = new EventEmitter<TagView[]>();

  readonly tagCtrl = new FormControl('');
  readonly separatorKeyCodes = [ENTER, COMMA] as const;

  readonly assignedTags = signal<TagView[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  /** Suggestions from API search */
  private readonly suggestions = signal<TagView[]>([]);

  private readonly inputValue = toSignal(
    this.tagCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' },
  );

  /** Filtered: suggestions minus already-assigned */
  readonly filteredSuggestions = computed(() => {
    const assignedIds = new Set(this.assignedTags().map(t => t.id?.toString()));
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
      const tags = await this.hierarchyService.getResourceTags(this.resourceId);
      this.assignedTags.set(tags);
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
      await this.hierarchyService.tagResource(this.resourceId, [tag.id?.toString()!]);
      this.assignedTags.update(tags => [...tags, tag]);
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
      if (this.assignedTags().some(t => (t.name?.toString() || '').toLowerCase() === name.toLowerCase())) {
        event.chipInput.clear();
        this.tagCtrl.setValue('');
        return;
      }

      // Create tag and assign to the resource
      const tag = await this.hierarchyService.createTag(name, '', this.resourceId);
      if (tag) {
        // createTag with resourceId auto-tags, but let's ensure it's in our list
        this.assignedTags.update(tags => [...tags, tag!]);
        this.tagsChanged.emit(this.assignedTags());
      }

      event.chipInput.clear();
      this.tagCtrl.setValue('');
    } finally {
      this.saving.set(false);
    }
  }

  isTagProtected(tag: TagView): boolean {
    return this.isProtected(tag);
  }

  async onChipRemoved(tag: TagView): Promise<void> {
    if (this.isProtected(tag)) return;
    this.saving.set(true);
    try {
      await this.hierarchyService.untagResource(this.resourceId, tag.id?.toString()!);
      this.assignedTags.update(tags => tags.filter(t => t.id?.toString() !== tag.id?.toString()));
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
