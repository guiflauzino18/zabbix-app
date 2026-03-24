import { View, Text } from 'react-native';

interface Props {
  label: string;
  value: string;
  valueColor: string;
  trend?: number;        // positivo = subiu, negativo = caiu
  trendGoodWhenDown?: boolean; // true para métricas onde queda é boa (ex: problemas)
  subtitle?: string;
}

export function MetricCard({
  label, value, valueColor, trend, trendGoodWhenDown, subtitle,
}: Props) {
  // Determina se a tendência é positiva ou negativa visualmente
  const trendIsGood = trend !== undefined
    ? (trendGoodWhenDown ? trend < 0 : trend > 0)
    : null;

  const trendColor = trendIsGood === null
    ? '#6B7280'
    : trendIsGood ? '#4ade80' : '#E45959';

  const trendArrow = trend !== undefined
    ? (trend > 0 ? '▲' : '▼')
    : '';

  return (
    <View
      className="flex-1 rounded-xl p-3 border border-border_color bg-bg_primary"
      // style={{ backgroundColor: '#16213E' }}
    >
      <Text className="text-text_primary text-xs mb-1">{label}</Text>

      <Text className="text-2xl font-semibold" style={{ color: valueColor }} >
        {value}
      </Text>

      {/* Indicador de tendência */}
      {trend !== undefined && (
        <Text style={{ color: trendColor, fontSize: 10, marginTop: 2 }}>
          {trendArrow} {Math.abs(trend).toFixed(1)}% vs anterior
        </Text>
      )}
      {subtitle && !trend && (
        <Text className="text-text_primary text-xs mt-0.5">{subtitle}</Text>
      )}
    </View>
  );
}