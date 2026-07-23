import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Crepe } from '@milkdown/crepe';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';

/** The exact Crepe constructor config type, so `features`/`featureConfigs` stay typed (no `any`). */
type CrepeConfig = NonNullable<ConstructorParameters<typeof Crepe>[0]>;

export interface MilkdownCrepeEditor {
  crepe: Crepe;
}

/**
 * MilkdownCrepe — the actual WYSIWYG editor. Vendored from zb-ui-lib's `zb-milkdown-crepe`: it
 * instantiates a Milkdown `Crepe` inside `runOutsideAngular` (ProseMirror manages its own DOM) and
 * bridges its markdown-updated stream back into Angular via `onChanged`. The toolbar + Angular API
 * live in the {@link MarkdownTextarea} shell that hosts this component.
 */
@Component({
  selector: 'app-milkdown-crepe',
  template: `
    <div #editorRef [hidden]="loading" class="milkdown-editor"></div>
    @if (loading) {
      <div class="milkdown-loading">Loading...</div>
    }
  `,
  styles: `
    :host { display: contents; }
    .milkdown-editor { position: relative; }
  `,
  encapsulation: ViewEncapsulation.None,
})
export class MilkdownCrepe implements AfterViewInit, OnDestroy {
  @ViewChild('editorRef') editorRef!: ElementRef;

  @Input() value = '';
  @Input() features: CrepeConfig['features'] = {};
  @Input() featureConfigs: CrepeConfig['featureConfigs'] = {};

  @Output() onReady = new EventEmitter<MilkdownCrepeEditor>();
  @Output() onChanged = new EventEmitter<string>();
  @Output() loadingChange = new EventEmitter<boolean>();

  @Input() loading = true;
  private crepe: Crepe | null = null;

  constructor(private readonly ngZone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    this.ngZone.runOutsideAngular(async () => {
      this.crepe = new Crepe({
        root: this.editorRef.nativeElement,
        defaultValue: this.value,
        features: this.features,
        featureConfigs: this.featureConfigs,
      });

      // Bridge Crepe's markdown-updated stream back into the Angular zone.
      this.crepe.editor
        .config((ctx) => {
          ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
            if (markdown !== prevMarkdown) {
              this.ngZone.run(() => this.onChanged.emit(markdown));
            }
          });
        })
        .use(listener);

      await this.crepe.create();

      this.ngZone.run(() => {
        this.loading = false;
        this.loadingChange.emit(false);
        this.onReady.emit({ crepe: this.crepe! });
      });
    });
  }

  async ngOnDestroy(): Promise<void> {
    await this.crepe?.destroy();
  }
}
