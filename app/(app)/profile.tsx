import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useServersStore } from '../../src/stores/servers.store';
import { useAuthStore } from '../../src/stores/auth.store';

export default function ProfileScreen() {
  const { currentUser, logoutAll } = useAuth();
  const { servers } = useServersStore();
  const { sessions } = useAuthStore();

  const handleLogoutAll = () => {
    Alert.alert(
      'Sair de todos os servidores',
      'Deseja encerrar todas as sessões?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logoutAll },
      ],
    );
  };

  // Lista somente servidores com sessão ativa
  const activeSessions = servers.filter(s => sessions[s.id]);

  return (
    <SafeAreaView className="flex-1 bg-bg_secondary" edges={['top']}>
      <View className="bg-bg_primary px-4 pt-3 pb-3 border-b border-border_color">
        <Text className="text-text_primary text-xl font-semibold">Perfil</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Info do usuário */}
        <View className="rounded-xl p-4 border border-white bg-bg_tertiary">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mb-3 bg-[#E94560]">
            <Text className="text-white text-lg font-bold">
              {currentUser?.name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text className="text-white text-base font-semibold">
            {currentUser?.name} {currentUser?.surname}
          </Text>
          <Text className="text-gray-400 text-sm mt-0.5">
            @{currentUser?.username}
          </Text>
        </View>

        {/* Configurações de notificação por servidor */}
        <Text className="text-text_primary text-xs font-medium px-1">
          NOTIFICAÇÕES POR SERVIDOR
        </Text>

        {activeSessions.map(server => (
          <TouchableOpacity
            key={server.id}
            onPress={() =>
              router.push({
                pathname: '/notifications-settings/[serverId]',
                params: { serverId: server.id },
              })
            }
            className="flex-row items-center rounded-xl p-4 border border-border_color bg-bg_primary">
            <View className="flex-1">
              <Text className="text-text_primary text-sm font-medium">
                {server.name}
              </Text>
              <Text className="text-text_secondary text-xs mt-0.5">
                {server.url.replace(/https?:\/\//, '')}
              </Text>
            </View>
            <Text className="text-text_primary text-xl">›</Text>
          </TouchableOpacity>
        ))}

        {/* Gerenciar servidores */}
        <Text className="text-text_primary text-xs font-medium px-1 mt-2">
          SERVIDORES
        </Text>

        {/* Gerenciar Servidores */}
        <TouchableOpacity
          onPress={() => router.push('/servers')}
          className="flex-row items-center rounded-xl p-4 border border-white bg-bg_tertiary">
          <Text className="flex-1 text-white text-sm">Gerenciar servidores</Text>
          <Text className="text-text_primary text-sm">›</Text>
        </TouchableOpacity>


        {/* Adicionar Sessão ao Dashboard */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          className="flex-row items-center rounded-xl p-4 border border-white bg-bg_tertiary">
          <Text className="flex-1 text-white text-sm">Adicionar servidores a esta sessão</Text>
          <Text className="text-text_primary text-sm">›</Text>
        </TouchableOpacity>

        {/* Sair */}
        <TouchableOpacity
          onPress={handleLogoutAll}
          className="rounded-xl p-4 items-center border border-white mt-2 bg-red"
          // style={{ borderColor: '#A32D2D', backgroundColor: '#3b1515' }}
        >
          <Text className="text-sm font-medium text-white">
            Sair de todos os servidores
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}