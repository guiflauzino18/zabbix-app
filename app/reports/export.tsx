import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReport } from '../../src/hooks/useReport';
import { useExport } from '../../src/hooks/useExport';
import type { ExportOptions } from '../../src/api/zabbix.types';

type ExportFormat = 'pdf' | 'csv' | 'json';

export default function ExportScreen() {
  const { data, period, activeSessions } = useReport();
  const { exportReport, isExporting } = useExport();

  const [format_, setFormat] = useState<ExportFormat>('pdf');
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [options, setOptions] = useState({
    includeSummary: true,
    includeTopHosts: true,
    includeAvailability: true,
    includeEventList: false,
  });

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleServer = (id: string) => {
    setSelectedServers(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  const handleExport = async () => {
    if (!data) return;

    const exportOptions: ExportOptions = {
      period,
      serverIds: selectedServers,
      format: format_,
      ...options,
    };

    await exportReport(data, exportOptions);
  };

  const periodStr = `${format(period.from, 'dd/MM/yyyy', { locale: ptBR })} – ${format(period.to, 'dd/MM/yyyy', { locale: ptBR })}`;

  return (
    <SafeAreaView className="flex-1 bg-zabbix-dark" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-zabbix-surface border-b border-zabbix-card">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-gray-400 text-sm">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-semibold">
          Exportar relatório
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Período atual */}
        <View
          className="rounded-xl p-3 border border-zabbix-card flex-row items-center"
          style={{ backgroundColor: '#16213E' }}
        >
          <View className="flex-1">
            <Text className="text-gray-500 text-xs">Período</Text>
            <Text className="text-gray-200 text-sm font-medium mt-0.5">
              {periodStr}
            </Text>
          </View>
          <Text className="text-gray-500 text-xs">{period.days} dias</Text>
        </View>

        {/* Filtro por servidor */}
        {activeSessions.length > 1 && (
          <>
            <Text className="text-gray-500 text-xs font-medium px-1">
              SERVIDORES
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                onPress={() => setSelectedServers([])}
                className="px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor: selectedServers.length === 0 ? '#E94560' : '#16213E',
                  borderColor: selectedServers.length === 0 ? '#E94560' : '#0F3460',
                }}
              >
                <Text
                  className="text-xs"
                  style={{ color: selectedServers.length === 0 ? '#fff' : '#9CA3AF' }}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {activeSessions.map(({ server }) => {
                const isSelected = selectedServers.includes(server.id);
                return (
                  <TouchableOpacity
                    key={server.id}
                    onPress={() => toggleServer(server.id)}
                    className="px-3 py-1.5 rounded-full border"
                    style={{
                      backgroundColor: isSelected ? '#E94560' : '#16213E',
                      borderColor: isSelected ? '#E94560' : '#0F3460',
                    }}
                  >
                    <Text
                      className="text-xs"
                      style={{ color: isSelected ? '#fff' : '#9CA3AF' }}
                    >
                      {server.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Conteúdo do relatório */}
        <Text className="text-gray-500 text-xs font-medium px-1">
          CONTEÚDO
        </Text>
        <View
          className="rounded-xl border border-zabbix-card overflow-hidden"
          style={{ backgroundColor: '#16213E' }}
        >
          {[
            { key: 'includeSummary', label: 'Resumo de problemas' },
            { key: 'includeTopHosts', label: 'Top hosts afetados' },
            { key: 'includeAvailability', label: 'Métricas de disponibilidade' },
            { key: 'includeEventList', label: 'Lista detalhada de eventos' },
          ].map(({ key, label }, index, arr) => {
            const isEnabled = options[key as keyof typeof options];
            return (
              <TouchableOpacity
                key={key}
                onPress={() => toggleOption(key as keyof typeof options)}
                className="flex-row items-center px-4 py-3"
                style={{
                  borderBottomWidth: index < arr.length - 1 ? 0.5 : 0,
                  borderBottomColor: '#0F3460',
                }}
              >
                <Text className="flex-1 text-gray-200 text-sm">{label}</Text>
                {/* Checkbox customizado */}
                <View
                  className="w-5 h-5 rounded items-center justify-center"
                  style={{
                    backgroundColor: isEnabled ? '#E94560' : '#0F3460',
                    borderWidth: isEnabled ? 0 : 0.5,
                    borderColor: '#1e3a6e',
                  }}
                >
                  {isEnabled && (
                    <Text className="text-white text-xs font-bold">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Formato */}
        <Text className="text-gray-500 text-xs font-medium px-1">
          FORMATO
        </Text>
        <View className="flex-row gap-2">
          {(['pdf', 'csv', 'json'] as ExportFormat[]).map(fmt => (
            <TouchableOpacity
              key={fmt}
              onPress={() => setFormat(fmt)}
              className="flex-1 py-3 rounded-xl items-center border"
              style={{
                backgroundColor: format_ === fmt ? '#E94560' : '#16213E',
                borderColor: format_ === fmt ? '#E94560' : '#0F3460',
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: format_ === fmt ? '#fff' : '#9CA3AF' }}
              >
                {fmt.toUpperCase()}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: format_ === fmt ? '#ffcdd2' : '#6B7280' }}
              >
                {fmt === 'pdf' ? 'Formatado'
                  : fmt === 'csv' ? 'Planilha'
                  : 'Dados brutos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botões de ação */}
        <TouchableOpacity
          onPress={handleExport}
          disabled={isExporting || !data}
          className="rounded-xl py-4 items-center"
          style={{
            backgroundColor: isExporting || !data ? '#4B5563' : '#E94560',
          }}
        >
          {isExporting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-semibold">Gerando...</Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-base">
              Gerar e compartilhar
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}