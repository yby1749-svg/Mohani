import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';

interface Expense {
  id: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  date: Date;
}

interface SpendingForecastProps {
  expenses: Expense[];
  monthlyBudget: number;
  monthlyIncome: number;
}

interface ForecastData {
  projectedMonthlyTotal: number;
  projectedEndOfMonth: number;
  dailyAverage: number;
  recommendedDailyBudget: number;
  daysRemaining: number;
  categoryForecasts: {
    category: string;
    categoryLabel: string;
    categoryIcon: string;
    currentSpent: number;
    projected: number;
    trend: 'up' | 'down' | 'stable';
    percentChange: number;
  }[];
  insights: {
    icon: string;
    text: string;
    type: 'info' | 'warning' | 'success';
  }[];
}

export const SpendingForecast: React.FC<SpendingForecastProps> = ({
  expenses,
  monthlyBudget,
  monthlyIncome,
}) => {
  const forecast = useMemo((): ForecastData | null => {
    if (expenses.length < 3) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // Get this month's expenses
    const thisMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Get last month's expenses for comparison
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    // Calculate totals
    const currentMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Daily average (based on days passed)
    const dailyAverage = dayOfMonth > 0 ? currentMonthTotal / dayOfMonth : 0;

    // Projected end of month total
    const projectedMonthlyTotal = dailyAverage * daysInMonth;
    const projectedEndOfMonth = currentMonthTotal + (dailyAverage * daysRemaining);

    // Recommended daily budget
    const budgetRemaining = monthlyBudget - currentMonthTotal;
    const recommendedDailyBudget = daysRemaining > 0 ? Math.max(0, budgetRemaining / daysRemaining) : 0;

    // Category forecasts
    const categoryMap = new Map<string, {
      label: string;
      icon: string;
      thisMonth: number;
      lastMonth: number;
    }>();

    thisMonthExpenses.forEach((e) => {
      const existing = categoryMap.get(e.category);
      if (existing) {
        existing.thisMonth += e.amount;
      } else {
        categoryMap.set(e.category, {
          label: e.categoryLabel,
          icon: e.categoryIcon,
          thisMonth: e.amount,
          lastMonth: 0,
        });
      }
    });

    lastMonthExpenses.forEach((e) => {
      const existing = categoryMap.get(e.category);
      if (existing) {
        existing.lastMonth += e.amount;
      } else {
        categoryMap.set(e.category, {
          label: e.categoryLabel,
          icon: e.categoryIcon,
          thisMonth: 0,
          lastMonth: e.amount,
        });
      }
    });

    const categoryForecasts = Array.from(categoryMap.entries())
      .map(([category, data]) => {
        const projectedCategory = (data.thisMonth / dayOfMonth) * daysInMonth;
        const percentChange = data.lastMonth > 0
          ? ((projectedCategory - data.lastMonth) / data.lastMonth) * 100
          : 0;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (percentChange > 10) trend = 'up';
        else if (percentChange < -10) trend = 'down';

        return {
          category,
          categoryLabel: data.label,
          categoryIcon: data.icon,
          currentSpent: data.thisMonth,
          projected: projectedCategory,
          trend,
          percentChange,
        };
      })
      .sort((a, b) => b.projected - a.projected)
      .slice(0, 5);

    // Generate insights
    const insights: ForecastData['insights'] = [];

    if (projectedMonthlyTotal > monthlyBudget) {
      const overBy = projectedMonthlyTotal - monthlyBudget;
      insights.push({
        icon: '⚠️',
        text: `이 속도면 예산을 ₩${Math.round(overBy).toLocaleString()} 초과할 것으로 예상돼요`,
        type: 'warning',
      });
    } else if (projectedMonthlyTotal < monthlyBudget * 0.8) {
      insights.push({
        icon: '🎉',
        text: `예산의 ${Math.round((projectedMonthlyTotal / monthlyBudget) * 100)}%만 사용할 것으로 예상돼요`,
        type: 'success',
      });
    }

    if (recommendedDailyBudget < dailyAverage * 0.5 && daysRemaining > 5) {
      insights.push({
        icon: '📉',
        text: `하루 지출을 ₩${Math.round(recommendedDailyBudget).toLocaleString()}으로 줄여야 해요`,
        type: 'warning',
      });
    }

    const highestCategory = categoryForecasts[0];
    if (highestCategory && highestCategory.trend === 'up' && highestCategory.percentChange > 30) {
      insights.push({
        icon: highestCategory.categoryIcon,
        text: `${highestCategory.categoryLabel} 지출이 지난달보다 ${Math.round(highestCategory.percentChange)}% 증가 중이에요`,
        type: 'info',
      });
    }

    if (monthlyIncome > 0 && projectedMonthlyTotal > monthlyIncome * 0.9) {
      insights.push({
        icon: '💸',
        text: '수입 대비 지출이 너무 많아요',
        type: 'warning',
      });
    }

    return {
      projectedMonthlyTotal,
      projectedEndOfMonth,
      dailyAverage,
      recommendedDailyBudget,
      daysRemaining,
      categoryForecasts,
      insights,
    };
  }, [expenses, monthlyBudget, monthlyIncome]);

  if (!forecast) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔮</Text>
        <Text style={styles.emptyText}>지출 데이터가 더 쌓이면 예측해드려요</Text>
        <Text style={styles.emptySubtext}>최소 3건 이상의 지출이 필요해요</Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return Math.round(amount).toLocaleString();
  };

  const budgetProgress = (forecast.projectedMonthlyTotal / monthlyBudget) * 100;

  return (
    <View style={styles.container}>
      {/* Main Forecast */}
      <View style={styles.mainForecast}>
        <View style={styles.forecastHeader}>
          <Text style={styles.forecastLabel}>이번 달 예상 지출</Text>
          <Text style={styles.daysRemaining}>{forecast.daysRemaining}일 남음</Text>
        </View>
        <Text style={[
          styles.forecastAmount,
          { color: forecast.projectedMonthlyTotal > monthlyBudget ? '#EF4444' : Colors.textPrimary }
        ]}>
          ₩{Math.round(forecast.projectedMonthlyTotal).toLocaleString()}
        </Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={
                budgetProgress > 100
                  ? ['#EF4444', '#DC2626']
                  : budgetProgress > 80
                  ? ['#F59E0B', '#D97706']
                  : ['#7c3aed', '#6d28d9']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(budgetProgress, 100)}%` }]}
            />
          </View>
          <Text style={styles.progressText}>예산 대비 {Math.round(budgetProgress)}%</Text>
        </View>
      </View>

      {/* Daily Stats */}
      <View style={styles.dailyStats}>
        <View style={styles.dailyStat}>
          <Text style={styles.dailyStatLabel}>일 평균 지출</Text>
          <Text style={styles.dailyStatValue}>₩{formatCurrency(forecast.dailyAverage)}</Text>
        </View>
        <View style={styles.dailyDivider} />
        <View style={styles.dailyStat}>
          <Text style={styles.dailyStatLabel}>권장 일 예산</Text>
          <Text style={[
            styles.dailyStatValue,
            { color: forecast.recommendedDailyBudget < forecast.dailyAverage ? '#F59E0B' : '#22C55E' }
          ]}>
            ₩{formatCurrency(forecast.recommendedDailyBudget)}
          </Text>
        </View>
      </View>

      {/* Category Forecasts */}
      {forecast.categoryForecasts.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>카테고리별 예상</Text>
          {forecast.categoryForecasts.map((cat, index) => (
            <Animated.View
              key={cat.category}
              entering={FadeInDown.delay(index * 80).duration(250)}
              style={styles.categoryItem}
            >
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryIcon}>{cat.categoryIcon}</Text>
                <View>
                  <Text style={styles.categoryLabel}>{cat.categoryLabel}</Text>
                  <Text style={styles.categorySpent}>
                    현재 ₩{formatCurrency(cat.currentSpent)}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryProjected}>₩{formatCurrency(cat.projected)}</Text>
                <View style={[
                  styles.trendBadge,
                  cat.trend === 'up' && styles.trendUp,
                  cat.trend === 'down' && styles.trendDown,
                ]}>
                  <Text style={styles.trendText}>
                    {cat.trend === 'up' ? '▲' : cat.trend === 'down' ? '▼' : '−'}
                    {Math.abs(Math.round(cat.percentChange))}%
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Insights */}
      {forecast.insights.length > 0 && (
        <View style={styles.insightsSection}>
          {forecast.insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightItem,
                insight.type === 'warning' && styles.insightWarning,
                insight.type === 'success' && styles.insightSuccess,
              ]}
            >
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  mainForecast: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  forecastLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  daysRemaining: {
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
    fontWeight: '500',
  },
  forecastAmount: {
    fontSize: FontSizes.hero,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  progressContainer: {},
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  dailyStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dailyStat: {
    flex: 1,
    alignItems: 'center',
  },
  dailyDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  dailyStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  dailyStatValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  categorySpent: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryProjected: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  trendBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 2,
  },
  trendUp: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendDown: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  trendText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  insightsSection: {
    gap: Spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  insightWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  insightSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  insightIcon: {
    fontSize: 16,
  },
  insightText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
});
