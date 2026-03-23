import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/auth.store';
import { useServersStore } from '../src/stores/servers.store';
import '../global.css'; // nativewind
import { View } from 'react-native';
import { useNotificationsStore } from '@/stores/notifications.store';
import { useThemeStore } from '@/stores/theme.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnMount: true, // sempre refetch ao montar
      refetchOnWindowFocus: true,
    },
  },
});

export default function RootLayout() {
  const loadSessions = useAuthStore((s) => s.loadSessions);
  const loadServers = useServersStore((s) => s.loadServers);
  const {mode} = useThemeStore()

  useEffect(() => {
    loadSessions();
    loadServers();
    // Carrega notificações e configurações persistidas
    useNotificationsStore.getState().load();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <View id='root-view' className={`flex-1 ${mode === 'dark' ? 'dark' : 'root'}`}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </QueryClientProvider>
  );
}