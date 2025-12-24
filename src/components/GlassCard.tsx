import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';

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
  gradient = ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'],
  borderColor = Colors.border,
  onPress,
  animated = true,
}: GlassCardProps) {
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

  const content = (
    <LinearGradient
      colors={gradient as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { borderColor }, style]}
    >
      <View style={styles.topBorder} />
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.container, animatedStyle]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  gradient: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
