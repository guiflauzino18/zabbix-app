import { View, Text, ActivityIndicator } from 'react-native';
import Svg, { Polyline, Path, Line, Text as SvgText } from 'react-native-svg';
import { useItemHistory } from '../hooks/useHostDetail';

interface Props {
  serverUrl: string;
  token: string;
  itemid: string;
  valueType: string;
  itemName: string;
  units: string;
  hours?: number;
}

export function MiniChart({
  serverUrl,
  token,
  itemid,
  valueType,
  itemName,
  units,
  hours = 3,
}: Props) {
  const { data: history, isLoading } = useItemHistory(
    serverUrl,
    token,
    itemid,
    valueType,
    hours,
  );

  if (isLoading) {
    return (
      <View
        className="rounded-xl p-3 border border-zabbix-card items-center justify-center"
        style={{ backgroundColor: '#16213E', height: 100 }}
      >
        <ActivityIndicator color="#E94560" size="small" />
      </View>
    );
  }

  if (!history || history.length < 2) {
    return (
      <View
        className="rounded-xl p-3 border border-zabbix-card items-center justify-center"
        style={{ backgroundColor: '#16213E', height: 100 }}
      >
        <Text className="text-gray-600 text-xs">Sem dados históricos</Text>
      </View>
    );
  }

  // Converte os valores para números e calcula min/max para normalização
  const values = history.map(h => parseFloat(h.value));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1; // evita divisão por zero

  const W = 280; // largura do SVG
  const H = 50;  // altura útil do gráfico
  const PAD = 4; // padding interno

  // Mapeia cada ponto para coordenadas (x, y) do SVG
  const points = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    // Inverte Y pois SVG cresce para baixo
    const y = PAD + H - ((v - minVal) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pointsStr = points.join(' ');

  // Cria o path de área preenchida abaixo da linha
  const areaPath = `M${points[0]} L${points.join(' L')} L${W - PAD},${H + PAD} L${PAD},${H + PAD} Z`;

  // Valor atual (último da série)
  const currentValue = values[values.length - 1];
  const displayValue = currentValue < 10
    ? currentValue.toFixed(2)
    : currentValue.toFixed(1);

  return (
    <View
      className="rounded-xl p-3 border border-zabbix-card"
      style={{ backgroundColor: '#16213E' }}
    >
      {/* Cabeçalho do gráfico com nome e valor atual */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-gray-400 text-xs flex-1" numberOfLines={1}>
          {itemName} · últimas {hours}h
        </Text>
        <Text className="text-blue-400 text-xs font-medium ml-2">
          {displayValue}{units}
        </Text>
      </View>

      {/* SVG do gráfico */}
      <Svg width="100%" height={H + PAD * 2} viewBox={`0 0 ${W} ${H + PAD * 2}`}>
        {/* Área preenchida sob a linha */}
        <Path d={areaPath} fill="#E94560" fillOpacity={0.08} />
        {/* Linha principal */}
        <Polyline
          points={pointsStr}
          fill="none"
          stroke="#E94560"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Linha de threshold (80% do máximo) — referência visual */}
        <Line
          x1={PAD}
          y1={PAD + H * 0.2}
          x2={W - PAD}
          y2={PAD + H * 0.2}
          stroke="#E45959"
          strokeWidth="0.5"
          strokeDasharray="4,3"
          opacity={0.4}
        />
        {/* Label do máximo */}
        <SvgText
          x={PAD + 2}
          y={PAD + H * 0.2 - 2}
          fill="#E45959"
          fontSize={8}
          opacity={0.6}
        >
          {maxVal.toFixed(0)}{units}
        </SvgText>
      </Svg>
    </View>
  );
}