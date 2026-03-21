import { useState } from 'react';
import { View, Text, FlatList, TextInput, RefreshControl, ActivityIndicator, SectionList, TouchableOpacity, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHosts } from '../../src/hooks/useHosts';
import { HostCard } from '../../src/components/HostCard';
import { ServerSelector } from '../../src/components/ServerSelector';
import { useHostGroups } from '@/hooks/useHostGroups';

export default function HostsScreen() {
  const [selectedServerId, setSelectedServerId] = useState<'all' | string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  let [search, setSearch] = useState('');

  const {
    hostsWithProblems,
    hostsWithoutProblems,
    isLoading,
    isRefetching,
    refetch,
    totalCount,
  } = useHosts({ selectedServerId, groupId: selectedGroupId, search });

  const { groups } = useHostGroups(selectedServerId);

  // Monta as seções para o SectionList
  // Hosts com problema ficam no topo para atenção imediata
  const sections = [...(hostsWithProblems.length > 0
      ? [{ title: `Com problemas · ${hostsWithProblems.length}`, data: hostsWithProblems, hasProblems: true }]
      : []),
    ...(hostsWithoutProblems.length > 0
      ? [{ title: `Sem problemas · ${hostsWithoutProblems.length}`, data: hostsWithoutProblems, hasProblems: false }]
      : []),
  ];

  const renderHeader = () => (
    <View className='bg-bg_primary rounded-sm m-2'>
      {/* Header com título e contagem total */}
      <View className="px-4 mx-2 rounded-sm pt-3 pb-3 border-b border-border_color">
        <View className="flex-row justify-between items-center">
          <Text className="text-text_primary text-xl font-semibold">Hosts</Text>
          <Text className="text-text_primary text-sm">{totalCount} hosts</Text>
        </View>

        {/* Campo de busca */}
        <View className="flex-row items-center gap-2 rounded-xl px-3 mt-3 border border-white bg-bg_tertiary">

          {/* <Text style={{ color: '#6B7280', fontSize: 14 }}>🔍</Text> */}

          <TextInput
            className="flex-1 text-white text-sm placeholder:text-text_primary"
            placeholder="Buscar host ou IP..."
            // value={search}
            returnKeyType='search'
            onSubmitEditing={(e) => setSearch(e.nativeEvent.text)}
            submitBehavior='submit'
            autoCapitalize="none"
            autoCorrect={false}
          />
          {/* Botão para limpar busca */}
          {search.length > 0 && (
            <Text className="text-white text-md px-1" onPress={() => setSearch('')} >✕ </Text>
          )}
        </View>
      </View>

      {/* Seletor de servidor */}
      <View className="pt-3">
        <ServerSelector selected={selectedServerId} onSelect={setSelectedServerId} />
      </View>

      {/* Chips de grupos */}
      {groups.length > 0 && (
        <FlatList
          horizontal
          data={[{ groupid: 'all', name: 'Todos' }, ...groups]}
          keyExtractor={(item, index) => `chip_${item.groupid}_${index}`} //prefixo para evitar colisão em grupos com mesmo id em mais de um servidor cliente
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-1.5 px-4 py-2"
          renderItem={({ item }) => {
            const isActive = selectedGroupId === item.groupid;
            return (
              <TouchableOpacity
                className={`px-3 py-1.5 rounded-full border 
                  ${isActive 
                    ? 'bg-bg_tertiary border-border_color'
                    : 'border-border_color bg-bg_primary'}`
                }
                // style={!isActive ? { backgroundColor: '#0F3460' } : undefined}
                onPress={() => setSelectedGroupId(item.groupid)}
              >
                <Text className={`text-xs ${isActive ? 'text-white font-semibold' : 'text-text_primary'}`}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg_secondary">
        {renderHeader()}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E94560" size="large" />
          <Text className="text-text_primary text-sm mt-3">Carregando hosts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg_secondary" edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `host_${item.serverId}_${item.hostid}_${index}` }
        renderItem={({ item, section }) => (
          <View className="px-4">
            <HostCard host={item} showServer={selectedServerId === 'all'} 
              // Conta quantos problemas esse host específico tem
              problemCount={section.hasProblems ? 1 : 0}
            />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View className="px-4 py-1.5">
            <Text
              className="text-xs font-medium"
              style={{
                // Seção com problemas em vermelho, sem problemas em cinza
                color: section.hasProblems ? '#E45959' : '#6B7280',
              }}
            >
              {section.title.toUpperCase()}
            </Text>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View className="items-center py-12 px-8">
            <Text className="text-text_primary text-base font-medium text-center">
              Nenhum host encontrado
            </Text>
            <Text className="text-text_primary text-sm text-center mt-1.5">
              {search ? 'Tente outro termo de busca' : 'Nenhum host disponível'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#E94560"
            colors={['#E94560']}
          />
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}