import type { 
  SyncResponse, 
  Entry, 
  Metrics, 
  AnalysisRequest, 
  AIModel,
  SettingsPublic
} from '@brag-docs/shared';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  return response.json();
}

export const api = {
  getSettings: () => request<SettingsPublic>('/settings'),
  updateSetting: (key: string, value: string) => request<{ success: true }>('/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value })
  }),
  sync: () => request<SyncResponse>('/sync', { method: 'POST' }),
  importSync: (files: Array<{ file_path: string; raw_content: string }>) => request<SyncResponse>('/sync/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files })
  }),
  getEntries: (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    return request<Entry[]>(`/entries?${searchParams.toString()}`);
  },
  getEntry: (id: number) => request<Entry>(`/entries/${id}`),
  getMetrics: (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    return request<Metrics>(`/metrics?${searchParams.toString()}`);
  },
  getAIModels: () => request<AIModel[]>('/ai/models'),
  analyze: (data: AnalysisRequest) => request<{ result: string }>('/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
};
