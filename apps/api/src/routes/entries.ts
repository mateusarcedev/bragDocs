import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from '../db';
import { Entry, Task, Activity } from '@brag-docs/shared';

export async function entriesRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get('/entries', {
    schema: {
      querystring: z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        project: z.string().optional(),
        week: z.string().optional()
      })
    }
  }, async (request) => {
    const { from, to, project, week } = request.query;

    let sql = `
      SELECT e.* 
      FROM entries e
      WHERE 1=1
    `;
    const params: any[] = [];

    if (from) {
      sql += ` AND e.date >= ?`;
      params.push(from);
    }
    if (to) {
      sql += ` AND e.date <= ?`;
      params.push(to);
    }
    if (week) {
      sql += ` AND e.week = ?`;
      params.push(week);
    }

    if (project) {
        sql += ` AND EXISTS (SELECT 1 FROM tasks t WHERE t.entry_id = e.id AND t.project = ?)`;
        params.push(project);
    }

    sql += ` ORDER BY e.date DESC`;

    const entries = db.prepare(sql).all(...params) as Entry[];

    for (const entry of entries) {
      let taskSql = `SELECT * FROM tasks WHERE entry_id = ?`;
      const taskParams: any[] = [entry.id];

      if (project) {
        taskSql += ` AND project = ?`;
        taskParams.push(project);
      }

      const tasks = db.prepare(taskSql).all(...taskParams) as Task[];

      for (const task of tasks) {
        const activities = db.prepare(`SELECT * FROM activities WHERE task_id = ?`).all(task.id) as Activity[];
        task.activities = activities;
      }

      entry.tasks = tasks;
    }

    return entries;
  });

  server.get('/entries/:id', {
    schema: {
      params: z.object({
        id: z.coerce.number().int().positive(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const entry = db.prepare(`SELECT * FROM entries WHERE id = ?`).get(id) as Entry | undefined;
    if (!entry) {
      return reply.code(404).send({ error: 'Entry not found' });
    }

    const tasks = db.prepare(`SELECT * FROM tasks WHERE entry_id = ?`).all(entry.id) as Task[];
    for (const task of tasks) {
      const activities = db.prepare(`SELECT * FROM activities WHERE task_id = ?`).all(task.id) as Activity[];
      task.activities = activities;
    }
    entry.tasks = tasks;

    return entry;
  });
}
