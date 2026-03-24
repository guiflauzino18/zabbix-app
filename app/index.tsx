import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';

export default function Index() {
  const { sessions, isLoading } = useAuthStore();

  // Aguarda carregar as sessões do SecureStore
  if (isLoading) return null;

  const hasSession = Object.keys(sessions).length > 0;

  // Redireciona baseado no estado de autenticação
  return hasSession
    ? <Redirect href="/(app)/dashboard" />
    : <Redirect href="/(auth)/login" />;
}