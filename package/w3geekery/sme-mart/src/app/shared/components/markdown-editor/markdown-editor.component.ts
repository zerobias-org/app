import {
  Component, input, output,
  ChangeDetectionStrategy, NgZone, ViewChild, ElementRef,
  AfterViewInit, OnDestroy, inject, signal,
  ViewEncapsulation, computed,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { editorViewCtx, serializerCtx, schemaCtx } from '@milkdown/kit/core';
import {
  toggleStrongCommand, toggleEmphasisCommand, toggleInlineCodeCommand,
  wrapInBlockquoteCommand, wrapInBulletListCommand, wrapInOrderedListCommand,
  wrapInHeadingCommand, insertHrCommand, createCodeBlockCommand, turnIntoTextCommand,
} from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { callCommand } from '@milkdown/kit/utils';
import { LanguageDescription } from '@codemirror/language';
import { VariableSubstitutionService } from '@/core/services';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatMenuModule,
    MatTooltipModule, MatProgressSpinnerModule,
  ],
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownEditor implements AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly variableSubstitution: VariableSubstitutionService = inject(VariableSubstitutionService);

  @ViewChild('editorRef') editorRef!: ElementRef;

  readonly content = input('');
  readonly height = input('200px');
  readonly placeholder = input('');
  readonly variableNames = input<string[]>([]);

  readonly contentChange = output<string>();

  readonly loading = signal(true);
  readonly previewMode = signal(false);
  readonly previewContent = signal('');
  readonly filteredVariables = signal<string[]>([]);
  readonly showVariableMenu = signal(false);

  private crepe: Crepe | null = null;

  private readonly features: Partial<Record<CrepeFeature, boolean>> = {
    [CrepeFeature.CodeMirror]: true,
    [CrepeFeature.ListItem]: true,
    [CrepeFeature.LinkTooltip]: false,
    [CrepeFeature.Cursor]: false,
    [CrepeFeature.ImageBlock]: false,
    [CrepeFeature.BlockEdit]: false,
    [CrepeFeature.Toolbar]: false,
    [CrepeFeature.Placeholder]: !!this.placeholder(),
    [CrepeFeature.Table]: true,
    [CrepeFeature.Latex]: false,
  };

  private readonly featureConfigs = {
    [CrepeFeature.CodeMirror]: {
      languages: [
        LanguageDescription.of({ name: 'JavaScript', alias: ['js'], extensions: ['js'], load: () => import('@codemirror/lang-javascript').then(m => m.javascript()) }),
        LanguageDescription.of({ name: 'TypeScript', alias: ['ts'], extensions: ['ts', 'tsx'], load: () => import('@codemirror/lang-javascript').then(m => m.javascript({ typescript: true })) }),
        LanguageDescription.of({ name: 'JSON', extensions: ['json'], load: () => import('@codemirror/lang-json').then(m => m.json()) }),
        LanguageDescription.of({ name: 'Python', extensions: ['py'], load: () => import('@codemirror/lang-python').then(m => m.python()) }),
        LanguageDescription.of({ name: 'SQL', extensions: ['sql'], load: () => import('@codemirror/lang-sql').then(m => m.sql()) }),
        LanguageDescription.of({ name: 'HTML', extensions: ['html'], load: () => import('@codemirror/lang-html').then(m => m.html()) }),
        LanguageDescription.of({ name: 'CSS', extensions: ['css'], load: () => import('@codemirror/lang-css').then(m => m.css()) }),
        LanguageDescription.of({ name: 'XML', extensions: ['xml'], load: () => import('@codemirror/lang-xml').then(m => m.xml()) }),
        LanguageDescription.of({ name: 'YAML', alias: ['yml'], extensions: ['yaml', 'yml'], load: () => import('@codemirror/lang-yaml').then(m => m.yaml()) }),
        LanguageDescription.of({ name: 'Markdown', alias: ['md'], extensions: ['md'], load: () => import('@codemirror/lang-markdown').then(m => m.markdown()) }),
      ],
    },
  };

  async ngAfterViewInit(): Promise<void> {
    // Guard against missing editorRef (e.g., in tests with stubbed component)
    if (!this.editorRef) {
      return;
    }

    this.ngZone.runOutsideAngular(async () => {
      // Workaround: milkdown crepe won't render if value is empty string
      const defaultValue = this.content() || '\u200B';

      this.crepe = new Crepe({
        root: this.editorRef.nativeElement,
        defaultValue,
        features: this.features,
        featureConfigs: this.featureConfigs,
      });

      this.crepe.editor.config((ctx) => {
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            const clean = markdown === '\u200B' ? '' : markdown.replace(/^\u200B/, '');
            this.ngZone.run(() => this.contentChange.emit(clean));
          }
        });
      }).use(listener);

      await this.crepe.create();

      this.ngZone.run(() => {
        this.loading.set(false);
      });
    });
  }

  async ngOnDestroy(): Promise<void> {
    await this.crepe?.destroy();
  }

  // ---- Preview & Variables ----

  togglePreview(): void {
    if (this.previewMode()) {
      this.previewMode.set(false);
    } else {
      const markdown = this.getMarkdown();
      const previewVars = this.variableSubstitution.generatePreviewVariables([]);
      const result = this.variableSubstitution.substitute(markdown, previewVars, []);
      this.previewContent.set(result.content);
      this.previewMode.set(true);
    }
  }

  insertVariable(varName: string): void {
    this.insertTextAtCursor(`{{${varName}}}`);
    this.showVariableMenu.set(false);
  }

  openVariableMenu(): void {
    this.filteredVariables.set(this.variableNames());
    this.showVariableMenu.set(true);
  }

  filterVariables(filterText: string): void {
    if (!filterText.trim()) {
      this.filteredVariables.set(this.variableNames());
      return;
    }
    const lower = filterText.toLowerCase();
    this.filteredVariables.set(
      this.variableNames().filter(v => v.toLowerCase().includes(lower))
    );
  }

  // ---- Toolbar actions ----

  toggleBold(): void { this.runCommand(callCommand(toggleStrongCommand.key)); }
  toggleItalic(): void { this.runCommand(callCommand(toggleEmphasisCommand.key)); }
  toggleStrikethrough(): void { this.runCommand(callCommand(toggleStrikethroughCommand.key)); }
  convertToText(): void { this.runCommand(callCommand(turnIntoTextCommand.key)); }
  toggleHeading(level: number): void { this.runCommand(callCommand(wrapInHeadingCommand.key, level)); }
  toggleBlockquote(): void { this.runCommand(callCommand(wrapInBlockquoteCommand.key)); }
  insertHorizontalRule(): void { this.runCommand(callCommand(insertHrCommand.key)); }
  toggleBulletList(): void { this.runCommand(callCommand(wrapInBulletListCommand.key)); }
  toggleOrderedList(): void { this.runCommand(callCommand(wrapInOrderedListCommand.key)); }
  toggleInlineCode(): void { this.runCommand(callCommand(toggleInlineCodeCommand.key)); }
  insertCodeBlock(): void { this.runCommand(callCommand(createCodeBlockCommand.key)); }

  toggleTaskList(): void {
    if (!this.crepe) return;
    try {
      // First ensure cursor is inside a bullet list item
      this.crepe.editor.action((ctx) => {
        callCommand(wrapInBulletListCommand.key)(ctx);
      });
      // Toggle checked attr on list_item: null → false (task), non-null → null (normal)
      this.crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        const { $from } = state.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'list_item') {
            const isTask = node.attrs['checked'] != null;
            const pos = $from.before(depth);
            dispatch(
              state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                checked: isTask ? null : false,
              }),
            );
            break;
          }
        }
        view.focus();
      });
    } catch (err) {
      console.error('[MarkdownEditor] Error toggling task list:', err);
    }
  }

  insertLink(): void {
    if (!this.crepe) return;
    const url = prompt('Enter URL:');
    if (!url) return;

    try {
      this.crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        const { from, to, empty } = state.selection;

        if (empty) {
          const linkText = prompt('Enter link text:', url) || url;
          const linkMark = state.schema.marks['link'].create({ href: url });
          const textNode = state.schema.text(linkText, [linkMark]);
          dispatch(state.tr.insert(from, textNode));
        } else {
          const linkMark = state.schema.marks['link'].create({ href: url });
          dispatch(state.tr.addMark(from, to, linkMark));
        }
        view.focus();
      });
    } catch (err) {
      console.error('[MarkdownEditor] Error inserting link:', err);
    }
  }

  insertTable(): void {
    const table = `\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`;
    this.insertTextAtCursor(table);
  }

  /** Insert a document cross-link as a markdown link with sme-doc:// scheme */
  insertDocLink(filename: string, docId: string): void {
    if (!this.crepe) return;
    const linkText = `📄 ${filename}`;
    const href = `sme-doc://${docId}`;
    try {
      this.crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        const { from } = state.selection;
        const linkMark = state.schema.marks['link'].create({ href });
        const textNode = state.schema.text(linkText, [linkMark]);
        dispatch(state.tr.insert(from, textNode));
        view.focus();
      });
    } catch (err) {
      // Fallback: insert as raw markdown
      this.insertTextAtCursor(`[${linkText}](${href})`);
    }
  }

  // ---- Public methods ----

  getMarkdown(): string {
    if (!this.crepe) return this.content() || '';
    try {
      let markdown = '';
      this.crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const serializer = ctx.get(serializerCtx);
        markdown = serializer(view.state.doc);
      });
      return markdown === '\u200B' ? '' : markdown.replace(/^\u200B/, '');
    } catch {
      return this.content() || '';
    }
  }

  reset(): void {
    if (!this.crepe) return;
    try {
      this.crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const schema = ctx.get(schemaCtx);
        const emptyDoc = schema.topNodeType.createAndFill()!;
        const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, emptyDoc.content);
        view.dispatch(tr);
      });
    } catch (err) {
      console.error('[MarkdownEditor] Error resetting:', err);
    }
  }

  focus(): void {
    if (!this.crepe) return;
    try {
      this.crepe.editor.action((ctx) => {
        ctx.get(editorViewCtx).focus();
      });
    } catch (err) {
      console.error('[MarkdownEditor] Error focusing:', err);
    }
  }

  // ---- Private helpers ----

  private runCommand(command: (ctx: any) => boolean): void {
    if (!this.crepe) return;
    try {
      this.crepe.editor.action((ctx) => {
        command(ctx);
        ctx.get(editorViewCtx).focus();
      });
    } catch (err) {
      console.error('[MarkdownEditor] Error running command:', err);
    }
  }

  private insertTextAtCursor(text: string): void {
    if (!this.crepe) return;
    try {
      this.crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { from } = view.state.selection;
        view.dispatch(view.state.tr.insertText(text, from));
        view.focus();
      });
    } catch (err) {
      console.error('[MarkdownEditor] Error inserting text:', err);
    }
  }
}
