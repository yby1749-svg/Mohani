import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, BorderRadius, FontSizes, Spacing, Gradients } from '../constants/theme';

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
        return Gradients.purple as [string, string];
      case 'gold':
        return Gradients.gold as [string, string];
      case 'secondary':
      case 'ghost':
        return ['transparent', 'transparent'];
      default:
        return Gradients.purple as [string, string];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'gold':
        return variant === 'gold' ? Colors.bgPrimary : Colors.textPrimary;
      case 'secondary':
        return Colors.textSecondary;
      case 'ghost':
        return Colors.purpleLight;
      default:
        return Colors.textPrimary;
    }
  };

  const getBorderStyle = () => {
    switch (variant) {
      case 'secondary':
        return { borderWidth: 1, borderColor: Colors.border };
      case 'ghost':
        return { borderWidth: 1, borderColor: Colors.borderPurple };
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
