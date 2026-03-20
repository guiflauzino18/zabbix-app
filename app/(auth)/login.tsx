import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
  Pressable,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../src/hooks/useAuth';
import { useServersStore } from '../../src/stores/servers.store';
import type { ZabbixServer } from '../../src/api/zabbix.types';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuário obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { servers } = useServersStore();
  const { sessions } = useAuthStore();
  const { login, isLoggingIn, loginError } = useAuth();
  const { removeServer } = useServersStore()

  // Servidores que ainda NÃO têm sessão ativa
  // Não faz sentido logar novamente em um servidor já autenticado
  const availableServers = servers.filter(s => !sessions[s.id]);

  const [selectedServer, setSelectedServer] = useState<ZabbixServer | null>(
    availableServers[0] ?? null
  );

  // Detecta se já há sessões ativas (modo adicionar servidor)
  const hasExistingSessions = Object.keys(sessions).length > 0;

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    if (!selectedServer) {
      Alert.alert('Atenção', 'Selecione um servidor antes de continuar.');
      return;
    }
    await login(selectedServer, data.username, data.password);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg_primary"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
        
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-between px-4 py-12"
          keyboardShouldPersistTaps="handled"
        >

            <View>
              {/* Botão voltar — só aparece se já há sessões ativas */}
              {hasExistingSessions && (
                <TouchableOpacity
                  onPress={() => router.replace('/(app)/dashboard')}
                  className="mb-6"
                >
                  <Text className="text-text_primary text-sm">← Voltar ao dashboard</Text>
                </TouchableOpacity>
              )}
              
            </View>

            <View className='flex-1'>

              {/* Logo / Header */}
              <View className="items-center mb-10 bg-red rounded-md p-4">
                <Text className="text-white text-3xl font-bold">Zabbix App</Text>
              </View>


              {/* Seletor de Servidor */}
              <View className="mb-6">
                <Text className="text-text_primary text-sm font-medium mb-2">Servidor</Text>

                {availableServers.length === 0 ? (
                <View className="bg-bg_primary border border-border_color rounded-xl p-4">

                  {servers.length === 0 ? (
                    <>
                      <Text className="text-text_primary text-center text-sm">
                        Nenhum servidor configurado
                      </Text>
                      <Link href="/servers/add" asChild>
                        <TouchableOpacity className="mt-3 bg-bg_tertiary rounded-lg py-2">
                          <Text className="text-white text-center font-medium text-sm">
                            + Adicionar servidor
                          </Text>
                        </TouchableOpacity>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Text className="text-text_primary text-center text-sm">
                        Todos os servidores já estão autenticados
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.replace('/(app)/dashboard')}
                        className="mt-3 bg-bg_text_secondary rounded-lg py-2"
                      >
                        <Text className="text-white text-center font-medium text-sm">
                          Ir para o dashboard
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
            ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {servers.map((server) => (
                        <Pressable
                          key={server.id}
                          onPress={() => setSelectedServer(server)}
                          onLongPress={()=>removeServer(server.id)}
                          className={`px-4 py-3 rounded-xl border ${
                            selectedServer?.id === server.id
                              ? 'bg-text_secondary text-white'
                              : 'bg-white text-text_primary'
                          }`}
                        >
                          <Text
                            className={`font-medium text-sm ${
                              selectedServer?.id === server.id
                                ? 'text-white'
                                : 'text-text_primary'
                            }`}
                          >
                            {server.name}
                          </Text>
                          <Text className={`text-xs mt-0.5 
                              ${selectedServer?.id === server.id 
                                ? 'text-white' 
                                : 'text-text_primary'}`}>

                            {server.url.replace(/https?:\/\//, '')}
                          </Text>
                        </Pressable>
                      ))}


                      <Link href="/servers/add" asChild>
                        <TouchableOpacity className="px-4 py-3 rounded-xl border border-dashed border-gray-600 items-center justify-center">
                          <Text className="text-text_primary text-sm">+ Novo</Text>
                        </TouchableOpacity>
                      </Link>
                    </View>
                  </ScrollView>
                )}
              </View>

              {/* Campos só aparecem se há servidor disponível para autenticar */}
              {availableServers.length > 0 && (
                <>

                {/* Campo Usuário */}
                <View className="mb-4">
                  <Text className="text-text_primary text-sm font-medium mb-2">Usuário</Text>
                  <Controller
                    control={control}
                    name="username"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <TextInput
                        className="border border-border rounded-xl px-4 py-3.5 text-text_primary text-base"
                        placeholder="Admin"
                        placeholderTextColor="#5f6773"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                      />
                    )}
                  />
                  {errors.username && (
                    <Text className="text-red text-xs mt-1">{errors.username.message}</Text>
                  )}
                </View>

                {/* Campo Senha */}
                <View className="mb-6">
                  <Text className="text-text_primary text-sm font-medium mb-2">Senha</Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <TextInput
                        className="border border-border rounded-xl px-4 py-3.5 text-text_primary text-base"
                        placeholder="••••••••"
                        placeholderTextColor="#4B5563"
                        secureTextEntry
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                      />
                    )}
                  />
                  {errors.password && (
                    <Text className="text-red text-xs mt-1">{errors.password.message}</Text>
                  )}
                </View>

                {/* Erro da API */}
                {loginError && (
                  <View className="bg-red border border-red rounded-xl px-4 py-3 mb-4">
                    <Text className="text-white text-center text-sm">{loginError}</Text>
                  </View>
                )}

                {/* Botão Login */}
                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoggingIn}
                  className={`rounded-md py-4 items-center bg-text_secondary
                  }`}
                >
                  {isLoggingIn 
                    ? (
                      <ActivityIndicator />
                    )
                    : (
                      <Text className="text-white font-semibold text-base">Entrar</Text>
                  )}
                </Pressable>

              </>
            )}
          </View>
        </ScrollView>
      
    </KeyboardAvoidingView>
  );
}