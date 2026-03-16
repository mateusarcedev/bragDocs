import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { parseMarkdown } from './parser';

async function listWeekFolders(dailyDir: string): Promise<string[]> {
  const entries = await fs.readdir(dailyDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && e.name.startsWith('Week '))
    .map((e) => path.join(dailyDir, e.name));
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => path.join(dir, e.name));
}

export async function syncVault(vaultPath: string) {
  const dailyDir = path.join(vaultPath, 'daily');
  const weekDirs = await listWeekFolders(dailyDir);
  const files: string[] = [];

  for (const weekDir of weekDirs) {
    const weekFiles = await listMarkdownFiles(weekDir);
    files.push(...weekFiles);
  }

  let processed = 0;
  const errors: Array<{ file: string; reason: string }> = [];

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

  for (const file of files) {
    try {
      const raw_content = await fs.readFile(file, 'utf-8');
      const parsed = parseMarkdown(file, raw_content);

      if (parsed.error) {
        errors.push({ file, reason: parsed.error });
        continue;
      }

      if (!parsed.entry) {
        errors.push({ file, reason: 'Parser returned no entry' });
        continue;
      }

      const { date, week, tasks } = parsed.entry;

      const transaction = db.transaction(() => {
        upsertEntry.run({
          date,
          week,
          file_path: file,
          raw_content,
          parsed_at: new Date().toISOString(),
        });

        const row = selectEntryId.get(file) as { id: number } | undefined;
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
      errors.push({ file, reason: e?.message ?? 'Unknown sync error' });
    }
  }

  return { processed, errors };
}
