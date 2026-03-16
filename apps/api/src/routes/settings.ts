import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from '../db';

export async function settingsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get('/settings', async () => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    let ai_token_set = false;
    for (const row of rows) {
      if (row.key === 'ai_token') {
        ai_token_set = true;
        continue;
      }
      if (row.key.endsWith('_token')) continue;
      settings[row.key] = row.value;
    }
    return { ...settings, ai_token_set };
  });

  server.put('/settings', {
    schema: {
      body: z.union([
        z.object({
          key: z.string(),
          value: z.string(),
        }),
        z.object({
          vault_path: z.string().optional(),
          ai_host: z.string().optional(),
          ai_token: z.string().optional(),
          gitlab_token: z.string().optional(),
          bitbucket_token: z.string().optional(),
        }),
      ]),
    }
  }, async (request) => {
    const stmt = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );

    const body = request.body as any;
    if (typeof body.key === 'string') {
      stmt.run(body.key, body.value ?? '');
      return { success: true };
    }

    const allowedKeys = ['vault_path', 'ai_host', 'ai_token', 'gitlab_token', 'bitbucket_token'] as const;
    for (const key of allowedKeys) {
      if (typeof body[key] === 'string') {
        stmt.run(key, body[key]);
      }
    }
    return { success: true };
  });
}
