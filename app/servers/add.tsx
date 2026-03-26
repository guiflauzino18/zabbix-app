import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useServersStore } from '../../src/stores/servers.store';
import { zabbixRequest } from '../../src/api/zabbix.client';

const serverSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  url: z
    .string()
    .min(1, 'URL obrigatória')
    .refine(
      (v) => /^https?:\/\/.+/.test(v),
      'URL deve começar com http:// ou https://',
    ),
});

type ServerForm = z.infer<typeof serverSchema>;

export default function AddServerScreen() {
  const { addServer } = useServersStore();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    version?: string;
  } | null>(null);

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<ServerForm>({
    resolver: zodResolver(serverSchema),
    defaultValues: { name: '', url: 'https://' },
  });

  const testConnection = async () => {
    const { url } = getValues();
    if (!url || !/^https?:\/\/.+/.test(url)) {
      setTestResult({ ok: false, message: 'URL inválida' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const version = await zabbixRequest<string>(url, 'apiinfo.version', {});
      setTestResult({
        ok: true,
        message: `Conexão bem-sucedida!`,
        version,
      });
    } catch {
      setTestResult({
        ok: false,
        message: 'Não foi possível conectar. Verifique a URL e a rede.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = (data: ServerForm) => { 
    addServer({ name: data.name.toUpperCase(), url: data.url.replace(/\/$/, ''), isActive: true, apiVersion: testResult?.version, });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg_primary"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-14 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-text_primary text-base">← Voltar</Text>
        </TouchableOpacity>

            

          <Text className="text-text_primary text-2xl font-bold mb-2">Novo servidor</Text>
          <Text className="text-text_primary text-sm mb-8">
            Configure a conexão com o seu servidor Zabbix
          </Text>

          {/* Nome */}
          <View className="mb-4">
            <Text className="text-text_primary text-sm font-medium mb-2">Nome</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  className="bg-zabbix-surface border rounded-xl px-4 py-3.5 text-primary text-base"
                  placeholder="Ex: Produção"
                  placeholderTextColor="#5d6776"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />
            {errors.name && (
              <Text className="text-red text-xs mt-1">{errors.name.message}</Text>
            )}
          </View>

          {/* URL */}
          <View className="mb-6">
            <Text className="text-text_primary text-sm font-medium mb-2">URL do servidor</Text>
            <Controller
              control={control}
              name="url"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  className="bg-zabbix-surface border rounded-xl px-4 py-3.5 text-text_primary text-base"
                  placeholder="https://zabbix.empresa.com"
                  placeholderTextColor="#4B5563"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />
            {errors.url && (
              <Text className="text-red text-xs mt-1">{errors.url.message}</Text>
            )}
          </View>

          {/* Testar conexão */}
          <Pressable
            onPress={testConnection}
            disabled={isTesting}
            className="border border-zabbix-card rounded-xl py-3.5 items-center mb-4"
          >
            {isTesting ? (
              <ActivityIndicator color="#9CA3AF" size="small" />
            ) : (
              <Text className="text-text_primary font-medium">Testar conexão</Text>
            )}
          </Pressable>

          {testResult && (
            <View
              className={`rounded-xl px-4 py-3 mb-6 border ${
                testResult.ok
                  ? 'border-success'
                  : 'border-red'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  testResult.ok ? 'text-success' : 'text-red'
                }`}
              >
                {testResult.message}
              </Text>
              {testResult.version && (
                <Text className="text-text_primary text-xs mt-1">
                  Zabbix API versão {testResult.version}
                </Text>
              )}
            </View>
          )}

          {/* Salvar */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            className="bg-text_secondary rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold text-base">Salvar servidor</Text>
          </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}