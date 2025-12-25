import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BorderRadius, Spacing, Shadows, LightShadows, DarkColors, LightColors } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

type GlassCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: string[];
  borderColor?: string;
  onPress?: () => void;
  animated?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GlassCard({
  children,
  style,
  gradient,
  borderColor,
  onPress,
  animated = true,
}: GlassCardProps) {
  const { settings } = useSettings();
  const isDark = settings?.darkMode ?? true;
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? Shadows : LightShadows;

  // Light mode: clean white card with subtle gradient
  // Dark mode: glass effect with transparency
  const defaultGradient: [string, string] = isDark
    ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']
    : ['#ffffff', '#fafafa'];

  // Ensure gradient is always valid
  let finalGradient: [string, string] = defaultGradient;

  if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
    if (isDark) {
      // Dark mode: use the provided gradient as-is
      finalGradient = [gradient[0], gradient[1]];
    } else {
      // Light mode: use clean white cards for professional look
      finalGradient = defaultGradient;
    }
  }

  // Border color: use provided or default, but lighten for light mode
  const finalBorderColor = isDark
    ? (borderColor || colors.border)
    : colors.border;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (animated && onPress) {
      scale.value = withSpring(0.98, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    if (animated && onPress) {
      scale.value = withSpring(1, { damping: 15 });
    }
  };

  const containerStyle = [
    styles.container,
    shadows.card,
    !isDark && styles.lightContainer,
  ];

  const gradientStyle = [
    styles.gradient,
    { borderColor: finalBorderColor },
    !isDark && styles.lightGradient,
    style,
  ];

  const content = (
    <LinearGradient
      colors={finalGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={gradientStyle}
    >
      {isDark && (
        <View style={[styles.topBorder, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]} />
      )}
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[containerStyle, animatedStyle]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  lightContainer: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
  },
  gradient: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  lightGradient: {
    borderWidth: 0,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },
});
