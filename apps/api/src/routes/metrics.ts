import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from '../db';
import { Metrics } from '@brag-docs/shared';

export async function metricsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get('/metrics', {
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

    let filterSql = '';
    const params: any[] = [];
    
    if (from) {
      filterSql += ` AND t.date >= ?`;
      params.push(from);
    }
    if (to) {
      filterSql += ` AND t.date <= ?`;
      params.push(to);
    }
    if (project) {
      filterSql += ` AND t.project = ?`;
      params.push(project);
    }
    if (week) {
        filterSql += ` AND e.week = ?`;
        params.push(week);
    }

    const joinClause = week ? `JOIN entries e ON t.entry_id = e.id` : '';
    const baseSql = `FROM tasks t ${joinClause} WHERE 1=1 ${filterSql}`;

    const tasksByWeek = db.prepare(`
      SELECT e.week, COUNT(*) as count
      FROM tasks t
      JOIN entries e ON t.entry_id = e.id
      WHERE 1=1 ${filterSql}
      GROUP BY e.week
      ORDER BY e.week
    `).all(...params) as { week: string; count: number }[];

    const tasksByWeekMap: Record<string, number> = {};
    tasksByWeek.forEach(r => tasksByWeekMap[r.week] = r.count);

    const tasksByMonth = db.prepare(`
      SELECT strftime('%Y-%m', t.date) as month, COUNT(*) as count
      ${baseSql}
      GROUP BY month
      ORDER BY month
    `).all(...params) as { month: string; count: number }[];

    const tasksByMonthMap: Record<string, number> = {};
    tasksByMonth.forEach(r => tasksByMonthMap[r.month] = r.count);

    const projectDistribution = db.prepare(`
      SELECT t.project, COUNT(*) as count
      ${baseSql}
      GROUP BY t.project
    `).all(...params) as { project: string; count: number }[];

    const projectDistributionMap: Record<string, number> = {};
    projectDistribution.forEach(r => projectDistributionMap[r.project] = r.count);

    const heatmap = db.prepare(`
      SELECT t.date, COUNT(*) as count
      ${baseSql}
      GROUP BY t.date
    `).all(...params) as { date: string; count: number }[];

    const heatmapMap: Record<string, number> = {};
    heatmap.forEach(r => heatmapMap[r.date] = r.count);

    const topTickets = db.prepare(`
      SELECT t.ticket_id as ticket, COUNT(DISTINCT t.date) as days
      ${baseSql} AND t.ticket_id IS NOT NULL
      GROUP BY t.ticket_id
      ORDER BY days DESC
      LIMIT 10
    `).all(...params) as { ticket: string; days: number }[];

    const evidenceCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM activities a
      JOIN tasks t ON a.task_id = t.id
      ${joinClause}
      WHERE a.type = 'evidence' ${filterSql}
    `).get(...params) as { count: number };

    const activeDates = db.prepare(`
      SELECT DISTINCT t.date
      ${baseSql}
      ORDER BY t.date ASC
    `).all(...params).map((r: any) => r.date);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const dateStr of activeDates) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);

      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diff = (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempStreak++;
        } else if (diff > 1) {
           if (tempStreak > longestStreak) longestStreak = tempStreak;
           tempStreak = 1;
        }
      }
      lastDate = date;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    currentStreak = tempStreak;

    const metrics: Metrics = {
      tasksByWeek: tasksByWeekMap,
      tasksByMonth: tasksByMonthMap,
      projectDistribution: projectDistributionMap,
      heatmap: heatmapMap,
      topTickets,
      evidenceCount: evidenceCountResult.count,
      currentStreak,
      longestStreak
    };

    return metrics;
  });
}
