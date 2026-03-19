import { Color, Redirect, Stack, Tabs } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function AppLayout() {
  const { sessions, isLoading } = useAuthStore();
  const hasSession = Object.keys(sessions).length > 0;


  if (!isLoading && !hasSession) {
    return <Redirect href="/(auth)/login" />;
  }

  // return <Stack screenOptions={{ headerShown: false }} />;

  interface tabicon {
    name: any,
    size: number,
    color: string,
    active: boolean
  }

  function TabIcon(icon: tabicon){
    const color = icon.active ? "#318FC6" : '#858C90'
    return (
      <FontAwesome name={icon.name} size={icon.size} color={color}/>
    )
  }

  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#EBEEF0',
          borderTopWidth: 0.5
        },
        tabBarActiveTintColor: "#318FC6",
        tabBarInactiveTintColor: '#858C90'
      }}>

      <Tabs.Screen name='dashboard' options={{title: 'Dashboard', tabBarIcon: ({focused}) => <TabIcon active={focused} name={'dashboard'} size={20} color='black'/> }}/>
      <Tabs.Screen name='hosts' options={{title: 'Hosts', tabBarIcon: ({focused}) => <TabIcon active={focused} name={'server'} size={20} color='black'/> }}/>
    </Tabs>
  )
}