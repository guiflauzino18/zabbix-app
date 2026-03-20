import { useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useNotificationsStore } from '../../src/stores/notifications.store';
import { NotificationCard } from '../../src/components/NotificationCard';
import type { AppNotification } from '../../src/api/zabbix.types';
import { clearBadge } from '@/services/push.service';


// Agrupa notificações por dia para exibição em seções
function groupByDay(notifications: AppNotification[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, AppNotification[]> = {};

  notifications.forEach(n => {
    const date = new Date(n.createdAt);
    let label: string;

    if (date.toDateString() === today.toDateString()) {
      label = 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Ontem';
    } else {
      // Formata como "Sex, 14 mar" para datas mais antigas
      label = date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });

  // Retorna como array de seções para o SectionList
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export default function NotificationsScreen() {
  const {
    notifications,
    markAllAsRead,
    clearAll,
    unreadCount,
  } = useNotificationsStore();

  const unread = unreadCount();

  // Marca todas como lidas ao entrar na tela
  // useFocusEffect(
  //   useCallback(() => {
  //     if (unread > 0) markAllAsRead();
  //   }, [unread]),
  // );


  useFocusEffect(
  useCallback(() => {
    if (unread > 0) markAllAsRead();
      // Zera o badge do ícone do app ao abrir a tela
      clearBadge();
    }, [unread]),
  );

  const sections = useMemo(() => groupByDay(notifications),
    [notifications],
  );

  const handleClearAll = () => {
    Alert.alert(
      'Limpar notificações',
      'Deseja remover todas as notificações?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: clearAll },
      ],
    );
  };

  // Renderiza o header de cada seção de dia
  const renderSectionHeader = (title: string) => (
    <View className="px-4 py-1.5">
      <Text className="text-text_primary text-xs font-medium">
        {title.toUpperCase()}
      </Text>
    </View>
  );

  // Transforma sections em lista plana com separadores de seção
  // SectionList não funciona bem com FlatList aninhada, então
  // renderizamos tudo como itens de uma FlatList única
  type ListItem =
    | { type: 'header'; title: string }
    | { type: 'notification'; data: AppNotification };

  const flatData: ListItem[] = sections.flatMap(section => [
    { type: 'header' as const, title: section.title },
    ...section.data.map(n => ({ type: 'notification' as const, data: n })),
  ]);

  return (
    <SafeAreaView className="flex-1 bg-bg_secondary" edges={['top']}>
      {/* Header */}
      <View className="bg-bg_primary px-4 pt-3 pb-3 border-b border-border_color">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-text_primary text-xl font-semibold">Notificações</Text>
            {unread > 0 && (
              <Text className="text-text_primary text-xs mt-0.5">
                {unread} não lida{unread !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          <View className="flex-row gap-3 items-center">
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleClearAll}>
                <Text className="text-text_primary text-xs">Limpar</Text>
              </TouchableOpacity>
            )}
            {unread > 0 && (
              <TouchableOpacity onPress={() => markAllAsRead()}>
                <Text className="text-text_secondary text-xs">Marcar lidas</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={flatData}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `header-${item.title}` : item.data.id
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.title);
          }
          return (
            <View className="px-4">
              <NotificationCard notification={item.data} />
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20 px-8">
            <Text className="text-4xl mb-3">🔕</Text>
            <Text className="text-text_primary text-base font-medium text-center">
              Nenhuma notificação
            </Text>
            <Text className="text-text_primary text-sm text-center mt-1.5">
              Os alertas aparecerão aqui quando novos problemas forem detectados
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function markAllAsRead() {
  throw new Error('Function not implemented.');
}
