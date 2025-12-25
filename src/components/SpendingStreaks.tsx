import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { useStreaks } from '../context/StreaksContext';

interface SpendingStreaksProps {
  todaySpending: number;
  dailyBudget: number;
}

const SpendingStreaks: React.FC<SpendingStreaksProps> = ({
  todaySpending,
  dailyBudget,
}) => {
  const {
    streakData,
    checkAndUpdateStreak,
    getStreakEmoji,
    getNextMilestone,
  } = useStreaks();

  const scale = useSharedValue(1);

  useEffect(() => {
    try {
      if (dailyBudget > 0) {
        checkAndUpdateStreak(todaySpending, dailyBudget);
      }
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  }, [todaySpending, dailyBudget]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(1.1, {}, () => {
      scale.value = withSpring(1);
    });
  };

  const nextMilestone = getNextMilestone();
  const progressToNext = nextMilestone > 0
    ? (streakData.currentStreak / nextMilestone) * 100
    : 100;

  const isUnderBudget = todaySpending <= dailyBudget;

  // Get last 7 days for mini calendar
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const historyItem = streakData.streakHistory.find((h) => h.date === dateStr);
      days.push({
        day: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
        date: date.getDate(),
        underBudget: historyItem?.underBudget,
        isToday: i === 0,
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  return (
    <View style={styles.container}>
      {/* Streak Header */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={[styles.streakHeader, animatedStyle]}>
          <LinearGradient
            colors={
              streakData.currentStreak >= 7
                ? ['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.1)']
                : ['rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.05)']
            }
            style={styles.streakCard}
          >
            <Text style={styles.streakEmoji}>{getStreakEmoji()}</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
              <Text style={styles.streakLabel}>일 연속</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>
                {isUnderBudget ? '오늘 성공!' : '내일 도전!'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Weekly Calendar */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.weeklyCalendar}>
        {last7Days.map((day, index) => (
          <Animated.View
            key={index}
            entering={FadeIn.delay(index * 50)}
            style={styles.dayColumn}
          >
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {day.day}
            </Text>
            <View
              style={[
                styles.dayCircle,
                day.underBudget === true && styles.dayCircleSuccess,
                day.underBudget === false && styles.dayCircleFail,
                day.isToday && styles.dayCircleToday,
              ]}
            >
              <Text style={[
                styles.dayDate,
                day.underBudget === true && styles.dayDateSuccess,
                day.underBudget === false && styles.dayDateFail,
              ]}>
                {day.date}
              </Text>
            </View>
            {day.underBudget === true && (
              <Text style={styles.dayCheckmark}>✓</Text>
            )}
            {day.underBudget === false && (
              <Text style={styles.dayX}>✗</Text>
            )}
          </Animated.View>
        ))}
      </Animated.View>

      {/* Progress to Next Milestone */}
      {nextMilestone > 0 && (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <Text style={styles.milestoneLabel}>다음 목표</Text>
            <Text style={styles.milestoneTarget}>{nextMilestone}일</Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[Colors.purplePrimary, Colors.goldPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(progressToNext, 100)}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {streakData.currentStreak}/{nextMilestone}일 달성
          </Text>
        </Animated.View>
      )}

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{streakData.longestStreak}</Text>
          <Text style={styles.statLabel}>최장 연속</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{streakData.totalUnderBudgetDays}</Text>
          <Text style={styles.statLabel}>총 성공일</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {streakData.milestones.filter((m) => m.achieved).length}
          </Text>
          <Text style={styles.statLabel}>달성 목표</Text>
        </View>
      </Animated.View>

      {/* Milestones */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.milestonesGrid}>
        {streakData.milestones.slice(0, 6).map((milestone, index) => (
          <View
            key={milestone.days}
            style={[
              styles.milestoneItem,
              milestone.achieved && styles.milestoneAchieved,
            ]}
          >
            <Text style={styles.milestoneDays}>{milestone.days}일</Text>
            {milestone.achieved ? (
              <Text style={styles.milestoneCheck}>🏅</Text>
            ) : (
              <Text style={styles.milestoneLock}>🔒</Text>
            )}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  streakHeader: {},
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  streakEmoji: {
    fontSize: 48,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  streakLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  streakBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  streakBadgeText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  weeklyCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  dayColumn: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dayLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  dayLabelToday: {
    color: Colors.goldPrimary,
    fontWeight: '600',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  dayCircleFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: Colors.goldPrimary,
  },
  dayDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dayDateSuccess: {
    color: Colors.success,
  },
  dayDateFail: {
    color: Colors.error,
  },
  dayCheckmark: {
    fontSize: 12,
    color: Colors.success,
  },
  dayX: {
    fontSize: 12,
    color: Colors.error,
  },
  milestoneSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  milestoneLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  milestoneTarget: {
    fontSize: FontSizes.md,
    color: Colors.goldPrimary,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  milestoneAchieved: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: Colors.goldPrimary,
  },
  milestoneDays: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  milestoneCheck: {
    fontSize: 14,
  },
  milestoneLock: {
    fontSize: 12,
  },
});

export default SpendingStreaks;
