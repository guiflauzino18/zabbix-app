import { TouchableOpacity, View, Text } from 'react-native';
import { router } from 'expo-router';
import { SEVERITY_COLORS, type ZabbixSeverity } from '../api/zabbix.types';
import type { ProblemWithServer } from '../services/problems.service';
import { SeverityBadge } from './ui/SeverityBadges';

interface Props {
  problem: ProblemWithServer;
  showServer?: boolean;
}

function timeAgo(clock: string): string {
  const diff = Math.floor(Date.now() / 1000) - parseInt(clock);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}min`;
  return `há ${Math.floor(diff / 86400)}d`;
}

export function ProblemCard({ problem, showServer = true }: Props) {
  const severity = parseInt(problem.severity) as ZabbixSeverity;
  const severityColor = SEVERITY_COLORS[severity];
  const isAcknowledged = problem.acknowledged === '1';
  const hostName = problem.hostName ?? 'Host desconhecido';

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/problem/[id]',
          params: { id: problem.eventid, serverId: problem.serverId },
        })
      }
      className="rounded-xl p-3 mb-2 border bg-bg_primary"
      style={{
        // backgroundColor: '#16213E',
        borderLeftWidth: 5,
        borderLeftColor: severityColor,
        borderWidth: .8,
      }}
    >
      <View className="flex-row items-start gap-2">
        <Text
          className="flex-1 text-text_primary text-sm font-medium leading-snug"
          numberOfLines={2}
        >
          {problem.name}
        </Text>
        <SeverityBadge severity={severity} size="sm" />
      </View>

      <View className="flex-row justify-between mt-1.5">
        <Text className="text-text_primary text-xs" numberOfLines={1}>
          {hostName}
        </Text>
        {showServer && (
          <Text className="text-text_secondary text-xs">{problem.serverName}</Text>
        )}
      </View>

      <View className="flex-row justify-between items-center mt-1">
        {/* <View className="flex-row items-center gap-1">
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: isAcknowledged ? '#4ade80' : '#6B7280' }}
          />
          <Text className="text-gray-500 text-xs">
            {isAcknowledged ? 'Confirmado' : 'Não confirmado'}
          </Text>
        </View> */}
        <Text className="text-text_primary text-xs">{timeAgo(problem.clock)}</Text>
      </View>
    </TouchableOpacity>
  );
}