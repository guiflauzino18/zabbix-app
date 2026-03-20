import { TouchableOpacity, View, Text } from 'react-native';
import { router } from 'expo-router';
import { useNotificationsStore } from '../stores/notifications.store';
import { SEVERITY_COLORS, SEVERITY_LABELS, type AppNotification, type ZabbixSeverity } from '../api/zabbix.types';

interface Props {
  notification: AppNotification;
}

// Formata o tempo relativo de forma compacta
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function NotificationCard({ notification: n }: Props) {
  const { markAsRead } = useNotificationsStore();
  const severityColor = SEVERITY_COLORS[n.severity];
  const severityLabel = SEVERITY_LABELS[n.severity];

  const handlePress = () => {
    // Marca como lida ao tocar
    if (!n.isRead) markAsRead(n.id);

    // Navega para o detalhe do problema
    router.push({
      pathname: '/problem/[id]',
      params: { id: n.eventid, serverId: n.serverId },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`rounded-xl p-3 mb-2 border border-border_color`}
      style={{
        backgroundColor: n.isRead ? '#ffffff' : '#0A466A',
        // Borda esquerda colorida apenas para não lidas
        borderLeftWidth: n.isRead ? 0.5 : 3,
        borderLeftColor: n.isRead ? '#0A466A' : severityColor,
        opacity: n.isResolved ? 0.6 : 1,
      }}
    >
      <View className="flex-row items-start gap-2">
        {/* Ponto de não lida */}
        {!n.isRead && (
          <View
            className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: '#E94560' }}
          />
        )}

        <View className="flex-1">
          {/* Título do problema */}
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="flex-1 text-text_primary text-xs font-medium leading-snug"
              numberOfLines={2}
            >
              {n.title}
            </Text>
            <Text className="text-text_primary text-xs">{timeAgo(n.createdAt)}</Text>
          </View>

          {/* Badges e meta */}
          <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
            {/* Badge de severidade ou resolvido */}
            {n.isResolved ? (
              <View className="px-1.5 py-0.5 rounded-full border border-border_color" /*style={{ backgroundColor: '#0d2e1a' }}*/>
                <Text className='text-success text-xs'>Resolvido</Text>
              </View>
            ) : (
              <View
                className="px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: severityColor + '25' }}
              >
                <Text style={{ color: severityColor, fontSize: 9 }}>
                  {severityLabel}
                </Text>
              </View>
            )}

            <Text className="text-text_primary text-xs" numberOfLines={1}>
              {n.hostName}
            </Text>

            <Text className="text-text_secondary text-xs">{n.serverName}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}