import { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Em produção envie para um serviço de monitoramento (Sentry, etc)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <SafeAreaView
          style={{ flex: 1, backgroundColor: '#1A1A2E' }}
          edges={['top']}
        >
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠️</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
              Algo deu errado
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              {this.state.error?.message ?? 'Erro inesperado'}
            </Text>
            <TouchableOpacity
              onPress={this.handleReset}
              style={{
                marginTop: 24,
                backgroundColor: '#E94560',
                borderRadius: 12,
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}