import { useState } from 'react';
import { router } from 'expo-router';
import { loginToZabbix, logoutFromZabbix } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { useServersStore } from '../stores/servers.store';
import type { ZabbixServer } from '../api/zabbix.types';

export function useAuth() {
  const {
    sessions,
    currentServerId,
    addSession,
    removeSession,
    setCurrentServer,
    clearAllSessions,
    getCurrentSession,
    getActiveSessions,
  } = useAuthStore();

  const { updateServer, servers } = useServersStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const currentEntry = getCurrentSession();
  const session = currentEntry?.session ?? null;
  const currentUser = currentEntry?.user ?? null;

  const login = async ( server: ZabbixServer, username: string, password: string, ) => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const result = await loginToZabbix({serverUrl: server.url,username,password,});

      updateServer(server.id, { apiVersion: result.apiVersion });

      await addSession(
        {
          serverId: server.id,
          token: result.token,
          username: result.user.username,
          createdAt: Date.now(),
        },
        result.user,
      );

    
      router.replace('/(app)/dashboard');

    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao conectar ao servidor';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async (serverId?: string) => {
    const targetId = serverId ?? currentServerId;
    if (!targetId) return;

    const entry = sessions[targetId];
    const server = servers.find(s => s.id === targetId);

    if (entry && server) {
      await logoutFromZabbix(server.url, entry.session.token);
    }

    await removeSession(targetId);

    const remaining = getActiveSessions();
    if (remaining.length === 0) {
      router.replace('/(auth)/login');
    }
  };

  const logoutAll = async () => {
    const allSessions = getActiveSessions();
    await Promise.allSettled(
      allSessions.map(({ session: s }) => {
        const server = servers.find(sv => sv.id === s.serverId);
        return server ? logoutFromZabbix(server.url, s.token) : Promise.resolve();
      }),
    );
    await clearAllSessions();
    router.replace('/(auth)/login');
  };

  return {
    session,
    currentUser,
    currentServerId,
    sessions,
    isLoggingIn,
    loginError,
    login,
    logout,
    logoutAll,
    setCurrentServer,
    isAuthenticated: !!session?.token,
    activeSessionsCount: Object.keys(sessions).length,
  };
}