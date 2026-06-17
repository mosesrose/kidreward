import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

function TabIcon({
  name, focused,
}: { name: IconName; focused: boolean }) {
  return (
    <MaterialIcons
      name={name}
      size={24}
      color={focused ? Colors.primary : Colors.onSurfaceVariant}
    />
  );
}

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.outlineVariant,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyBold,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="challenges/index"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ focused }) => <TabIcon name="assignment-turned-in" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rewards/index"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused }) => <TabIcon name="card-giftcard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="children/index"
        options={{
          title: 'Family',
          tabBarIcon: ({ focused }) => <TabIcon name="group" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused }) => <TabIcon name="rocket-launch" focused={focused} />,
        }}
      />
      {/* Hidden routes */}
      <Tabs.Screen name="challenges/create" options={{ href: null }} />
      <Tabs.Screen name="challenges/[id]"   options={{ href: null }} />
      <Tabs.Screen name="children/invite"   options={{ href: null }} />
      <Tabs.Screen name="rewards/create"    options={{ href: null }} />
      <Tabs.Screen name="redemptions"       options={{ href: null }} />
      <Tabs.Screen name="settings"          options={{ href: null }} />
    </Tabs>
  );
}
