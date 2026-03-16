import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Entry, Metrics, SettingsPublic } from '@brag-docs/shared';

interface AppState {
  settings: SettingsPublic;
  entries: Entry[];
  metrics: Metrics | null;
  loading: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  syncVault: () => Promise<void>;
  importVault: (files: Array<{ file_path: string; raw_content: string }>) => Promise<void>;
  fetchData: (filters?: Record<string, string>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  settings: {},
  entries: [],
  metrics: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    try {
      const settings = await api.getSettings();
      set({ settings });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  updateSetting: async (key, value) => {
    try {
      await api.updateSetting(key, value);
      set((state) => ({
        settings: key.endsWith('_token')
          ? { ...state.settings, ai_token_set: key === 'ai_token' ? true : state.settings.ai_token_set }
          : { ...state.settings, [key]: value }
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  syncVault: async () => {
    set({ loading: true, error: null });
    try {
      await api.sync();
      await get().fetchData();
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  importVault: async (files) => {
    set({ loading: true, error: null });
    try {
      await api.importSync(files);
      await get().fetchSettings();
      await get().fetchData();
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchData: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const [entries, metrics] = await Promise.all([
        api.getEntries(filters),
        api.getMetrics(filters)
      ]);
      set({ entries, metrics });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  }
}));
