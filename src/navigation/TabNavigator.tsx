import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import HomeStack from './HomeStack';
import CalendarScreen from '../screens/CalendarScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsStack from './SettingsStack';
import { Colors, BorderRadius, FontSizes } from '../constants/theme';

const Tab = createBottomTabNavigator();

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
};

const TabIcon = ({ name, focused, label }: TabIconProps) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 15 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.tabItem}>
      {focused && (
        <LinearGradient
          colors={[Colors.purplePrimary, Colors.purpleSecondary]}
          style={styles.tabIndicator}
        />
      )}
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Ionicons
          name={name}
          size={24}
          color={focused ? Colors.purplePrimary : Colors.textMuted}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? Colors.purplePrimary : Colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={80} tint="dark" style={styles.blurView}>
        <View style={styles.tabBar}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            let iconName: keyof typeof Ionicons.glyphMap;
            let label: string;

            switch (route.name) {
              case 'Home':
                iconName = isFocused ? 'home' : 'home-outline';
                label = 'Home';
                break;
              case 'Calendar':
                iconName = isFocused ? 'calendar' : 'calendar-outline';
                label = 'Calendar';
                break;
              case 'Shopping':
                iconName = isFocused ? 'cart' : 'cart-outline';
                label = 'Shopping';
                break;
              case 'Analytics':
                iconName = isFocused ? 'bar-chart' : 'bar-chart-outline';
                label = 'Analytics';
                break;
              case 'Settings':
                iconName = isFocused ? 'settings' : 'settings-outline';
                label = 'Settings';
                break;
              default:
                iconName = 'ellipse';
                label = route.name;
            }

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.7}
                onPress={onPress}
                style={styles.tabButton}
              >
                <TabIcon name={iconName} focused={isFocused} label={label} />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Shopping" component={ShoppingScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurView: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderPurple,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    paddingBottom: 30,
    paddingTop: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 8,
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  iconContainer: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
});
