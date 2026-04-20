import {
  Component, Input, Output, EventEmitter, TemplateRef,
  ChangeDetectionStrategy, inject, signal, OnInit, OnChanges, SimpleChanges, ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  ZbChipColorsDirective, ZbSnakeToSpacesPipe,
  ZbSimplePanelComponent,
  ZbCustomizableTableComponent,
} from '@zerobias-org/ngx-library';
import type { TagView } from '@zerobias-com/platform-sdk';
import { EngagementHierarchyService } from '../../../core/services/engagement-hierarchy.service';
import { isProtectedTag } from '../../../core/utils/tag-prefix.util';

@Component({
  selector: 'app-resource-tags-panel',
  standalone: true,
  imports: [
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatSnackBarModule,
    ZbChipColorsDirective, ZbSnakeToSpacesPipe,
    ZbSimplePanelComponent,
    ZbCustomizableTableComponent,
  ],
  templateUrl: './resource-tags-panel.component.html',
  styleUrl: './resource-tags-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceTagsPanel implements OnInit, OnChanges {
  private readonly hierarchyService = inject(EngagementHierarchyService);
  private readonly snackBar = inject(MatSnackBar);

  @Input({ required: true }) resourceId!: string;
  @Input() readonly = false;

  /** Predicate for tags that cannot be removed (e.g. sme-mart.eng.*, sme-mart.proj.*, ENG-*, PROJ-*) */
  @Input() isProtected: (tag: TagView) => boolean = (tag) => {
    return isProtectedTag(tag.name?.toString() || '');
  };

  @Output() tagsChanged = new EventEmitter<TagView[]>();

  @ViewChild('typesRef') typesRef!: TemplateRef<any>;
  @ViewChild('nameRef') nameRef!: TemplateRef<any>;
  @ViewChild('descriptionRef') descriptionRef!: TemplateRef<any>;
  @ViewChild('scopeRef') scopeRef!: TemplateRef<any>;
  @ViewChild('actionsRef') actionsRef!: TemplateRef<any>;

  readonly columns = ['types', 'name', 'description', 'scope', 'actions'];
  readonly columnLabels = ['Type', 'Name', 'Description', 'Scope', ''];

  readonly tags = signal<TagView[]>([]);
  readonly loading = signal(false);

  get templateRefs(): Record<string, TemplateRef<any>> {
    return {
      types: this.typesRef,
      name: this.nameRef,
      description: this.descriptionRef,
      scope: this.scopeRef,
      actions: this.actionsRef,
    };
  }

  ngOnInit(): void {
    this.list();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resourceId'] && !changes['resourceId'].firstChange) {
      this.list();
    }
  }

  async list(): Promise<void> {
    if (!this.resourceId) return;
    this.loading.set(true);
    try {
      const tags = await this.hierarchyService.getResourceTags(this.resourceId);
      this.tags.set(tags);
    } finally {
      this.loading.set(false);
    }
  }

  tagType(tag: TagView): string {
    return (tag as any).type?.toString() || '';
  }

  tagColor(tag: TagView): string {
    return (tag as any).color || '';
  }

  tagScope(tag: TagView): string {
    return (tag as any).scope?.toString() || '';
  }

  tagDescription(tag: TagView): string {
    return tag.description?.toString() || '';
  }

  isTagProtected(tag: TagView): boolean {
    return this.isProtected(tag);
  }

  async onRemoveTag(tag: TagView): Promise<void> {
    if (this.isProtected(tag)) return;
    try {
      await this.hierarchyService.untagResource(this.resourceId, tag.id?.toString()!);
      this.snackBar.open(`Tag "${tag.name}" removed`, 'OK', { duration: 3000 });
      await this.list();
      this.tagsChanged.emit(this.tags());
    } catch (err: any) {
      this.snackBar.open(`Failed to remove tag: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  onAdd(): void {
    this.snackBar.open('Tag search dialog coming soon — use the autocomplete tag editor for now.', 'OK', { duration: 4000 });
  }
}
