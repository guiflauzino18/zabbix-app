import { Color, Redirect, Stack, Tabs } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';
import { useNotificationsStore } from '@/stores/notifications.store';
import { useNotificationPoller } from '@/hooks/useNotificationPoller';
import { usePushNotifications } from '@/hooks/usePushNotifications';

  interface tabicon {
    name: any,
    size: number,
    color: string,
    active: boolean
  }

  function TabIcon(icon: tabicon){
    const color = icon.active ? "#0A466A" : '#858C90'
    return (
      <FontAwesome name={icon.name} size={icon.size} color={color}/>
    )
  }


  // Componente separado para o badge de não lidas
  // Separado para evitar re-render de toda a tab bar ao mudar o contador
  function UnreadBadge() {
    const unreadCount = useNotificationsStore(s => s.unreadCount());
    if (unreadCount === 0) return null;

    return (
      <View
        className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full items-center justify-center px-1"
        style={{ backgroundColor: '#E94560' }}
      >
        <Text className="text-white text-xs font-bold" style={{ fontSize: 9 }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Text>
      </View>
    );
  }


function AppLayoutInner() {
  // Ativa o poller de notificações — roda enquanto o app estiver na tela
  usePushNotifications();

  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#EBEEF0',
          borderTopWidth: 0.5
        },
        tabBarActiveTintColor: "#0A466A",
        tabBarInactiveTintColor: '#858C90'
      }}>

      <Tabs.Screen name='dashboard' options={{title: 'Dashboard', tabBarIcon: ({focused}) => <TabIcon active={focused} name={'dashboard'} size={20} color='black'/> }}/>
      <Tabs.Screen name='hosts' options={{title: 'Hosts', tabBarIcon: ({focused}) => <TabIcon active={focused} name={'server'} size={20} color='black'/> }}/>
      <Tabs.Screen name='notifications' options={{title: 'Notificações', tabBarIcon: ({focused}) => <TabIcon active={focused} name={'bell'} size={20} color='black'/> }}/>
      <Tabs.Screen name='profile' options={{title: 'Perfil', tabBarIcon: ({focused}) => <TabIcon active={focused} name={'user'} size={20} color='black'/> }}/>
    </Tabs>

    )
}


export default function AppLayout() {
  const { sessions, isLoading } = useAuthStore();
  const hasSession = Object.keys(sessions).length > 0;


  if (!isLoading && !hasSession) {
    return <Redirect href="/(auth)/login" />;
  }

  return <AppLayoutInner />
}