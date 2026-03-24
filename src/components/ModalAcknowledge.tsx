import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import { Modal, Pressable, TextInput, View, Text } from "react-native";
import DateTimePicker from "react-native-modal-datetime-picker";



export interface ModalKnowledgeProps {
    visible: boolean,
    title?: string,
    type: 'suppressed' | 'unsuppresed' | 'close' | 'acknowledge',
    onCancel: ()=> void,
    onConfirm: (message?: string, date?:Date)=> void
}


export default function ModalAcknowledge({visible, title, type, onCancel, onConfirm }:ModalKnowledgeProps) {

    const [message, setMessage] = useState('')
    const [datePicker, setDatePicker] = useState(false)
    const [date, setDate] = useState<Date>()

    return (
        <Modal
        animationType='slide'
        transparent={true}

        visible={visible}>

          <View className='flex-1 items-center justify-center flex gap-5 p-5 bg-gray-900/80'>

            <View className='flex justify-between bg-bg_primary gap-2 p-5 rounded-lg min-h-[350px] h-[50%] w-[90%]'>

                <View>
                    <Text className='font-bold text-text_primary text-xl text-center'>{title ?? 'Reconhece Problema'}</Text>
                </View>

                <View className='gap-2'>
                    <TextInput onChangeText={(t) => setMessage(t)} className='border border-border_color rounded-md py-6 text-wrap text-sm text-text_primary placeholder:text-text_primary' placeholder='Digite uma mensagem...(Opcional)'></TextInput>
                </View>

                { type == 'suppressed' && (
                    <View className='flex-1 mt-5'>
                        <Text className='text-text_primary text-sm'>Suprimir evento até esta data ou deixe em branco para "indeterminado"</Text>

                        <Pressable
                        className='border border-border_color mt-1 p-2 rounded-md flex-row justify-between'
                        onPress={()=> setDatePicker(true)}>

                        <Text className='text-text_primary'>{date?.toISOString ? date.toLocaleDateString() : 'selecione a data'}</Text>
                        <FontAwesome name="calendar" size={16} color="gray"/>
                        </Pressable>
                    </View>
                    )}



                <View className='flex-row justify-between'>
                    {/* Botão Cancelar */}
                    <Pressable
                    className='p-4 rounded-md bg-red'
                    onPress={onCancel}>
                    <Text className='text-white'>Cancelar</Text>
                    </Pressable>

                    {/* Botão Confirmar */}
                    <Pressable
                    className='p-4 rounded-md bg-text_secondary'
                    onPress={() => onConfirm(message, date)}>
                    <Text className='text-white'>Confirmar</Text>
                    </Pressable>
              </View>  


              <DateTimePicker
                isVisible={datePicker}
                mode='date'
                onConfirm={(date)=>{
                    setDate(date)
                    setDatePicker(false)
                  }
                }
                onCancel={()=>{
                  setDatePicker(false)
                }}
              />
            </View>
        </View>

      </Modal>
    )

}