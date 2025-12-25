import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground } from '../components';
import { useSpendingStreaks } from '../context/SpendingStreaksContext';
import { useSettings } from '../context/SettingsContext';
import {
  STREAK_MILESTONES,
  formatStreak,
  getDayNameKo,
  calculateSavingsRate,
} from '../utils/streaks';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

export default function SpendingStreaksScreen() {
  const {
    streakData,
    unlockedMilestones,
    totalStreakPoints,
    currentMilestone,
    nextMilestone,
    streakStatus,
    claimMilestoneReward,
    hasUnclaimedRewards,
  } = useSpendingStreaks();
  const { settings } = useSettings();

  const savingsRate = useMemo(
    () => calculateSavingsRate(streakData),
    [streakData]
  );

  const progressToNextMilestone = useMemo(() => {
    if (!nextMilestone) return 100;
    const prevMilestone = currentMilestone?.days || 0;
    const range = nextMilestone.days - prevMilestone;
    const progress = streakData.currentStreak - prevMilestone;
    return Math.round((progress / range) * 100);
  }, [streakData.currentStreak, currentMilestone, nextMilestone]);

  const handleClaimReward = (days: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    claimMilestoneReward(days);
  };

  const formatBudget = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header showMenu={false} showNotification={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.screenHeader}
        >
          <Text style={styles.screenTitle}>Spending Streaks</Text>
          <Text style={styles.screenSubtitle}>예산 내 지출 연속 기록</Text>
        </Animated.View>

        {/* Current Streak Hero Card */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <GlassCard gradient={Gradients.cardPurple} borderColor={Colors.borderPurple}>
            <View style={styles.heroCard}>
              <View style={styles.streakEmojiContainer}>
                <Text style={styles.streakEmoji}>{streakStatus.emoji}</Text>
              </View>
              <Text style={styles.currentStreakNumber}>
                {streakData.currentStreak}
              </Text>
              <Text style={styles.currentStreakLabel}>일 연속</Text>
              <Text style={[styles.streakMessage, { color: streakStatus.color }]}>
                {streakStatus.message}
              </Text>

              {/* Progress to next milestone */}
              {nextMilestone && (
                <View style={styles.nextMilestoneProgress}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>
                      다음 목표: {nextMilestone.icon} {nextMilestone.titleKo}
                    </Text>
                    <Text style={styles.progressDays}>
                      {nextMilestone.days - streakData.currentStreak}일 남음
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressToNextMilestone}%` },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.statsRow}
        >
          <GlassCard style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{streakData.longestStreak}</Text>
            <Text style={styles.statLabel}>최장 기록</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{savingsRate}%</Text>
            <Text style={styles.statLabel}>절약률</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{totalStreakPoints}</Text>
            <Text style={styles.statLabel}>포인트</Text>
          </GlassCard>
        </Animated.View>

        {/* Weekly Progress */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <Text style={styles.sectionTitle}>📅 이번 주 현황</Text>
          <GlassCard>
            <View style={styles.weeklyGrid}>
              {streakData.weeklyProgress.map((day, index) => {
                const isToday =
                  new Date(day.date).toDateString() === new Date().toDateString();
                const hasSpending = day.spent > 0;

                return (
                  <Animated.View
                    key={day.dateString}
                    entering={FadeIn.delay(300 + index * 50).duration(200)}
                    style={styles.dayColumn}
                  >
                    <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                      {getDayNameKo(new Date(day.date))}
                    </Text>
                    <View
                      style={[
                        styles.dayCircle,
                        hasSpending && day.isUnderBudget && styles.daySuccess,
                        hasSpending && !day.isUnderBudget && styles.dayFail,
                        !hasSpending && styles.dayEmpty,
                        isToday && styles.dayToday,
                      ]}
                    >
                      {hasSpending ? (
                        <Text style={styles.dayIcon}>
                          {day.isUnderBudget ? '✓' : '✗'}
                        </Text>
                      ) : (
                        <Text style={styles.dayIconEmpty}>-</Text>
                      )}
                    </View>
                    <Text style={styles.dayAmount}>
                      {hasSpending
                        ? `₩${Math.round(day.spent / 1000)}K`
                        : '-'}
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
            <View style={styles.weeklyLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.daySuccess]} />
                <Text style={styles.legendText}>예산 내</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.dayFail]} />
                <Text style={styles.legendText}>초과</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.dayEmpty]} />
                <Text style={styles.legendText}>기록 없음</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Daily Budget Info */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard style={styles.budgetInfoCard}>
            <View style={styles.budgetInfoRow}>
              <Text style={styles.budgetInfoLabel}>일일 예산</Text>
              <Text style={styles.budgetInfoValue}>
                {formatBudget(
                  Math.floor(
                    settings.monthlyBudget /
                      new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        0
                      ).getDate()
                  )
                )}
              </Text>
            </View>
            <View style={styles.budgetInfoRow}>
              <Text style={styles.budgetInfoLabel}>월 예산</Text>
              <Text style={styles.budgetInfoValue}>
                {formatBudget(settings.monthlyBudget)}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Milestones */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <Text style={styles.sectionTitle}>🎯 마일스톤</Text>

          {/* Unclaimed Rewards */}
          {hasUnclaimedRewards && (
            <View style={styles.unclaimedSection}>
              {unlockedMilestones
                .filter((u) => !u.claimed)
                .map((unlocked) => (
                  <TouchableOpacity
                    key={unlocked.milestone.days}
                    style={styles.unclaimedCard}
                    onPress={() => handleClaimReward(unlocked.milestone.days)}
                  >
                    <LinearGradient
                      colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']}
                      style={styles.unclaimedGradient}
                    >
                      <Text style={styles.unclaimedIcon}>
                        {unlocked.milestone.icon}
                      </Text>
                      <View style={styles.unclaimedInfo}>
                        <Text style={styles.unclaimedTitle}>
                          {unlocked.milestone.titleKo} 달성!
                        </Text>
                        <Text style={styles.unclaimedDesc}>
                          +{unlocked.milestone.reward}P 획득 가능
                        </Text>
                      </View>
                      <View style={styles.claimButton}>
                        <Text style={styles.claimButtonText}>받기</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* All Milestones */}
          <View style={styles.milestonesGrid}>
            {STREAK_MILESTONES.map((milestone, index) => {
              const isAchieved = streakData.currentStreak >= milestone.days;
              const isClaimed = unlockedMilestones.some(
                (u) => u.milestone.days === milestone.days && u.claimed
              );
              const isNext = nextMilestone?.days === milestone.days;

              return (
                <Animated.View
                  key={milestone.days}
                  entering={FadeIn.delay(400 + index * 30).duration(200)}
                  style={styles.milestoneCard}
                >
                  <View
                    style={[
                      styles.milestoneInner,
                      isAchieved && styles.milestoneAchieved,
                      isNext && styles.milestoneNext,
                    ]}
                  >
                    <Text
                      style={[
                        styles.milestoneIcon,
                        !isAchieved && styles.milestoneIconLocked,
                      ]}
                    >
                      {isAchieved ? milestone.icon : '🔒'}
                    </Text>
                    <Text style={styles.milestoneDays}>{milestone.days}일</Text>
                    <Text style={styles.milestoneTitle}>{milestone.titleKo}</Text>
                    <Text style={styles.milestoneReward}>
                      {isClaimed ? '✓ 획득' : `+${milestone.reward}P`}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Monthly Calendar */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={styles.sectionTitle}>📊 이번 달 기록</Text>
          <GlassCard>
            <View style={styles.monthlyStats}>
              <View style={styles.monthlyStatItem}>
                <Text style={styles.monthlyStatValue}>
                  {streakData.totalDaysUnderBudget}
                </Text>
                <Text style={styles.monthlyStatLabel}>예산 내 일수</Text>
              </View>
              <View style={styles.monthlyStatDivider} />
              <View style={styles.monthlyStatItem}>
                <Text style={styles.monthlyStatValue}>
                  {streakData.totalDaysTracked}
                </Text>
                <Text style={styles.monthlyStatLabel}>총 기록 일수</Text>
              </View>
              <View style={styles.monthlyStatDivider} />
              <View style={styles.monthlyStatItem}>
                <Text style={styles.monthlyStatValue}>
                  {streakData.totalDaysTracked > 0
                    ? Math.round(
                        (streakData.totalDaysUnderBudget /
                          streakData.totalDaysTracked) *
                          100
                      )
                    : 0}
                  %
                </Text>
                <Text style={styles.monthlyStatLabel}>성공률</Text>
              </View>
            </View>

            {/* Mini Calendar */}
            <View style={styles.miniCalendar}>
              {streakData.monthlyProgress.map((day, index) => {
                const hasSpending = day.spent > 0;
                const isToday =
                  new Date(day.date).toDateString() === new Date().toDateString();

                return (
                  <View
                    key={day.dateString}
                    style={[
                      styles.calendarDay,
                      hasSpending && day.isUnderBudget && styles.calendarDaySuccess,
                      hasSpending && !day.isUnderBudget && styles.calendarDayFail,
                      !hasSpending && styles.calendarDayEmpty,
                      isToday && styles.calendarDayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isToday && styles.calendarDayTextToday,
                      ]}
                    >
                      {new Date(day.date).getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(450).duration(500)}>
          <GlassCard style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              매일 일일 예산 내에서 지출하면 연속 기록이 쌓입니다.
              연속 기록을 유지하면 마일스톤을 달성하고 포인트를 획득할 수 있어요!
            </Text>
          </GlassCard>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  screenHeader: {
    marginBottom: Spacing.xl,
  },
  screenTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  streakEmojiContainer: {
    marginBottom: Spacing.md,
  },
  streakEmoji: {
    fontSize: 64,
  },
  currentStreakNumber: {
    fontSize: 72,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 80,
  },
  currentStreakLabel: {
    fontSize: FontSizes.xl,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  streakMessage: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  nextMilestoneProgress: {
    width: '100%',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  progressDays: {
    fontSize: FontSizes.sm,
    color: Colors.goldPrimary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.goldPrimary,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  dayNameToday: {
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  daySuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  dayFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  dayEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayToday: {
    borderWidth: 2,
    borderColor: Colors.purplePrimary,
  },
  dayIcon: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  dayIconEmpty: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  dayAmount: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  weeklyLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  budgetInfoCard: {
    marginTop: Spacing.lg,
  },
  budgetInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  budgetInfoLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  budgetInfoValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  unclaimedSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  unclaimedCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  unclaimedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  unclaimedIcon: {
    fontSize: 32,
  },
  unclaimedInfo: {
    flex: 1,
  },
  unclaimedTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  unclaimedDesc: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  claimButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  milestoneCard: {
    width: '47%',
  },
  milestoneInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  milestoneAchieved: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  milestoneNext: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  milestoneIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  milestoneIconLocked: {
    opacity: 0.5,
  },
  milestoneDays: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  milestoneTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  milestoneReward: {
    fontSize: FontSizes.xs,
    color: Colors.goldPrimary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  monthlyStats: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  monthlyStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyStatValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  monthlyStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  monthlyStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  miniCalendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  calendarDayFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  calendarDayEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: Colors.purplePrimary,
  },
  calendarDayText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  calendarDayTextToday: {
    color: Colors.purpleLight,
    fontWeight: '700',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});
