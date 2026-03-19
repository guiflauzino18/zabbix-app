import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useProblems } from '../../src/hooks/useProblems';
import { useActiveSessions } from '../../src/hooks/useActiveSessions';
import { useServersStore } from '../../src/stores/servers.store';
import { ProblemCard } from '../../src/components/ProblemCard';
import { ServerSelector } from '../../src/components/ServerSelector';
import { SeverityCounter } from '../../src/components/ui/SeverityCounter';
import type { ZabbixSeverity } from '../../src/api/zabbix.types';
import { Checkbox } from 'expo-checkbox';

const SEVERITY_FILTERS: ZabbixSeverity[] = [5, 4, 3, 2, 1];

export default function DashboardScreen() {
  const { currentUser, session, logoutAll } = useAuth();
  const { servers } = useServersStore();
  const activeSessions = useActiveSessions();
  const [selectedServerId, setSelectedServerId] = useState<'all' | string>('all');
  const [showSuppressed, setShowSuppressed] = useState(false)
  const [activeSeverity, setActiveSeverity] = useState<ZabbixSeverity | null>(null);
  const severityFilter = activeSeverity !== null ? [activeSeverity] : undefined;
  const { problems, isLoading, isRefetching, refetch, countBySeverity, totalCount } = useProblems({ selectedServerId, severityFilter, showSuppressed });
  const activeServer = servers.find(s => s.id === session?.serverId);

  const handleSeverityPress = useCallback((sev: ZabbixSeverity) => {
    setActiveSeverity(prev => (prev === sev ? null : sev));
  }, [])


  // console.log("dashboard.tsx:35 "+currentUser?.username)

  const renderHeader = () => (
    <View className='m-2 bg-bg_primary rounded-sm'>
      {/* Header */}
      <View className="px-4 mx-2 rounded-sm pt-3 pb-3 border-b border-border">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-text_primary text-xl font-semibold">Dashboard</Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-green-400 mr-1.5" />
              <Text className="text-green-400 text-xs">
                {activeSessions.length} servidor{activeSessions.length !== 1 ? 'es' : ''} ativo{activeSessions.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View className="items-end gap-1">
            <View
              className="rounded-xl px-3 py-1.5 items-center border"
              style={{
                backgroundColor: totalCount > 0 ? '#D40000' : '#34AF67',
                borderColor: totalCount > 0 ? '#8c1515' : '#0e6833',
              }}
            >
              <Text
                className="text-xl font-semibold text-white"
              >
                {totalCount}
              </Text>
              <Text className="text-white text-xs">incidentes</Text>
            </View>

          </View>
        </View>

        <View className='flex-row justify-between items-center mt-1.5'>
          <Text className="text-text_primary text-xs">
            {currentUser?.name} {currentUser?.surname}
            {activeServer ? ` · ${activeServer.name}` : ''}
            {activeServer?.apiVersion ? ` v${activeServer.apiVersion}` : ''}
          </Text>
          <TouchableOpacity onPress={logoutAll}>
            <Text className="text-red text-sm ">Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Seletor de servidor */}
      <View className="pt-3">
        <ServerSelector selected={selectedServerId} onSelect={setSelectedServerId} />
      </View>

      {/* Contadores por severidade */}
      <View className=" rounded-sm flex-row gap-1.5 px-4 py-3">
        {SEVERITY_FILTERS.map(sev => (
          <SeverityCounter
            key={sev}
            severity={sev}
            count={countBySeverity[sev]}
            isActive={activeSeverity === sev}
            onPress={() => handleSeverityPress(sev)}
          />
        ))}
      </View>

      {/* Filtro ativo */}
      {activeSeverity !== null && (
        <View className="flex-row items-center rounded-sm justify-between px-4 mb-2">
          <Text className="text-text_primary text-xs">Filtrando por severidade</Text>
          <TouchableOpacity onPress={() => setActiveSeverity(null)}>
            <Text className="text-text_primary text-xs">Limpar filtro</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Total */}
      <View className="px-4 mb-1.5 flex-row justify-between items-center">
        <Text className="text-text_primary text-xs">
          {problems.length} problema{problems.length !== 1 ? 's' : ''} encontrado{problems.length !== 1 ? 's' : ''}
        </Text>
        
        <View className='flex-row gap-1'>
          <Checkbox className='h-1' value={showSuppressed} onValueChange={(check) =>setShowSuppressed(check)}/>
          <Text className='text-sm text-text_primary'>Exibir suprimidos</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="items-center py-12 px-8 bg-bg_primary mx-2">
        <Text className="text-4xl mb-3">✅</Text>
        <Text className="text-text_primary text-base font-medium text-center">
          Nenhum incidente ativo
        </Text>
        <Text className="text-text_primary text-sm text-center mt-1.5">
          {activeSeverity !== null
            ? 'Tente remover o filtro de severidade'
            : 'Todos os sistemas operando normalmente'}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg_secondary mx-2">
        {renderHeader()}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E94560" size="large" />
          <Text className="text-text_primary text-sm mt-3">Carregando incidentes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg_secondary" edges={['top']}>
      <FlatList
        data={problems}
        keyExtractor={item => `${item.serverId}-${item.eventid}`}
        renderItem={({ item }) => (
          <View className="px-4">
            <ProblemCard problem={item} showServer={selectedServerId === 'all'} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#E94560"
            colors={['#E94560']}
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}