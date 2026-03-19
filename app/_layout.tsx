import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/auth.store';
import { useServersStore } from '../src/stores/servers.store';
import '../global.css'; // nativewind
import { View } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const loadSessions = useAuthStore((s) => s.loadSessions);
  const loadServers = useServersStore((s) => s.loadServers);

  useEffect(() => {
    loadSessions();
    loadServers();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <View className='flex-1 dark'>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </QueryClientProvider>
  );
}