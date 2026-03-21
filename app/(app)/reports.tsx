import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useReport } from '../../src/hooks/useReport';
import { MetricCard } from '../../src/components/reports/MetricCard';
import { SeverityBar } from '../../src/components/reports/SeverityBar';
import { formatDuration } from '../../src/services/reports.service';
import type { ZabbixSeverity } from '../../src/api/zabbix.types';

const PERIOD_OPTIONS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
];

const SEVERITY_ORDER: ZabbixSeverity[] = [5, 4, 3, 2, 1, 0];

export default function ReportsScreen() {
  const {
    data,
    isLoading,
    refetch,
    period,
    selectPeriod,
    filterServerIds,
    toggleServer,
    clearServerFilter,
    activeSessions,
  } = useReport();

  // Calcula tendências para as métricas principais
  const problemsTrend = data && data.totalProblemsPrev > 0
    ? ((data.totalProblems - data.totalProblemsPrev) / data.totalProblemsPrev) * 100
    : undefined;

  const mttrTrend = data && data.mttrSecondsPrev > 0
    ? ((data.mttrSeconds - data.mttrSecondsPrev) / data.mttrSecondsPrev) * 100
    : undefined;

  const availTrend = data && data.availabilityPrev > 0
    ? ((data.availability - data.availabilityPrev) / data.availabilityPrev) * 100
    : undefined;

  // Máximo para escala das barras de severidade
  const maxSeverityCount = data
    ? Math.max(...SEVERITY_ORDER.map(s => data.bySeverity[s]))
    : 1;

  return (
    <SafeAreaView className="flex-1 bg-bg_secondary" edges={['top']}>
      {/* Header */}
      <View className="bg-bg_primary px-4 pt-3 pb-3 m-2 border-b border-border_color">
        <View className="flex-row justify-between items-center">
          <Text className="text-text_primary text-xl font-semibold">Relatórios</Text>
          <TouchableOpacity
            onPress={() => router.push('/reports/export')}
            className="px-3 py-1.5 rounded-lg bg-bg_tertiary"
          >
            <Text className="text-white text-sm">Exportar</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-text_primary text-xs mt-1">
          {activeSessions.length} servidor{activeSessions.length !== 1 ? 'es' : ''}
          {filterServerIds.length > 0 ? ` · ${filterServerIds.length} filtrado${filterServerIds.length !== 1 ? 's' : ''}` : ' · todos'}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, gap: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#E94560"
            colors={['#E94560']}
          />
        }
      >
        {/* Seletor de período */}
        <View className="flex-row gap-2">
          {PERIOD_OPTIONS.map(opt => (
            <Pressable
              key={opt.days}
              onPress={() => selectPeriod(opt.days)}
              className={`flex-1 py-2 rounded-xl items-center border 
                ${period.days === opt.days ? 'bg-bg_tertiary border-white' : 'bg-bg_primary border-border_color'}`
              }>

              <Text className="text-xs font-medium" style={{ color: period.days === opt.days ? '#fff' : '#9CA3AF' }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Filtro por servidor — só aparece com múltiplos servidores */}
        {activeSessions.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={clearServerFilter}
                className={`px-3 py-1.5 rounded-full border ${filterServerIds.length === 0 ? 'bg-bg_tertiary border-white' : 'bg-bg_primary border-border_color'}`}>
                <Text className={`text-xs ${filterServerIds.length === 0 ? 'text-white' : 'text-text_primary'}`}>
                  Todos
                </Text>
              </Pressable>

              {activeSessions.map(({ server }) => {
                const isSelected = filterServerIds.includes(server.id);
                return (
                  <Pressable
                    key={server.id}
                    onPress={() => toggleServer(server.id)}
                    className={`px-3 py-1.5 rounded-full border ${isSelected ? 'bg-bg_tertiary border-white' : 'bg-bg_primary border-border_color'}`}>

                    <Text
                      className={`text-xs ${isSelected ? 'text-white' : 'text-text_primary'}`}>
                      {server.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {isLoading && !data ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#E94560" size="large" />
            <Text className="text-text_primary text-sm mt-3">
              Calculando relatório...
            </Text>
          </View>
        ) : data ? (
          <>
            {/* Métricas principais */}
            <View className="flex-row gap-2">
              <MetricCard
                label="Problemas"
                value={String(data.totalProblems)}
                valueColor="#E45959"
                trend={problemsTrend}
                trendGoodWhenDown
              />
              <MetricCard
                label="MTTR médio"
                value={formatDuration(data.mttrSeconds)}
                valueColor="#7499FF"
                trend={mttrTrend}
                trendGoodWhenDown
              />
            </View>
            <View className="flex-row gap-2">
              <MetricCard
                label="Disponibilidade"
                value={`${data.availability.toFixed(2)}%`}
                valueColor="#4ade80"
                trend={availTrend}
              />
              <MetricCard
                label="Hosts afetados"
                value={String(data.hostsAffected)}
                valueColor="#FFA059"
                subtitle={`de ${data.totalHosts} monitorados`}
              />
            </View>

            {/* Por severidade */}
            <Text className="text-text_primary text-xs font-medium px-1">
              PROBLEMAS POR SEVERIDADE
            </Text>
            <View
              className="rounded-xl p-3 border border-border_color bg-bg_primary">
              {SEVERITY_ORDER.map(sev => (
                <SeverityBar
                  key={sev}
                  severity={sev}
                  count={data.bySeverity[sev]}
                  maxCount={maxSeverityCount}
                />
              ))}
            </View>

            {/* Top hosts */}
            {data.topHosts.length > 0 && (
              <>
                <Text className="text-text_primary text-xs font-medium px-1">
                  TOP HOSTS
                </Text>
                <View
                  className="rounded-xl border border-border_color overflow-hidden bg-bg_primary"
                >
                  {data.topHosts.slice(0, 8).map((host, index) => (
                    <View
                      key={`${host.serverId}_${host.hostName}`}
                      className="flex-row items-center px-3 py-2.5"
                      style={{
                        borderBottomWidth: index < data.topHosts.length - 1 ? 0.5 : 0,
                        borderBottomColor: '#0F3460',
                      }}
                    >
                      {/* Número do ranking */}
                      <Text
                        className="text-xs font-medium mr-3"
                        style={{ color: '#6B7280', width: 16 }}
                      >
                        {index + 1}
                      </Text>
                      <View className="flex-1">

                        <Text className="text-text_primary text-xs font-medium" numberOfLines={1}>
                          {host.hostName}
                        </Text>
                        <Text className="text-text_secondary text-xs">
                          {host.serverName}
                        </Text>
                      </View>
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          // Cor degradê do vermelho ao amarelo conforme ranking
                          color: index === 0 ? '#E45959'
                            : index === 1 ? '#E97659'
                            : index === 2 ? '#FFA059'
                            : '#9CA3AF',
                        }}
                      >
                        {host.count} eventos
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Breakdown por servidor */}
            {data.serverBreakdown.length > 1 && (
              <>
                <Text className="text-text_primary text-xs font-medium px-1">
                  POR SERVIDOR
                </Text>

                <View
                  className="rounded-xl border border-border_color overflow-hidden bg-bg_primary"
                >
                  {data.serverBreakdown.map((s, index) => (
                    <View
                      key={s.serverId}
                      className="flex-row items-center px-3 py-2.5"
                      style={{
                        borderBottomWidth: index < data.serverBreakdown.length - 1 ? 0.5 : 0,
                        borderBottomColor: '#0F3460',
                      }}
                    >
                      <View className="w-2 h-2 rounded-full bg-green-400 mr-3" />
                      <Text className="flex-1 text-text_primary text-xs">
                        {s.serverName}
                      </Text>
                      <Text className="text-text_primary text-xs">
                        {s.count} eventos
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}