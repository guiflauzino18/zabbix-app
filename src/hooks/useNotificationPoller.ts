/*
* Este hook roda em background e compara os problemas atuais com o último snapshot para detectar eventos novos e gerar notificações.
*/

import { useEffect, useRef } from 'react';
import { useProblems } from './useProblems';
import { useNotificationsStore } from '../stores/notifications.store';
import type { ZabbixSeverity } from '../api/zabbix.types';

// Intervalo de polling para detecção de novos problemas (ms)
const POLL_INTERVAL = 60_000;

export function useNotificationPoller() {
  const { problems } = useProblems({
    selectedServerId: 'all',
    refetchInterval: POLL_INTERVAL,
  });

  const { addNotification, markResolved } = useNotificationsStore();

  // Guarda o snapshot anterior dos eventids conhecidos
  // useRef evita re-renders ao atualizar o snapshot
  const knownEventIds = useRef<Set<string>>(new Set());
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (problems.length === 0) return;

    // Na primeira execução apenas popula o snapshot sem gerar notificações
    // Evita notificar problemas que já existiam antes de abrir o app
    if (isFirstRun.current) {
      problems.forEach(p => knownEventIds.current.add(p.eventid));
      isFirstRun.current = false;
      return;
    }

    const currentIds = new Set(problems.map(p => p.eventid));

    // Detecta problemas NOVOS (não estavam no snapshot anterior)
    problems.forEach(p => {
      if (!knownEventIds.current.has(p.eventid)) {
        addNotification({
          eventid: p.eventid,
          serverId: p.serverId,
          serverName: p.serverName,
          title: p.name,
          hostName: p.hostName,
          severity: parseInt(p.severity) as ZabbixSeverity,
          isResolved: p.r_eventid !== '0',
        });
      }
    });

    // Detecta problemas RESOLVIDOS (estavam no snapshot mas não estão mais)
    knownEventIds.current.forEach(id => {
      if (!currentIds.has(id)) {
        markResolved(id);
      }
    });

    // Atualiza o snapshot para o próximo ciclo
    knownEventIds.current = currentIds;
  }, [problems]);
}