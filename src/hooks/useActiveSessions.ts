import { useServersStore } from '../stores/servers.store';
import { useAuthStore } from '../stores/auth.store';
import type { ZabbixServer } from '../api/zabbix.types';

export interface ActiveServer {
  server: ZabbixServer;
  token: string;
  username: string;
}

export function useActiveSessions(): ActiveServer[] {
  const { servers } = useServersStore();
  const { getActiveSessions } = useAuthStore();

  const activeSessions = getActiveSessions();

  return activeSessions.reduce<ActiveServer[]>((acc, { session, user }) => {
    const server = servers.find(s => s.id === session.serverId);
    if (server) {
      acc.push({ server, token: session.token, username: user.username });
    }
    return acc;
  }, []);
}