import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { fetchHosts, type HostWithServer } from '../services/hosts.service';
import { useActiveSessions } from './useActiveSessions';
import { useProblems } from './useProblems';

export interface UseHostsOptions {
  selectedServerId: 'all' | string;
  groupId?: string;
  search?: string;
}

export function useHosts({ selectedServerId, groupId, search, }: UseHostsOptions) {

  const activeSessions = useActiveSessions();

  // Filtra quais servidores buscar baseado na seleção
  const serversToFetch = selectedServerId === 'all'
      ? activeSessions
      : activeSessions.filter(s => s.server.id === selectedServerId);

  // Busca problemas para cruzar com os hosts e contar por host
  const { problems } = useProblems({ selectedServerId });

  // Monta um mapa de hostid -> contagem de problemas
  // para evitar N queries adicionais
  const problemCountByHost = problems.reduce<Record<string, number>>(
    (acc, problem) => {
      // O hostid vem do trigger associado ao problema
      // Precisamos do triggerid para cruzar — usamos o objectid
      acc[problem.objectid] = (acc[problem.objectid] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: [ 'hosts', selectedServerId, activeSessions.map(s => s.server.id).join(',')],
    queryFn: async (): Promise<HostWithServer[]> => {
      // Busca hosts de todos os servidores selecionados em paralelo
      const results = await Promise.allSettled(serversToFetch.map(async ({ server, token }) => {
          const hosts = await fetchHosts(server.url, token);
          return hosts.map(h => ({
            ...h,
            serverId: server.id,
            serverName: server.name,
            // Inicialmente 0 — será atualizado pelo cruzamento com problems
            problemCount: 0,
          }));
        }),
      );

      // Agrega resultados ignorando servidores com falha
      const allHosts: HostWithServer[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allHosts.push(...result.value);
        }
      }

      return allHosts;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Recarrega ao voltar para a tela
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  // Aplica os filtros de grupo e busca em memória
  // (evita múltiplas chamadas à API para cada filtro)
  const allHosts = data ?? [];

  const filteredHosts = allHosts
    .filter(host => {
      // Filtra por grupo se selecionado
      if (groupId && groupId !== 'all') {
        return host.groups?.some(g => g.groupid === groupId);
      }
      return true;
    })
    .filter(host => {
      // Filtra por busca (nome ou IP)
      if (!search || search.trim() === '') return true;
      const term = search.toLowerCase();
      const ip = host.interfaces?.find(i => i.main === '1')?.ip ?? '';
      return (
        host.name.toLowerCase().includes(term) ||
        host.host.toLowerCase().includes(term) ||
        ip.includes(term)
      );
    });

  // Separa hosts com e sem problemas para a seção dupla da lista
  const hostsWithProblems = filteredHosts.filter(h => {
    // Um host tem problema se algum problema ativo referencia seus triggers
    // Aqui verificamos pelo available e cruzamos com problems store
    return problems.some(p =>
      // hostName do problema bate com o nome do host
      p.hostName === h.name || p.hostName === h.host,
    );
  });

  const hostsWithoutProblems = filteredHosts.filter(
    h => !hostsWithProblems.find(ph => ph.hostid === h.hostid),
  );

  return {
    allHosts,
    filteredHosts,
    hostsWithProblems,
    hostsWithoutProblems,
    isLoading,
    isRefetching,
    error: error as Error | null,
    refetch,
    totalCount: allHosts.length,
  };
}