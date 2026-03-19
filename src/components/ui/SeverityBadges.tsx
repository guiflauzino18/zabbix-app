import { View, Text } from 'react-native';
import { SEVERITY_LABELS, SEVERITY_COLORS, SEVERITY_BG, type ZabbixSeverity } from '../../api/zabbix.types';

interface Props {
  severity: ZabbixSeverity;
  size?: 'sm' | 'md';
}

export function SeverityBadge({ severity, size = 'md' }: Props) {
  const label = SEVERITY_LABELS[severity];
  const color = SEVERITY_COLORS[severity];
  const bg = SEVERITY_BG[severity];

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: size === 'sm' ? 6 : 8,
        paddingVertical: size === 'sm' ? 2 : 3,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: color + '60',
      }}
    >
      <Text
        style={{
          color,
          fontSize: size === 'sm' ? 9 : 11,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </View>
  );
}