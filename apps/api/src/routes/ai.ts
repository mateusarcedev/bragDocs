import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from '../db';
import { AnalysisType } from '@brag-docs/shared';

const PROMPTS: Record<AnalysisType, string> = {
  'weekly-summary': 'Summarize the key achievements and impact for the week based on the following entries. Focus on outcomes.',
  'impact-highlight': 'Identify the top 3 most impactful contributions from these entries. Explain why they matter.',
  'performance-review': 'Draft a performance review self-assessment section based on these entries. Highlight strengths and areas of growth.',
  'pattern-detection': 'Analyze the entries for patterns. Are there gaps? Is work concentrated on one project? Are there evidences missing?'
};

export async function aiRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  const AnalyzeBodySchema = z.object({
    period: z.object({
      from: z.string(),
      to: z.string(),
    }),
    type: z.enum(['weekly-summary', 'impact-highlight', 'performance-review', 'pattern-detection']),
    model: z.string(),
  });

  const getSettings = () => {
    const rows = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?)').all('ai_host', 'ai_token') as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    rows.forEach(r => settings[r.key] = r.value);
    return settings;
  };

  server.get('/ai/models', async () => {
    const settings = getSettings();
    if (!settings.ai_host || !settings.ai_token) {
      throw new Error('AI Host or Token not configured');
    }

    try {
      const response = await fetch(`${settings.ai_host}/api/models`, {
        headers: {
          'Authorization': `Bearer ${settings.ai_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(list)) return [];
      return list.map((m: any) => ({
        id: String(m.id),
        name: typeof m.name === 'string' ? m.name : String(m.id),
      }));
    } catch (e: any) {
      throw new Error(`AI Service Error: ${e.message}`);
    }
  });

  server.post('/ai/analyze', {
    schema: {
      body: AnalyzeBodySchema
    }
  }, async (request) => {
    const { period, type, model } = AnalyzeBodySchema.parse(request.body);
    const settings = getSettings();

    if (!settings.ai_host || !settings.ai_token) {
      throw new Error('AI Host or Token not configured');
    }

    const entries = db.prepare(`
      SELECT raw_content, date
      FROM entries
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `).all(period.from, period.to) as { raw_content: string; date: string }[];

    if (entries.length === 0) {
      return { result: 'No entries found for the selected period.' };
    }

    const context = entries.map(e => `Date: ${e.date}\n${e.raw_content}`).join('\n\n---\n\n');
    const systemPrompt = PROMPTS[type];

    try {
      const response = await fetch(`${settings.ai_host}/api/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.ai_token}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI API Error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'No response generated.';
      return { result: content };

    } catch (e: any) {
      throw new Error(`AI Analysis Failed: ${e.message}`);
    }
  });
}
