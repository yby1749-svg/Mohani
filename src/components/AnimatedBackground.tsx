import React, { useEffect, memo, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

const { width, height } = Dimensions.get('window');

// Reduced particle count for better performance
const PARTICLE_COUNT = 8;
const VERTICAL_LINES = 10;
const HORIZONTAL_LINES = 12;

const GlowOrb = ({
  color,
  size,
  initialX,
  initialY,
  delay = 0,
}: {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  delay?: number;
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const startAnimation = () => {
      translateX.value = withRepeat(
        withSequence(
          withTiming(30, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-20, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      translateY.value = withRepeat(
        withSequence(
          withTiming(-30, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    };

    const timeout = setTimeout(startAnimation, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          left: initialX,
          top: initialY,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

// Memoized Particle component for performance
const Particle = memo(({ index }: { index: number }) => {
  const translateY = useSharedValue(height + 50);
  const opacity = useSharedValue(0);
  const left = Math.random() * width;
  const size = Math.random() * 4 + 2;
  const duration = Math.random() * 20000 + 30000;
  const delay = Math.random() * 20000;
  const isPurple = Math.random() > 0.5;

  useEffect(() => {
    const timeout = setTimeout(() => {
      translateY.value = withRepeat(
        withTiming(-50, { duration, easing: Easing.linear }),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration * 0.1 }),
          withTiming(0.8, { duration: duration * 0.8 }),
          withTiming(0, { duration: duration * 0.1 })
        ),
        -1,
        false
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left,
          width: size,
          height: size,
          backgroundColor: isPurple ? Colors.purpleLight : Colors.goldPrimary,
          shadowColor: isPurple ? Colors.purpleLight : Colors.goldPrimary,
        },
        animatedStyle,
      ]}
    />
  );
});

// Memoize the GlowOrb component too
const MemoizedGlowOrb = memo(GlowOrb);

export default function AnimatedBackground() {
  const { settings } = useSettings();

  // Light mode: clean, professional gradient (Apple-style)
  if (!settings.darkMode) {
    return (
      <View style={styles.container} pointerEvents="none">
        <LinearGradient
          colors={['#f5f5f7', '#eef0f2', '#f5f5f7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Subtle top accent */}
        <LinearGradient
          colors={['rgba(109, 40, 217, 0.03)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0.3 }}
          style={[StyleSheet.absoluteFill, { height: height * 0.4 }]}
        />
      </View>
    );
  }

  // Pre-compute grid lines for performance
  const verticalLines = useMemo(() =>
    Array.from({ length: VERTICAL_LINES }).map((_, i) => (
      <View
        key={`v-${i}`}
        style={[
          styles.gridLine,
          styles.gridLineVertical,
          { left: (i / VERTICAL_LINES) * width },
        ]}
      />
    )), []);

  const horizontalLines = useMemo(() =>
    Array.from({ length: HORIZONTAL_LINES }).map((_, i) => (
      <View
        key={`h-${i}`}
        style={[
          styles.gridLine,
          styles.gridLineHorizontal,
          { top: (i / HORIZONTAL_LINES) * height },
        ]}
      />
    )), []);

  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
      <Particle key={i} index={i} />
    )), []);

  // Dark mode: animated orbs and particles
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Grid lines effect - reduced count */}
      <View style={styles.gridContainer}>
        {verticalLines}
        {horizontalLines}
      </View>

      {/* Glowing orbs - using memoized component */}
      <MemoizedGlowOrb
        color={Colors.purplePrimary}
        size={300}
        initialX={width - 100}
        initialY={-100}
        delay={0}
      />
      <MemoizedGlowOrb
        color="#92400e"
        size={250}
        initialX={-80}
        initialY={height * 0.4}
        delay={4000}
      />
      <MemoizedGlowOrb
        color={Colors.purpleSecondary}
        size={200}
        initialX={width * 0.3}
        initialY={height - 100}
        delay={8000}
      />

      {/* Floating particles - reduced from 20 to 8 */}
      {particles}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(124, 58, 237, 0.03)',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.4,
  },
  particle: {
    position: 'absolute',
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});
