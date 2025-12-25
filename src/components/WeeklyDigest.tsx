import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { useExpenses } from '../context/ExpenseContext';
import { useSettings } from '../context/SettingsContext';

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍚',
  transport: '🚌',
  shopping: '🛍️',
  entertainment: '🎮',
  cafe: '☕',
  health: '💊',
  bills: '📄',
  education: '📚',
  other: '📦',
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const WeeklyDigest: React.FC = () => {
  const { expenses } = useExpenses();
  const { settings } = useSettings();

  const getWeekData = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
    });

    const totalSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const weeklyBudget = (settings.monthlyBudget / 30) * 7;
    const remaining = weeklyBudget - totalSpent;
    const percentUsed = (totalSpent / weeklyBudget) * 100;

    // Daily breakdown
    const dailySpending: number[] = Array(7).fill(0);
    weekExpenses.forEach((e) => {
      const day = new Date(e.date).getDay();
      dailySpending[day] += e.amount;
    });

    const maxDaily = Math.max(...dailySpending, 1);

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    weekExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([category, amount]) => ({
        category,
        amount,
        icon: CATEGORY_ICONS[category] || '📦',
        percent: (amount / totalSpent) * 100,
      }));

    // Find peak day
    const peakDayIndex = dailySpending.indexOf(maxDaily);
    const peakDay = DAY_NAMES[peakDayIndex];

    // Average daily spending
    const avgDaily = totalSpent / 7;
    const dailyBudget = weeklyBudget / 7;

    // Transaction count
    const transactionCount = weekExpenses.length;

    return {
      totalSpent,
      weeklyBudget,
      remaining,
      percentUsed,
      dailySpending,
      maxDaily,
      topCategories,
      peakDay,
      peakDayAmount: maxDaily,
      avgDaily,
      dailyBudget,
      transactionCount,
      startOfWeek,
      dayOfWeek,
    };
  };

  const data = getWeekData();

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000) {
      return `₩${(amount / 10000).toFixed(1)}만`;
    }
    return `₩${amount.toLocaleString()}`;
  };

  const getStatusColor = (): string => {
    if (data.percentUsed <= 70) return Colors.success;
    if (data.percentUsed <= 100) return Colors.warning;
    return Colors.error;
  };

  const getStatusMessage = (): string => {
    if (data.percentUsed <= 50) return '절약 잘 하고 있어요! 💪';
    if (data.percentUsed <= 70) return '계획대로 진행중! 👍';
    if (data.percentUsed <= 100) return '예산 주의! ⚠️';
    return '예산 초과! 🚨';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <View style={styles.headerRow}>
          <Text style={styles.headerIcon}>📊</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>이번 주 요약</Text>
            <Text style={styles.headerSubtitle}>
              {data.startOfWeek.getMonth() + 1}월 {data.startOfWeek.getDate()}일 ~ {DAY_NAMES[data.dayOfWeek]}요일
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Main Stats */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <LinearGradient
          colors={['rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.05)']}
          style={styles.mainCard}
        >
          <View style={styles.spentRow}>
            <Text style={styles.spentLabel}>총 지출</Text>
            <Text style={styles.spentAmount}>{formatCurrency(data.totalSpent)}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>예산</Text>
            <Text style={styles.budgetAmount}>{formatCurrency(data.weeklyBudget)}</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(data.percentUsed, 100)}%`,
                  backgroundColor: getStatusColor(),
                },
              ]}
            />
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
            <Text style={[styles.remainingText, { color: data.remaining >= 0 ? Colors.success : Colors.error }]}>
              {data.remaining >= 0 ? `남은 예산: ${formatCurrency(data.remaining)}` : `초과: ${formatCurrency(Math.abs(data.remaining))}`}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Daily Chart */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.chartSection}>
        <Text style={styles.sectionTitle}>일별 지출</Text>
        <View style={styles.chartContainer}>
          {data.dailySpending.map((amount, index) => {
            const height = (amount / data.maxDaily) * 80;
            const isToday = index === data.dayOfWeek;
            return (
              <Animated.View key={index} entering={FadeIn.delay(index * 50)} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(height, 4),
                        backgroundColor: isToday ? Colors.goldPrimary : Colors.purplePrimary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                  {DAY_NAMES[index]}
                </Text>
                <Text style={styles.barAmount}>
                  {amount > 0 ? `${(amount / 10000).toFixed(0)}만` : '-'}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* Quick Stats */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.quickStats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{data.transactionCount}건</Text>
          <Text style={styles.statLabel}>거래 횟수</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatCurrency(data.avgDaily)}</Text>
          <Text style={styles.statLabel}>일평균</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{data.peakDay}요일</Text>
          <Text style={styles.statLabel}>최다 지출</Text>
        </View>
      </Animated.View>

      {/* Top Categories */}
      {data.topCategories.length > 0 && (
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>카테고리별</Text>
          <View style={styles.categoriesGrid}>
            {data.topCategories.map((cat, index) => (
              <Animated.View
                key={cat.category}
                entering={FadeIn.delay(index * 50)}
                style={styles.categoryItem}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
                <Text style={styles.categoryPercent}>{cat.percent.toFixed(0)}%</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  mainCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  spentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  spentLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  spentAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  budgetLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  budgetAmount: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: FontSizes.sm,
  },
  chartSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 80,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  barLabelToday: {
    color: Colors.goldPrimary,
    fontWeight: '600',
  },
  barAmount: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  quickStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  categoryPercent: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});

export default WeeklyDigest;
