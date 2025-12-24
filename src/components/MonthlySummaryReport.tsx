import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { useExpenses } from '../context/ExpenseContext';
import { useIncome } from '../context/IncomeContext';
import { useCategoryBudgets } from '../context/CategoryBudgetContext';

const { width } = Dimensions.get('window');

interface MonthData {
  month: Date;
  totalExpense: number;
  totalIncome: number;
  savings: number;
  savingsRate: number;
  topCategories: { category: string; amount: number; icon: string }[];
  transactionCount: number;
  avgDailySpending: number;
  peakSpendingDay: { day: number; amount: number };
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍚',
  transport: '🚗',
  shopping: '🛒',
  entertainment: '🎬',
  health: '💊',
  education: '📚',
  cafe: '☕',
  utility: '💡',
  housing: '🏠',
  other: '📦',
};

const MonthlySummaryReport: React.FC = () => {
  const { expenses } = useExpenses();
  const { getTotalIncome } = useIncome();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const getMonthData = (date: Date): MonthData => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
    });

    const totalExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = getTotalIncome(month, year);
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Top categories
    const categoryTotals: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        icon: CATEGORY_ICONS[category] || '📦',
      }));

    // Daily spending analysis
    const dailySpending: Record<number, number> = {};
    monthExpenses.forEach((e) => {
      const day = new Date(e.date).getDate();
      dailySpending[day] = (dailySpending[day] || 0) + e.amount;
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const avgDailySpending = totalExpense / daysInMonth;

    let peakDay = { day: 1, amount: 0 };
    Object.entries(dailySpending).forEach(([day, amount]) => {
      if (amount > peakDay.amount) {
        peakDay = { day: parseInt(day), amount };
      }
    });

    return {
      month: date,
      totalExpense,
      totalIncome,
      savings,
      savingsRate,
      topCategories,
      transactionCount: monthExpenses.length,
      avgDailySpending,
      peakSpendingDay: peakDay,
    };
  };

  const monthData = getMonthData(selectedMonth);

  const formatCurrency = (amount: number): string => {
    return `₩${amount.toLocaleString()}`;
  };

  const formatMonth = (date: Date): string => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const getGrade = (): { grade: string; color: string; message: string } => {
    const rate = monthData.savingsRate;
    if (rate >= 30) return { grade: 'A+', color: '#22C55E', message: '훌륭한 저축률!' };
    if (rate >= 20) return { grade: 'A', color: '#22C55E', message: '좋은 저축 습관!' };
    if (rate >= 10) return { grade: 'B', color: '#F59E0B', message: '적정 수준입니다' };
    if (rate >= 0) return { grade: 'C', color: '#EF4444', message: '저축률을 높여보세요' };
    return { grade: 'D', color: '#EF4444', message: '지출이 수입을 초과했어요' };
  };

  const gradeInfo = getGrade();

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <LinearGradient
          colors={['rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.05)']}
          style={styles.headerCard}
        >
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
              <Text style={styles.navText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{formatMonth(selectedMonth)}</Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
              <Text style={styles.navText}>▶</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gradeContainer}>
            <View style={[styles.gradeBadge, { borderColor: gradeInfo.color }]}>
              <Text style={[styles.gradeText, { color: gradeInfo.color }]}>
                {gradeInfo.grade}
              </Text>
            </View>
            <Text style={styles.gradeMessage}>{gradeInfo.message}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Overview Cards */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.overviewRow}>
        <View style={[styles.overviewCard, styles.incomeCard]}>
          <Text style={styles.overviewLabel}>수입</Text>
          <Text style={[styles.overviewAmount, { color: Colors.success }]}>
            {formatCurrency(monthData.totalIncome)}
          </Text>
        </View>
        <View style={[styles.overviewCard, styles.expenseCard]}>
          <Text style={styles.overviewLabel}>지출</Text>
          <Text style={[styles.overviewAmount, { color: Colors.error }]}>
            {formatCurrency(monthData.totalExpense)}
          </Text>
        </View>
      </Animated.View>

      {/* Savings Summary */}
      <Animated.View entering={FadeInDown.delay(300)}>
        <View style={styles.savingsCard}>
          <View style={styles.savingsHeader}>
            <Text style={styles.cardTitle}>💰 저축 현황</Text>
            <Text style={[styles.savingsRate, { color: monthData.savings >= 0 ? Colors.success : Colors.error }]}>
              {monthData.savingsRate.toFixed(1)}%
            </Text>
          </View>
          <Text style={[styles.savingsAmount, { color: monthData.savings >= 0 ? Colors.success : Colors.error }]}>
            {monthData.savings >= 0 ? '+' : ''}{formatCurrency(monthData.savings)}
          </Text>
          <View style={styles.savingsBar}>
            <View
              style={[
                styles.savingsProgress,
                {
                  width: `${Math.min(Math.max(monthData.savingsRate, 0), 100)}%`,
                  backgroundColor: monthData.savings >= 0 ? Colors.success : Colors.error,
                }
              ]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Statistics */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>📊 통계</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>거래 횟수</Text>
              <Text style={styles.statValue}>{monthData.transactionCount}건</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>일평균 지출</Text>
              <Text style={styles.statValue}>{formatCurrency(Math.round(monthData.avgDailySpending))}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>최다 지출일</Text>
              <Text style={styles.statValue}>{monthData.peakSpendingDay.day}일</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>최다 지출액</Text>
              <Text style={styles.statValue}>{formatCurrency(monthData.peakSpendingDay.amount)}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Top Categories */}
      <Animated.View entering={FadeInDown.delay(500)}>
        <View style={styles.categoriesCard}>
          <Text style={styles.cardTitle}>🏆 지출 TOP 5</Text>
          {monthData.topCategories.length > 0 ? (
            monthData.topCategories.map((cat, index) => {
              const percentage = monthData.totalExpense > 0
                ? (cat.amount / monthData.totalExpense) * 100
                : 0;
              return (
                <View key={cat.category} style={styles.categoryRow}>
                  <View style={styles.categoryRank}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{cat.category}</Text>
                    <View style={styles.categoryBar}>
                      <View
                        style={[styles.categoryProgress, { width: `${percentage}%` }]}
                      />
                    </View>
                  </View>
                  <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>이번 달 지출 내역이 없습니다</Text>
          )}
        </View>
      </Animated.View>

      {/* Insights */}
      <Animated.View entering={FadeInDown.delay(600)}>
        <View style={styles.insightsCard}>
          <Text style={styles.cardTitle}>💡 인사이트</Text>
          {monthData.totalIncome > 0 && (
            <>
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>📈</Text>
                <Text style={styles.insightText}>
                  수입 대비 지출 비율: {((monthData.totalExpense / monthData.totalIncome) * 100).toFixed(1)}%
                </Text>
              </View>
              {monthData.topCategories[0] && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>🎯</Text>
                  <Text style={styles.insightText}>
                    가장 많이 쓴 카테고리: {monthData.topCategories[0].icon} {monthData.topCategories[0].category}
                  </Text>
                </View>
              )}
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>📅</Text>
                <Text style={styles.insightText}>
                  {monthData.peakSpendingDay.day}일에 가장 많이 지출했어요 ({formatCurrency(monthData.peakSpendingDay.amount)})
                </Text>
              </View>
            </>
          )}
          {monthData.totalIncome === 0 && (
            <Text style={styles.emptyText}>수입을 등록하면 더 자세한 분석을 볼 수 있어요</Text>
          )}
        </View>
      </Animated.View>

      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  headerCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  navButton: {
    padding: Spacing.sm,
  },
  navText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.lg,
  },
  monthTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginHorizontal: Spacing.lg,
  },
  gradeContainer: {
    alignItems: 'center',
  },
  gradeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  gradeText: {
    fontSize: 32,
    fontWeight: '800',
  },
  gradeMessage: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  incomeCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  expenseCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  overviewLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  overviewAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  savingsCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  savingsRate: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  savingsAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  savingsBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  savingsProgress: {
    height: '100%',
    borderRadius: 4,
  },
  statsCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
  statItem: {
    width: '50%',
    paddingVertical: Spacing.sm,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  categoriesCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  categoryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rankNumber: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  categoryInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  categoryName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    marginBottom: 4,
  },
  categoryBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  categoryProgress: {
    height: '100%',
    backgroundColor: Colors.purplePrimary,
    borderRadius: 2,
  },
  categoryAmount: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  insightsCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  insightText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    flex: 1,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default MonthlySummaryReport;
