import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { DarkColors, LightColors, BorderRadius, Gradients } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

type ProgressBarProps = {
  progress: number; // 0-100
  height?: number;
  gradient?: string[];
  showGlow?: boolean;
  animated?: boolean;
  style?: ViewStyle;
};

export default function ProgressBar({
  progress,
  height = 12,
  gradient = Gradients.mixed,
  showGlow = true,
  animated = true,
  style,
}: ProgressBarProps) {
  const { settings } = useSettings();
  const isDark = settings?.darkMode ?? true;
  const colors = isDark ? DarkColors : LightColors;

  const animatedProgress = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(progress, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedProgress.value = progress;
    }
  }, [progress, animated]);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(2, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value * 100 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Use theme-appropriate background
  const bgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={[styles.background, { borderRadius: height / 2, backgroundColor: bgColor }]}>
        <Animated.View style={[styles.fillContainer, fillStyle]}>
          <LinearGradient
            colors={gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { borderRadius: height / 2 }]}
          >
            {/* Shimmer effect */}
            <Animated.View style={[styles.shimmer, shimmerStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </LinearGradient>

          {/* Glow at the end - only in dark mode */}
          {showGlow && isDark && (
            <Animated.View
              style={[
                styles.glow,
                {
                  backgroundColor: gradient[1] || colors.goldPrimary,
                  width: height * 1.5,
                  height: height * 1.5,
                  borderRadius: height,
                },
                glowStyle,
              ]}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  background: {
    flex: 1,
    overflow: 'hidden',
  },
  fillContainer: {
    height: '100%',
    position: 'relative',
  },
  fill: {
    flex: 1,
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: '50%',
  },
  shimmerGradient: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    right: -6,
    top: '50%',
    marginTop: -9,
  },
});
