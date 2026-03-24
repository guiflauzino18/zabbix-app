import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/auth.store';
import { useServersStore } from '../src/stores/servers.store';
import '../global.css'; // nativewind
import { View } from 'react-native';
import { useNotificationsStore } from '@/stores/notifications.store';
import { useThemeStore } from '@/stores/theme.store';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 0, // staleTime por tipo de dado — dados que mudam pouco ficam em cache mais tempo
      gcTime: 5 * 60_000,       // mantém no cache por 5min após desmontar
      refetchOnMount: true,
      refetchOnWindowFocus: false, // evita refetch agressivo ao voltar para o app
      refetchOnReconnect: true,   // mas sempre refaz ao reconectar a rede
    },
    mutations: {
      retry: 1
    }
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <View id='root-view' className={`flex-1 ${mode === 'dark' ? 'dark' : 'root'}`}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}