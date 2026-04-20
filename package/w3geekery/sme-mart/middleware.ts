// Vercel Edge Middleware — proxies /api/* requests to ZeroBias CI backend
// Injects API key and org ID server-side (never exposed to browser)
// Also handles /api/llm/* routes for AI-assisted bid generation (Plan 033 Phase 5)

export const config = {
  matcher: '/api/:path*',
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // Route /api/llm/* to Anthropic API (separate from ZeroBias proxy)
  if (url.pathname.startsWith('/api/llm/')) {
    return handleLlmRoute(request, url);
  }

  // Default: proxy to ZeroBias backend
  return handleZerobiasProxy(request, url);
}

// ---------------------------------------------------------------------------
// LLM Routes — Anthropic Claude API proxy
// ---------------------------------------------------------------------------

async function handleLlmRoute(request: Request, url: URL): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const anthropicApiKey = process.env['ANTHROPIC_API_KEY'];
  if (!anthropicApiKey) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (url.pathname === '/api/llm/generate-bid') {
    return handleGenerateBid(request, anthropicApiKey);
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGenerateBid(
  request: Request,
  apiKey: string,
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { context, sections } = body;
  if (!context?.rfp || !context?.vendor) {
    return new Response(
      JSON.stringify({ error: 'Missing required context (rfp, vendor)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(context, sections);

  // Call Anthropic Messages API with streaming
  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 8192,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!anthropicResponse.ok) {
    const errText = await anthropicResponse.text();
    console.error('[LLM] Anthropic API error:', anthropicResponse.status, errText);
    return new Response(
      JSON.stringify({
        error: 'AI service error',
        status: anthropicResponse.status,
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Stream the Anthropic SSE response back to the client
  return new Response(anthropicResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Ai-Model': 'claude-sonnet-4-5-20250514',
    },
  });
}

function buildSystemPrompt(): string {
  return `You are an expert government/enterprise bid writer. You help vendors respond to Requests for Proposals (RFPs) in compliance, cybersecurity, and IT services domains.

Your output MUST be valid JSON matching the BidAiResponse schema below. Do not include any text outside the JSON.

Schema:
{
  "executive_summary": "string (2-3 paragraphs, markdown)",
  "cover_letter": "string (professional, specific to this RFP)",
  "team_description": "string (markdown, based on vendor profile)",
  "requirement_responses": [
    {
      "requirementId": "string (exact ID from input)",
      "complianceStatus": "met | partially_met | planned | not_met | not_applicable",
      "responseText": "string (how the vendor meets this requirement)",
      "estimatedHours": number,
      "estimatedCost": number
    }
  ],
  "pricing_breakdown": [
    {
      "taskType": "string (task group displayName)",
      "estimatedHours": number,
      "estimatedCost": number,
      "notes": "string (optional)"
    }
  ],
  "proposed_price": "string (total price)",
  "proposed_timeline": "string (e.g. '12 weeks')"
}

Guidelines:
- Be specific and factual. Reference vendor capabilities from the provided context.
- For compliance_status: use "met" only when the vendor clearly has the capability. Use "planned" if they can achieve it. Use "partially_met" for partial coverage.
- Estimate hours conservatively. Government/enterprise work typically runs 1.5-2x initial estimates.
- Price based on a blended rate of $150-250/hr for compliance/cybersecurity consulting unless vendor context suggests otherwise.
- If vendor org documents mention specific certifications, tools, or methodologies, reference them in responses.
- Keep executive summary under 500 words. Keep individual requirement responses under 200 words.`;
}

function buildUserPrompt(context: any, sections?: string[]): string {
  const { rfp, vendor, orgDocSummaries } = context;

  let prompt = `Generate a structured bid response for the following RFP.

## RFP Details
- Title: ${rfp.title}
- Description: ${rfp.description || 'Not provided'}
- Category: ${rfp.category || 'Not specified'}
- Budget: ${rfp.budgetType || 'Not specified'}${rfp.budgetMin ? ` ($${rfp.budgetMin}` : ''}${rfp.budgetMax ? ` - $${rfp.budgetMax})` : rfp.budgetMin ? ')' : ''}
- Timeline: ${rfp.timeline || 'Not specified'}

## Vendor Profile
- Name: ${vendor.displayName}
- Headline: ${vendor.headline || 'Not provided'}
- Bio: ${vendor.bio || 'Not provided'}`;

  if (vendor.skills?.length) {
    prompt += `\n- Skills: ${vendor.skills.join(', ')}`;
  }
  if (vendor.frameworks?.length) {
    prompt += `\n- Frameworks: ${vendor.frameworks.join(', ')}`;
  }
  if (vendor.certifications?.length) {
    prompt += `\n- Certifications: ${vendor.certifications.join(', ')}`;
  }

  if (orgDocSummaries?.length) {
    prompt += `\n\n## Vendor Organization Documents\n`;
    for (const summary of orgDocSummaries) {
      prompt += `- ${summary}\n`;
    }
  }

  if (rfp.taskGroups?.length) {
    prompt += `\n\n## Requirements\n`;
    for (const group of rfp.taskGroups) {
      prompt += `\n### ${group.displayName} (${group.taskTypeTagName})\n`;
      for (const req of group.requirements || []) {
        prompt += `- ID: ${req.id}\n  Title: ${req.title}\n`;
        if (req.description) prompt += `  Description: ${req.description}\n`;
        if (req.standardReference) prompt += `  Standard: ${req.standardReference}\n`;
        prompt += `  Evidence: ${req.evidenceType || 'document'}\n`;
      }
    }
  }

  if (sections?.length) {
    prompt += `\n\nOnly generate these sections: ${sections.join(', ')}. Return JSON with only these fields populated.`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// ZeroBias Proxy (existing)
// ---------------------------------------------------------------------------

async function handleZerobiasProxy(request: Request, url: URL): Promise<Response> {
  const target = process.env['ZB_TARGET_HOST'] || 'https://uat.zerobias.com';
  const apiKey = process.env['ZB_API_KEY'];
  const orgId = process.env['ZB_ORG_ID'];

  const targetUrl = `${target}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);

  // Inject API key for authentication
  if (apiKey) {
    headers.set('Authorization', `APIKey ${apiKey}`);
  }

  // Inject org ID as cookie for multi-tenancy
  if (orgId) {
    const existing = headers.get('cookie') || '';
    if (!existing.includes('dana-org-id')) {
      headers.set(
        'cookie',
        existing ? `${existing}; dana-org-id=${orgId}` : `dana-org-id=${orgId}`,
      );
    }
  }

  // Remove host header so fetch sets it from target URL
  headers.delete('host');

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
