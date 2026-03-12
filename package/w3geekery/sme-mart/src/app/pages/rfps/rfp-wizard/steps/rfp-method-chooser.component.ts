import {
  Component, Output, EventEmitter, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import type { RfpCreationMethod } from '../rfp-wizard.component';

@Component({
  selector: 'app-rfp-method-chooser',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="method-chooser">
      <h2>How would you like to create your RFP?</h2>
      <p class="chooser-subtitle">
        You can have an AI extract requirements from your documents, or build the RFP step by step.
      </p>

      <div class="method-cards">
        <!-- AI-Assisted Card -->
        <mat-card class="method-card" appearance="outlined"
          [class.selected]="showAiInstructions()"
          (click)="showAiInstructions.set(true)">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-icon ai-icon">auto_awesome</mat-icon>
            <mat-card-title>Import with AI</mat-card-title>
            <mat-card-subtitle>Recommended for large RFP documents</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>
              Use an LLM (ChatGPT, Claude, etc.) to extract requirements from your RFP
              documents into structured JSON, then import directly into the wizard.
            </p>
            <ul>
              <li>Upload your PDF/DOCX to any LLM</li>
              <li>Get structured requirements back as JSON</li>
              <li>Import into Step 3 with one click</li>
              <li>Review and edit in the wizard</li>
            </ul>
          </mat-card-content>
        </mat-card>

        <!-- Manual Card -->
        <mat-card class="method-card" appearance="outlined" (click)="choose('manual')">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-icon manual-icon">edit_note</mat-icon>
            <mat-card-title>Create Manually</mat-card-title>
            <mat-card-subtitle>Step-by-step wizard</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>
              Walk through each step of the wizard to define your RFP from scratch.
              Add requirements one at a time with full control over every field.
            </p>
            <ul>
              <li>Fill in basics, upload documents</li>
              <li>Add requirement groups and subtasks</li>
              <li>Set terms, deadlines, evaluation criteria</li>
              <li>Review and publish</li>
            </ul>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- AI Instructions Panel -->
      @if (showAiInstructions()) {
        <div class="ai-instructions">
          <h3>AI Import Instructions</h3>

          <div class="instruction-section">
            <h4>
              <mat-icon>download</mat-icon>
              1. Download the prompt template
            </h4>
            <p>Choose the prompt that matches your setup:</p>
            <div class="download-buttons">
              <a mat-stroked-button href="docs/rfp-import-prompt.md" download
                class="download-btn">
                <mat-icon>description</mat-icon>
                Standard Prompt
              </a>
              <a mat-stroked-button href="docs/rfp-import-prompt-mcp.md" download
                class="download-btn">
                <mat-icon>settings_suggest</mat-icon>
                ZeroBias MCP Prompt
              </a>
              <a mat-stroked-button href="docs/rfp-import-schema.json" download
                class="download-btn">
                <mat-icon>data_object</mat-icon>
                JSON Schema
              </a>
            </div>
          </div>

          <div class="instruction-section">
            <h4>
              <mat-icon>chat</mat-icon>
              2. Paste prompt + RFP into your LLM
            </h4>
            <ol>
              <li>Open <strong>ChatGPT</strong>, <strong>Claude</strong>, or any LLM</li>
              <li>Paste the downloaded prompt template</li>
              <li>Upload or paste your RFP document text after the prompt</li>
              <li>The LLM will return structured JSON</li>
            </ol>
          </div>

          <div class="instruction-section">
            <h4>
              <mat-icon>input</mat-icon>
              3. Import the JSON
            </h4>
            <p>
              Copy the JSON output, then click <strong>"Import from JSON"</strong>
              in Step 3 (Requirements) of the wizard. The wizard will parse and
              display all requirements for your review.
            </p>
          </div>

          <!-- ZB MCP Setup (stub) -->
          <div class="instruction-section mcp-section">
            <h4>
              <mat-icon>hub</mat-icon>
              Advanced: ZeroBias MCP Integration
            </h4>
            <p class="mcp-note">
              If you have <strong>Claude Code</strong> or another MCP-capable AI tool, the
              ZeroBias MCP server can read your files directly and automate the import.
            </p>
            <div class="mcp-steps">
              <p><strong>Quick Setup:</strong></p>
              <ol>
                <li>
                  Generate an API key in ZeroBias:
                  <em>Settings → API Keys → Create Key</em>
                </li>
                <li>
                  Add the ZeroBias MCP server to your AI tool's configuration
                  (see the MCP prompt template for details)
                </li>
                <li>
                  Use the <strong>ZeroBias MCP Prompt</strong> — your AI reads the
                  RFP file directly and produces the import JSON
                </li>
              </ol>
              <p class="mcp-coming-soon">
                <mat-icon>info</mat-icon>
                <strong>Coming soon:</strong> Hosted ZeroBias MCP — no local setup required.
                We'll publish detailed KB articles when it's available.
              </p>
            </div>
          </div>

          <div class="chooser-actions">
            <button mat-button (click)="showAiInstructions.set(false)">
              <mat-icon>arrow_back</mat-icon> Back
            </button>
            <button mat-flat-button (click)="choose('ai')">
              Got it — Start Wizard
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .method-chooser {
      max-width: 800px;
      margin: 0 auto;
    }

    h2 {
      font-size: 20px;
      font-weight: 500;
      margin: 0 0 4px;
    }

    .chooser-subtitle {
      color: var(--mat-sys-on-surface-variant, #666);
      font-size: 14px;
      margin: 0 0 24px;
    }

    .method-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .method-card {
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:hover {
        border-color: var(--mat-sys-primary, #1976d2);
      }

      &.selected {
        border-color: var(--mat-sys-primary, #1976d2);
        box-shadow: 0 0 0 1px var(--mat-sys-primary, #1976d2);
      }
    }

    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 20px;
    }

    .ai-icon {
      background: var(--mat-sys-primary-container, #e3f2fd);
      color: var(--mat-sys-on-primary-container, #1565c0);
    }

    .manual-icon {
      background: var(--mat-sys-secondary-container, #e8f5e9);
      color: var(--mat-sys-on-secondary-container, #2e7d32);
    }

    mat-card-content {
      p { margin: 0 0 8px; font-size: 13px; color: var(--mat-sys-on-surface-variant, #666); }
      ul {
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
        color: var(--mat-sys-on-surface-variant, #555);
        li { padding: 2px 0; }
      }
    }

    .ai-instructions {
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 24px;
      margin-top: 8px;
      background: var(--mat-sys-surface-container-lowest, #fff);
    }

    .ai-instructions h3 {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 20px;
    }

    .instruction-section {
      margin-bottom: 24px;

      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 500;
        margin: 0 0 8px;

        mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--mat-sys-primary, #1976d2); }
      }

      p, ol, li {
        font-size: 13px;
        color: var(--mat-sys-on-surface-variant, #555);
        line-height: 1.5;
      }

      ol { padding-left: 20px; }
      li { padding: 2px 0; }
    }

    .download-buttons {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .download-btn {
      mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .mcp-section {
      border-top: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      padding-top: 20px;
    }

    .mcp-note {
      margin-bottom: 12px;
    }

    .mcp-steps {
      background: var(--mat-sys-surface-container, #f5f5f5);
      border-radius: 8px;
      padding: 16px;
    }

    .mcp-steps p:first-child { margin-top: 0; }

    .mcp-coming-soon {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 12px;
      padding: 12px;
      background: var(--mat-sys-tertiary-container, #fff3e0);
      border-radius: 8px;
      font-size: 13px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--mat-sys-tertiary, #e65100);
        flex-shrink: 0;
        margin-top: 2px;
      }
    }

    .chooser-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
    }

    @media (max-width: 600px) {
      .method-cards {
        grid-template-columns: 1fr;
      }
      .download-buttons {
        flex-direction: column;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpMethodChooser {
  @Output() methodChosen = new EventEmitter<RfpCreationMethod>();

  readonly showAiInstructions = signal(false);

  choose(method: RfpCreationMethod): void {
    this.methodChosen.emit(method);
  }
}
