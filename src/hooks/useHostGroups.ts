import { useQuery } from '@tanstack/react-query';
import { fetchHostGroups } from '../services/hosts.service';
import { useActiveSessions } from './useActiveSessions';
import type { ZabbixHostGroup } from '../api/zabbix.types';

export function useHostGroups(selectedServerId: 'all' | string) {
  const activeSessions = useActiveSessions();

  const serversToFetch =
    selectedServerId === 'all'
      ? activeSessions
      : activeSessions.filter(s => s.server.id === selectedServerId);

  const { data } = useQuery({
    queryKey: ['host-groups', selectedServerId],
    queryFn: async (): Promise<ZabbixHostGroup[]> => {
      // Agrega grupos de todos os servidores e remove duplicatas pelo nome
      const results = await Promise.allSettled(
        serversToFetch.map(({ server, token }) =>
          fetchHostGroups(server.url, token),
        ),
      );

      const allGroups: ZabbixHostGroup[] = [];
      const seen = new Set<string>();

      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const group of result.value) {
            // Evita duplicatas quando o mesmo grupo existe em múltiplos servidores
            if (!seen.has(group.name)) {
              seen.add(group.name);
              allGroups.push({
                groupid: `group_${group.name.replace(/\s+/g, '_').toLowerCase()}`,
                name: group.name
              });
            }
          }
        }
      }

      return allGroups.sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 5 * 60_000, // grupos mudam pouco, cache de 5 min
  });

  return { groups: data ?? [] };
}