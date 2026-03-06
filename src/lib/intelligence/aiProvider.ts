// ═══════════════════════════════════════════════════════════════════
// JABR — AI Provider (Claude API)
// Provider-agnostic layer for editorial intelligence
// ═══════════════════════════════════════════════════════════════════

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  config: AIProviderConfig
): Promise<{ text?: string; error?: string }> {
  const model = config.model || 'claude-sonnet-4-20250514';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: `API ${res.status}: ${(err as Record<string, unknown>).error?.toString() || res.statusText}` };
    }

    const data = await res.json();
    const text = data.content?.find((c: Record<string, string>) => c.type === 'text')?.text;
    return { text: text || '' };
  } catch (e) {
    return { error: `Réseau: ${String(e)}` };
  }
}

// Parse JSON from Claude response (handles markdown fences)
export function parseJSONResponse<T>(text: string): T | null {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to find JSON in the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as T; } catch { return null; }
    }
    return null;
  }
}
