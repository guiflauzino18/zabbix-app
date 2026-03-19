import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ZabbixServer } from '../api/zabbix.types';

const STORAGE_KEY = 'zabbixapp-servers';

interface ServersState {
  servers: ZabbixServer[];
  isLoaded: boolean;
  addServer: (server: Omit<ZabbixServer, 'id' | 'createdAt'>) => void;
  removeServer: (id: string) => void;
  updateServer: (id: string, updates: Partial<ZabbixServer>) => void;
  loadServers: () => Promise<void>;
  persistServers: (servers: ZabbixServer[]) => Promise<void>;
}

export const useServersStore = create<ServersState>((set, get) => ({
  servers: [],
  isLoaded: false,

  addServer: (serverData) => {
    const newServer: ZabbixServer = {
      ...serverData,
      id: `server_${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [...get().servers, newServer];
    set({ servers: updated });
    get().persistServers(updated);
  },

  removeServer: (id) => {
    const updated = get().servers.filter((s) => s.id !== id);
    set({ servers: updated });
    get().persistServers(updated);
  },

  updateServer: (id, updates) => {
    const updated = get().servers.map((s) =>
      s.id === id ? { ...s, ...updates } : s,
    );
    set({ servers: updated });
    get().persistServers(updated);
  },

  loadServers: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const servers: ZabbixServer[] = raw ? JSON.parse(raw) : [];
      set({ servers, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  persistServers: async (servers) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
  },
}));