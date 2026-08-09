import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TAB_CONFIG: Record<string, { label: string; icon: IconName }> = {
  Home: { label: 'Home', icon: 'home' },
  Chat: { label: 'Chat', icon: 'chat-bubble' },
  Insights: { label: 'Insights', icon: 'bar-chart' },
  Profile: { label: 'Profile', icon: 'person' },
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar} />
      <View style={styles.row}>
        {state.routes.slice(0, 2).map((route, index) => (
          <TabButton
            key={route.key}
            config={TAB_CONFIG[route.name]}
            isFocused={state.index === index}
            onPress={() => onTabPress(navigation, route, state.index === index)}
          />
        ))}

        <View style={styles.fabGap} />

        {state.routes.slice(2).map((route, offsetIndex) => {
          const index = offsetIndex + 2;
          return (
            <TabButton
              key={route.key}
              config={TAB_CONFIG[route.name]}
              isFocused={state.index === index}
              onPress={() => onTabPress(navigation, route, state.index === index)}
            />
          );
        })}
      </View>

      <Svg
        width={110}
        height={110}
        style={styles.fabGlow}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="fabGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
            <Stop offset="55%" stopColor="#7c3aed" stopOpacity={0.22} />
            <Stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={55} cy={55} r={55} fill="url(#fabGlow)" />
      </Svg>

      <Pressable
        style={styles.fab}
        onPress={() => navigation.getParent()?.navigate('AddExpense')}
      >
        <Svg width={52} height={52}>
          <Defs>
            <SvgLinearGradient id="fabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#7c3aed" />
              <Stop offset="100%" stopColor="#a855f7" />
            </SvgLinearGradient>
          </Defs>
          <Rect width={52} height={52} rx={26} fill="url(#fabGradient)" />
        </Svg>
        <View style={styles.fabIcon}>
          <MaterialIcons name="add" size={32} color="#ffffff" />
        </View>
      </Pressable>
    </View>
  );
}

function onTabPress(
  navigation: BottomTabBarProps['navigation'],
  route: BottomTabBarProps['state']['routes'][number],
  isFocused: boolean,
) {
  const event = navigation.emit({
    type: 'tabPress',
    target: route.key,
    canPreventDefault: true,
  });
  if (!isFocused && !event.defaultPrevented) {
    navigation.navigate(route.name);
  }
}

type TabButtonProps = {
  config: { label: string; icon: IconName };
  isFocused: boolean;
  onPress: () => void;
};

function TabButton({ config, isFocused, onPress }: TabButtonProps) {
  const color = isFocused ? '#7c3aed' : '#9aa0ab';
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <MaterialIcons name={config.icon} size={25} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{config.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 92,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: '#ffffff',
    shadowColor: 'rgba(20,22,40,0.08)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  row: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  fabGap: {
    width: 70,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  fabGlow: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -55,
  },
  fab: {
    position: 'absolute',
    bottom: 44,
    left: '50%',
    marginLeft: -31,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#f5f6f8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  fabIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabBar;
