import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { LanguageDescription } from '@codemirror/language';
import { editorViewCtx, schemaCtx, serializerCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { DOMSerializer } from '@milkdown/kit/prose/model';
import {
  createCodeBlockCommand,
  insertHrCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleStrongCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand,
} from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { callCommand } from '@milkdown/kit/utils';

import { MilkdownCrepe, MilkdownCrepeEditor } from './milkdown-crepe';

type CrepeConfig = NonNullable<ConstructorParameters<typeof Crepe>[0]>;

/** Zero-width space (U+200B) — Crepe won't render an empty doc, so we seed/strip this sentinel. */
const ZWSP = String.fromCharCode(0x200b);
const ZWSP_PREFIX = new RegExp('^' + ZWSP);

/**
 * MarkdownTextarea — the Milkdown WYSIWYG editor SHELL, vendored from zb-ui-lib's
 * `zb-markdown-textarea`. It renders the static Material toolbar and drives the hosted
 * {@link MilkdownCrepe} editor through Milkdown commands, and serializes the document back to
 * markdown/HTML. `change` emits `{ markdown, html }` on every edit; `ready` fires once Crepe is up.
 */
@Component({
  selector: 'app-markdown-textarea',
  encapsulation: ViewEncapsulation.None,
  imports: [NgStyle, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MilkdownCrepe],
  template: `
    <div class="milkdown-wrapper" [ngStyle]="getEditorStyle()">
      <div class="milkdown-static-toolbar">
        <div class="toolbar-group">
          <button mat-icon-button matTooltip="Text" (click)="convertToText()" [disabled]="loading">
            <mat-icon>notes</mat-icon>
          </button>
          <button
            mat-button
            [matMenuTriggerFor]="headingMenu"
            class="heading-dropdown"
            [disabled]="loading"
            matTooltip="Headings"
          >
            <span>H</span>
            <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
          </button>
          <mat-menu #headingMenu="matMenu">
            <button mat-menu-item (click)="toggleHeading(1)"><span class="heading-menu-item h1">Heading 1</span></button>
            <button mat-menu-item (click)="toggleHeading(2)"><span class="heading-menu-item h2">Heading 2</span></button>
            <button mat-menu-item (click)="toggleHeading(3)"><span class="heading-menu-item h3">Heading 3</span></button>
            <button mat-menu-item (click)="toggleHeading(4)"><span class="heading-menu-item h4">Heading 4</span></button>
            <button mat-menu-item (click)="toggleHeading(5)"><span class="heading-menu-item h5">Heading 5</span></button>
            <button mat-menu-item (click)="toggleHeading(6)"><span class="heading-menu-item h6">Heading 6</span></button>
          </mat-menu>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
          <button mat-icon-button matTooltip="Bold" (click)="toggleBold()" [disabled]="loading">
            <mat-icon>format_bold</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Italic" (click)="toggleItalic()" [disabled]="loading">
            <mat-icon>format_italic</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Strikethrough" (click)="toggleStrikethrough()" [disabled]="loading">
            <mat-icon>strikethrough_s</mat-icon>
          </button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
          <button mat-icon-button matTooltip="Quote" (click)="toggleBlockquote()" [disabled]="loading">
            <mat-icon>format_quote</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Horizontal Rule" (click)="insertHorizontalRule()" [disabled]="loading">
            <mat-icon>horizontal_rule</mat-icon>
          </button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
          <button mat-icon-button matTooltip="Bullet List" (click)="toggleBulletList()" [disabled]="loading">
            <mat-icon>format_list_bulleted</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Numbered List" (click)="toggleOrderedList()" [disabled]="loading">
            <mat-icon>format_list_numbered</mat-icon>
          </button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
          <button mat-icon-button matTooltip="Table" (click)="insertTable()" [disabled]="loading">
            <mat-icon>table_chart</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Link" (click)="insertLink()" [disabled]="loading">
            <mat-icon>link</mat-icon>
          </button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
          <button mat-icon-button matTooltip="Inline Code" (click)="toggleInlineCode()" [disabled]="loading">
            <mat-icon>code</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Code Block" (click)="insertCodeBlock()" [disabled]="loading">
            <mat-icon>integration_instructions</mat-icon>
          </button>
        </div>
      </div>

      <div class="milkdown-editor-container">
        <app-milkdown-crepe
          #milkdownEditor
          [value]="editorValue"
          [features]="features"
          [featureConfigs]="featureConfigs"
          [(loading)]="loading"
          (onReady)="onEditorReady($event)"
          (onChanged)="onContentChange($event)"
        />
      </div>
    </div>
  `,
})
export class MarkdownTextarea implements AfterViewInit, OnDestroy, OnChanges {
  @Input() content = '';
  @Input() height = '250px';
  @Input() minHeight = '250px';

  @Output() change = new EventEmitter<{ markdown: string; html: string }>();
  @Output() ready = new EventEmitter<MilkdownCrepeEditor>();

  @ViewChild('milkdownEditor') milkdownEditorComponent!: MilkdownCrepe;

  loading = true;
  private crepeInstance: Crepe | null = null;
  private themeObserver: MutationObserver | null = null;

  /** Crepe refuses to render an empty string, so seed it with a zero-width space. */
  get editorValue(): string {
    return this.content || ZWSP;
  }

  // Limit CodeMirror languages to a practical subset (lazy-loaded on demand).
  featureConfigs: CrepeConfig['featureConfigs'] = {
    [CrepeFeature.CodeMirror]: {
      languages: [
        LanguageDescription.of({ name: 'JavaScript', alias: ['js', 'mjs', 'cjs'], extensions: ['js', 'mjs', 'cjs'], load: () => import('@codemirror/lang-javascript').then((m) => m.javascript()) }),
        LanguageDescription.of({ name: 'TypeScript', alias: ['ts'], extensions: ['ts', 'tsx', 'mts', 'cts'], load: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })) }),
        LanguageDescription.of({ name: 'JSON', extensions: ['json'], load: () => import('@codemirror/lang-json').then((m) => m.json()) }),
        LanguageDescription.of({ name: 'Python', extensions: ['py'], load: () => import('@codemirror/lang-python').then((m) => m.python()) }),
        LanguageDescription.of({ name: 'SQL', extensions: ['sql'], load: () => import('@codemirror/lang-sql').then((m) => m.sql()) }),
        LanguageDescription.of({ name: 'HTML', alias: ['htm'], extensions: ['html', 'htm'], load: () => import('@codemirror/lang-html').then((m) => m.html()) }),
        LanguageDescription.of({ name: 'CSS', extensions: ['css'], load: () => import('@codemirror/lang-css').then((m) => m.css()) }),
        LanguageDescription.of({ name: 'XML', extensions: ['xml', 'xsl', 'xsd', 'svg'], load: () => import('@codemirror/lang-xml').then((m) => m.xml()) }),
        LanguageDescription.of({ name: 'YAML', alias: ['yml'], extensions: ['yaml', 'yml'], load: () => import('@codemirror/lang-yaml').then((m) => m.yaml()) }),
        LanguageDescription.of({ name: 'Markdown', alias: ['md'], extensions: ['md', 'markdown'], load: () => import('@codemirror/lang-markdown').then((m) => m.markdown()) }),
      ],
    },
  };

  // Crepe features — disable the floating UI elements since we ship a static toolbar.
  features: CrepeConfig['features'] = {
    [CrepeFeature.CodeMirror]: true,
    [CrepeFeature.ListItem]: true,
    [CrepeFeature.LinkTooltip]: false,
    [CrepeFeature.Cursor]: true,
    [CrepeFeature.ImageBlock]: false,
    [CrepeFeature.BlockEdit]: false,
    [CrepeFeature.Toolbar]: false,
    [CrepeFeature.Placeholder]: false,
    [CrepeFeature.Table]: true,
    [CrepeFeature.Latex]: false,
  };

  constructor(
    private readonly elementRef: ElementRef,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] && this.crepeInstance && !changes['content'].firstChange) {
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit(): void {
    this.setupThemeObserver();
    this.setupCodeBlockClickHandler();
  }

  ngOnDestroy(): void {
    this.themeObserver?.disconnect();
    this.themeObserver = null;
  }

  onEditorReady(event: MilkdownCrepeEditor): void {
    this.crepeInstance = event.crepe;
    this.loading = false;
    this.ready.emit(event);
  }

  onContentChange(markdown: string): void {
    const cleanMarkdown = markdown === ZWSP ? '' : markdown.replace(ZWSP_PREFIX, '');
    this.change.emit({ markdown: cleanMarkdown, html: this.getHTMLFromEditor() });
  }

  // ============ Toolbar actions ============

  toggleBold(): void {
    this.runCommand(callCommand(toggleStrongCommand.key));
  }

  toggleItalic(): void {
    this.runCommand(callCommand(toggleEmphasisCommand.key));
  }

  toggleStrikethrough(): void {
    this.runCommand(callCommand(toggleStrikethroughCommand.key));
  }

  convertToText(): void {
    this.runCommand(callCommand(turnIntoTextCommand.key));
  }

  toggleHeading(level = 2): void {
    this.runCommand(callCommand(wrapInHeadingCommand.key, level));
  }

  toggleBlockquote(): void {
    this.runCommand(callCommand(wrapInBlockquoteCommand.key));
  }

  insertHorizontalRule(): void {
    this.runCommand(callCommand(insertHrCommand.key));
  }

  toggleBulletList(): void {
    this.runCommand(callCommand(wrapInBulletListCommand.key));
  }

  toggleOrderedList(): void {
    this.runCommand(callCommand(wrapInOrderedListCommand.key));
  }

  toggleInlineCode(): void {
    this.runCommand(callCommand(toggleInlineCodeCommand.key));
  }

  insertCodeBlock(): void {
    this.runCommand(callCommand(createCodeBlockCommand.key));
  }

  insertLink(): void {
    if (!this.crepeInstance) return;
    const url = prompt('Enter URL:');
    if (!url) return;
    try {
      this.crepeInstance.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        const { from, to, empty } = state.selection;
        if (empty) {
          const linkText = prompt('Enter link text:', url) || url;
          const linkMark = state.schema.marks['link'].create({ href: url });
          dispatch(state.tr.insert(from, state.schema.text(linkText, [linkMark])));
        } else {
          dispatch(state.tr.addMark(from, to, state.schema.marks['link'].create({ href: url })));
        }
        view.focus();
      });
    } catch (error) {
      console.error('Error inserting link:', error);
    }
  }

  insertTable(): void {
    this.insertTextAtCursor(
      '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n',
    );
  }

  // ============ Public API ============

  reset(): void {
    if (this.crepeInstance) {
      this.content = '';
      this.cdr.detectChanges();
    }
  }

  focus(): void {
    if (!this.crepeInstance) return;
    try {
      this.crepeInstance.editor.action((ctx) => ctx.get(editorViewCtx).focus());
    } catch (error) {
      console.error('Error focusing Milkdown editor:', error);
    }
  }

  getMarkdown(): string {
    if (!this.crepeInstance) return this.content || '';
    try {
      let markdown = '';
      this.crepeInstance.editor.action((ctx) => {
        markdown = ctx.get(serializerCtx)(ctx.get(editorViewCtx).state.doc);
      });
      return markdown === ZWSP ? '' : markdown.replace(ZWSP_PREFIX, '');
    } catch (error) {
      console.error('Error getting markdown from Milkdown editor:', error);
      return this.content || '';
    }
  }

  getHTML(): string {
    return this.getHTMLFromEditor();
  }

  getEditorStyle(): Record<string, string> {
    return { height: this.height, 'min-height': this.minHeight };
  }

  // ============ Internals ============

  private runCommand(command: (ctx: Ctx) => unknown): void {
    if (!this.crepeInstance) return;
    try {
      this.crepeInstance.editor.action((ctx) => {
        command(ctx);
        ctx.get(editorViewCtx).focus();
      });
    } catch (error) {
      console.error('Error running Milkdown command:', error);
    }
  }

  private insertTextAtCursor(text: string): void {
    if (!this.crepeInstance) return;
    try {
      this.crepeInstance.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        dispatch(state.tr.insertText(text, state.selection.from));
        view.focus();
      });
    } catch (error) {
      console.error('Error inserting text:', error);
    }
  }

  private getHTMLFromEditor(): string {
    if (!this.crepeInstance) return '';
    try {
      let html = '';
      this.crepeInstance.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const schema = ctx.get(schemaCtx);
        const div = document.createElement('div');
        div.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(view.state.doc.content));
        html = div.innerHTML;
      });
      return html;
    } catch (error) {
      console.error('Error getting HTML from Milkdown editor:', error);
      return '';
    }
  }

  /** Crepe bakes its theme colors from CSS vars at build; re-render when the app toggles dark mode. */
  private setupThemeObserver(): void {
    this.themeObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          this.cdr.detectChanges();
        }
      }
    });
    this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /** Stop code-block tool clicks from bubbling to parent components (e.g. a host edit mode). */
  private setupCodeBlockClickHandler(): void {
    this.elementRef.nativeElement.addEventListener(
      'click',
      (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (
          target.closest('.tools-button-group') ||
          target.closest('.language-button') ||
          target.closest('.milkdown-code-block button')
        ) {
          event.stopPropagation();
        }
      },
      true,
    );
  }
}
