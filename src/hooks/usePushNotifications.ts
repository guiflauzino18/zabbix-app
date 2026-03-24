import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  registerForPushNotifications,
  sendLocalPushNotification,
  clearBadge,
} from '../services/push.service';
import { useNotificationsStore } from '../stores/notifications.store';
import { useProblems } from './useProblems';
import type { ZabbixSeverity } from '../api/zabbix.types';
import { SEVERITY_LABELS } from '../api/zabbix.types';

//Definir jitter (variação aleatória para distribuir as requisições e evitar gargalo quando mútiplos servidores fazerem requisições simultaneament.)
const POLL_INTERVAL = 60_000 + Math.random() * 10_000

export function usePushNotifications() {
  const { problems } = useProblems({selectedServerId: 'all', refetchInterval: POLL_INTERVAL});

  const { notifications, addNotification, markResolved, getSettings } = useNotificationsStore();

  const knownEventIds = useRef<Set<string>>(new Set());
  const isFirstRun = useRef(true);
  const notifListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  // Registra permissões e listeners ao montar
  useEffect(() => { registerForPushNotifications();

    notifListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('[Push] Recebida em foreground:', notification.request.identifier);
      },
    );

    // Ao tocar na notificação navega para o problema
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as {
          eventid?: string;
          serverId?: string;
        };

        if (data?.eventid && data?.serverId) {
          router.push({
            pathname: '/problem/[id]',
            params: { id: data.eventid, serverId: data.serverId },
          });
        }
      });

    clearBadge();

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Zera badge ao voltar para o foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') clearBadge();
      },
    );
    return () => subscription.remove();
  }, []);

  // Detecta novos problemas e gerencia notificações
  useEffect(() => {
    if (problems.length === 0 && !isFirstRun.current) return;

    // Primeira execução: popula snapshot sem notificar
    // Evita notificar problemas que já existiam ao abrir o app
    if (isFirstRun.current) {
      problems.forEach(p => knownEventIds.current.add(p.eventid));
      isFirstRun.current = false;
      return;
    }

    const currentIds = new Set(problems.map(p => p.eventid));

    // Processa novos problemas
    problems.forEach(async p => {
      // Ignora problemas já conhecidos
      if (knownEventIds.current.has(p.eventid)) return;

      const severity = parseInt(p.severity) as ZabbixSeverity;
      const settings = getSettings(p.serverId);

      // Adiciona na store de notificações (histórico)
      // Feito independentemente das configurações de push
      // para garantir que o histórico sempre seja completo
      await addNotification({
        eventid: p.eventid,
        serverId: p.serverId,
        serverName: p.serverName,
        title: p.name,
        hostName: p.hostName,
        severity,
        isResolved: p.r_eventid !== '0',
      });

      // Dispara push apenas se as configurações permitirem
      await sendLocalPushNotification({
        title: `${SEVERITY_LABELS[severity]}: ${p.serverName}`,
        body: `${p.name}\n${p.hostName}`,
        severity,
        eventid: p.eventid,
        serverId: p.serverId,
        settings,
      });
    });

    // Marca como resolvidos os que saíram da lista
    knownEventIds.current.forEach(id => {
      if (!currentIds.has(id)) markResolved(id);
    });

    // Atualiza snapshot
    knownEventIds.current = currentIds;
  }, [problems]);
}