import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { AnimatedBackground, GlassCard } from '../components';
import { useExpenses, Expense } from '../context/ExpenseContext';
import { useSettings } from '../context/SettingsContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  Gradients,
} from '../constants/theme';

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

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍜',
  transport: '🚇',
  shopping: '🛍️',
  entertainment: '🎮',
  cafe: '☕',
  health: '💊',
  bills: '📄',
  other: '📦',
};

interface Insight {
  id: string;
  type: 'anomaly' | 'trend' | 'tip' | 'achievement' | 'warning';
  icon: string;
  title: string;
  description: string;
  value?: string;
  change?: number;
  priority: 'high' | 'medium' | 'low';
}

interface CategoryTrend {
  category: string;
  name: string;
  icon: string;
  thisWeek: number;
  lastWeek: number;
  change: number;
  avgTransaction: number;
  transactionCount: number;
}

export default function ExpenseInsightsScreen() {
  const navigation = useNavigation();
  const { expenses } = useExpenses();
  const { settings } = useSettings();
  const monthlyBudget = settings.monthlyBudget;

  // Get expenses by time period
  const getExpensesByPeriod = (days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);
    return expenses.filter((e) => new Date(e.date) >= cutoff);
  };

  // Calculate daily spending for a period
  const getDailySpending = (expenseList: Expense[]) => {
    const dailyMap: Record<string, number> = {};
    expenseList.forEach((e) => {
      const dateKey = new Date(e.date).toDateString();
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + e.amount;
    });
    return Object.values(dailyMap);
  };

  // Detect anomalies
  const anomalies = useMemo(() => {
    const results: Insight[] = [];
    const last30Days = getExpensesByPeriod(30);
    const last7Days = getExpensesByPeriod(7);
    const today = getExpensesByPeriod(1);

    // Calculate average daily spending
    const dailySpending = getDailySpending(last30Days);
    const avgDaily = dailySpending.length > 0
      ? dailySpending.reduce((a, b) => a + b, 0) / dailySpending.length
      : 0;
    const stdDev = Math.sqrt(
      dailySpending.reduce((sum, val) => sum + Math.pow(val - avgDaily, 2), 0) / (dailySpending.length || 1)
    );

    // Check today's spending
    const todayTotal = today.reduce((sum, e) => sum + e.amount, 0);
    if (todayTotal > avgDaily + stdDev * 2 && todayTotal > 0) {
      results.push({
        id: 'today_high',
        type: 'anomaly',
        icon: '📈',
        title: '오늘 지출이 평소보다 높아요',
        description: `오늘 ₩${todayTotal.toLocaleString()} 지출했어요. 평균 일 지출의 ${Math.round((todayTotal / avgDaily) * 100)}%입니다.`,
        value: `₩${todayTotal.toLocaleString()}`,
        change: Math.round(((todayTotal - avgDaily) / avgDaily) * 100),
        priority: 'high',
      });
    }

    // Check for unusual single transactions
    const avgTransaction = last30Days.length > 0
      ? last30Days.reduce((sum, e) => sum + e.amount, 0) / last30Days.length
      : 0;

    const unusualTransactions = last7Days.filter((e) => e.amount > avgTransaction * 3);
    if (unusualTransactions.length > 0) {
      const largest = unusualTransactions.sort((a, b) => b.amount - a.amount)[0];
      results.push({
        id: 'large_transaction',
        type: 'anomaly',
        icon: '💸',
        title: '큰 금액 지출 감지',
        description: `${largest.note || largest.categoryLabel}에 ₩${largest.amount.toLocaleString()} 지출이 있었어요.`,
        value: `₩${largest.amount.toLocaleString()}`,
        priority: 'medium',
      });
    }

    return results;
  }, [expenses]);

  // Category trends
  const categoryTrends = useMemo((): CategoryTrend[] => {
    const thisWeek = getExpensesByPeriod(7);
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const lastWeek = expenses.filter((e) => {
      const date = new Date(e.date);
      return date >= lastWeekStart && date < lastWeekEnd;
    });

    const categories = Object.keys(CATEGORY_NAMES);

    return categories.map((cat) => {
      const thisWeekCat = thisWeek.filter((e) => e.category === cat);
      const lastWeekCat = lastWeek.filter((e) => e.category === cat);

      const thisWeekTotal = thisWeekCat.reduce((sum, e) => sum + e.amount, 0);
      const lastWeekTotal = lastWeekCat.reduce((sum, e) => sum + e.amount, 0);

      const change = lastWeekTotal > 0
        ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
        : thisWeekTotal > 0 ? 100 : 0;

      return {
        category: cat,
        name: CATEGORY_NAMES[cat],
        icon: CATEGORY_ICONS[cat],
        thisWeek: thisWeekTotal,
        lastWeek: lastWeekTotal,
        change: Math.round(change),
        avgTransaction: thisWeekCat.length > 0 ? thisWeekTotal / thisWeekCat.length : 0,
        transactionCount: thisWeekCat.length,
      };
    }).filter((c) => c.thisWeek > 0 || c.lastWeek > 0)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [expenses]);

  // Generate smart tips
  const smartTips = useMemo((): Insight[] => {
    const tips: Insight[] = [];
    const last30Days = getExpensesByPeriod(30);
    const last7Days = getExpensesByPeriod(7);

    // Analyze spending patterns
    const weekdaySpending: number[] = [0, 0, 0, 0, 0, 0, 0];
    const weekdayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

    last30Days.forEach((e) => {
      const day = new Date(e.date).getDay();
      weekdaySpending[day] += e.amount;
      weekdayCounts[day]++;
    });

    const avgWeekdaySpending = weekdaySpending.map((total, idx) =>
      weekdayCounts[idx] > 0 ? total / weekdayCounts[idx] : 0
    );

    // Find high spending days
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const maxDay = avgWeekdaySpending.indexOf(Math.max(...avgWeekdaySpending));
    const minDay = avgWeekdaySpending.indexOf(Math.min(...avgWeekdaySpending.filter((v) => v > 0)));

    if (avgWeekdaySpending[maxDay] > avgWeekdaySpending[minDay] * 1.5) {
      tips.push({
        id: 'weekday_pattern',
        type: 'tip',
        icon: '📅',
        title: `${dayNames[maxDay]}요일에 지출이 많아요`,
        description: `${dayNames[maxDay]}요일 평균 지출이 ₩${Math.round(avgWeekdaySpending[maxDay]).toLocaleString()}으로 가장 높아요. 계획적으로 소비해보세요.`,
        priority: 'medium',
      });
    }

    // Check cafe/discretionary spending
    const cafeSpending = last7Days.filter((e) => e.category === 'cafe').reduce((sum, e) => sum + e.amount, 0);
    const entertainmentSpending = last7Days.filter((e) => e.category === 'entertainment').reduce((sum, e) => sum + e.amount, 0);
    const discretionaryTotal = cafeSpending + entertainmentSpending;
    const weeklyTotal = last7Days.reduce((sum, e) => sum + e.amount, 0);

    if (discretionaryTotal > weeklyTotal * 0.3 && weeklyTotal > 0) {
      tips.push({
        id: 'discretionary_high',
        type: 'warning',
        icon: '⚠️',
        title: '재량 지출 비율이 높아요',
        description: `카페와 여가 지출이 주간 지출의 ${Math.round((discretionaryTotal / weeklyTotal) * 100)}%를 차지해요. 조금 줄여보는 건 어떨까요?`,
        value: `₩${discretionaryTotal.toLocaleString()}`,
        priority: 'medium',
      });
    }

    // Budget progress tip
    const monthlySpending = getExpensesByPeriod(30).reduce((sum, e) => sum + e.amount, 0);
    const budgetProgress = (monthlySpending / monthlyBudget) * 100;
    const daysInMonth = 30;
    const dayOfMonth = new Date().getDate();
    const expectedProgress = (dayOfMonth / daysInMonth) * 100;

    if (budgetProgress < expectedProgress * 0.8) {
      tips.push({
        id: 'under_budget',
        type: 'achievement',
        icon: '🎉',
        title: '예산보다 적게 쓰고 있어요!',
        description: `현재 예산의 ${Math.round(budgetProgress)}%를 사용했어요. 예상보다 ${Math.round(expectedProgress - budgetProgress)}% 적게 지출중이에요.`,
        priority: 'low',
      });
    } else if (budgetProgress > expectedProgress * 1.2) {
      tips.push({
        id: 'over_budget',
        type: 'warning',
        icon: '🚨',
        title: '예산 초과 주의!',
        description: `현재 예산의 ${Math.round(budgetProgress)}%를 사용했어요. 남은 기간 지출을 줄여야 해요.`,
        priority: 'high',
      });
    }

    // Frequent small purchases
    const smallPurchases = last7Days.filter((e) => e.amount < 5000);
    if (smallPurchases.length >= 10) {
      const smallTotal = smallPurchases.reduce((sum, e) => sum + e.amount, 0);
      tips.push({
        id: 'small_purchases',
        type: 'tip',
        icon: '🔍',
        title: '소액 지출이 쌓이고 있어요',
        description: `이번 주 5천원 미만 지출이 ${smallPurchases.length}건, 총 ₩${smallTotal.toLocaleString()}이에요. 작은 지출도 합치면 커져요!`,
        value: `₩${smallTotal.toLocaleString()}`,
        priority: 'low',
      });
    }

    return tips;
  }, [expenses, monthlyBudget]);

  // Weekly summary
  const weeklySummary = useMemo(() => {
    const thisWeek = getExpensesByPeriod(7);
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const lastWeek = expenses.filter((e) => {
      const date = new Date(e.date);
      return date >= lastWeekStart && date < lastWeekEnd;
    });

    const thisWeekTotal = thisWeek.reduce((sum, e) => sum + e.amount, 0);
    const lastWeekTotal = lastWeek.reduce((sum, e) => sum + e.amount, 0);
    const change = lastWeekTotal > 0
      ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
      : 0;

    const dailyAvg = thisWeekTotal / 7;
    const transactionCount = thisWeek.length;
    const avgTransaction = transactionCount > 0 ? thisWeekTotal / transactionCount : 0;

    return {
      total: thisWeekTotal,
      lastWeekTotal,
      change: Math.round(change),
      dailyAvg: Math.round(dailyAvg),
      transactionCount,
      avgTransaction: Math.round(avgTransaction),
    };
  }, [expenses]);

  // Spending score (0-100)
  const spendingScore = useMemo(() => {
    let score = 100;

    // Budget adherence (40 points)
    const monthlySpending = getExpensesByPeriod(30).reduce((sum, e) => sum + e.amount, 0);
    const budgetRatio = monthlySpending / monthlyBudget;
    if (budgetRatio > 1) score -= 40;
    else if (budgetRatio > 0.9) score -= 20;
    else if (budgetRatio > 0.8) score -= 10;

    // Consistency (30 points)
    const dailySpending = getDailySpending(getExpensesByPeriod(14));
    if (dailySpending.length > 1) {
      const avg = dailySpending.reduce((a, b) => a + b, 0) / dailySpending.length;
      const variance = dailySpending.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dailySpending.length;
      const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;
      if (cv > 1) score -= 30;
      else if (cv > 0.7) score -= 20;
      else if (cv > 0.5) score -= 10;
    }

    // No-spend days bonus (15 points)
    const noSpendDays = 7 - getDailySpending(getExpensesByPeriod(7)).length;
    score += Math.min(noSpendDays * 5, 15);

    // Trend (15 points)
    if (weeklySummary.change < -10) score += 15;
    else if (weeklySummary.change > 20) score -= 15;

    return Math.max(0, Math.min(100, score));
  }, [expenses, monthlyBudget, weeklySummary]);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: '훌륭해요!', color: Colors.success };
    if (score >= 60) return { label: '괜찮아요', color: Colors.goldPrimary };
    if (score >= 40) return { label: '주의 필요', color: '#f97316' };
    return { label: '개선 필요', color: Colors.error };
  };

  const scoreInfo = getScoreLabel(spendingScore);

  // Combine all insights
  const allInsights = useMemo(() => {
    return [...anomalies, ...smartTips]
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [anomalies, smartTips]);

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
        <Text style={styles.headerTitle}>지출 인사이트</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Spending Score Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard
            gradient={['rgba(139, 92, 246, 0.15)', 'rgba(10, 10, 15, 0.95)']}
            borderColor="rgba(139, 92, 246, 0.3)"
          >
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>이번 주 지출 점수</Text>
              <View style={[styles.scoreBadge, { backgroundColor: `${scoreInfo.color}20` }]}>
                <Text style={[styles.scoreBadgeText, { color: scoreInfo.color }]}>
                  {scoreInfo.label}
                </Text>
              </View>
            </View>

            <View style={styles.scoreContainer}>
              <View style={styles.scoreCircle}>
                <LinearGradient
                  colors={[scoreInfo.color, `${scoreInfo.color}80`]}
                  style={styles.scoreCircleGradient}
                >
                  <Text style={styles.scoreValue}>{spendingScore}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </LinearGradient>
              </View>

              <View style={styles.scoreDetails}>
                <View style={styles.scoreDetailRow}>
                  <Text style={styles.scoreDetailLabel}>주간 지출</Text>
                  <Text style={styles.scoreDetailValue}>
                    ₩{weeklySummary.total.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.scoreDetailRow}>
                  <Text style={styles.scoreDetailLabel}>지난주 대비</Text>
                  <Text style={[
                    styles.scoreDetailValue,
                    weeklySummary.change < 0 ? styles.changePositive : styles.changeNegative
                  ]}>
                    {weeklySummary.change > 0 ? '+' : ''}{weeklySummary.change}%
                  </Text>
                </View>
                <View style={styles.scoreDetailRow}>
                  <Text style={styles.scoreDetailLabel}>일 평균</Text>
                  <Text style={styles.scoreDetailValue}>
                    ₩{weeklySummary.dailyAvg.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Insights Section */}
        {allInsights.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.sectionTitle}>스마트 인사이트</Text>
            <View style={styles.insightsContainer}>
              {allInsights.map((insight, index) => (
                <Animated.View
                  key={insight.id}
                  entering={FadeInRight.delay(100 + index * 50).duration(300)}
                >
                  <View style={[
                    styles.insightCard,
                    insight.priority === 'high' && styles.insightCardHigh,
                    insight.priority === 'medium' && styles.insightCardMedium,
                  ]}>
                    <Text style={styles.insightIcon}>{insight.icon}</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightTitle}>{insight.title}</Text>
                      <Text style={styles.insightDescription}>{insight.description}</Text>
                    </View>
                    {insight.value && (
                      <Text style={styles.insightValue}>{insight.value}</Text>
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Category Trends */}
        {categoryTrends.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={styles.sectionTitle}>카테고리별 변화</Text>
            <GlassCard>
              {categoryTrends.slice(0, 5).map((cat, index) => (
                <View
                  key={cat.category}
                  style={[
                    styles.trendRow,
                    index !== Math.min(categoryTrends.length - 1, 4) && styles.trendRowBorder,
                  ]}
                >
                  <View style={styles.trendLeft}>
                    <Text style={styles.trendIcon}>{cat.icon}</Text>
                    <View>
                      <Text style={styles.trendName}>{cat.name}</Text>
                      <Text style={styles.trendCount}>{cat.transactionCount}건</Text>
                    </View>
                  </View>
                  <View style={styles.trendRight}>
                    <Text style={styles.trendAmount}>
                      ₩{cat.thisWeek.toLocaleString()}
                    </Text>
                    <View style={[
                      styles.trendChangeBadge,
                      cat.change < 0 ? styles.trendChangeDown : cat.change > 0 ? styles.trendChangeUp : null
                    ]}>
                      <Text style={[
                        styles.trendChangeText,
                        cat.change < 0 ? styles.trendChangeTextDown : cat.change > 0 ? styles.trendChangeTextUp : null
                      ]}>
                        {cat.change > 0 ? '↑' : cat.change < 0 ? '↓' : '−'}{Math.abs(cat.change)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        )}

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.sectionTitle}>이번 주 요약</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
                style={styles.statCardGradient}
              >
                <Text style={styles.statIcon}>💳</Text>
                <Text style={styles.statValue}>{weeklySummary.transactionCount}</Text>
                <Text style={styles.statLabel}>총 거래</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
                style={styles.statCardGradient}
              >
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statValue}>₩{(weeklySummary.avgTransaction / 1000).toFixed(0)}k</Text>
                <Text style={styles.statLabel}>평균 거래</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
                style={styles.statCardGradient}
              >
                <Text style={styles.statIcon}>📅</Text>
                <Text style={styles.statValue}>₩{(weeklySummary.dailyAvg / 1000).toFixed(0)}k</Text>
                <Text style={styles.statLabel}>일 평균</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={weeklySummary.change < 0
                  ? ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']
                  : ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
                style={styles.statCardGradient}
              >
                <Text style={styles.statIcon}>{weeklySummary.change < 0 ? '📉' : '📈'}</Text>
                <Text style={[
                  styles.statValue,
                  weeklySummary.change < 0 ? { color: Colors.success } : { color: Colors.error }
                ]}>
                  {weeklySummary.change > 0 ? '+' : ''}{weeklySummary.change}%
                </Text>
                <Text style={styles.statLabel}>주간 변화</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Empty State */}
        {allInsights.length === 0 && categoryTrends.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>아직 충분한 데이터가 없어요</Text>
              <Text style={styles.emptyDescription}>
                지출을 기록하면 스마트 인사이트를 제공해드려요
              </Text>
            </View>
          </Animated.View>
        )}

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
  headerRight: {
    width: 40,
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
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scoreTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  scoreBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  scoreCircleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scoreMax: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: -4,
  },
  scoreDetails: {
    flex: 1,
    gap: Spacing.sm,
  },
  scoreDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreDetailLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  scoreDetailValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  changePositive: {
    color: Colors.success,
  },
  changeNegative: {
    color: Colors.error,
  },
  insightsContainer: {
    gap: Spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: Spacing.md,
  },
  insightCardHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  insightCardMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  insightIcon: {
    fontSize: 28,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  insightValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.purpleLight,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  trendRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  trendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  trendIcon: {
    fontSize: 24,
  },
  trendName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  trendCount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  trendRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  trendAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  trendChangeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  trendChangeUp: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  trendChangeDown: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  trendChangeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  trendChangeTextUp: {
    color: Colors.error,
  },
  trendChangeTextDown: {
    color: Colors.success,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});
