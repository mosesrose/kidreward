import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({
  name, focused,
}: { name: IconName; focused: boolean }) {
  const icon: IconName = focused ? name : (`${name}-outline` as IconName);
  return (
    <MaterialCommunityIcons
      name={icon}
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
          tabBarIcon: ({ focused }) => <TabIcon name="view-dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="challenges/index"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ focused }) => <TabIcon name="clipboard-check" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rewards/index"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused }) => <TabIcon name="gift" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="children/index"
        options={{
          title: 'Family',
          tabBarIcon: ({ focused }) => <TabIcon name="account-group" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused }) => <TabIcon name="flag" focused={focused} />,
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
