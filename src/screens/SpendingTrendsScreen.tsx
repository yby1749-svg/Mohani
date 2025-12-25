import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { AnimatedBackground, GlassCard } from '../components';
import { useExpenses } from '../context/ExpenseContext';
import { useSettings } from '../context/SettingsContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  Gradients,
} from '../constants/theme';

const { width } = Dimensions.get('window');

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  food: { label: '식비', icon: '🍜', color: '#f59e0b' },
  transport: { label: '교통', icon: '🚇', color: '#3b82f6' },
  shopping: { label: '쇼핑', icon: '🛍️', color: '#ec4899' },
  entertainment: { label: '여가', icon: '🎮', color: '#8b5cf6' },
  cafe: { label: '카페', icon: '☕', color: '#6366f1' },
  health: { label: '건강', icon: '💊', color: '#10b981' },
  bills: { label: '공과금', icon: '📄', color: '#64748b' },
  other: { label: '기타', icon: '📦', color: '#78716c' },
};

interface MonthlyData {
  month: string;
  year: number;
  monthNum: number;
  total: number;
  categories: Record<string, number>;
}

interface CategoryTrend {
  category: string;
  label: string;
  icon: string;
  color: string;
  currentMonth: number;
  lastMonth: number;
  twoMonthsAgo: number;
  threeMonthAvg: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  isImprovement: boolean;
}

export default function SpendingTrendsScreen() {
  const navigation = useNavigation();
  const { expenses } = useExpenses();
  const { settings } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m'>('3m');

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // Calculate monthly data for the last N months
  const monthlyData = useMemo((): MonthlyData[] => {
    const months = selectedPeriod === '3m' ? 3 : 6;
    const data: MonthlyData[] = [];
    const today = new Date();

    for (let i = 0; i < months; i++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const monthNum = targetDate.getMonth();

      const monthExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === monthNum && expenseDate.getFullYear() === year;
      });

      const categories: Record<string, number> = {};
      monthExpenses.forEach((e) => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
      });

      data.push({
        month: monthNames[monthNum],
        year,
        monthNum,
        total: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
        categories,
      });
    }

    return data;
  }, [expenses, selectedPeriod]);

  // Calculate category trends
  const categoryTrends = useMemo((): CategoryTrend[] => {
    const trends: CategoryTrend[] = [];
    const categories = Object.keys(CATEGORY_INFO);

    categories.forEach((cat) => {
      const info = CATEGORY_INFO[cat];
      const currentMonth = monthlyData[0]?.categories[cat] || 0;
      const lastMonth = monthlyData[1]?.categories[cat] || 0;
      const twoMonthsAgo = monthlyData[2]?.categories[cat] || 0;

      const threeMonthAvg = (currentMonth + lastMonth + twoMonthsAgo) / 3;
      const change = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';

      // For spending, down is improvement
      const isImprovement = trend === 'down';

      if (currentMonth > 0 || lastMonth > 0 || twoMonthsAgo > 0) {
        trends.push({
          category: cat,
          label: info.label,
          icon: info.icon,
          color: info.color,
          currentMonth,
          lastMonth,
          twoMonthsAgo,
          threeMonthAvg,
          change: Math.round(change),
          trend,
          isImprovement,
        });
      }
    });

    // Sort by absolute change
    return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [monthlyData]);

  // Overall trend
  const overallTrend = useMemo(() => {
    const currentMonth = monthlyData[0]?.total || 0;
    const lastMonth = monthlyData[1]?.total || 0;
    const change = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;
    const threeMonthAvg = monthlyData.slice(0, 3).reduce((sum, m) => sum + m.total, 0) / 3;

    return {
      currentMonth,
      lastMonth,
      change: Math.round(change),
      threeMonthAvg: Math.round(threeMonthAvg),
      isImprovement: change < 0,
      budgetUsage: settings.monthlyBudget > 0 ? (currentMonth / settings.monthlyBudget) * 100 : 0,
    };
  }, [monthlyData, settings.monthlyBudget]);

  // Best and worst categories
  const { bestCategory, worstCategory } = useMemo(() => {
    const withChanges = categoryTrends.filter((c) => c.lastMonth > 0);
    const best = withChanges.find((c) => c.isImprovement && c.change < -10);
    const worst = withChanges.find((c) => !c.isImprovement && c.change > 10);
    return { bestCategory: best, worstCategory: worst };
  }, [categoryTrends]);

  // Mini bar chart component
  const MiniBarChart = ({ data, maxValue }: { data: number[]; maxValue: number }) => (
    <View style={styles.miniChart}>
      {data.map((value, index) => (
        <View key={index} style={styles.miniBarContainer}>
          <View
            style={[
              styles.miniBar,
              {
                height: maxValue > 0 ? (value / maxValue) * 40 : 0,
                backgroundColor: index === 0 ? Colors.purplePrimary : 'rgba(139, 92, 246, 0.3)',
              },
            ]}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>지출 트렌드</Text>
        <View style={styles.periodToggle}>
          {(['3m', '6m'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodBtn, selectedPeriod === period && styles.periodBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPeriod(period);
              }}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period === '3m' ? '3개월' : '6개월'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Trend Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard
            gradient={overallTrend.isImprovement
              ? ['rgba(16, 185, 129, 0.15)', 'rgba(10, 10, 15, 0.95)']
              : ['rgba(239, 68, 68, 0.15)', 'rgba(10, 10, 15, 0.95)']}
            borderColor={overallTrend.isImprovement ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
          >
            <View style={styles.overallHeader}>
              <Text style={styles.overallTitle}>이번 달 지출</Text>
              <View style={[
                styles.changeBadge,
                overallTrend.isImprovement ? styles.changeBadgeGood : styles.changeBadgeBad
              ]}>
                <Ionicons
                  name={overallTrend.isImprovement ? 'trending-down' : 'trending-up'}
                  size={14}
                  color={overallTrend.isImprovement ? Colors.success : Colors.error}
                />
                <Text style={[
                  styles.changeText,
                  overallTrend.isImprovement ? styles.changeTextGood : styles.changeTextBad
                ]}>
                  {overallTrend.change > 0 ? '+' : ''}{overallTrend.change}%
                </Text>
              </View>
            </View>

            <Text style={styles.overallAmount}>₩{overallTrend.currentMonth.toLocaleString()}</Text>

            <View style={styles.overallStats}>
              <View style={styles.overallStat}>
                <Text style={styles.statLabel}>지난달</Text>
                <Text style={styles.statValue}>₩{overallTrend.lastMonth.toLocaleString()}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.overallStat}>
                <Text style={styles.statLabel}>3개월 평균</Text>
                <Text style={styles.statValue}>₩{overallTrend.threeMonthAvg.toLocaleString()}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.overallStat}>
                <Text style={styles.statLabel}>예산 대비</Text>
                <Text style={[
                  styles.statValue,
                  overallTrend.budgetUsage > 100 ? { color: Colors.error } : { color: Colors.success }
                ]}>
                  {Math.round(overallTrend.budgetUsage)}%
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Highlight Cards */}
        {(bestCategory || worstCategory) && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.highlightRow}>
              {bestCategory && (
                <View style={[styles.highlightCard, styles.highlightGood]}>
                  <Text style={styles.highlightIcon}>{bestCategory.icon}</Text>
                  <Text style={styles.highlightTitle}>가장 절약</Text>
                  <Text style={styles.highlightCategory}>{bestCategory.label}</Text>
                  <Text style={styles.highlightChange}>{bestCategory.change}%</Text>
                </View>
              )}
              {worstCategory && (
                <View style={[styles.highlightCard, styles.highlightBad]}>
                  <Text style={styles.highlightIcon}>{worstCategory.icon}</Text>
                  <Text style={styles.highlightTitle}>가장 증가</Text>
                  <Text style={styles.highlightCategory}>{worstCategory.label}</Text>
                  <Text style={[styles.highlightChange, { color: Colors.error }]}>
                    +{worstCategory.change}%
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Monthly Overview */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.sectionTitle}>월별 추이</Text>
          <GlassCard>
            <View style={styles.monthlyBars}>
              {monthlyData.slice().reverse().map((month, index) => {
                const maxTotal = Math.max(...monthlyData.map((m) => m.total));
                const barHeight = maxTotal > 0 ? (month.total / maxTotal) * 100 : 0;
                const isCurrentMonth = index === monthlyData.length - 1;

                return (
                  <View key={`${month.year}-${month.monthNum}`} style={styles.monthBarItem}>
                    <View style={styles.barWrapper}>
                      <LinearGradient
                        colors={isCurrentMonth
                          ? Gradients.purple as [string, string]
                          : ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']}
                        style={[styles.monthBar, { height: `${barHeight}%` }]}
                      />
                    </View>
                    <Text style={[styles.monthLabel, isCurrentMonth && styles.monthLabelActive]}>
                      {month.month}
                    </Text>
                    <Text style={styles.monthAmount}>
                      {(month.total / 10000).toFixed(0)}만
                    </Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Category Trends */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.sectionTitle}>카테고리별 변화</Text>
          <View style={styles.categoryList}>
            {categoryTrends.map((cat, index) => (
              <Animated.View
                key={cat.category}
                entering={FadeInRight.delay(100 + index * 50).duration(300)}
              >
                <View style={styles.categoryCard}>
                  <View style={styles.categoryLeft}>
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{cat.label}</Text>
                      <Text style={styles.categoryAmount}>
                        ₩{cat.currentMonth.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.categoryRight}>
                    <MiniBarChart
                      data={[cat.currentMonth, cat.lastMonth, cat.twoMonthsAgo]}
                      maxValue={Math.max(cat.currentMonth, cat.lastMonth, cat.twoMonthsAgo)}
                    />
                    <View style={[
                      styles.trendBadge,
                      cat.isImprovement ? styles.trendBadgeGood :
                      cat.trend === 'up' ? styles.trendBadgeBad : styles.trendBadgeNeutral
                    ]}>
                      <Ionicons
                        name={cat.trend === 'up' ? 'arrow-up' : cat.trend === 'down' ? 'arrow-down' : 'remove'}
                        size={12}
                        color={cat.isImprovement ? Colors.success : cat.trend === 'up' ? Colors.error : Colors.textMuted}
                      />
                      <Text style={[
                        styles.trendText,
                        cat.isImprovement ? styles.trendTextGood :
                        cat.trend === 'up' ? styles.trendTextBad : styles.trendTextNeutral
                      ]}>
                        {cat.change > 0 ? '+' : ''}{cat.change}%
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Insights */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text style={styles.sectionTitle}>인사이트</Text>
          <GlassCard>
            <View style={styles.insightsList}>
              {overallTrend.isImprovement && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>🎉</Text>
                  <Text style={styles.insightText}>
                    지난달보다 {Math.abs(overallTrend.change)}% 적게 지출하고 있어요!
                  </Text>
                </View>
              )}
              {!overallTrend.isImprovement && overallTrend.change > 0 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>⚠️</Text>
                  <Text style={styles.insightText}>
                    지출이 지난달보다 {overallTrend.change}% 증가했어요. 예산을 확인해보세요.
                  </Text>
                </View>
              )}
              {bestCategory && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>💪</Text>
                  <Text style={styles.insightText}>
                    {bestCategory.label} 지출을 {Math.abs(bestCategory.change)}% 줄였어요!
                  </Text>
                </View>
              )}
              {worstCategory && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>💡</Text>
                  <Text style={styles.insightText}>
                    {worstCategory.label} 지출이 급증했어요. 원인을 파악해보세요.
                  </Text>
                </View>
              )}
              {overallTrend.budgetUsage > 80 && overallTrend.budgetUsage <= 100 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>📊</Text>
                  <Text style={styles.insightText}>
                    예산의 {Math.round(overallTrend.budgetUsage)}%를 사용했어요. 조금만 더 절약해보세요!
                  </Text>
                </View>
              )}
              {categoryTrends.length === 0 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>📝</Text>
                  <Text style={styles.insightText}>
                    지출을 기록하면 트렌드 분석이 시작됩니다.
                  </Text>
                </View>
              )}
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  periodBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  periodBtnActive: {
    backgroundColor: Colors.purplePrimary,
  },
  periodText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  periodTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  overallTitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  changeBadgeGood: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  changeBadgeBad: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  changeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  changeTextGood: {
    color: Colors.success,
  },
  changeTextBad: {
    color: Colors.error,
  },
  overallAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overallStat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  highlightRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  highlightCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  highlightGood: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  highlightBad: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  highlightIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  highlightTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  highlightCategory: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginVertical: 2,
  },
  highlightChange: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.success,
  },
  monthlyBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: Spacing.md,
  },
  monthBarItem: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 100,
    width: 24,
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  monthBar: {
    width: '100%',
    borderRadius: BorderRadius.sm,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  monthLabelActive: {
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  monthAmount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  categoryList: {
    gap: Spacing.sm,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
  },
  miniBarContainer: {
    width: 8,
    height: 40,
    justifyContent: 'flex-end',
  },
  miniBar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    minWidth: 55,
    justifyContent: 'center',
  },
  trendBadgeGood: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  trendBadgeBad: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  trendBadgeNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  trendText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  trendTextGood: {
    color: Colors.success,
  },
  trendTextBad: {
    color: Colors.error,
  },
  trendTextNeutral: {
    color: Colors.textMuted,
  },
  insightsList: {
    gap: Spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});
