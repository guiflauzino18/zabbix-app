import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, router, Label, Color, Icon, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServersStore } from '../../src/stores/servers.store';
import { SEVERITY_COLORS, TriggerItem, type ZabbixSeverity } from '../../src/api/zabbix.types';
import { SeverityBadge } from '@/components/ui/SeverityBadges';
import React, { Key, useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { acknowledgeProblems, closeProblem, fetchProblemsWithHosts, suppressProblems, SuppressProblemsOptions, unsuppressProblems } from '@/services/problems.service';
import ModalAcknowledge, { ModalKnowledgeProps } from '@/components/ModalAcknowledge';
import { ErrorState } from '@/components/ui/ErrorState';
import { fetchTriggerItems } from '@/services/trigger.service';


function formatDate(clock: string) {
  return new Date(parseInt(clock) * 1000).toLocaleString('pt-BR');
}

export default function ProblemDetailScreen() {
  const { id, serverId } = useLocalSearchParams<{ id: string; serverId: string }>();
  const { session } = useAuthStore(s => s.getSession(serverId)!);
  const { servers } = useServersStore();
  const queryClient = useQueryClient();
  const [modalAcknowledge, setModalAcknowledge] = useState<ModalKnowledgeProps>({type: 'suppressed', visible: false, onCancel: ()=> {}, onConfirm: ()=> {}})
  const server = servers.find(s => s.id === serverId);

  const { data: problem, isLoading, isError, error, refetch } = useQuery({

    queryKey: ['problem-detail', id],

    queryFn: async () => {
      const problem = await fetchProblemsWithHosts({serverUrl: server!.url,token: session.token,id: [parseInt(id)]});

      return problem.at(0) ?? null

    },
    enabled: !!server && !!session,
  });

// Busca os itens do trigger associado ao problema
const { data: triggerItems } = useQuery({
  queryKey: ['trigger-items', problem?.objectid, serverId],
  queryFn: async () => {
    if (!problem?.objectid) return [];
    const itemsMap = await fetchTriggerItems(server!.url, session.token, [problem.objectid]);
    return itemsMap[problem.objectid] ?? [];
  },
  enabled: !!problem?.objectid && !!server && !!session,
  staleTime: 30_000,
});


  const ackMutation = useMutation({mutationFn: (message: string) =>

      acknowledgeProblems(server!.url, session!.token.toString(), [id], message),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['problems'] });
        queryClient.invalidateQueries({ queryKey: ['problem-detail', id]});
        Alert.alert('Sucesso', 'Problema confirmado com sucesso.');

    },
    onError: (err) => {
      Alert.alert('Erro', 'Não foi possível confirmar o problema.'); 
    },
  });

  const suppressMutation = useMutation({mutationFn: (options: SuppressProblemsOptions) =>

      suppressProblems(options),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['problems'] });
        queryClient.refetchQueries({ queryKey: ['problem-detail', id] });
        Alert.alert('Sucesso', 'Problema suprimido com sucesso.');
    },
    onError: (err) => {
      Alert.alert('Erro', 'Não foi possível confirmar o problema: '+err);
    },
  });

  const unsuppressMutation = useMutation({mutationFn: (options: Omit<SuppressProblemsOptions, 'suppress_until'>) =>

      unsuppressProblems(options.eventids, options.serverUrl, options.token, options.message ?? ''),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['problems'] });
        queryClient.refetchQueries({ queryKey: ['problem-detail', id] });
        Alert.alert('Sucesso', 'Problema exibido com sucesso.');

    },
    onError: (err) => {
      Alert.alert('Erro', 'Não foi possível confirmar o problema: '+err);
    },
  });

  const closeMutation = useMutation({mutationFn: (options: Omit<SuppressProblemsOptions, 'suppress_until'>) =>

      closeProblem(options.eventids, options.serverUrl, options.token, options.message ?? ''),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['problems'] });
        queryClient.refetchQueries({ queryKey: ['problem-detail', id] });
        Alert.alert('Sucesso', 'Problema encerrado com sucesso.');

    },
    onError: (err) => {
      Alert.alert('Erro', 'Não foi possível confirmar o problema: '+err);
    },
  });



  const handleAcknowledge = (message: string) => {

    ackMutation.mutate(message)
    
  };

  const handleSuppressed = (message: string, date: Date ) => {
    const timeStampInSeconds = Math.floor(date.getTime() / 1000)
    suppressMutation.mutate({serverUrl: server!.url, eventids: [parseInt(id)], message , suppress_until: timeStampInSeconds, token: session.token })

  };

  const handleUnsuppressed = (message: string) => {
    unsuppressMutation.mutate({eventids: [parseInt(id)], serverUrl: server?.url ?? '', token: session.token, message})

  };

  const handleClose = (message: string) => {
    closeMutation.mutate({eventids: [parseInt(id)], serverUrl: server?.url ?? '', token: session.token, message})

  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-bg_primary">
        <ErrorState
          message="Erro ao carregar incidente"
          onRetry={refetch}
        />
    </SafeAreaView>
    )
  }

  if (isLoading || !problem ) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#E94560" />
      </SafeAreaView>
    );
  }



  const severity = parseInt(problem.severity) as ZabbixSeverity;
  const severityColor = SEVERITY_COLORS[severity];
  const isAcknowledged = problem.acknowledged === '1';
  let isSuppressed = problem.suppressed === '1';
  let manualClose: boolean | undefined = undefined
  if (problem.trigger != undefined) manualClose = problem.trigger.manual_close === '1'

  function renderModal(props: ModalKnowledgeProps){
    return <ModalAcknowledge  visible={props.visible} type={props.type} title={props.title} onConfirm={props.onConfirm} onCancel={props.onCancel}/>
  }

  return (
    <SafeAreaView className='flex-1 bg-bg_secondary'>
      {/* Header */}
      <View className='flex-row justify-between items-center px-4 py-2 border-bottom-border'>

        <TouchableOpacity onPress={() => router.back()}>

          <Text className='text-text_primary text-lg'>← Voltar</Text>

        </TouchableOpacity>

        <Text className='text-text_primary flex-1 text-right text-lg'>
          Detalhes do problema
        </Text>

      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Card principal */}
        <View className='bg-bg_primary rounded-xl p-2 '
          style={{
            borderWidth: 0.3,
            borderLeftWidth: 4,
            borderLeftColor: severityColor,
          }}>

          <View className='flex-row justify-between mb-2'>

            <SeverityBadge severity={severity} />
            
            <Text style={{ color: isAcknowledged ? '#4ade80' : '#6B7280', fontSize: 12 }}>
              {isAcknowledged ? '✓ Confirmado' : '○ Não confirmado'}
            </Text>

          </View>

          <Text className='text-text_primary text-lg font-bold'>
            {problem.name}
          </Text>
        </View>

        {/* Informações */}
        <View className='bg-bg_primary rounded-xl p-2'
        style={{borderWidth: 0.3}}
          // style={{ backgroundColor: '#16213E', borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#0F3460' }}
        >
          <InfoRow label="Servidor" value={server?.name ?? '—'} />
          <InfoRow label="Host" value={problem.hostName ?? '—'} />
          <InfoRow label="Iniciado em" value={formatDate(problem.clock)} />
          <InfoRow label="Event ID" value={problem.eventid} mono />
        </View>

        {/* Dados operacionais — últimos valores dos itens do trigger */}
        {triggerItems && triggerItems.length > 0 && (
          <View>
            <Text className="text-text_primary text-xs font-medium mb-1.5 ml-1">
              DADOS OPERACIONAIS
            </Text>
            <View
              className="rounded-xl overflow-hidden bg-bg_primary"
                style={{borderWidth: 0.3}}
            >
              {triggerItems.map((item, index) => {
                const isLast = index === triggerItems.length - 1;
                const formattedValue = formatItemValue(item);

                // Determina a cor do valor baseado na severidade do problema
                // Itens numéricos ficam na cor da severidade para chamar atenção
                const valueColor = ['0', '3'].includes(item.value_type)
                  ? SEVERITY_COLORS[severity]
                  : '#9CA3AF';

                return (
                  <View
                    key={item.itemid}
                    className="px-4 py-3 flex-row items-center"
                    style={{ borderBottomWidth: isLast ? 0 : 0.5,borderBottomColor: '#0F3460',
                    }}
                  >
                    <View className="flex-1">
                      <Text
                        className="text-text_primary text-sm"
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      {item.lastclock && parseInt(item.lastclock) > 0 && (
                        <Text className="text-text_primary text-xs mt-0.5">
                          Atualizado {lastSeenAgo(item.lastclock)}
                        </Text>
                      )}
                    </View>
                    <Text
                      className="text-sm font-semibold ml-3"
                      style={{ color: valueColor }}
                    >
                      {formattedValue}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Histórico de acknowledges */}
        {problem.acknowledges && problem.acknowledges.length > 0 && (
          <View className='bg-bg_primary rounded-xl p-2' style={{borderWidth: 0.3}}>

            <Text className='text-text_primary font-bold uppercase tracking-wider'>
              Histórico
            </Text>

            {problem.acknowledges.map((ack: { acknowledgeid: Key | null | undefined; message: any; clock: string; }) => (
              <View key={ack.acknowledgeid} className='p-2 border-b-[.5px] border-b-text_secondary'>
                <Text className='text-text_primary text-md'>{ack.message || 'Sem mensagem'}</Text>
                <Text className='text-text_primary text-sm mt-2'
                  // style={{ color: '#6B7280', fontSize: 11, marginTop: 3 }}
                  >
                  {formatDate(ack.clock)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Botão acknowledge */}
        {!isAcknowledged && (
          <View className='gap-4'>
            
            <Pressable
                onPress={()=> setModalAcknowledge({
                  type: 'acknowledge',
                  visible: true,
                  onCancel: ()=> setModalAcknowledge({...modalAcknowledge, visible: false}),
                  onConfirm(message) {
                    handleAcknowledge(message ?? '')
                    setModalAcknowledge({...modalAcknowledge, visible: false})
                  },
                })}
                disabled={ackMutation.isPending}
                style={{
                  backgroundColor: ackMutation.isPending ? '#0F3460' : '#D40000',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
              {ackMutation.isPending 
              ? (<ActivityIndicator color="#fff" />)
              : (<Text className='text-white text-lg font-bold'>Reconhecer problema</Text>)}

            </Pressable>

            <Pressable
            onPress={()=> setModalAcknowledge({
              type: isSuppressed ? 'unsuppresed' : 'suppressed',
              visible: true,
              onCancel:()=> {setModalAcknowledge({...modalAcknowledge, visible: false})},
              onConfirm: (message, date) => {
                isSuppressed ? handleUnsuppressed(message ?? '') : handleSuppressed(message ?? '', date ?? new Date())
                setModalAcknowledge({...modalAcknowledge, visible: false})
              },
            })}
            disabled={suppressMutation.isPending || suppressMutation.isPending || isLoading}
              style={{
                backgroundColor: ackMutation.isPending ? '#0F3460' : '#7b817d',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
              >
              {suppressMutation.isPending || suppressMutation.isPending || isLoading
              ? (<ActivityIndicator color="#fff" />)
              : (<Text className='text-white text-lg font-bold'>{isSuppressed ? 'Exibir Problema' : 'Suprimir Problema'}</Text>)}

            </Pressable>

          </View>
        )}


        {manualClose && (
          <Pressable
          onPress={() => setModalAcknowledge({
            visible: true,
            type: 'close',
            onCancel: ()=> {setModalAcknowledge({...modalAcknowledge, visible: false})},
            onConfirm: (message)=>{
              handleClose(message ?? '')
              setModalAcknowledge({...modalAcknowledge, visible: false})
            }
          })}
          disabled={suppressMutation.isPending || suppressMutation.isPending || isLoading}
          style={{
            backgroundColor: ackMutation.isPending ? '#0F3460' : '#318FC6',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}>
            {suppressMutation.isPending || suppressMutation.isPending || isLoading
            ? (<ActivityIndicator color="#fff" />)
            : (<Text className='text-white text-lg font-bold'>Encerrar Incidente</Text>)}

          </Pressable>
        )}

      </ScrollView>


      <ModalAcknowledge visible={modalAcknowledge?.visible ?? false} type={modalAcknowledge?.type ?? 'suppressed'} onCancel={modalAcknowledge.onCancel} onConfirm={modalAcknowledge?.onConfirm} />

    </SafeAreaView>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View className='flex-row justify-between p-2 items-center gap-3'>
      <Text className='text-text_primary text-md'>{label}</Text>
      <Text className='text-text_primary text-md max-w-[70%] flex-wrap'>{value}</Text>
    </View>
  );
}


// Formata o valor do item com sua unidade de forma legível
function formatItemValue(item: TriggerItem): string {
  const val = parseFloat(item.lastvalue);
  if (isNaN(val)) return item.lastvalue || '—';

  if (item.units === 'B'  || item.units === 'b' || item.units === 'bytes') {
    if (val >= 1099511627776) return `${(val / 1099511627776).toFixed(1)} TB`;
    if (val >= 1073741824) return `${(val / 1073741824).toFixed(1)} GB`;
    if (val >= 1048576) return `${(val / 1048576).toFixed(1)} MB`;
    if (val >= 1024) return `${(val / 1024).toFixed(1)} KB`;
    return `${val} B`;
  }
  if (item.units === 'bps') {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} Mbps`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)} Kbps`;
    return `${val} bps`;
  }
  if (item.units === '%') return `${val.toFixed(1)}%`;
  return `${val.toFixed(val % 1 === 0 ? 0 : 2)}${item.units ? ' ' + item.units : ''}`;
}

function lastSeenAgo(clock: string): string {
  const diff = Math.floor(Date.now() / 1000) - parseInt(clock);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return `há ${Math.floor(diff / 3600)}h`;
}