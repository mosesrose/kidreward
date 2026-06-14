import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function ChildLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.childCard,
          borderTopColor: Colors.border,
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: Colors.childAccent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="challenges/index"
        options={{
          title: 'Missions',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚔️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="store/index"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎁" focused={focused} />,
        }}
      />
      <Tabs.Screen name="challenges/[id]" options={{ href: null }} />
      <Tabs.Screen name="join" options={{ href: null }} />
      <Tabs.Screen name="rewards/index" options={{ href: null }} />
    </Tabs>
  );
}
