import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, router, Label, Color, Icon } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServersStore } from '../../src/stores/servers.store';
import { SEVERITY_COLORS, type ZabbixSeverity } from '../../src/api/zabbix.types';
import { SeverityBadge } from '@/components/ui/SeverityBadges';
import React, { Key, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { acknowledgeProblems, fetchProblemsWithHosts, suppressProblems, SuppressProblemsOptions, unsuppressProblems } from '@/services/problems.service';
import DateTimePicker from 'react-native-modal-datetime-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';


function formatDate(clock: string) {
  return new Date(parseInt(clock) * 1000).toLocaleString('pt-BR');
}

export default function ProblemDetailScreen() {
  const { id, serverId } = useLocalSearchParams<{ id: string; serverId: string }>();
  const { session } = useAuthStore(s => s.getSession(serverId)!);
  const { servers } = useServersStore();
  const queryClient = useQueryClient();
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [selectedDateSuppressed, setSelectedDateSuppressed] = useState<Date>()
  const [suppressedMessage, setSuppressedMessage] = useState<string>()
  const [modalSuppressed, setModalSuppressed] = useState(false)


  const server = servers.find(s => s.id === serverId);

  const { data: problem, isLoading, isError, error, refetch } = useQuery({

    queryKey: ['problem-detail', id, serverId],

    queryFn: async () => {
      const problem = await fetchProblemsWithHosts({
        serverUrl: server!.url,
        token: session.token,
        id: [parseInt(id)]
      });
      
      return problem.at(0) ?? null
      // const found = problem.find((p: { eventid: string; }) => p.eventid === id);
      // return found ?? null;
    },
    enabled: !!server && !!session,
  });


  const ackMutation = useMutation({mutationFn: (message: string) =>

      acknowledgeProblems(server!.url, session!.token.toString(), [id], message),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['problem'] });
        queryClient.invalidateQueries({ queryKey: ['problem-detail', id, serverId] });
        Alert.alert('Sucesso', 'Problema confirmado com sucesso.');

    },
    onError: (err) => {
      Alert.alert('Erro', 'Não foi possível confirmar o problema.'); 
    },
  });


  const suppressMutation = useMutation({mutationFn: (options: SuppressProblemsOptions) =>

      suppressProblems(options),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['problem'] });
        queryClient.invalidateQueries({ queryKey: ['problem-detail', id] });
        Alert.alert('Sucesso', 'Problema suprimido com sucesso.');
    },
    onError: (err) => {
      Alert.alert('Erro', 'Não foi possível confirmar o problema: '+err);
    },
  });

  const unsuppressMutation = useMutation({mutationFn: (options: Omit<SuppressProblemsOptions, 'suppress_until'>) =>

      unsuppressProblems(options.eventids, options.serverUrl, options.token, options.message ?? ''),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['problem'] });
        queryClient.invalidateQueries({ queryKey: ['problem-detail', id] });
        Alert.alert('Sucesso', 'Problema exibido com sucesso.');

    },
    onError: (err) => {
      Alert.alert('Erro', 'Não foi possível confirmar o problema: '+err);
    },
  });

  const handleAcknowledge = () => {

    
    Alert.alert("Confirmar", "Adicione uma mensagem", [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Confirmar',
          onPress: (message = '') => ackMutation.mutate(message)
        }
      ]
    )
  };

  const handleSuppressed = () => {
    setModalSuppressed(true)
    
  };

  
  if (isError || ! problem){
     return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center'}}>
        <Text>{error?.message}</Text>
      </SafeAreaView>
  }

  if (isLoading || !problem) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#E94560" />
      </SafeAreaView>
    );
  }

  const severity = parseInt(problem.severity) as ZabbixSeverity;
  const severityColor = SEVERITY_COLORS[severity];
  const isAcknowledged = problem.acknowledged === '1';
  const isSuppressed = problem.suppressed === '1';

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
                onPress={handleAcknowledge}
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
                onPress={handleSuppressed}
                disabled={ackMutation.isPending}
                style={{
                  backgroundColor: ackMutation.isPending ? '#0F3460' : '#7b817d',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
              {ackMutation.isPending || suppressMutation.isPending || unsuppressMutation.isPending
              ? (<ActivityIndicator color="#fff" />)
              : (<Text className='text-white text-lg font-bold'>{isSuppressed ? 'Exibir problema' : 'Suprimir problema'}</Text>)}

            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType='slide'
        transparent={true}
        visible={modalSuppressed}>

          <View className='flex-1 items-center justify-center flex gap-5 p-5 bg-gray-900/80'>

            <View className='flex justify-between bg-bg_primary gap-2 p-5 rounded-lg min-h-[350px] h-[50%] w-[90%]'>

              <View>
                <Text className='font-bold text-text_primary text-xl text-center'>Reconhecer Problema</Text>
              </View>

              <View className='gap-2'>
                <TextInput onChangeText={(t) => setSuppressedMessage(t)} className='border border-border_color rounded-md py-6 text-wrap text-sm text-text_primary placeholder:text-text_primary' placeholder='Digite uma mensagem...(Opcional)'></TextInput>
              </View>

               { !isSuppressed && (
                  <View className='flex-1 mt-5'>
                    <Text className='text-text_primary text-sm'>Suprimir evento até esta data ou deixe em branco para "indeterminado"</Text>

                    <Pressable
                      className='border border-border_color mt-1 p-2 rounded-md flex-row justify-between'
                      onPress={()=> setDatePickerVisible(true)}>

                      <Text className='text-text_primary'>{selectedDateSuppressed?.toISOString ? selectedDateSuppressed.toLocaleDateString() : 'selecione a data'}</Text>
                      <FontAwesome name="calendar" size={16} color="gray"/>
                    </Pressable>
                  </View>
                )}

              <View className='flex-row justify-between'>
                <Pressable
                  className='p-4 rounded-md bg-red'
                  onPress={()=> setModalSuppressed(false)}>
                  <Text className='text-white'>Cancelar</Text>
                </Pressable>

                <Pressable
                  className='p-4 rounded-md bg-text_secondary'
                  onPress={()=> {
                    switch (isSuppressed) {
                      case false:
                        const timeStampInSeconds = selectedDateSuppressed && Math.floor(selectedDateSuppressed?.getTime() / 1000)
                        suppressMutation.mutate({serverUrl: server!.url, eventids: [parseInt(id)], message: suppressedMessage, suppress_until: timeStampInSeconds, token: session.token })
                        break;

                      case true:
                        unsuppressMutation.mutate({eventids: [parseInt(id)], serverUrl: server?.url ?? '', token: session.token, message: suppressedMessage})
                        break;
                    }
                    setModalSuppressed(false)
                  }}>
                  <Text className='text-white'>Confirmar</Text>
                </Pressable>
              </View>  

              <DateTimePicker
                isVisible={datePickerVisible}
                mode='date'
                onConfirm={(date)=>{
                    setSelectedDateSuppressed(date)
                    setDatePickerVisible(false)
                  }
                }
                onCancel={()=>{
                  setDatePickerVisible(false)
                }}
              />
            </View>
        </View>

      </Modal>


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