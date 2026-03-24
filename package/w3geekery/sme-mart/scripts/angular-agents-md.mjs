#!/usr/bin/env node

/**
 * angular-agents-md.mjs
 *
 * Downloads Angular documentation from GitHub (version-pinned) and generates
 * a compact index for AGENTS.md. Mirrors the pattern from Next.js's
 * `npx @next/codemod agents-md`.
 *
 * Usage:
 *   node scripts/angular-agents-md.mjs [options]
 *
 * Options:
 *   --version <ver>   Angular version to download (default: auto-detect from package.json)
 *   --output <file>   Target file for index injection (default: AGENTS.md)
 *   --docs-dir <dir>  Local docs directory name (default: .angular-docs)
 *   --help            Show help
 *
 * Examples:
 *   node scripts/angular-agents-md.mjs                     # Auto-detect version
 *   node scripts/angular-agents-md.mjs --version 21.1.4    # Pin to specific version
 *   node scripts/angular-agents-md.mjs --output CLAUDE.md  # Inject into different file
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// --- Constants ---

const REPO_URL = 'https://github.com/angular/angular.git';
const DOCS_PATH = 'adev/src/content';
const DEFAULT_DOCS_DIR = '.angular-docs';
const DEFAULT_OUTPUT = 'AGENTS.md';
const START_MARKER = '<!-- ANGULAR-AGENTS-MD-START -->';
const END_MARKER = '<!-- ANGULAR-AGENTS-MD-END -->';

// Files to skip in the index (navigation stubs, build files)
const SKIP_FILES = new Set(['BUILD.bazel', 'kitchen-sink.md']);
const SKIP_NAMES = new Set(['index.md']);

// --- Core Functions ---

/**
 * Detect Angular version from package.json.
 * Checks @angular/core in dependencies and devDependencies.
 * Supports monorepo scanning (walks up to find root package.json with workspaces).
 */
function detectAngularVersion(cwd) {
  // Check local package.json first
  const version = readAngularVersionFromPkg(path.join(cwd, 'package.json'));
  if (version) return version;

  // Walk up looking for monorepo root
  let dir = path.dirname(cwd);
  const root = path.parse(cwd).root;
  while (dir !== root) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.workspaces || pkg.nx || pkg.lerna) {
        // Monorepo root — scan workspace packages
        const found = scanWorkspacePackages(dir, pkg);
        if (found) return found;
      }
    }
    dir = path.dirname(dir);
  }

  return null;
}

function readAngularVersionFromPkg(pkgPath) {
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const raw = deps['@angular/core'];
  if (!raw) return null;
  // Strip range chars (^, ~, >=, etc.) and extract semver
  const match = raw.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

function scanWorkspacePackages(rootDir, rootPkg) {
  // Collect versions from workspace packages
  let highest = null;
  const patterns = Array.isArray(rootPkg.workspaces)
    ? rootPkg.workspaces
    : rootPkg.workspaces?.packages || [];

  for (const pattern of patterns) {
    const base = pattern.replace(/\/?\*\*?\/?$/, '');
    const searchDir = path.join(rootDir, base);
    if (!fs.existsSync(searchDir) || !fs.statSync(searchDir).isDirectory()) continue;

    for (const entry of fs.readdirSync(searchDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const ver = readAngularVersionFromPkg(path.join(searchDir, entry.name, 'package.json'));
      if (ver && (!highest || compareVersions(ver, highest) > 0)) {
        highest = ver;
      }
    }
  }
  return highest;
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/**
 * Download Angular docs via git sparse-checkout.
 * Clones only the adev/src/content/ directory from the matching version tag.
 */
function downloadDocs(version, destDir) {
  const tag = `v${version}`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'angular-agents-md-'));

  try {
    log(`Cloning Angular ${tag} (sparse checkout)...`);
    execSync(
      `git clone --depth 1 --filter=blob:none --sparse --branch ${tag} ${REPO_URL} .`,
      { cwd: tempDir, stdio: 'pipe', timeout: 120_000 }
    );

    execSync(`git sparse-checkout set ${DOCS_PATH}`, {
      cwd: tempDir,
      stdio: 'pipe',
      timeout: 30_000,
    });

    const sourceDir = path.join(tempDir, DOCS_PATH);
    if (!fs.existsSync(sourceDir)) {
      throw new Error(
        `Docs path '${DOCS_PATH}' not found in tag ${tag}. ` +
        `The Angular docs structure may have changed.`
      );
    }

    // Remove old docs and copy fresh
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true });
    }
    fs.cpSync(sourceDir, destDir, { recursive: true });

    // Count files
    const count = countFiles(destDir, '.md');
    log(`Copied ${count} doc files to ${path.basename(destDir)}/`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Recursively collect all .md files from the docs directory.
 * Skips index.md, BUILD.bazel, and other non-content files.
 */
function collectDocFiles(dir, base = dir) {
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip directories that aren't documentation content
      if (entry.name === 'examples') continue;
      files.push(...collectDocFiles(fullPath, base));
    } else if (entry.name.endsWith('.md')) {
      if (SKIP_FILES.has(entry.name)) continue;
      if (SKIP_NAMES.has(entry.name)) continue;
      files.push(path.relative(base, fullPath));
    }
  }

  return files.sort();
}

/**
 * Generate a compact pipe-delimited index string.
 * Groups files by parent directory for readability.
 *
 * Format: [Angular Docs Index]|root: ./<dir>|...|dir:{file1.md,file2.md}|...
 */
function generateIndex(docsDir, files) {
  // Group files by directory
  const groups = new Map();

  for (const file of files) {
    const dir = path.dirname(file);
    const name = path.basename(file);
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(name);
  }

  const parts = [
    '[Angular Docs Index]',
    `root: ./${path.basename(docsDir)}`,
    'STOP. What you remember about Angular may be OUTDATED. Always search docs and read before any task.',
    `If docs missing, run: node scripts/angular-agents-md.mjs`,
  ];

  for (const [dir, fileNames] of groups) {
    parts.push(`${dir}:{${fileNames.join(',')}}`);
  }

  return parts.join('|');
}

/**
 * Inject the index between marker comments in the target file.
 * Creates the file if it doesn't exist.
 * Replaces existing content between markers (idempotent).
 */
function injectIndex(targetPath, index) {
  const block = `${START_MARKER}${index}${END_MARKER}`;

  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(
      targetPath,
      `## Angular Docs\n\n${block}\n`,
      'utf-8'
    );
    log(`Created ${path.basename(targetPath)} with Angular docs index`);
    return;
  }

  let content = fs.readFileSync(targetPath, 'utf-8');
  const startIdx = content.indexOf(START_MARKER);
  const endIdx = content.indexOf(END_MARKER);

  if (startIdx !== -1 && endIdx !== -1) {
    // Replace existing block
    content =
      content.substring(0, startIdx) +
      block +
      content.substring(endIdx + END_MARKER.length);
    log(`Updated existing Angular docs index in ${path.basename(targetPath)}`);
  } else {
    // Append new section
    content += `\n## Angular Docs\n\n${block}\n`;
    log(`Appended Angular docs index to ${path.basename(targetPath)}`);
  }

  fs.writeFileSync(targetPath, content, 'utf-8');
}

/**
 * Ensure the docs directory is in .gitignore.
 */
function ensureGitignore(cwd, docsDir) {
  const gitignorePath = path.join(cwd, '.gitignore');
  const entry = path.basename(docsDir);

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (content.includes(entry)) return;
    fs.appendFileSync(
      gitignorePath,
      `\n# Angular docs (downloaded by angular-agents-md)\n${entry}/\n`
    );
  } else {
    fs.writeFileSync(
      gitignorePath,
      `# Angular docs (downloaded by angular-agents-md)\n${entry}/\n`
    );
  }
  log(`Added ${entry}/ to .gitignore`);
}

// --- Helpers ---

function countFiles(dir, ext) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name), ext);
    } else if (entry.name.endsWith(ext)) {
      count++;
    }
  }
  return count;
}

function log(msg) {
  console.log(`  ${msg}`);
}

function logHeader(msg) {
  console.log(`\n${msg}`);
  console.log('─'.repeat(msg.length));
}

// --- CLI ---

function parseArgs(argv) {
  const args = { version: null, output: DEFAULT_OUTPUT, docsDir: DEFAULT_DOCS_DIR };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--version':
      case '-v':
        args.version = argv[++i];
        break;
      case '--output':
      case '-o':
        args.output = argv[++i];
        break;
      case '--docs-dir':
      case '-d':
        args.docsDir = argv[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (argv[i].startsWith('-')) {
          console.error(`Unknown option: ${argv[i]}`);
          printHelp();
          process.exit(1);
        }
    }
  }

  return args;
}

function printHelp() {
  console.log(`
angular-agents-md — Download Angular docs and generate AGENTS.md index

Usage:
  node scripts/angular-agents-md.mjs [options]

Options:
  --version, -v <ver>   Angular version (default: auto-detect from package.json)
  --output, -o <file>   Target file for index injection (default: AGENTS.md)
  --docs-dir, -d <dir>  Local docs directory name (default: .angular-docs)
  --help, -h            Show this help

Examples:
  node scripts/angular-agents-md.mjs
  node scripts/angular-agents-md.mjs --version 21.1.4
  node scripts/angular-agents-md.mjs --output CLAUDE.md
  node scripts/angular-agents-md.mjs --version 19.2.0 --docs-dir .ng-docs
`);
}

// --- Main ---

async function main() {
  const cwd = process.cwd();
  const args = parseArgs(process.argv.slice(2));

  logHeader('angular-agents-md');

  // Step 1: Resolve version
  let version = args.version;
  if (!version) {
    log('Detecting Angular version from package.json...');
    version = detectAngularVersion(cwd);
    if (!version) {
      console.error(
        '\n  Could not detect Angular version.\n' +
        '  Use --version <ver> or ensure @angular/core is in package.json.\n'
      );
      process.exit(1);
    }
  }
  log(`Angular version: ${version} (tag: v${version})`);

  // Step 2: Download docs
  const docsDir = path.join(cwd, args.docsDir);
  downloadDocs(version, docsDir);

  // Step 3: Collect doc files
  const files = collectDocFiles(docsDir);
  log(`Indexed ${files.length} documentation files`);

  // Step 4: Generate compact index
  const index = generateIndex(docsDir, files);
  const indexSizeKb = (Buffer.byteLength(index, 'utf-8') / 1024).toFixed(1);
  log(`Index size: ${indexSizeKb} KB`);

  // Step 5: Inject into target file
  const targetPath = path.join(cwd, args.output);
  injectIndex(targetPath, index);

  // Step 6: Update .gitignore
  ensureGitignore(cwd, docsDir);

  logHeader('Done!');
  log(`Docs: ./${args.docsDir}/ (${files.length} files)`);
  log(`Index: ${args.output}`);
  log(`Markers: ${START_MARKER} ... ${END_MARKER}`);
  log('');
}

main().catch((err) => {
  console.error(`\n  Error: ${err.message}\n`);
  if (err.message.includes('Could not find remote branch') ||
      err.message.includes('not found in the remote')) {
    console.error(
      `  The tag v${process.argv.find((_, i, a) => a[i-1] === '--version') || '?'} ` +
      `may not exist. Check: https://github.com/angular/angular/tags\n`
    );
  }
  process.exit(1);
});
