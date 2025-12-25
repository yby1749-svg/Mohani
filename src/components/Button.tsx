import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DarkColors, LightColors, BorderRadius, FontSizes, Spacing, Gradients } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'ghost';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const { settings } = useSettings();
  const isDark = settings?.darkMode ?? true;
  const colors = isDark ? DarkColors : LightColors;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
    opacity.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getGradient = (): [string, string] => {
    switch (variant) {
      case 'primary':
        return isDark ? (Gradients.purple as [string, string]) : ['#6d28d9', '#8b5cf6'];
      case 'gold':
        return isDark ? (Gradients.gold as [string, string]) : ['#b45309', '#f59e0b'];
      case 'secondary':
      case 'ghost':
        return ['transparent', 'transparent'];
      default:
        return isDark ? (Gradients.purple as [string, string]) : ['#6d28d9', '#8b5cf6'];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'gold':
        return isDark ? colors.bgPrimary : '#ffffff';
      case 'secondary':
        return colors.textSecondary;
      case 'ghost':
        return colors.purpleLight;
      default:
        return '#ffffff';
    }
  };

  const getBorderStyle = () => {
    switch (variant) {
      case 'secondary':
        return { borderWidth: 1, borderColor: colors.border };
      case 'ghost':
        return { borderWidth: 1, borderColor: colors.borderPurple };
      default:
        return {};
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, getBorderStyle()]}
      >
        {icon}
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  text: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
