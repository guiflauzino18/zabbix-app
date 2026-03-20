import { useState } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationsStore } from '../../src/stores/notifications.store';
import { useServersStore } from '../../src/stores/servers.store';
import {
  SEVERITY_LABELS, SEVERITY_COLORS,
  type ZabbixSeverity, type NotificationSettings,
} from '../../src/api/zabbix.types';

// Severidades exibidas na tela de configuração (da mais grave para a menos)
const SEVERITY_OPTIONS: ZabbixSeverity[] = [5, 4, 3, 2, 1];

export default function NotificationSettingsScreen() {
  const { serverId } = useLocalSearchParams<{ serverId: string }>();
  const { servers } = useServersStore();
  const { getSettings, saveSettings } = useNotificationsStore();

  const server = servers.find(s => s.id === serverId);

  // Inicializa o estado local com as configurações salvas (ou padrão)
  const [settings, setSettings] = useState<NotificationSettings>(
    getSettings(serverId),
  );

  // Helper para atualizar um campo específico das configurações
  const update = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Helper para atualizar a configuração de uma severidade específica
  const updateSeverity = (severity: ZabbixSeverity, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      severities: { ...prev.severities, [severity]: value },
    }));
  };

  const handleSave = async () => {
    await saveSettings(settings);
    Alert.alert('Salvo', 'Configurações salvas com sucesso.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg_secondary" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-bg_primary border-b border-border_color">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-text_primary text-md">← Voltar</Text>
        </TouchableOpacity>

        <View>
          <Text className="text-text_primary text-base font-semibold flex-1" numberOfLines={1}>
            Notificações · {server?.name ?? serverId}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção: Geral */}
        <SectionLabel label="Geral" />

        <SettingRow
          label="Ativar notificações"
          description="Receber alertas deste servidor"
          value={settings.enabled}
          onValueChange={v => update('enabled', v)}
        />
        <SettingRow
          label="Som de alerta"
          description="Toque ao receber notificação"
          value={settings.sound}
          onValueChange={v => update('sound', v)}
          disabled={!settings.enabled}
        />
        <SettingRow
          label="Vibração"
          description="Vibrar ao receber notificação"
          value={settings.vibration}
          onValueChange={v => update('vibration', v)}
          disabled={!settings.enabled}
        />

        {/* Seção: Severidades */}
        <SectionLabel label="Severidades" />
        <View
          className="mx-4 rounded-xl border border-border_color overflow-hidden bg-bg_tertiary">
          {SEVERITY_OPTIONS.map((sev, index) => {
            const color = SEVERITY_COLORS[sev];
            const label = SEVERITY_LABELS[sev];
            const isLast = index === SEVERITY_OPTIONS.length - 1;

            return (
              <View
                key={sev}
                className={`flex-row items-center px-4 py-3 ${!isLast ? 'border-b border-border_color' : ''}`}
              >
                {/* Ponto colorido da severidade */}
                <View
                  className="w-2 h-2 rounded-full mr-3"
                  style={{ backgroundColor: color }}
                />
                <Text className="flex-1 text-text_primary text-sm">{label}</Text>
                <Switch
                  value={settings.severities[sev]}
                  onValueChange={v => updateSeverity(sev, v)}
                  disabled={!settings.enabled}
                  trackColor={{ false: '#0F3460', true: '#E94560' }}
                  thumbColor="#ffffff"
                />
              </View>
            );
          })}
        </View>

        {/* Seção: Horário silencioso */}
        <SectionLabel label="Horário silencioso" />

        <SettingRow
          label="Não perturbe"
          description={`${settings.quietHoursStart} – ${settings.quietHoursEnd}`}
          value={settings.quietHoursEnabled}
          onValueChange={v => update('quietHoursEnabled', v)}
          disabled={!settings.enabled}
        />

        {/* Seletores de horário — só aparecem se ativado */}
        {settings.quietHoursEnabled && settings.enabled && (
          <View className="mx-4 mt-2 flex-row gap-3">
            <TimeSelector
              label="Início"
              value={settings.quietHoursStart}
              // Opções de hora em intervalos de 30min
              options={generateTimeOptions()}
              onSelect={v => update('quietHoursStart', v)}
            />
            <TimeSelector
              label="Fim"
              value={settings.quietHoursEnd}
              options={generateTimeOptions()}
              onSelect={v => update('quietHoursEnd', v)}
            />
          </View>
        )}

        {/* Botão salvar */}
        <TouchableOpacity
          onPress={handleSave}
          className="mx-4 mt-6 rounded-xl py-4 items-center bg-text_secondary"
        >
          <Text className="text-white font-semibold text-base">
            Salvar configurações
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente auxiliar: label de seção
function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-text_primary text-xs font-medium px-4 pt-5 pb-2">
      {label.toUpperCase()}
    </Text>
  );
}

// Componente auxiliar: linha de configuração com Switch
function SettingRow({ label, description, value, onValueChange, disabled = false } : {label: string; description?: string; value: boolean; onValueChange: (v: boolean) => void;disabled?: boolean; }) {
  return (
    <View
      className="flex-row items-center px-4 py-3 mx-4 mb-1 rounded-xl border border-border_color bg-bg_tertiary"
      style={{opacity: disabled ? 0.5 : 1 }}
    >
      <View className="flex-1">
        <Text className="text-text_primary text-sm">{label}</Text>
        {description && (
          <Text className="text-text_primary text-xs mt-0.5">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#0F3460', true: '#E94560' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

// Componente auxiliar: seletor de horário
function TimeSelector({label,value,options,onSelect,}: {label: string;value: string;options: string[];onSelect: (v: string) => void}) {
  return (
    <View
      className="flex-1 rounded-xl border border-border_color p-3 bg-bg_tertiary">
      <Text className="text-text_primary text-xs mb-2">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5">
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              className="px-2.5 py-1.5 rounded-lg"
              style={{
                backgroundColor: value === opt ? '#E94560' : '#0F3460',
              }}
            >
              <Text className="text-xs font-medium" style={{ color: value === opt ? '#fff' : '#9CA3AF' }} >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Gera opções de horário de 00:00 a 23:30 em intervalos de 30min
function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      options.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      );
    }
  }
  return options;
}