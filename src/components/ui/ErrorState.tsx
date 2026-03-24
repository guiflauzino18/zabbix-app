import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Erro ao carregar dados',
  onRetry,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Text className="text-3xl mb-3">📡</Text>
      <Text className="text-text_primary text-base font-medium text-center">
        {message}
      </Text>
      <Text className="text-text_primarytext-sm text-center mt-1.5">
        Verifique sua conexão com o servidor
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="mt-5 px-6 py-3 rounded-xl"
          style={{ backgroundColor: '#E94560' }}
        >
          <Text className="text-text_primary font-medium">Tentar novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}