export interface Entry {
  id: number;
  date: string;
  week: string;
  file_path: string;
  raw_content: string;
  parsed_at: string;
  tasks?: Task[];
}

export interface Task {
  id: number;
  entry_id: number;
  ticket_id: string | null;
  title: string;
  project: string;
  date: string;
  activities?: Activity[];
}

export type ActivityType = 'action' | 'impact' | 'evidence';

export interface Activity {
  id: number;
  task_id: number;
  description: string;
  type: ActivityType;
}

export interface Setting {
  key: string;
  value: string;
}

export interface SettingsPublic {
  vault_path?: string;
  ai_host?: string;
  ai_token_set?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface SyncResponse {
  processed: number;
  errors: Array<{ file: string; reason: string }>;
}

export interface EntriesFilter {
  from?: string;
  to?: string;
  project?: string;
  week?: string;
}

export interface Metrics {
  tasksByWeek: Record<string, number>;
  tasksByMonth: Record<string, number>;
  projectDistribution: Record<string, number>;
  heatmap: Record<string, number>;
  topTickets: Array<{ ticket: string; days: number }>;
  evidenceCount: number;
  currentStreak: number;
  longestStreak: number;
}

export type AnalysisType = 'weekly-summary' | 'impact-highlight' | 'performance-review' | 'pattern-detection';

export interface AnalysisRequest {
  period: { from: string; to: string };
  type: AnalysisType;
  model: string;
}

export interface AIModel {
  id: string;
  name: string;
}
