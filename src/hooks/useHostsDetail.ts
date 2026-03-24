import { useQuery } from '@tanstack/react-query';
import { fetchHostItems, fetchItemHistory } from '../services/hosts.service';
import { useAuthStore } from '../stores/auth.store';
import { useServersStore } from '../stores/servers.store';

export function useHostDetail(hostid: string, serverId: string) {
  const { getSession } = useAuthStore();
  const { servers } = useServersStore();

  const session = getSession(serverId);
  const server = servers.find(s => s.id === serverId);

  // Busca todos os itens do host com seus últimos valores
  const {
    data: items,
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['host-items', hostid, serverId],
    queryFn: () => fetchHostItems(server!.url, session!.session.token, hostid),
    enabled: !!server && !!session,
    staleTime: 0,
  });

  return {
    items: items ?? [],
    itemsLoading,
    refetchItems,
    server,
    token: session?.session.token,
  };
}

// Hook separado para o histórico de um item específico
// Separado para não bloquear a renderização da tela enquanto o gráfico carrega
export function useItemHistory(
  serverUrl: string,
  token: string,
  itemid: string,
  valueType: string,
  hours: number = 3,
) {
  return useQuery({
    queryKey: ['item-history', itemid, hours],
    queryFn: () =>
      fetchItemHistory(serverUrl, token, itemid, valueType, hours),
    enabled: !!itemid && !!token,
    staleTime: 60_000,
  });
}