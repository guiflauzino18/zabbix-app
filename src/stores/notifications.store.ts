import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppNotification,
  NotificationSettings,
  ZabbixSeverity,
} from '../api/zabbix.types';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../api/zabbix.types';

const NOTIFICATIONS_KEY = '@zabbixapp/notifications';
const SETTINGS_KEY = '@zabbixapp/notification_settings';

// Limite máximo de notificações armazenadas localmente
const MAX_NOTIFICATIONS = 100;

interface NotificationsState {
  notifications: AppNotification[];
  settings: Record<string, NotificationSettings>; // keyed by serverId
  isLoaded: boolean;

  // Carrega dados persistidos do AsyncStorage
  load: () => Promise<void>;

  // Adiciona uma nova notificação (chamado pelo polling)
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;

  // Marca uma notificação como lida
  markAsRead: (id: string) => Promise<void>;

  // Marca todas como lidas
  markAllAsRead: () => Promise<void>;

  // Marca notificações de um evento como resolvidas
  markResolved: (eventid: string) => Promise<void>;

  // Limpa todas as notificações
  clearAll: () => Promise<void>;

  // Retorna configuração de um servidor (cria padrão se não existir)
  getSettings: (serverId: string) => NotificationSettings;

  // Salva configuração de um servidor
  saveSettings: (settings: NotificationSettings) => Promise<void>;

  // Conta notificações não lidas
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  settings: {},
  isLoaded: false,

  load: async () => {
    try {
      const [rawNotifs, rawSettings] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);

      const notifications: AppNotification[] = rawNotifs
        ? JSON.parse(rawNotifs)
        : [];
      const settings: Record<string, NotificationSettings> = rawSettings
        ? JSON.parse(rawSettings)
        : {};

      set({ notifications, settings, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  addNotification: async (data) => {
    const { notifications, settings } = get();

    // Verifica se já existe notificação para este evento
    // Evita duplicatas geradas pelo polling contínuo
    const alreadyExists = notifications.some(n => n.eventid === data.eventid);
    if (alreadyExists) return;

    // Verifica se as configurações do servidor permitem essa severidade
    // const serverSettings = get().getSettings(data.serverId);
    // if (!serverSettings.enabled) return;
    // if (!serverSettings.severities[data.severity]) return;

    const newNotification: AppNotification = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      isRead: false,
    };

    // Mantém somente as últimas MAX_NOTIFICATIONS notificações
    const updated = [newNotification, ...notifications].slice(0, MAX_NOTIFICATIONS);

    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    set({ notifications: updated });
  },

  markAsRead: async (id) => {
    const updated = get().notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    set({ notifications: updated });
  },

  markAllAsRead: async () => {
    const updated = get().notifications.map(n => ({ ...n, isRead: true }));
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    set({ notifications: updated });
  },

  markResolved: async (eventid) => {
    const updated = get().notifications.map(n =>
      n.eventid === eventid ? { ...n, isResolved: true } : n,
    );
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    set({ notifications: updated });
  },

  clearAll: async () => {
    await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
    set({ notifications: [] });
  },

  getSettings: (serverId) => {
    const existing = get().settings[serverId];
    if (existing) return existing;

    // Retorna configuração padrão se não houver configuração salva
    return { ...DEFAULT_NOTIFICATION_SETTINGS, serverId };
  },

  saveSettings: async (settings) => {
    const updated = { ...get().settings, [settings.serverId]: settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    set({ settings: updated });
  },

  unreadCount: () => get().notifications.filter(n => !n.isRead).length,
}));