import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { NotificationSettings, ZabbixSeverity } from '../api/zabbix.types';
import { SEVERITY_LABELS } from '../api/zabbix.types';

// Configura como as notificações aparecem enquanto o app está em foreground
// Por padrão o Expo suprime notificações em foreground — aqui habilitamos
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Solicita permissão e retorna o Expo Push Token
// O token é necessário para enviar push via servidor externo no futuro
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications só funcionam em dispositivo físico
  if (!Device.isDevice) {
    console.log('[Push] Simulador detectado — push não disponível');
    return null;
  }

  // Verifica permissão atual
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Solicita permissão se ainda não concedida
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permissão negada pelo usuário');
    return null;
  }

  // Canal Android — obrigatório para Android 8+
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('zabbix-alerts', {
      name: 'Alertas Zabbix',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E94560',
      // sound: 'default',
      enableVibrate: true,
    });

    // Canal separado para alertas de desastre com prioridade máxima
    await Notifications.setNotificationChannelAsync('zabbix-disaster', {
      name: 'Desastres Zabbix',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      lightColor: '#E45959',
      // sound: 'default',
      enableVibrate: true,
      bypassDnd: true, // ignora modo não perturbe do sistema para desastres
    });
  }

  // Obtém o token Expo Push (para envio remoto futuro)
  /*
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'seu-project-id-aqui', // substitua pelo ID do seu projeto Expo
    });
    return token.data;
  } catch (err) {
    console.log('[Push] Erro ao obter token:', err);
    return null;
  }
    */

  return null
}

export interface LocalPushPayload {
  title: string;
  body: string;
  severity: ZabbixSeverity;
  eventid: string;
  serverId: string;
  settings: NotificationSettings;
}

// Verifica se está no horário silencioso configurado
function isInQuietHours(settings: NotificationSettings): boolean {
  if (!settings.quietHoursEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
  const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Horário silencioso pode cruzar meia-noite (ex: 22:00 – 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// Dispara uma notificação local imediata
export async function sendLocalPushNotification(
  payload: LocalPushPayload,
): Promise<void> {
  const { title, body, severity, eventid, serverId, settings } = payload;

  // Respeita configurações do servidor
  if (!settings.enabled) return;
  if (!settings.severities[severity]) return;

  // Verifica horário silencioso
  // Desastres (severity 5) ignoram o horário silencioso
  if (severity < 5 && isInQuietHours(settings)) return;

  // Escolhe o canal Android baseado na severidade
  const androidChannelId =
    severity === 5 ? 'zabbix-disaster' : 'zabbix-alerts';

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: settings.sound ? true : false,
      vibrate: settings.vibration ? [0, 250, 250, 250] : undefined,
      badge: 1,
      // Dados extras para identificar o alerta ao tocar na notificação
      data: { eventid, serverId, type: 'zabbix-alert' },
      // Prioridade máxima para desastres
      priority:
        severity === 5
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // dispara imediatamente
    identifier: `zabbix-${eventid}`, // evita duplicatas pelo mesmo eventid
    ...(Platform.OS === 'android' && { channelId: androidChannelId }),
  });
}

// Cancela a notificação de um evento específico (quando resolvido)
export async function cancelNotification(eventid: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`zabbix-${eventid}`);
}

// Zera o badge do app
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}