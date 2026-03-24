import { TouchableOpacity, Text, View } from 'react-native';
import { SEVERITY_COLORS, SEVERITY_LABELS, type ZabbixSeverity } from '../../api/zabbix.types';

interface Props {
  severity: ZabbixSeverity;
  count: number;
  isActive: boolean;
  onPress: () => void;
}

export function SeverityCounter({ severity, count, isActive, onPress }: Props) {
  const color = SEVERITY_COLORS[severity];
  const label = SEVERITY_LABELS[severity];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: isActive ? color + '20' : '#0A466A', 
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        borderWidth: isActive ? 1 : 0.5,
        borderColor: isActive ? color : '#0F3460',
      }}
    >
      <Text style={{ color, fontSize: 22, fontWeight: '600' }}>
        {count}
      </Text>
      <Text style={{ color: '#9CA3AF', fontSize: 8, marginTop: 2, textAlign: 'center' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}