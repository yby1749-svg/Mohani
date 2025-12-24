import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';

const { width } = Dimensions.get('window');

interface Expense {
  id: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  note: string;
  date: Date;
}

interface MonthComparisonProps {
  expenses: Expense[];
  monthlyBudget: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#7c3aed',
  transport: '#3b82f6',
  shopping: '#ec4899',
  entertainment: '#8b5cf6',
  cafe: '#f59e0b',
  health: '#10b981',
  bills: '#64748b',
  other: '#6b7280',
};

const CATEGORY_NAMES: Record<string, string> = {
  food: '식비',
  transport: '교통',
  shopping: '쇼핑',
  entertainment: '여가',
  cafe: '카페',
  health: '건강',
  bills: '공과금',
  other: '기타',
};

export const MonthComparison: React.FC<MonthComparisonProps> = ({
  expenses,
  monthlyBudget,
}) => {
  const [compareMonths, setCompareMonths] = useState(1); // 1 = last month, 2 = 2 months ago

  const comparisonData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month expenses
    const currentMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Previous month expenses
    const prevMonth = currentMonth - compareMonths < 0
      ? 12 + (currentMonth - compareMonths)
      : currentMonth - compareMonths;
    const prevYear = currentMonth - compareMonths < 0
      ? currentYear - 1
      : currentYear;

    const prevMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    // Calculate totals
    const currentTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotal = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate change
    const change = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    const absoluteChange = currentTotal - prevTotal;

    // Category breakdown
    const currentByCategory: Record<string, number> = {};
    const prevByCategory: Record<string, number> = {};

    currentMonthExpenses.forEach((e) => {
      currentByCategory[e.category] = (currentByCategory[e.category] || 0) + e.amount;
    });

    prevMonthExpenses.forEach((e) => {
      prevByCategory[e.category] = (prevByCategory[e.category] || 0) + e.amount;
    });

    // All categories
    const allCategories = [...new Set([
      ...Object.keys(currentByCategory),
      ...Object.keys(prevByCategory),
    ])];

    const categoryComparison = allCategories.map((cat) => {
      const current = currentByCategory[cat] || 0;
      const prev = prevByCategory[cat] || 0;
      const catChange = prev > 0 ? ((current - prev) / prev) * 100 : (current > 0 ? 100 : 0);

      return {
        category: cat,
        name: CATEGORY_NAMES[cat] || cat,
        color: CATEGORY_COLORS[cat] || '#6b7280',
        current,
        prev,
        change: catChange,
        absoluteChange: current - prev,
      };
    }).sort((a, b) => Math.abs(b.absoluteChange) - Math.abs(a.absoluteChange));

    // Daily average
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysPassed = Math.min(now.getDate(), daysInCurrentMonth);
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    const currentDailyAvg = daysPassed > 0 ? currentTotal / daysPassed : 0;
    const prevDailyAvg = prevTotal / daysInPrevMonth;

    // Month names
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    return {
      currentMonth: monthNames[currentMonth],
      prevMonth: monthNames[prevMonth],
      currentTotal,
      prevTotal,
      change,
      absoluteChange,
      categoryComparison,
      currentDailyAvg,
      prevDailyAvg,
      transactionCount: {
        current: currentMonthExpenses.length,
        prev: prevMonthExpenses.length,
      },
    };
  }, [expenses, compareMonths]);

  const getChangeColor = (change: number) => {
    if (change > 10) return '#EF4444'; // Red - spending increased
    if (change < -10) return '#22C55E'; // Green - spending decreased
    return '#F59E0B'; // Yellow - similar
  };

  const getChangeIcon = (change: number) => {
    if (change > 5) return 'trending-up';
    if (change < -5) return 'trending-down';
    return 'remove';
  };

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodBtn, compareMonths === 1 && styles.periodBtnActive]}
          onPress={() => setCompareMonths(1)}
        >
          <Text style={[styles.periodText, compareMonths === 1 && styles.periodTextActive]}>
            지난달
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, compareMonths === 2 && styles.periodBtnActive]}
          onPress={() => setCompareMonths(2)}
        >
          <Text style={[styles.periodText, compareMonths === 2 && styles.periodTextActive]}>
            2개월 전
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, compareMonths === 3 && styles.periodBtnActive]}
          onPress={() => setCompareMonths(3)}
        >
          <Text style={[styles.periodText, compareMonths === 3 && styles.periodTextActive]}>
            3개월 전
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Comparison */}
      <View style={styles.mainComparison}>
        <View style={styles.monthColumn}>
          <Text style={styles.monthLabel}>{comparisonData.prevMonth}</Text>
          <Text style={styles.monthAmount}>
            ₩{comparisonData.prevTotal.toLocaleString()}
          </Text>
        </View>

        <View style={styles.changeIndicator}>
          <View style={[styles.changeIconBg, { backgroundColor: `${getChangeColor(comparisonData.change)}20` }]}>
            <Ionicons
              name={getChangeIcon(comparisonData.change)}
              size={24}
              color={getChangeColor(comparisonData.change)}
            />
          </View>
          <Text style={[styles.changePercent, { color: getChangeColor(comparisonData.change) }]}>
            {comparisonData.change > 0 ? '+' : ''}{comparisonData.change.toFixed(1)}%
          </Text>
          <Text style={styles.changeAbsolute}>
            {comparisonData.absoluteChange > 0 ? '+' : ''}₩{comparisonData.absoluteChange.toLocaleString()}
          </Text>
        </View>

        <View style={styles.monthColumn}>
          <Text style={styles.monthLabel}>{comparisonData.currentMonth}</Text>
          <Text style={[styles.monthAmount, styles.currentAmount]}>
            ₩{comparisonData.currentTotal.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatLabel}>일평균</Text>
          <View style={styles.quickStatValues}>
            <Text style={styles.quickStatPrev}>₩{Math.round(comparisonData.prevDailyAvg).toLocaleString()}</Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} />
            <Text style={styles.quickStatCurrent}>₩{Math.round(comparisonData.currentDailyAvg).toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatLabel}>거래 횟수</Text>
          <View style={styles.quickStatValues}>
            <Text style={styles.quickStatPrev}>{comparisonData.transactionCount.prev}건</Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} />
            <Text style={styles.quickStatCurrent}>{comparisonData.transactionCount.current}건</Text>
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>카테고리별 변화</Text>
        {comparisonData.categoryComparison.slice(0, 5).map((cat, index) => (
          <Animated.View
            key={cat.category}
            entering={FadeInDown.delay(index * 50).duration(300)}
            style={styles.categoryRow}
          >
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryName}>{cat.name}</Text>
            </View>
            <View style={styles.categoryAmounts}>
              <Text style={styles.categoryPrev}>₩{cat.prev.toLocaleString()}</Text>
              <Ionicons
                name={cat.change > 0 ? 'caret-up' : cat.change < 0 ? 'caret-down' : 'remove'}
                size={12}
                color={cat.change > 0 ? '#EF4444' : cat.change < 0 ? '#22C55E' : Colors.textMuted}
              />
              <Text style={styles.categoryCurrent}>₩{cat.current.toLocaleString()}</Text>
            </View>
            <Text style={[
              styles.categoryChange,
              { color: cat.change > 0 ? '#EF4444' : cat.change < 0 ? '#22C55E' : Colors.textMuted }
            ]}>
              {cat.change > 0 ? '+' : ''}{cat.change.toFixed(0)}%
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Insight */}
      <View style={styles.insightContainer}>
        <Text style={styles.insightIcon}>
          {comparisonData.change < -10 ? '🎉' : comparisonData.change > 10 ? '⚠️' : '👍'}
        </Text>
        <Text style={styles.insightText}>
          {comparisonData.change < -10
            ? `${comparisonData.prevMonth} 대비 ${Math.abs(comparisonData.change).toFixed(0)}% 절약했어요!`
            : comparisonData.change > 10
            ? `${comparisonData.prevMonth} 대비 지출이 증가했어요. 예산을 확인해보세요.`
            : `${comparisonData.prevMonth}과 비슷한 수준의 지출이에요.`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  periodBtnActive: {
    backgroundColor: Colors.purplePrimary,
  },
  periodText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  periodTextActive: {
    color: Colors.text,
  },
  mainComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  monthColumn: {
    alignItems: 'center',
    flex: 1,
  },
  monthLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  monthAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  currentAmount: {
    color: Colors.text,
  },
  changeIndicator: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  changeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  changePercent: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  changeAbsolute: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  quickStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  quickStatValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickStatPrev: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  quickStatCurrent: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  categoryName: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  categoryAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginRight: Spacing.md,
  },
  categoryPrev: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  categoryCurrent: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  categoryChange: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
});
