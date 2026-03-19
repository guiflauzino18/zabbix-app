import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../src/hooks/useAuth';
import { useServersStore } from '../../src/stores/servers.store';
import type { ZabbixServer } from '../../src/api/zabbix.types';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuário obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { servers } = useServersStore();
  const { login, isLoggingIn, loginError } = useAuth();
  const { removeServer } = useServersStore()
  const [selectedServer, setSelectedServer] = useState<ZabbixServer | null>(
    servers[0] ?? null,
  );

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
          contentContainerClassName="flex-grow justify-center px-4 py-12"
          keyboardShouldPersistTaps="handled"
        >
            {/* Logo / Header */}
            <View className="items-center mb-10 bg-red rounded-md p-4">
              <Text className="text-white text-3xl font-bold">Zabbix App</Text>
            </View>

            {/* Seletor de Servidor */}
            <View className="mb-6">
              <Text className="text-text_primary text-sm font-medium mb-2">Servidor</Text>

              {servers.length === 0 ? (
                <View className="border border-border rounded-xl p-4">
                  <Text className="text-text_primary text-center text-sm">
                    Nenhum servidor configurado
                  </Text>
                  <Link href="/servers/add" asChild>
                    <TouchableOpacity className="mt-3 text-secondary rounded-lg py-2">
                      <Text className="text-text_primary text-center font-medium text-sm">
                        + Adicionar servidor
                      </Text>
                    </TouchableOpacity>
                  </Link>
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
        </ScrollView>
      
    </KeyboardAvoidingView>
  );
}