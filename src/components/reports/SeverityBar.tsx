import { View, Text } from 'react-native';
import { SEVERITY_LABELS, SEVERITY_COLORS, type ZabbixSeverity } from '../../api/zabbix.types';

interface Props {
  severity: ZabbixSeverity;
  count: number;
  maxCount: number;
}

export function SeverityBar({ severity, count, maxCount }: Props) {
  const color = SEVERITY_COLORS[severity];
  const label = SEVERITY_LABELS[severity];
  // Calcula a largura da barra proporcional ao máximo
  const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <View className="flex-row items-center gap-2 mb-1.5">
      {/* Label alinhado à direita com largura fixa */}
      <Text
        className="text-text_primary text-xs text-right"
        style={{ width: 72 }}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Trilha da barra */}
      <View
        className="flex-1 rounded-full overflow-hidden bg-bg_tertiary h-2"
        // style={{ height: 6, backgroundColor: '#0F3460' }}
      >
        <View
          style={{
            height: 6,
            width: `${widthPct}%`,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>

      {/* Contagem */}
      <Text
        className="text-text_primary text-xs text-right"
        style={{ width: 24 }}
      >
        {count}
      </Text>
    </View>
  );
}