import { ZabbixItem, HOST_AVAILABILITY, getHostMainIp } from "@/api/zabbix.types";
import { MiniChart } from "@/components/MiniChart";
import { ProblemCard } from "@/components/ProblemCard";
import { useHostDetail } from "@/hooks/useHostsDetail";
import { useProblems } from "@/hooks/useProblems";
import { fetchHosts } from "@/services/hosts.service";
import { useAuthStore } from "@/stores/auth.store";
import { useServersStore } from "@/stores/servers.store";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View, ScrollView, RefreshControl, TouchableOpacity, Text, Pressable } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';


// Formata o valor do item com sua unidade de forma legível
function formatItemValue(item: ZabbixItem): string {
  const val = parseFloat(item.lastvalue);
  if (isNaN(val)) return item.lastvalue || '—';

  // Conversão de bytes para unidade legível
  if (item.units === 'B' || item.units === 'bytes') {
    if (val >= 1073741824) return `${(val / 1073741824).toFixed(1)} GB`;
    if (val >= 1048576) return `${(val / 1048576).toFixed(1)} MB`;
    if (val >= 1024) return `${(val / 1024).toFixed(1)} KB`;
    return `${val} B`;
  }

  // Converte bits/s para Mbps quando alto
  if (item.units === 'bps') {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} Mbps`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)} Kbps`;
    return `${val} bps`;
  }

  // Para porcentagem, limita a 1 casa decimal
  if (item.units === '%') return `${val.toFixed(1)}%`;

  // Valor genérico com unidade
  return `${val.toFixed(val % 1 === 0 ? 0 : 2)}${item.units ? ' ' + item.units : ''}`;
}

// Calcula quanto tempo atrás foi a última coleta
function lastSeenAgo(clock: string): string {
  const diff = Math.floor(Date.now() / 1000) - parseInt(clock);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return `há ${Math.floor(diff / 3600)}h`;
}

export default function HostDetailScreen() {
  const { id: hostid, serverId } = useLocalSearchParams<{id: string; serverId: string;}>();

  const { servers } = useServersStore();
  const { getSession } = useAuthStore();
  const server = servers.find(s => s.id === serverId);
  const session = getSession(serverId);

  // Qual item está selecionado para exibir o gráfico
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { items, itemsLoading, refetchItems } = useHostDetail(hostid, serverId);

  // Busca dados do host específico para exibir status e IP
  const { data: hostData, isLoading: hostLoading } = useQuery({
    queryKey: ['host-detail', hostid, serverId],
    queryFn: async () => {
      const hosts = await fetchHosts(server!.url, session!.session.token);
      return hosts.find(h => h.hostid === hostid) ?? null;
    },
    enabled: !!server && !!session,
    staleTime: 0,
  });

  // Busca apenas os problemas deste host para exibir na seção de alertas
  const { problems: hostProblems } = useProblems({
    selectedServerId: serverId,
  });

  // Filtra somente os problemas que pertencem a este host
  const thisHostProblems = hostProblems.filter(
    p => p.hostName === hostData?.name || p.hostName === hostData?.host,
  );

  // Encontra o item selecionado para o gráfico (ou usa o primeiro numérico)
  const numericItems = items.filter(i => ['0', '3'].includes(i.value_type));
  const chartItem = selectedItemId
    ? items.find(i => i.itemid === selectedItemId)
    : numericItems[0];

  const isLoading = hostLoading || itemsLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg_secondary items-center justify-center">
        <ActivityIndicator color="#E94560" size="large" />
      </SafeAreaView>
    );
  }

  if (!hostData) {
    return (
      <SafeAreaView className="flex-1 bg-bg_secondary">
        <View className="flex-row items-center px-4 py-3 bg-zabbix-surface border-b border-border_color">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-text_primary text-sm">← Hosts</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-text_primary">Host não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const availability = HOST_AVAILABILITY[hostData.available ?? '0'];
  const ip = getHostMainIp(hostData);
  const primaryGroup = hostData.groups?.[0]?.name ?? '—';

  return (
    <SafeAreaView className="flex-1 bg-bg_secondary" edges={['top']}>
      {/* Header de navegação */}
      <View className="flex-row justify-between items-center m-2 rounded-sm px-4 py-3 bg-bg_primary border-b">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-text_primary text-sm">← Hosts</Text>
        </TouchableOpacity>
        <Text className="text-text_primary text-base font-semibold" numberOfLines={1}>
          {hostData.name}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, gap: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetchItems}
            tintColor="#E94560"
            colors={['#E94560']}
          />
        }
      >
        {/* Card de status geral */}
        <View className="rounded-xl p-3 border border-border_color flex-row items-center gap-3 bg-bg_primary">

          <View className={`w-3 h-3 rounded-full`}
            style={{ backgroundColor: availability.dot }}
          />

          <Text className="text-sm font-medium flex-1" style={{ color: availability.color }} >
            {thisHostProblems.length > 0
              ? `${thisHostProblems.length} problema${thisHostProblems.length !== 1 ? 's' : ''} ativo${thisHostProblems.length !== 1 ? 's' : ''}`
              : availability.label}
          </Text>
          <Text className="text-text_primary text-xs">{server?.name}</Text>
        </View>

        {/* Grid de informações do host */}
        <View className="flex-row gap-2">
          <InfoCard label="IP" value={ip} />
          <InfoCard label="Grupo" value={primaryGroup} />
        </View>
        <View className="flex-row gap-2">
          <InfoCard label="Itens ativos" value={String(items.length)} />
          <InfoCard
            label="Última coleta"
            value={
              items[0]?.lastclock ? lastSeenAgo(items[0].lastclock) : '—'
            }
          />
        </View>

        {/* Gráfico do item selecionado */}
        {chartItem && server && session && (
          <MiniChart
            serverUrl={server.url}
            token={session.session.token}
            itemid={chartItem.itemid}
            valueType={chartItem.value_type}
            itemName={chartItem.name}
            units={chartItem.units}
            hours={3}
          />
        )}

        {/* Problemas ativos deste host */}
        {thisHostProblems.length > 0 && (
          <View>
            <Text className="text-text_primary text-xs font-medium mb-1.5 ml-1">
              PROBLEMAS ATIVOS
            </Text>
            {thisHostProblems.map(p => (
              <ProblemCard key={p.eventid} problem={p} showServer={false} />
            ))}
          </View>
        )}

        {/* Lista de últimos valores dos itens */}
        <View>
          <Text className="text-text_primary text-xs font-medium mb-1.5 ml-1">
            ÚLTIMOS VALORES
          </Text>
          {items.map(item => (
            <Pressable
              key={item.itemid}
              // Toca no item para selecionar e exibir seu gráfico
              onPress={() =>
                ['0', '3'].includes(item.value_type)
                  ? setSelectedItemId(item.itemid)
                  : null
              }
              className={`rounded-lg px-3 py-2.5 mb-1 border border-border_color flex-row items-center 
                ${selectedItemId === item.itemid 
                  ? 'bg-bg_tertiary'
                  : 'bg-bg_primary'
              }`}
            >
              <View className="flex-1">
                <Text className={`text-xs ${selectedItemId === item.itemid ? 'text-white' : 'text-text_primary'} `} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-text_primary text-xs mt-1">
                  {lastSeenAgo(item.lastclock)}
                </Text>
              </View>
              <Text
                className="text-xs font-medium ml-2"
                style={{
                  // Itens numéricos em azul, texto em cinza
                  color: ['0', '3'].includes(item.value_type)
                    ? '#7499FF'
                    : '#9CA3AF',
                }}
              >
                {formatItemValue(item)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente auxiliar para os cards de informação do grid
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl p-3 border border-white bg-bg_tertiary" >
      <Text className="text-white text-xs">{label}</Text>
      <Text className="text-white text-sm font-medium mt-0.5" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}