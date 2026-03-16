import path from 'path';
import { ActivityType } from '@brag-docs/shared';

export interface ParsedActivity {
  description: string;
  type: ActivityType;
}

export interface ParsedTask {
  ticket_id: string | null;
  title: string;
  project: string;
  activities: ParsedActivity[];
}

export interface ParsedEntry {
  date: string;
  week: string;
  tasks: ParsedTask[];
  raw_content: string;
}

export interface ParseResult {
  entry?: ParsedEntry;
  error?: string;
}

function toIsoDateFromFilename(filenameNoExt: string): string | null {
  const match = filenameNoExt.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
}

function classifyActivity(text: string): ActivityType {
  const lower = text.toLowerCase();
  if (lower.includes('http://') || lower.includes('https://')) return 'evidence';
  if (lower.startsWith('impacto:')) return 'impact';
  return 'action';
}

export function parseMarkdown(filePath: string, content: string): ParseResult {
  try {
    const filenameNoExt = path.basename(filePath, '.md');
    const date = toIsoDateFromFilename(filenameNoExt);
    if (!date) {
      return { error: `Invalid filename format: ${filenameNoExt}. Expected DD-MM-YYYY.` };
    }

    const pathParts = filePath.split(path.sep);
    const weekFolder = pathParts[pathParts.length - 2] ?? '';
    const week = weekFolder.startsWith('Week ') || weekFolder === 'Week' || weekFolder.startsWith('Week')
      ? weekFolder
      : 'Unknown Week';

    const lines = content.split('\n');
    const tasks: ParsedTask[] = [];
    let currentProject = '';
    let currentTask: ParsedTask | null = null;

    const ticketRegex = /^([A-Z]+-\d+)\s*[—-]\s*(.+)$/;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        currentProject = trimmed.slice(4).trim();
        currentTask = null;
        continue;
      }

      if (!currentProject) continue;
      if (!trimmed) continue;

      const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
      const bulletIndent = bulletMatch ? bulletMatch[1].length : null;
      const bulletContent = bulletMatch ? bulletMatch[2].trim() : null;

      const candidate = (bulletContent ?? trimmed).trim();
      const ticketMatch = candidate.match(ticketRegex);

      if (ticketMatch) {
        currentTask = {
          ticket_id: ticketMatch[1],
          title: ticketMatch[2],
          project: currentProject,
          activities: [],
        };
        tasks.push(currentTask);
        continue;
      }

      if (currentProject === 'Outros' && bulletMatch && bulletIndent === 0) {
        currentTask = {
          ticket_id: null,
          title: candidate,
          project: currentProject,
          activities: [],
        };
        tasks.push(currentTask);
        continue;
      }

      if (!currentTask) continue;
      if (!bulletContent) continue;

      currentTask.activities.push({
        description: bulletContent,
        type: classifyActivity(bulletContent),
      });
    }

    return {
      entry: {
        date,
        week,
        tasks,
        raw_content: content,
      },
    };
  } catch (e: any) {
    return { error: e?.message ?? 'Unknown parser error' };
  }
}
