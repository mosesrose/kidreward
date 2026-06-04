import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A0A3C',
          borderTopColor: 'rgba(255,255,255,0.1)',
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: Colors.gem,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="challenges/index"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="children/index"
        options={{
          title: 'My Kids',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👧" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rewards/index"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎁" focused={focused} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="challenges/create" options={{ href: null }} />
      <Tabs.Screen name="challenges/[id]" options={{ href: null }} />
      <Tabs.Screen name="children/invite" options={{ href: null }} />
      <Tabs.Screen name="rewards/create" options={{ href: null }} />
      <Tabs.Screen name="redemptions" options={{ href: null }} />
    </Tabs>
  );
}
