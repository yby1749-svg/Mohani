import React, { useEffect } from 'react';
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

const { width, height } = Dimensions.get('window');

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

const Particle = ({ index }: { index: number }) => {
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
};

export default function AnimatedBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Grid lines effect */}
      <View style={styles.gridContainer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              styles.gridLineVertical,
              { left: (i / 20) * width },
            ]}
          />
        ))}
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              styles.gridLineHorizontal,
              { top: (i / 30) * height },
            ]}
          />
        ))}
      </View>

      {/* Glowing orbs */}
      <GlowOrb
        color={Colors.purplePrimary}
        size={300}
        initialX={width - 100}
        initialY={-100}
        delay={0}
      />
      <GlowOrb
        color="#92400e"
        size={250}
        initialX={-80}
        initialY={height * 0.4}
        delay={4000}
      />
      <GlowOrb
        color={Colors.purpleSecondary}
        size={200}
        initialX={width * 0.3}
        initialY={height - 100}
        delay={8000}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}
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
