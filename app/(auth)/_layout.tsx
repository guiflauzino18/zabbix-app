import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';

export default function AuthLayout() {
  const { sessions, isLoading } = useAuthStore();
  const hasSession = Object.keys(sessions).length > 0;

  if (!isLoading && hasSession) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}