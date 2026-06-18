import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

function QuestIcon({ focused }: { focused: boolean }) {
  return (
    <MaterialCommunityIcons
      name="sword-cross"
      size={24}
      color={focused ? Colors.kidGreen : Colors.kidMuted}
    />
  );
}

function MapIcon({ focused }: { focused: boolean }) {
  return (
    <MaterialIcons
      name="map"
      size={24}
      color={focused ? Colors.kidGreen : Colors.kidMuted}
    />
  );
}

function LootIcon({ focused }: { focused: boolean }) {
  return (
    <MaterialIcons
      name="card-giftcard"
      size={24}
      color={focused ? Colors.kidGreen : Colors.kidMuted}
    />
  );
}

function HeroIcon({ focused }: { focused: boolean }) {
  return (
    <MaterialIcons
      name="person"
      size={24}
      color={focused ? Colors.kidGreen : Colors.kidMuted}
    />
  );
}

export default function ChildLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.kidTabBg,
          borderTopWidth: 2,
          borderTopColor: Colors.kidBorder,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   Colors.kidGreen,
        tabBarInactiveTintColor: Colors.kidMuted,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyBold,
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Quests',
          tabBarIcon: ({ focused }) => <QuestIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <MapIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="store/index"
        options={{
          title: 'Loot',
          tabBarIcon: ({ focused }) => <LootIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Hero',
          tabBarIcon: ({ focused }) => <HeroIcon focused={focused} />,
        }}
      />
      {/* Hidden routes */}
      <Tabs.Screen name="challenges/[id]"  options={{ href: null }} />
      <Tabs.Screen name="join"             options={{ href: null }} />
    </Tabs>
  );
}
