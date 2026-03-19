import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { ZabbixSession, ZabbixUser } from '../api/zabbix.types';

const SESSIONS_KEY = 'zabbixapp-sessions';
const CURRENT_KEY = 'zabbixapp-current_session';

export interface SessionEntry {
  session: ZabbixSession;
  user: ZabbixUser;
}

interface AuthState {
  sessions: Record<string, SessionEntry>; // keyed by serverId
  currentServerId: string | null;
  isLoading: boolean;

  addSession: (session: ZabbixSession, user: ZabbixUser) => Promise<void>;
  removeSession: (serverId: string) => Promise<void>;
  setCurrentServer: (serverId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  clearAllSessions: () => Promise<void>;

  getCurrentSession: () => SessionEntry | null;
  getSession: (serverId: string) => SessionEntry | null;
  getActiveSessions: () => SessionEntry[];
}

export const useAuthStore = create<AuthState>((set, get) => ({
  sessions: {},
  currentServerId: null,
  isLoading: true,

  addSession: async (session, user) => {
    const updated = {
      ...get().sessions,
      [session.serverId]: { session, user },
    };
    await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(updated));

    const currentServerId = get().currentServerId ?? session.serverId;
    await SecureStore.setItemAsync(CURRENT_KEY, currentServerId);

    set({ sessions: updated, currentServerId, isLoading: false });
  },

  removeSession: async (serverId) => {
    const updated = { ...get().sessions };
    delete updated[serverId];

    await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(updated));

    let currentServerId = get().currentServerId;
    if (currentServerId === serverId) {
      currentServerId = Object.keys(updated)[0] ?? null;
      if (currentServerId) {
        await SecureStore.setItemAsync(CURRENT_KEY, currentServerId);
      } else {
        await SecureStore.deleteItemAsync(CURRENT_KEY);
      }
    }

    set({ sessions: updated, currentServerId });
  },

  setCurrentServer: async (serverId) => {
    await SecureStore.setItemAsync(CURRENT_KEY, serverId);
    set({ currentServerId: serverId });
  },

  loadSessions: async () => {
    try {
      const rawSessions = await SecureStore.getItemAsync(SESSIONS_KEY);
      const rawCurrent = await SecureStore.getItemAsync(CURRENT_KEY);
      const sessions: Record<string, SessionEntry> = rawSessions
        ? JSON.parse(rawSessions)
        : {};
      const currentServerId = rawCurrent ?? Object.keys(sessions)[0] ?? null;
      set({ sessions, currentServerId, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearAllSessions: async () => {
    await SecureStore.deleteItemAsync(SESSIONS_KEY);
    await SecureStore.deleteItemAsync(CURRENT_KEY);
    set({ sessions: {}, currentServerId: null });
  },

  getCurrentSession: () => {
    const { sessions, currentServerId } = get();
    return currentServerId ? (sessions[currentServerId] ?? null) : null;
  },

  getSession: (serverId) => {
    return get().sessions[serverId] ?? null;
  },

  getActiveSessions: () => {
    return Object.values(get().sessions);
  },
}));