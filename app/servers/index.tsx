import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useServersStore } from '../../src/stores/servers.store';
import type { ZabbixServer } from '../../src/api/zabbix.types';

function ServerCard({ server }: { server: ZabbixServer }) {
  const { removeServer } = useServersStore();

  const handleDelete = () => {
    Alert.alert(
      'Remover servidor',
      `Deseja remover "${server.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => removeServer(server.id),
        },
      ],
    );
  };

  return (
    <View className="bg-zabbix-surface border border-zabbix-card rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">{server.name}</Text>
          <Text className="text-gray-400 text-sm mt-0.5">{server.url}</Text>
          {server.apiVersion && (
            <Text className="text-gray-500 text-xs mt-1">
              API v{server.apiVersion}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          className="ml-4 p-2 bg-red-900/30 rounded-lg"
        >
          <Text className="text-red-400 text-sm">Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ServersScreen() {
  const { servers } = useServersStore();

  return (
    <View className="flex-1 bg-zabbix-dark px-4 pt-14">
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-gray-400 text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Servidores</Text>
        <Link href="/servers/add" asChild>
          <TouchableOpacity>
            <Text className="text-zabbix-accent font-semibold">+ Novo</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <FlatList
        data={servers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ServerCard server={item} />}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-gray-500 text-base">Nenhum servidor ainda</Text>
          </View>
        }
      />
    </View>
  );
}