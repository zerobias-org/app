#!/usr/bin/env node
/**
 * Generate a Stitch screen from a prompt and save the PNG.
 *
 * Uses Application Default Credentials (ADC) from gcloud for OAuth.
 * No API key required.
 *
 * Usage:
 *   node stitch-gen.mjs --prompt "..." --out path/to/s1.png
 *   node stitch-gen.mjs --prompt-file prompt.txt --out mocks/s1.png
 *
 * Optional:
 *   --stitch-project <id>    Reuse existing Stitch project (default: read/create)
 *   --title "..."            Title for new Stitch project (first run)
 *   --device desktop|mobile|tablet|agnostic  (default: desktop)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { GoogleAuth } from 'google-auth-library';
import { Stitch, StitchToolClient } from '@google/stitch-sdk';

const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'clark-claude-tools';
const STITCH_PROJECT_FILE = resolve(new URL('.', import.meta.url).pathname, '.stitch-project-id');

const { values } = parseArgs({
  options: {
    prompt: { type: 'string' },
    'prompt-file': { type: 'string' },
    out: { type: 'string' },
    'stitch-project': { type: 'string' },
    title: { type: 'string', default: 'SME Mart UI mocks' },
    device: { type: 'string', default: 'desktop' },
  },
});

if (!values.out) die('--out is required');
const prompt = values.prompt
  ?? (values['prompt-file'] ? await readFile(values['prompt-file'], 'utf8') : null);
if (!prompt) die('--prompt or --prompt-file is required');

const deviceMap = {
  desktop: 'DESKTOP', mobile: 'MOBILE', tablet: 'TABLET', agnostic: 'AGNOSTIC',
};
const deviceType = deviceMap[values.device.toLowerCase()] ?? 'DESKTOP';

// 1. Grab an OAuth access token from ADC
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const tokenRes = await auth.getAccessToken();
const accessToken = typeof tokenRes === 'string' ? tokenRes : tokenRes?.token;
if (!accessToken) die('Failed to acquire access token from ADC. Run: gcloud auth application-default login');

// 2. Build the Stitch client with OAuth credentials
const client = new StitchToolClient({ accessToken, projectId: GCP_PROJECT });
await client.connect();
const stitch = new Stitch(client);

// 3. Resolve the Stitch project (reuse or create)
let stitchProjectId = values['stitch-project']
  ?? (await readFileIfExists(STITCH_PROJECT_FILE))?.trim();

let project;
if (stitchProjectId) {
  project = stitch.project(stitchProjectId);
  log(`Reusing Stitch project: ${stitchProjectId}`);
} else {
  log(`Creating new Stitch project: "${values.title}"`);
  project = await stitch.createProject(values.title);
  stitchProjectId = project.id;
  await writeFile(STITCH_PROJECT_FILE, stitchProjectId);
  log(`Saved project ID to ${STITCH_PROJECT_FILE}: ${stitchProjectId}`);
}

// 4. Generate the screen
log(`Generating screen (device=${deviceType}, prompt length=${prompt.length})…`);
const screen = await project.generate(prompt, deviceType);
log(`Generated screen: ${screen.id}`);

// 5. Fetch the screenshot URL, download, write to disk
const imageUrl = await screen.getImage();
log(`Screenshot URL: ${imageUrl}`);
const imgRes = await fetch(imageUrl);
if (!imgRes.ok) die(`Screenshot download failed: ${imgRes.status} ${imgRes.statusText}`);
const buf = Buffer.from(await imgRes.arrayBuffer());
await mkdir(dirname(values.out), { recursive: true });
await writeFile(values.out, buf);
log(`Saved ${buf.length} bytes -> ${values.out}`);

await client.close();

// ─── helpers ─────────────────────────────────────────────────────────────
function log(msg) { console.error(`[stitch-gen] ${msg}`); }
function die(msg) { console.error(`[stitch-gen] ERROR: ${msg}`); process.exit(1); }
async function readFileIfExists(path) {
  try { return await readFile(path, 'utf8'); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
