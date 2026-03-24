import { TouchableOpacity, View, Text } from 'react-native';
import { router } from 'expo-router';
import { HOST_AVAILABILITY, getHostMainIp } from '../api/zabbix.types';
import type { HostWithServer } from '../services/hosts.service';
import { memo } from 'react';

interface Props {
  host: HostWithServer;
  showServer?: boolean;
  problemCount?: number;
}
// Memo evita re-render desnecessários
export const HostCard = memo(
  function HostCard({ host, showServer = true, problemCount = 0 }: Props) {
    const availability = HOST_AVAILABILITY[host.available ?? '0'];
    const ip = getHostMainIp(host);
    // Pega o primeiro grupo para exibir no badge
    const primaryGroup = host.groups?.[0]?.name;

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/host/[id]',
            params: { id: host.hostid, serverId: host.serverId },
          })
        }
        className="rounded-xl p-3 mb-2 border border-border_color bg-bg_primary"
        // style={{ backgroundColor: '#16213E' }}
      >
        {/* Linha principal: indicador de status + nome + servidor */}
        <View className="flex-row items-center gap-2">
          {/* Ponto colorido indica disponibilidade */}
          <View
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: availability.dot }}
          />
          <Text
            className="flex-1 text-text_primary text-sm font-medium"
            numberOfLines={1}
          >
            {host.name}
          </Text>
          {showServer && (
            <Text className="text-text_secondary text-xs">{host.serverName}</Text>
          )}
        </View>

        {/* Linha de badges: problemas + grupo + itens */}
        <View className="flex-row gap-2 mt-1.5 ml-4">
          {/* Badge de problemas só aparece se houver algum */}
          {problemCount > 0 && (
            <View
              className="px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: '#3b1515' }}
            >
              <Text style={{ color: '#E45959', fontSize: 10 }}>
                {problemCount} problema{problemCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Grupo do host */}
          {primaryGroup && (
            <View
              className="px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: '#1a1f3b' }}
            >
              <Text style={{ color: '#7499FF', fontSize: 10 }}>
                {primaryGroup}
              </Text>
            </View>
          )}

          {/* IP principal */}
          {ip !== 'N/A' && (
            <Text className="text-success text-xs self-center">{ip}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => 
    prev.host.hostid === next.host.hostid &&
    prev.host.available === next.host.available &&
    prev.problemCount === next.problemCount &&
    prev.showServer === next.showServer,
)