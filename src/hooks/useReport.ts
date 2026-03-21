import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { generateReport, buildPeriod } from '../services/reports.service';
import { useActiveSessions } from './useActiveSessions';
import { useHosts } from './useHosts';
import type { ReportData, ReportPeriod } from '../api/zabbix.types';

export function useReport() {
  const activeSessions = useActiveSessions();

  // Período selecionado — padrão 30 dias
  const [period, setPeriod] = useState<ReportPeriod>(buildPeriod(30));

  // Servidores filtrados — vazio significa todos
  const [filterServerIds, setFilterServerIds] = useState<string[]>([]);

  // Busca total de hosts para calcular % de afetados
  const { totalCount: totalHosts } = useHosts({ selectedServerId: 'all' });

  const sessions = activeSessions.map(s => ({
    serverUrl: s.server.url,
    token: s.token,
    serverId: s.server.id,
    serverName: s.server.name,
  }));

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'report',
      period.days,
      filterServerIds.join(','),
      activeSessions.map(s => s.server.id).join(','),
    ],
    queryFn: () => generateReport(sessions, period, filterServerIds, totalHosts),
    enabled: sessions.length > 0,
    staleTime: 5 * 60_000, // relatório tem cache de 5min
  });

  const selectPeriod = useCallback((days: number) => {
    setPeriod(buildPeriod(days));
  }, []);

  const toggleServer = useCallback((serverId: string) => {
    setFilterServerIds(prev =>
      prev.includes(serverId)
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId],
    );
  }, []);

    const clearServerFilter = useCallback(() => {
    setFilterServerIds([]);
    }, []);

  return {
    data: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
    period,
    selectPeriod,
    filterServerIds,
    toggleServer,
    clearServerFilter,
    activeSessions,
  };
}