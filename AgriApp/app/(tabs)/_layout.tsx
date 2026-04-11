import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={20} style={{ marginBottom: -1 }} {...props} />;
}

export default function TabLayout() {
  const user = useAuthStore((state) => state.user);
  const isSeller = user?.role === 'SELLER';

  return (
    <Tabs
      initialRouteName={isSeller ? 'index' : 'index'}
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarActiveBackgroundColor: '#0F172A',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          paddingHorizontal: 8,
          borderTopColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
        },
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 4,
          marginVertical: 6,
          overflow: 'hidden',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
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
