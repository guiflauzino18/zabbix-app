import { useQuery } from '@tanstack/react-query';
import { fetchProblemsWithHosts, type ProblemWithServer } from '../services/problems.service';
import { useActiveSessions } from './useActiveSessions';
import type { ZabbixSeverity } from '../api/zabbix.types';

export interface UseProblemsOptions {
  selectedServerId: 'all' | string;
  severityFilter?: ZabbixSeverity[];
  showSuppressed?: boolean,
  refetchInterval?: number;
}

export interface ProblemsResult {
  problems: ProblemWithServer[];
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => void;
  countBySeverity: Record<ZabbixSeverity, number>;
  totalCount: number;
}

export function useProblems({selectedServerId, severityFilter, refetchInterval = 60_000, showSuppressed}: UseProblemsOptions): ProblemsResult {

  const activeSessions = useActiveSessions();

  const serversToFetch = selectedServerId === 'all' 
      ? activeSessions
      : activeSessions.filter(s => s.server.id === selectedServerId);

  const { data, isLoading, isRefetching, error, refetch } = useQuery({

    queryKey: ['problems', selectedServerId, severityFilter?.join(','), activeSessions.map(s => s.server.id).join(','), showSuppressed],

    queryFn: async (): Promise<ProblemWithServer[]> => {
      const results = await Promise.allSettled(serversToFetch.map(async ({ server, token }) => {

        const problems = await fetchProblemsWithHosts({ serverUrl: server.url, token, severities: severityFilter, acknowledged: false, suppressed: showSuppressed});
          return problems.map(p => ({
            ...p,
            serverId: server.id,
            serverName: server.name,
          }));
        }),
      );

      const allProblems: ProblemWithServer[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allProblems.push(...result.value);
        }
      }

      return allProblems

      // return allProblems.sort((a, b) => {
      //   const sevDiff = parseInt(b.severity) - parseInt(a.severity);
      //   if (sevDiff !== 0) return sevDiff;
      //   return parseInt(b.clock) - parseInt(a.clock);
      // });
    },
    refetchInterval,
    enabled: serversToFetch.length > 0,
  });

  const problems = data ?? [];

  const countBySeverity = problems.reduce((acc, p) => {
      const sev = parseInt(p.severity) as ZabbixSeverity;
      acc[sev] = (acc[sev] ?? 0) + 1;
      return acc;
    },
    { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<ZabbixSeverity, number>,
    
  );

  return {
    problems,
    isLoading,
    isRefetching,
    error: error as Error | null,
    refetch,
    countBySeverity,
    totalCount: problems.length,
  };
}