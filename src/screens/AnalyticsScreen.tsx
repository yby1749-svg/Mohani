import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground } from '../components';
import { useExpenses } from '../context/ExpenseContext';
import { useDiary } from '../context/DiaryContext';
import { useSettings } from '../context/SettingsContext';
import { useRecurringExpenses } from '../context/RecurringExpenseContext';
import { generateInsights, getMoodSpendingCorrelation, getSpendingTrend } from '../utils/aiInsights';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

const { width } = Dimensions.get('window');

const PERIODS = ['Month', '3M', 'Year'];

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

const MOOD_EMOJIS: Record<string, string> = {
  great: '😊',
  good: '🙂',
  okay: '😐',
  bad: '😔',
  awful: '😢',
};

const MOOD_LABELS: Record<string, string> = {
  great: '최고',
  good: '좋음',
  okay: '보통',
  bad: '별로',
  awful: '최악',
};

interface CategoryData {
  name: string;
  category: string;
  percent: number;
  color: string;
  amount: number;
}

export default function AnalyticsScreen() {
  const [activePeriod, setActivePeriod] = useState('Month');
  const { expenses, getCategoryTotals, getMonthlyTotal } = useExpenses();
  const { entries: diaryEntries } = useDiary();
  const { settings } = useSettings();
  const { getTotalMonthly } = useRecurringExpenses();

  const monthlyTotal = getMonthlyTotal();
  const monthlyBudget = settings.monthlyBudget;
  const fixedExpensesTotal = getTotalMonthly();

  // Calculate weekly spending data
  const weeklyData = useMemo(() => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getDate() === date.getDate() &&
          expenseDate.getMonth() === date.getMonth() &&
          expenseDate.getFullYear() === date.getFullYear()
        );
      });
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      result.push({
        day: days[date.getDay()],
        date: date.getDate(),
        amount: total,
        isToday: i === 0,
      });
    }
    return result;
  }, [expenses]);

  const maxDailySpending = Math.max(...weeklyData.map((d) => d.amount), 1);

  // Calculate category data
  const categoryData = useMemo((): CategoryData[] => {
    const totals = getCategoryTotals();
    if (totals.length === 0 || monthlyTotal === 0) return [];

    return totals.map((cat) => ({
      name: CATEGORY_NAMES[cat.category] || cat.category,
      category: cat.category,
      percent: Math.round((cat.total / monthlyTotal) * 100),
      color: CATEGORY_COLORS[cat.category] || '#6b7280',
      amount: cat.total,
    }));
  }, [expenses, monthlyTotal]);

  // Calculate mood spending correlation
  const moodSpending = useMemo(() => {
    return getMoodSpendingCorrelation(expenses, diaryEntries);
  }, [expenses, diaryEntries]);

  // Get max spending for bar chart scaling
  const maxMoodSpending = Math.max(...moodSpending.map((m) => m.avgSpending), 1);

  // Generate AI insights
  const aiInsights = useMemo(() => {
    return generateInsights(expenses, diaryEntries, monthlyBudget);
  }, [expenses, diaryEntries]);

  // Get spending trend
  const spendingTrend = useMemo(() => {
    return getSpendingTrend(expenses);
  }, [expenses]);

  // Calculate monthly comparison
  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const lastMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    });

    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const percentChange = lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    // Calculate category comparison
    const categoryComparison = Object.keys(CATEGORY_NAMES).map((cat) => {
      const thisMonthCat = thisMonthExpenses
        .filter((e) => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      const lastMonthCat = lastMonthExpenses
        .filter((e) => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        category: cat,
        name: CATEGORY_NAMES[cat],
        thisMonth: thisMonthCat,
        lastMonth: lastMonthCat,
        change: lastMonthCat > 0
          ? Math.round(((thisMonthCat - lastMonthCat) / lastMonthCat) * 100)
          : thisMonthCat > 0 ? 100 : 0,
        color: CATEGORY_COLORS[cat],
      };
    }).filter((c) => c.thisMonth > 0 || c.lastMonth > 0);

    return {
      thisMonthTotal,
      lastMonthTotal,
      percentChange,
      categoryComparison,
    };
  }, [expenses]);

  const handlePeriodChange = (period: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePeriod(period);
  };

  // Donut Chart component
  const DonutChart = () => {
    const size = 160;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    let cumulativePercent = 0;

    if (categoryData.length === 0) {
      return (
        <View style={styles.donutContainer}>
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartIcon}>📊</Text>
            <Text style={styles.emptyChartText}>데이터가 없습니다</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.donutContainer}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {categoryData.map((cat, index) => {
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = `${(cat.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = (-cumulativePercent * circumference) / 100;
              cumulativePercent += cat.percent;

              return (
                <Circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={cat.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutTotal}>
            ₩{(monthlyTotal / 1000000).toFixed(2)}M
          </Text>
          <Text style={styles.donutLabel}>이번 달</Text>
        </View>
      </View>
    );
  };

  // Find mood insight
  const getMoodInsight = () => {
    if (moodSpending.length < 2) return null;

    const sortedBySpending = [...moodSpending].sort((a, b) => b.avgSpending - a.avgSpending);
    const highest = sortedBySpending[0];
    const lowest = sortedBySpending[sortedBySpending.length - 1];

    if (highest.avgSpending > lowest.avgSpending * 1.5) {
      const isNegativeMood = highest.mood === 'bad' || highest.mood === 'awful';
      return {
        icon: isNegativeMood ? '⚠️' : '💡',
        text: isNegativeMood
          ? `${MOOD_LABELS[highest.mood]} 기분일 때 평균 ${Math.round(((highest.avgSpending - lowest.avgSpending) / lowest.avgSpending) * 100)}% 더 지출해요. 스트레스 관리가 도움이 될 수 있어요!`
          : `${MOOD_LABELS[highest.mood]} 기분일 때 가장 많이 소비해요. 좋은 날에는 계획적인 소비를 해보세요!`,
        warning: isNegativeMood,
      };
    }
    return null;
  };

  const moodInsight = getMoodInsight();

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.screenHeader}
        >
          <Text style={styles.screenTitle}>Analytics</Text>
          <View style={styles.periodTabs}>
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => handlePeriodChange(period)}
                style={[
                  styles.periodTab,
                  activePeriod === period && styles.periodTabActive,
                ]}
              >
                {activePeriod === period ? (
                  <LinearGradient
                    colors={Gradients.purple as [string, string]}
                    style={styles.periodTabGradient}
                  >
                    <Text style={styles.periodTabTextActive}>{period}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.periodTabText}>{period}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Overview Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard>
            <View style={styles.overviewGrid}>
              <View style={[styles.overviewItem, styles.overviewBudget]}>
                <Text style={styles.overviewLabel}>예산</Text>
                <Text style={[styles.overviewValue, styles.budgetValue]}>
                  ₩{(monthlyBudget / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={[styles.overviewItem, styles.overviewExpense]}>
                <Text style={styles.overviewLabel}>지출</Text>
                <Text style={[styles.overviewValue, styles.expenseValue]}>
                  ₩{(monthlyTotal / 1000000).toFixed(2)}M
                </Text>
              </View>
              <View style={[styles.overviewItem, styles.overviewBalance]}>
                <Text style={styles.overviewLabel}>남은 예산</Text>
                <Text style={[styles.overviewValue, styles.balanceValue]}>
                  ₩{((monthlyBudget - monthlyTotal) / 1000000).toFixed(2)}M
                </Text>
              </View>
            </View>

            {/* Trend indicator */}
            <View style={styles.trendContainer}>
              <Text style={styles.trendLabel}>지난주 대비</Text>
              <View style={[
                styles.trendBadge,
                spendingTrend === 'down' ? styles.trendDown : spendingTrend === 'up' ? styles.trendUp : styles.trendStable
              ]}>
                <Text style={styles.trendIcon}>
                  {spendingTrend === 'down' ? '📉' : spendingTrend === 'up' ? '📈' : '➡️'}
                </Text>
                <Text style={[
                  styles.trendText,
                  spendingTrend === 'down' ? styles.trendTextDown : spendingTrend === 'up' ? styles.trendTextUp : null
                ]}>
                  {spendingTrend === 'down' ? '지출 감소' : spendingTrend === 'up' ? '지출 증가' : '유지 중'}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Weekly Spending Chart */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard>
            <Text style={styles.chartTitle}>주간 지출 추이</Text>
            <View style={styles.weeklyChart}>
              {weeklyData.map((day, index) => {
                const height = day.amount > 0 ? (day.amount / maxDailySpending) * 100 : 5;
                return (
                  <View key={index} style={styles.weeklyBarContainer}>
                    <Text style={styles.weeklyAmount}>
                      {day.amount > 0 ? `${(day.amount / 1000).toFixed(0)}k` : '-'}
                    </Text>
                    <View style={styles.weeklyBarWrapper}>
                      <LinearGradient
                        colors={day.isToday ? Gradients.gold as [string, string] : Gradients.purple as [string, string]}
                        style={[styles.weeklyBar, { height: `${height}%` }]}
                      />
                    </View>
                    <Text style={[styles.weeklyDay, day.isToday && styles.weeklyDayToday]}>
                      {day.day}
                    </Text>
                    <Text style={[styles.weeklyDate, day.isToday && styles.weeklyDateToday]}>
                      {day.date}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatLabel}>주간 총 지출</Text>
                <Text style={styles.weeklyStatValue}>
                  ₩{weeklyData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.weeklyStatDivider} />
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatLabel}>일 평균</Text>
                <Text style={styles.weeklyStatValue}>
                  ₩{Math.round(weeklyData.reduce((sum, d) => sum + d.amount, 0) / 7).toLocaleString()}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Monthly Comparison */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <GlassCard gradient={Gradients.cardGold} borderColor={Colors.borderGold}>
            <Text style={styles.chartTitle}>📊 지난 달 비교</Text>
            <View style={styles.comparisonHeader}>
              <View style={styles.comparisonMonth}>
                <Text style={styles.comparisonLabel}>지난 달</Text>
                <Text style={styles.comparisonValue}>
                  ₩{monthlyComparison.lastMonthTotal.toLocaleString()}
                </Text>
              </View>
              <View style={styles.comparisonArrow}>
                <Text style={styles.comparisonArrowIcon}>→</Text>
              </View>
              <View style={styles.comparisonMonth}>
                <Text style={styles.comparisonLabel}>이번 달</Text>
                <Text style={[styles.comparisonValue, styles.comparisonValueCurrent]}>
                  ₩{monthlyComparison.thisMonthTotal.toLocaleString()}
                </Text>
              </View>
              <View style={[
                styles.comparisonBadge,
                monthlyComparison.percentChange > 0 ? styles.comparisonBadgeUp : styles.comparisonBadgeDown
              ]}>
                <Text style={[
                  styles.comparisonBadgeText,
                  monthlyComparison.percentChange > 0 ? styles.comparisonBadgeTextUp : styles.comparisonBadgeTextDown
                ]}>
                  {monthlyComparison.percentChange > 0 ? '+' : ''}{monthlyComparison.percentChange}%
                </Text>
              </View>
            </View>

            {monthlyComparison.categoryComparison.length > 0 && (
              <View style={styles.categoryComparisonList}>
                {monthlyComparison.categoryComparison.slice(0, 4).map((cat) => (
                  <View key={cat.category} style={styles.categoryComparisonItem}>
                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.categoryComparisonName}>{cat.name}</Text>
                    <View style={styles.categoryComparisonChange}>
                      <Text style={[
                        styles.categoryComparisonPercent,
                        cat.change > 0 ? styles.changeUp : cat.change < 0 ? styles.changeDown : null
                      ]}>
                        {cat.change > 0 ? '↑' : cat.change < 0 ? '↓' : '−'}{Math.abs(cat.change)}%
                      </Text>
                    </View>
                    <Text style={styles.categoryComparisonAmount}>
                      ₩{cat.thisMonth.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Category Chart */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <GlassCard>
            <Text style={styles.chartTitle}>카테고리별 지출</Text>
            <DonutChart />
            {categoryData.length > 0 && (
              <View style={styles.legend}>
                {categoryData.map((cat, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.legendText}>
                      {cat.name} {cat.percent}%
                    </Text>
                    <Text style={styles.legendAmount}>
                      ₩{cat.amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Mood Analysis */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <GlassCard>
            <Text style={styles.chartTitle}>기분별 지출 분석</Text>
            {moodSpending.length > 0 ? (
              <>
                <View style={styles.moodBars}>
                  {moodSpending.map((mood, index) => {
                    const percent = (mood.avgSpending / maxMoodSpending) * 100;
                    const isHighSpender = mood.avgSpending === maxMoodSpending && moodSpending.length > 1;

                    return (
                      <View key={index} style={styles.moodBar}>
                        <Text style={styles.moodEmoji}>{MOOD_EMOJIS[mood.mood]}</Text>
                        <View style={styles.barContainer}>
                          <LinearGradient
                            colors={
                              isHighSpender && (mood.mood === 'bad' || mood.mood === 'awful')
                                ? ([Colors.goldPrimary, Colors.error] as [string, string])
                                : (Gradients.purple as [string, string])
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.barFill, { width: `${percent}%` }]}
                          />
                        </View>
                        <View style={styles.moodAmountContainer}>
                          <Text style={styles.moodAmount}>
                            ₩{(mood.avgSpending / 1000).toFixed(0)}k
                          </Text>
                          <Text style={styles.moodDays}>{mood.days}일</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {moodInsight && (
                  <View style={[styles.moodInsight, moodInsight.warning && styles.moodInsightWarning]}>
                    <Text style={styles.insightIcon}>{moodInsight.icon}</Text>
                    <Text style={styles.insightText}>{moodInsight.text}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyMood}>
                <Text style={styles.emptyMoodIcon}>📝</Text>
                <Text style={styles.emptyMoodText}>
                  일기를 작성하면 기분과 지출의{'\n'}상관관계를 분석해드려요!
                </Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* AI Insights Summary */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <GlassCard gradient={Gradients.cardPurple} borderColor={Colors.borderPurple}>
            <View style={styles.aiInsightsHeader}>
              <Text style={styles.aiInsightsTitle}>🤖 AI 분석 요약</Text>
            </View>
            <View style={styles.aiInsightsList}>
              {aiInsights.slice(0, 3).map((insight, index) => (
                <View key={insight.id} style={styles.aiInsightItem}>
                  <Text style={styles.aiInsightIcon}>{insight.icon}</Text>
                  <View style={styles.aiInsightContent}>
                    <Text style={styles.aiInsightItemTitle}>{insight.title}</Text>
                    <Text style={styles.aiInsightItemMessage}>{insight.message}</Text>
                  </View>
                </View>
              ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  screenTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  periodTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  periodTab: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  periodTabActive: {},
  periodTabGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  periodTabText: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  periodTabTextActive: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  overviewItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  overviewBudget: {
    backgroundColor: Colors.purpleDark,
  },
  overviewExpense: {
    backgroundColor: Colors.errorDark,
  },
  overviewBalance: {
    backgroundColor: Colors.successDark,
  },
  overviewLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  overviewValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  budgetValue: {
    color: Colors.purpleLight,
  },
  expenseValue: {
    color: Colors.error,
  },
  balanceValue: {
    color: Colors.success,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  trendLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  trendDown: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  trendUp: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendStable: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  trendIcon: {
    fontSize: 14,
  },
  trendText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  trendTextDown: {
    color: Colors.success,
  },
  trendTextUp: {
    color: Colors.error,
  },
  chartTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: Spacing.lg,
  },
  weeklyBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyAmount: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  weeklyBarWrapper: {
    width: 20,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weeklyBar: {
    width: '100%',
    borderRadius: 10,
    minHeight: 4,
  },
  weeklyDay: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  weeklyDayToday: {
    color: Colors.goldPrimary,
    fontWeight: '600',
  },
  weeklyDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  weeklyDateToday: {
    color: Colors.goldPrimary,
    fontWeight: '600',
  },
  weeklyStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  weeklyStatValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  weeklyStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    height: 160,
  },
  emptyChart: {
    alignItems: 'center',
  },
  emptyChartIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyChartText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutTotal: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  donutLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  legend: {
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  legendAmount: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  moodBars: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  moodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  moodEmoji: {
    fontSize: 24,
    width: 30,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  moodAmountContainer: {
    width: 70,
    alignItems: 'flex-end',
  },
  moodAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  moodDays: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  moodInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.purpleDark,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.purplePrimary,
  },
  moodInsightWarning: {
    backgroundColor: Colors.goldDark,
    borderLeftColor: Colors.goldPrimary,
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
  emptyMood: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyMoodIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyMoodText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  aiInsightsHeader: {
    marginBottom: Spacing.md,
  },
  aiInsightsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  aiInsightsList: {
    gap: Spacing.md,
  },
  aiInsightItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BorderRadius.md,
  },
  aiInsightIcon: {
    fontSize: 20,
  },
  aiInsightContent: {
    flex: 1,
  },
  aiInsightItemTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  aiInsightItemMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 100,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  comparisonMonth: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  comparisonValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  comparisonValueCurrent: {
    color: Colors.goldPrimary,
  },
  comparisonArrow: {
    paddingHorizontal: Spacing.md,
  },
  comparisonArrowIcon: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  comparisonBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  comparisonBadgeUp: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  comparisonBadgeDown: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  comparisonBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  comparisonBadgeTextUp: {
    color: Colors.error,
  },
  comparisonBadgeTextDown: {
    color: Colors.success,
  },
  categoryComparisonList: {
    gap: Spacing.sm,
  },
  categoryComparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryComparisonName: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  categoryComparisonChange: {
    width: 50,
    alignItems: 'center',
  },
  categoryComparisonPercent: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  changeUp: {
    color: Colors.error,
  },
  changeDown: {
    color: Colors.success,
  },
  categoryComparisonAmount: {
    width: 80,
    textAlign: 'right',
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});
