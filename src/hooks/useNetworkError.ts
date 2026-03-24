import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// Instal: npx expo install @react-native-community/netinfo

export function useNetworkError() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Quando a conexão voltar, invalida todas as queries
    // para buscar dados atualizados imediatamente
    const unsubscribe = NetInfo.addEventListener((state: { isConnected: any; isInternetReachable: any; }) => {
      if (state.isConnected && state.isInternetReachable) {
        queryClient.invalidateQueries();
      }
    });

    return () => unsubscribe();
  }, [queryClient]);
}