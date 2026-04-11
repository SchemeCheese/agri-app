import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store/authStore';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const isSeller = user?.role === 'SELLER';

  return (
    <Tabs
      initialRouteName={isSeller ? 'index' : 'index'}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isSeller ? 'Tong quan' : 'Trang chu',
          tabBarIcon: ({ color }) => <TabBarIcon name={isSeller ? 'dashboard' : 'home'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: isSeller ? 'San pham' : 'San pham',
          tabBarIcon: ({ color }) => <TabBarIcon name={isSeller ? 'leaf' : 'th-large'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: isSeller ? 'Don hang' : 'Gio hang',
          tabBarIcon: ({ color }) => <TabBarIcon name={isSeller ? 'inbox' : 'shopping-basket'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="seller-center"
        options={{
          href: isSeller ? undefined : null,
          title: 'Ma giam & DG',
          tabBarIcon: ({ color }) => <TabBarIcon name="ticket" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: isSeller ? undefined : null,
          title: 'Chat',
          tabBarIcon: ({ color }) => <TabBarIcon name="comment-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tai khoan',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
