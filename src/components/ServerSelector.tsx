import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { useActiveSessions } from '../hooks/useActiveSessions';

interface Props {
  selected: 'all' | string;
  onSelect: (id: 'all' | string) => void;
}

export function ServerSelector({ selected, onSelect }: Props) {
  const activeSessions = useActiveSessions();

  if (activeSessions.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-1.5 px-4 pb-1"
    >
      <Chip label="Todos" isActive={selected === 'all'} onPress={() => onSelect('all')} />
      {activeSessions.map(({ server }) => (
        <Chip
          key={server.id}
          label={server.name}
          isActive={selected === server.id}
          onPress={() => onSelect(server.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3.5 py-1.5 rounded-full border ${
        isActive
          ? 'bg-text_secondary border-text_secondary'
          : 'bg-bg_primary border-border'
      }`}
    >
      <Text
        className={`text-xs ${isActive ? 'text-white font-semibold' : 'text-primary'}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}