import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';
import { Colors, FontSizes, Spacing, Gradients, DarkColors, LightColors } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

type HeaderProps = {
  showMenu?: boolean;
  showNotification?: boolean;
  showBack?: boolean;
  notificationCount?: number;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
};

export default function Header({
  showMenu = true,
  showNotification = true,
  showBack = false,
  notificationCount = 3,
  onMenuPress,
  onNotificationPress,
}: HeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const badgeScale = useSharedValue(1);
  const { settings } = useSettings();
  const colors = settings.darkMode ? DarkColors : LightColors;

  React.useEffect(() => {
    badgeScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const isDark = settings?.darkMode ?? true;
  const containerStyle = [
    styles.container,
    {
      paddingTop: insets.top,
      backgroundColor: isDark ? 'rgba(10, 10, 15, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderBottomColor: isDark ? colors.borderPurple : 'rgba(0, 0, 0, 0.06)',
    }
  ];

  return (
    <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={containerStyle}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : showMenu ? (
          <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
            <View style={[styles.menuLine, { backgroundColor: colors.textSecondary }]} />
            <View style={[styles.menuLine, styles.menuLineShort, { backgroundColor: colors.textSecondary }]} />
            <View style={[styles.menuLine, { backgroundColor: colors.textSecondary }]} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <LinearGradient
              colors={Gradients.purple}
              style={styles.logoM}
            >
              <Text style={styles.logoMText}>M</Text>
            </LinearGradient>
            <LinearGradient
              colors={Gradients.gold}
              style={styles.logoCoin}
            >
              <Text style={styles.logoCoinText}>$</Text>
            </LinearGradient>
          </View>
          <LinearGradient
            colors={Gradients.mixed}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoTextGradient}
          >
            <Text style={styles.logoText}>MOHANI</Text>
          </LinearGradient>
        </View>

        {showNotification ? (
          <TouchableOpacity onPress={onNotificationPress} style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
            {notificationCount > 0 && (
              <Animated.View style={[styles.badge, badgeStyle]}>
                <LinearGradient colors={Gradients.gold} style={styles.badgeGradient}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  menuButton: {
    padding: Spacing.sm,
    gap: 5,
  },
  backButton: {
    padding: Spacing.xs,
  },
  menuLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
  },
  menuLineShort: {
    width: 16,
  },
  placeholder: {
    width: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 36,
    height: 36,
    position: 'relative',
  },
  logoM: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  logoCoin: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCoinText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.bgPrimary,
  },
  logoTextGradient: {
    paddingHorizontal: 2,
  },
  logoText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textPrimary,
  },
  notificationButton: {
    padding: Spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  badgeGradient: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.bgPrimary,
  },
});
