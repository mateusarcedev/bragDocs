import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from '../db';
import { syncVault } from '../lib/sync';
import { parseMarkdown } from '../lib/parser';
import fs from 'fs/promises';
import path from 'path';

export async function syncRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  const settingsUpsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );

  const ensureDir = async (dirPath: string) => {
    await fs.mkdir(dirPath, { recursive: true });
  };

  const safeJoinUnder = (rootDir: string, relativePosixPath: string) => {
    const cleanParts = relativePosixPath
      .split('/')
      .filter((p) => p && p !== '.' && p !== '..');
    const candidate = path.resolve(rootDir, ...cleanParts);
    const rootResolved = path.resolve(rootDir);
    if (candidate === rootResolved) return candidate;
    if (!candidate.startsWith(rootResolved + path.sep)) {
      throw new Error('Invalid file path');
    }
    return candidate;
  };

  server.post('/sync', async () => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('vault_path') as { value: string } | undefined;
    
    if (!row || !row.value) {
      throw new Error('Vault path not configured in settings');
    }

    const result = await syncVault(row.value);
    return result;
  });

  server.post('/sync/import', {
    schema: {
      body: z.object({
        files: z.array(z.object({
          file_path: z.string().min(1),
          raw_content: z.string()
        })).min(1)
      })
    }
  }, async (request) => {
    const { files } = request.body;

    let processed = 0;
    const errors: Array<{ file: string; reason: string }> = [];

    const importRoot = path.resolve(process.cwd(), 'vault-imports');
    await ensureDir(importRoot);

    const firstPath = files[0]?.file_path ?? '';
    const firstSegments = firstPath.split('/').filter(Boolean);
    const vaultFolderName = firstSegments.length > 0 ? firstSegments[0] : 'vault';
    const vaultPath = path.resolve(importRoot, vaultFolderName);
    await ensureDir(vaultPath);

    const upsertEntry = db.prepare(`
      INSERT INTO entries (date, week, file_path, raw_content, parsed_at)
      VALUES (@date, @week, @file_path, @raw_content, @parsed_at)
      ON CONFLICT(file_path) DO UPDATE SET
        date = excluded.date,
        week = excluded.week,
        raw_content = excluded.raw_content,
        parsed_at = excluded.parsed_at
    `);

    const selectEntryId = db.prepare(`SELECT id FROM entries WHERE file_path = ?`);

    const insertTask = db.prepare(`
      INSERT INTO tasks (entry_id, ticket_id, title, project, date)
      VALUES (@entry_id, @ticket_id, @title, @project, @date)
    `);

    const insertActivity = db.prepare(`
      INSERT INTO activities (task_id, description, type)
      VALUES (@task_id, @description, @type)
    `);

    const deleteTasks = db.prepare('DELETE FROM tasks WHERE entry_id = ?');

    for (const f of files) {
      try {
        const relativePath = f.file_path.includes('/') ? f.file_path.split('/').slice(1).join('/') : f.file_path;
        const diskTarget = safeJoinUnder(vaultPath, relativePath);
        await ensureDir(path.dirname(diskTarget));
        await fs.writeFile(diskTarget, f.raw_content, 'utf-8');

        const parsed = parseMarkdown(f.file_path, f.raw_content);
        if (parsed.error) {
          errors.push({ file: f.file_path, reason: parsed.error });
          continue;
        }
        if (!parsed.entry) {
          errors.push({ file: f.file_path, reason: 'Parser returned no entry' });
          continue;
        }

        const { date, week, tasks } = parsed.entry;

        const transaction = db.transaction(() => {
          upsertEntry.run({
            date,
            week,
            file_path: f.file_path,
            raw_content: f.raw_content,
            parsed_at: new Date().toISOString(),
          });

          const row = selectEntryId.get(f.file_path) as { id: number } | undefined;
          if (!row) {
            throw new Error('Entry id not found after upsert');
          }

          deleteTasks.run(row.id);

          for (const task of tasks) {
            const taskResult = insertTask.run({
              entry_id: row.id,
              ticket_id: task.ticket_id,
              title: task.title,
              project: task.project,
              date,
            });

            const taskId = Number(taskResult.lastInsertRowid);
            for (const activity of task.activities) {
              insertActivity.run({
                task_id: taskId,
                description: activity.description,
                type: activity.type,
              });
            }
          }
        });

        transaction();
        processed++;
      } catch (e: any) {
        errors.push({ file: f.file_path, reason: e?.message ?? 'Unknown import error' });
      }
    }

    settingsUpsert.run('vault_path', vaultPath);
    return { processed, errors };
  });
}
