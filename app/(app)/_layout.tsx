import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';

export default function AppLayout() {
  const { sessions, isLoading } = useAuthStore();
  const hasSession = Object.keys(sessions).length > 0;

  if (!isLoading && !hasSession) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}