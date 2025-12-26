import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useGoals, SavingsGoal } from '../context/GoalsContext';
import { useIncome } from '../context/IncomeContext';
import { useExpenses } from '../context/ExpenseContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  Gradients,
  LightGradients,
} from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface GoalWithProjection extends SavingsGoal {
  progress: number;
  remaining: number;
  daysRemaining: number | null;
  projectedCompletionDate: Date | null;
  isOnTrack: boolean;
  monthlySavingsNeeded: number;
  status: 'completed' | 'on-track' | 'behind' | 'at-risk';
}

export const SavingsGoalsWidget: React.FC = () => {
  const navigation = useNavigation();
  const { goals } = useGoals();
  const { getTotalIncomeThisMonth } = useIncome();
  const { getMonthlyTotal } = useExpenses();
  const { colors, isDark } = useTheme();
  const gradients = isDark ? Gradients : LightGradients;

  // Calculate monthly savings rate
  const monthlySavingsRate = useMemo(() => {
    const income = getTotalIncomeThisMonth();
    const expenses = getMonthlyTotal();
    return Math.max(0, income - expenses);
  }, [getTotalIncomeThisMonth, getMonthlyTotal]);

  // Calculate projections for each goal
  const goalsWithProjections = useMemo((): GoalWithProjection[] => {
    const now = new Date();

    return goals
      .filter((goal) => !goal.isCompleted)
      .map((goal) => {
        const progress = goal.targetAmount > 0
          ? (goal.currentAmount / goal.targetAmount) * 100
          : 0;
        const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

        // Calculate days since creation
        const daysSinceCreation = Math.max(1, Math.floor(
          (now.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ));

        // Calculate daily savings rate for this goal (based on actual progress)
        const dailySavingsRate = goal.currentAmount / daysSinceCreation;

        // Calculate projected completion
        let projectedCompletionDate: Date | null = null;
        let daysRemaining: number | null = null;

        if (dailySavingsRate > 0 && remaining > 0) {
          const daysNeeded = Math.ceil(remaining / dailySavingsRate);
          daysRemaining = daysNeeded;
          projectedCompletionDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
        } else if (remaining === 0) {
          daysRemaining = 0;
          projectedCompletionDate = now;
        }

        // Check if on track (compared to deadline if exists)
        let isOnTrack = true;
        let status: GoalWithProjection['status'] = 'on-track';

        if (goal.isCompleted) {
          status = 'completed';
        } else if (goal.deadline) {
          const deadlineDate = new Date(goal.deadline);
          const daysToDeadline = Math.floor(
            (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysToDeadline <= 0) {
            isOnTrack = false;
            status = 'at-risk';
          } else if (projectedCompletionDate && projectedCompletionDate > deadlineDate) {
            isOnTrack = false;
            status = 'behind';
          }
        }

        // Calculate monthly savings needed to meet deadline
        let monthlySavingsNeeded = 0;
        if (goal.deadline && remaining > 0) {
          const deadlineDate = new Date(goal.deadline);
          const monthsRemaining = Math.max(1,
            (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
            (deadlineDate.getMonth() - now.getMonth())
          );
          monthlySavingsNeeded = remaining / monthsRemaining;
        }

        return {
          ...goal,
          progress: Math.min(100, progress),
          remaining,
          daysRemaining,
          projectedCompletionDate,
          isOnTrack,
          monthlySavingsNeeded,
          status,
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [goals]);

  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${year}.${month}.${day}`;
  };

  const formatDaysRemaining = (days: number | null): string => {
    if (days === null) return '계산중...';
    if (days === 0) return '완료!';
    if (days < 30) return `${days}일 후`;
    if (days < 365) return `약 ${Math.round(days / 30)}개월 후`;
    return `약 ${(days / 365).toFixed(1)}년 후`;
  };

  const getStatusColor = (status: GoalWithProjection['status']) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'on-track': return colors.purplePrimary;
      case 'behind': return '#f59e0b';
      case 'at-risk': return colors.error;
      default: return colors.purplePrimary;
    }
  };

  const getStatusLabel = (status: GoalWithProjection['status']) => {
    switch (status) {
      case 'completed': return '완료';
      case 'on-track': return '순조로움';
      case 'behind': return '지연 중';
      case 'at-risk': return '위험';
      default: return '';
    }
  };

  if (goalsWithProjections.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🎯</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>저축 목표</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.purplePrimary }]}>
            <Text style={[styles.countText, { color: colors.text }]}>{goalsWithProjections.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Goals' as never);
          }}
        >
          <Text style={[styles.viewAllText, { color: colors.purpleLight }]}>전체 보기</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.purpleLight} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {goalsWithProjections.slice(0, 5).map((goal, index) => (
          <Animated.View
            key={goal.id}
            entering={FadeInRight.delay(index * 80).duration(300)}
          >
            <TouchableOpacity
              style={[
                styles.goalCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                }
              ]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Goals' as never);
              }}
            >
              {/* Goal Header */}
              <View style={styles.goalHeader}>
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(goal.status)}20` }
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(goal.status) }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(goal.status) }
                  ]}>
                    {getStatusLabel(goal.status)}
                  </Text>
                </View>
              </View>

              {/* Goal Name */}
              <Text style={[styles.goalName, { color: colors.text }]} numberOfLines={1}>{goal.name}</Text>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <LinearGradient
                    colors={goal.status === 'on-track' || goal.status === 'completed'
                      ? gradients.purple as [string, string]
                      : ['#f59e0b', '#f97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${goal.progress}%` }]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.purpleLight }]}>{Math.round(goal.progress)}%</Text>
              </View>

              {/* Amount Info */}
              <View style={styles.amountRow}>
                <Text style={[styles.currentAmount, { color: colors.goldPrimary }]}>
                  ₩{goal.currentAmount.toLocaleString()}
                </Text>
                <Text style={[styles.targetAmount, { color: colors.textMuted }]}>
                  / ₩{goal.targetAmount.toLocaleString()}
                </Text>
              </View>

              {/* Projection Info */}
              <View style={styles.projectionRow}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.projectionText, { color: colors.textMuted }]}>
                  {goal.projectedCompletionDate
                    ? formatDaysRemaining(goal.daysRemaining)
                    : '저축을 시작하세요'}
                </Text>
              </View>

              {/* Remaining or Monthly Needed */}
              {goal.remaining > 0 && (
                <View style={[styles.remainingRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  <Text style={[styles.remainingLabel, { color: colors.textMuted }]}>남은 금액</Text>
                  <Text style={[styles.remainingValue, { color: colors.textSecondary }]}>
                    ₩{goal.remaining.toLocaleString()}
                  </Text>
                </View>
              )}

              {/* Deadline Warning */}
              {goal.status === 'behind' && goal.monthlySavingsNeeded > 0 && (
                <View style={styles.warningRow}>
                  <Ionicons name="warning" size={12} color="#f59e0b" />
                  <Text style={styles.warningText}>
                    월 ₩{Math.round(goal.monthlySavingsNeeded).toLocaleString()} 필요
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Add New Goal Card */}
        <Animated.View entering={FadeInRight.delay(goalsWithProjections.length * 80).duration(300)}>
          <TouchableOpacity
            style={[
              styles.addGoalCard,
              {
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.25)',
              }
            ]}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Goals' as never);
            }}
          >
            <View style={[styles.addIconCircle, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="add" size={24} color={colors.purpleLight} />
            </View>
            <Text style={[styles.addGoalText, { color: colors.purpleLight }]}>새 목표</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Summary Card */}
      {goalsWithProjections.length > 0 && (
        <View style={[
          styles.summaryCard,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          }
        ]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>총 저축액</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₩{goalsWithProjections.reduce((sum, g) => sum + g.currentAmount, 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>목표 금액</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₩{goalsWithProjections.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>월 저축</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              ₩{monthlySavingsRate.toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.purplePrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
  },
  scrollContent: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  goalIcon: {
    fontSize: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  goalName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.purpleLight,
    width: 35,
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currentAmount: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.goldPrimary,
  },
  targetAmount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  projectionText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  remainingLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  remainingValue: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 4,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 10,
    color: '#f59e0b',
  },
  addGoalCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: 100,
    height: 160,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGoalText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
    fontWeight: '500',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default SavingsGoalsWidget;
