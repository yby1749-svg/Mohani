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

import { Header, GlassCard, AnimatedBackground, BudgetRecommendations, InvestmentDashboard } from '../components';
import { SpendingLineChart } from '../components/SpendingLineChart';
import { SpendingBarChart } from '../components/SpendingBarChart';
import { SpendingHeatmap } from '../components/SpendingHeatmap';
import { SavingsCalculator } from '../components/SavingsCalculator';
import { MonthComparison } from '../components/MonthComparison';
import { SpendingPatterns } from '../components/SpendingPatterns';
import { LocationInsights } from '../components/LocationInsights';
import { CategoryBudgets } from '../components/CategoryBudgets';
import { FinancialHealthScore } from '../components/FinancialHealthScore';
import { SpendingForecast } from '../components/SpendingForecast';
import MonthlySummaryReport from '../components/MonthlySummaryReport';
import TagManager from '../components/TagManager';
import CurrencyConverter from '../components/CurrencyConverter';
import SpendingStreaks from '../components/SpendingStreaks';
import NetWorthTracker from '../components/NetWorthTracker';
import WeeklyDigest from '../components/WeeklyDigest';
import CategoryManager from '../components/CategoryManager';
import { useExpenses } from '../context/ExpenseContext';
import { useGoals } from '../context/GoalsContext';
import { useIncome } from '../context/IncomeContext';
import { useDiary } from '../context/DiaryContext';
import { useSettings } from '../context/SettingsContext';
import { useRecurringExpenses } from '../context/RecurringExpenseContext';
import { useCategoryBudgets } from '../context/CategoryBudgetContext';
import { useDebts } from '../context/DebtContext';
import { generateInsights, getMoodSpendingCorrelation, getSpendingTrend } from '../utils/aiInsights';
import {
  Colors,
  DarkColors,
  LightColors,
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
  const { expenses, getCategoryTotals, getMonthlyTotal, getTodayTotal } = useExpenses();
  const { entries: diaryEntries } = useDiary();
  const { settings, updateSettings } = useSettings();
  const isDark = settings?.darkMode !== false;
  const colors = isDark ? DarkColors : LightColors;
  const { getTotalMonthly } = useRecurringExpenses();
  const { getTotalSaved, getOverallProgress, getTotalTarget } = useGoals();
  const { getTotalIncomeThisMonth } = useIncome();
  const { budgets, setBudget, removeBudget, getCategorySpending, getCategoryProgress } = useCategoryBudgets();
  const { getTotalOwed } = useDebts();

  const monthlyTotal = getMonthlyTotal();
  const monthlyBudget = settings.monthlyBudget;
  const fixedExpensesTotal = getTotalMonthly();
  const currentSavings = getTotalSaved();
  const monthlyIncome = getTotalIncomeThisMonth();

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

  // Calculate time-of-day spending
  const timeOfDaySpending = useMemo(() => {
    const timeSlots = [
      { id: 'morning', label: '아침', range: '6-12시', icon: '🌅', hours: [6, 7, 8, 9, 10, 11] },
      { id: 'afternoon', label: '오후', range: '12-18시', icon: '☀️', hours: [12, 13, 14, 15, 16, 17] },
      { id: 'evening', label: '저녁', range: '18-24시', icon: '🌙', hours: [18, 19, 20, 21, 22, 23] },
      { id: 'night', label: '심야', range: '0-6시', icon: '🌃', hours: [0, 1, 2, 3, 4, 5] },
    ];

    return timeSlots.map((slot) => {
      const slotExpenses = expenses.filter((e) => {
        const hour = new Date(e.date).getHours();
        return slot.hours.includes(hour);
      });
      const total = slotExpenses.reduce((sum, e) => sum + e.amount, 0);
      const count = slotExpenses.length;
      return {
        ...slot,
        total,
        count,
        avg: count > 0 ? Math.round(total / count) : 0,
      };
    });
  }, [expenses]);

  const maxTimeSpending = Math.max(...timeOfDaySpending.map((t) => t.total), 1);
  const peakTime = timeOfDaySpending.reduce((max, t) => t.total > max.total ? t : max, timeOfDaySpending[0]);

  // Weekly report data
  const weeklyReport = useMemo(() => {
    const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.amount, 0);
    const dailyAverage = Math.round(weeklyTotal / 7);
    const dailyBudget = Math.round(monthlyBudget / 30);

    // Find best and worst days
    const sortedDays = [...weeklyData].sort((a, b) => a.amount - b.amount);
    const bestDay = sortedDays.find(d => d.amount > 0) || sortedDays[0];
    const worstDay = sortedDays[sortedDays.length - 1];

    // Count days under budget
    const daysUnderBudget = weeklyData.filter(d => d.amount <= dailyBudget).length;
    const noSpendDays = weeklyData.filter(d => d.amount === 0).length;

    // Calculate comparison to last week
    const lastWeekData: number[] = [];
    for (let i = 7; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        expenseDate.setHours(0, 0, 0, 0);
        return expenseDate.getTime() === date.getTime();
      });
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      lastWeekData.push(total);
    }
    const lastWeekTotal = lastWeekData.reduce((sum, d) => sum + d, 0);
    const weeklyChange = lastWeekTotal > 0
      ? Math.round(((weeklyTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : 0;

    // Generate tip
    let tip = '';
    let tipIcon = '💡';
    if (noSpendDays >= 3) {
      tip = '무지출 날이 많네요! 좋은 습관을 유지하세요.';
      tipIcon = '🌟';
    } else if (daysUnderBudget >= 5) {
      tip = '대부분의 날을 예산 내에서 보냈어요!';
      tipIcon = '👍';
    } else if (worstDay.amount > dailyBudget * 2) {
      tip = `${worstDay.day}요일에 지출이 많았어요. 큰 지출은 미리 계획해보세요.`;
      tipIcon = '📋';
    } else if (weeklyChange > 20) {
      tip = '지난주보다 지출이 늘었어요. 다음 주는 절약해보세요!';
      tipIcon = '⚠️';
    } else if (weeklyChange < -10) {
      tip = '지난주보다 지출이 줄었어요! 잘하고 있어요.';
      tipIcon = '🎉';
    } else {
      tip = '균형 잡힌 소비를 유지하고 있어요.';
      tipIcon = '⚖️';
    }

    return {
      weeklyTotal,
      dailyAverage,
      dailyBudget,
      bestDay,
      worstDay,
      daysUnderBudget,
      noSpendDays,
      lastWeekTotal,
      weeklyChange,
      tip,
      tipIcon,
    };
  }, [weeklyData, expenses, monthlyBudget]);

  // Budget recommendations
  const budgetRecommendations = useMemo(() => {
    const recommendations: { id: string; icon: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }[] = [];
    const categoryTotals = getCategoryTotals();
    const totalSpent = categoryTotals.reduce((sum, c) => sum + c.total, 0);

    // Check if over budget
    if (monthlyTotal > monthlyBudget) {
      recommendations.push({
        id: 'over_budget',
        icon: '🚨',
        title: '예산 초과 경고',
        description: `예산을 ₩${(monthlyTotal - monthlyBudget).toLocaleString()} 초과했어요. 남은 기간 지출을 줄여보세요.`,
        priority: 'high',
      });
    }

    // Find highest spending category
    if (categoryTotals.length > 0) {
      const sortedCategories = [...categoryTotals].sort((a, b) => b.total - a.total);
      const topCategory = sortedCategories[0];
      const topPercent = Math.round((topCategory.total / totalSpent) * 100);

      if (topPercent > 40) {
        recommendations.push({
          id: 'category_balance',
          icon: '⚖️',
          title: `${CATEGORY_NAMES[topCategory.category]} 지출 집중`,
          description: `${CATEGORY_NAMES[topCategory.category]}이(가) 전체 지출의 ${topPercent}%를 차지해요. 다른 영역과 균형을 맞춰보세요.`,
          priority: 'medium',
        });
      }

      // Check for potential savings in discretionary categories
      const discretionary = ['cafe', 'entertainment', 'shopping'];
      const discretionaryTotal = categoryTotals
        .filter(c => discretionary.includes(c.category))
        .reduce((sum, c) => sum + c.total, 0);
      const discretionaryPercent = Math.round((discretionaryTotal / totalSpent) * 100);

      if (discretionaryPercent > 30) {
        recommendations.push({
          id: 'discretionary',
          icon: '💡',
          title: '절약 가능 영역',
          description: `카페, 여가, 쇼핑 지출이 ${discretionaryPercent}%예요. 10% 줄이면 월 ₩${Math.round(discretionaryTotal * 0.1).toLocaleString()} 절약 가능해요.`,
          priority: 'medium',
        });
      }
    }

    // Check spending consistency
    const dailyBudget = monthlyBudget / 30;
    const overBudgetDays = weeklyData.filter(d => d.amount > dailyBudget * 1.5).length;
    if (overBudgetDays >= 3) {
      recommendations.push({
        id: 'consistency',
        icon: '📊',
        title: '지출 불규칙',
        description: `이번 주 ${overBudgetDays}일이 일일 예산을 크게 초과했어요. 매일 비슷하게 지출해보세요.`,
        priority: 'low',
      });
    }

    // Suggest savings if under budget
    if (monthlyTotal < monthlyBudget * 0.7) {
      const savingsAmount = monthlyBudget - monthlyTotal;
      recommendations.push({
        id: 'savings',
        icon: '🎯',
        title: '저축 기회',
        description: `예산의 30% 이상이 남았어요. ₩${savingsAmount.toLocaleString()}을 저축 목표에 추가해보세요!`,
        priority: 'low',
      });
    }

    // Fixed expenses tip
    if (fixedExpensesTotal > monthlyBudget * 0.5) {
      recommendations.push({
        id: 'fixed',
        icon: '📋',
        title: '고정 지출 점검',
        description: `고정 지출이 예산의 ${Math.round((fixedExpensesTotal / monthlyBudget) * 100)}%예요. 구독 서비스나 정기 결제를 점검해보세요.`,
        priority: 'medium',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }).slice(0, 4);
  }, [monthlyTotal, monthlyBudget, weeklyData, fixedExpensesTotal]);

  // Spending forecast
  const spendingForecast = useMemo(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // Calculate daily average from this month
    const dailyAverage = dayOfMonth > 0 ? monthlyTotal / dayOfMonth : 0;

    // Projected total at month end
    const projectedTotal = monthlyTotal + (dailyAverage * daysRemaining);

    // Calculate trend-adjusted projection (weight recent days more)
    const last7DaysTotal = weeklyData.reduce((sum, d) => sum + d.amount, 0);
    const last7DaysAvg = last7DaysTotal / 7;
    const trendAdjustedProjection = monthlyTotal + (last7DaysAvg * daysRemaining);

    // Average of both projections for balanced forecast
    const forecastTotal = Math.round((projectedTotal + trendAdjustedProjection) / 2);

    // Determine status
    let status: 'safe' | 'warning' | 'danger';
    let statusMessage: string;
    let statusIcon: string;

    const budgetDiff = monthlyBudget - forecastTotal;
    const budgetPercent = Math.round((forecastTotal / monthlyBudget) * 100);

    if (forecastTotal <= monthlyBudget * 0.9) {
      status = 'safe';
      statusMessage = `예산 내 안전! ₩${Math.abs(budgetDiff).toLocaleString()} 여유`;
      statusIcon = '✅';
    } else if (forecastTotal <= monthlyBudget) {
      status = 'warning';
      statusMessage = `예산에 근접! 주의가 필요해요`;
      statusIcon = '⚠️';
    } else {
      status = 'danger';
      statusMessage = `예산 초과 예상! ₩${Math.abs(budgetDiff).toLocaleString()} 초과`;
      statusIcon = '🚨';
    }

    // Calculate recommended daily budget for remaining days
    const remainingBudget = monthlyBudget - monthlyTotal;
    const recommendedDaily = daysRemaining > 0 ? Math.max(0, Math.round(remainingBudget / daysRemaining)) : 0;

    return {
      projectedTotal: forecastTotal,
      budgetPercent,
      status,
      statusMessage,
      statusIcon,
      daysRemaining,
      dailyAverage: Math.round(dailyAverage),
      recommendedDaily,
      willExceed: forecastTotal > monthlyBudget,
      excessAmount: Math.max(0, forecastTotal - monthlyBudget),
      savingsAmount: Math.max(0, monthlyBudget - forecastTotal),
    };
  }, [monthlyTotal, monthlyBudget, weeklyData]);

  const handlePeriodChange = (period: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePeriod(period);
  };

  const handleApplyBudget = (newBudget: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateSettings({ monthlyBudget: newBudget });
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
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
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
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Analytics</Text>
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
                  <Text style={[styles.periodTabText, { color: colors.textSecondary }]}>{period}</Text>
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
                <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>예산</Text>
                <Text style={[styles.overviewValue, styles.budgetValue]}>
                  ₩{(monthlyBudget / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={[styles.overviewItem, styles.overviewExpense]}>
                <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>지출</Text>
                <Text style={[styles.overviewValue, styles.expenseValue]}>
                  ₩{(monthlyTotal / 1000000).toFixed(2)}M
                </Text>
              </View>
              <View style={[styles.overviewItem, styles.overviewBalance]}>
                <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>남은 예산</Text>
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

        {/* Spending Charts */}
        <Animated.View entering={FadeInDown.delay(220).duration(500)}>
          <SpendingLineChart
            expenses={expenses}
            period={activePeriod === 'Month' ? 'month' : activePeriod === '3M' ? '3months' : 'week'}
            title="📈 지출 추이"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(500)}>
          <SpendingBarChart
            expenses={expenses}
            budget={monthlyBudget}
            title="📊 일별 지출"
            showComparison={true}
          />
        </Animated.View>

        {/* Spending Forecast */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <GlassCard
            gradient={
              spendingForecast.status === 'danger'
                ? ['rgba(239, 68, 68, 0.15)', 'rgba(10, 10, 15, 0.95)']
                : spendingForecast.status === 'warning'
                ? ['rgba(245, 158, 11, 0.15)', 'rgba(10, 10, 15, 0.95)']
                : ['rgba(16, 185, 129, 0.15)', 'rgba(10, 10, 15, 0.95)']
            }
            borderColor={
              spendingForecast.status === 'danger'
                ? 'rgba(239, 68, 68, 0.3)'
                : spendingForecast.status === 'warning'
                ? 'rgba(245, 158, 11, 0.3)'
                : 'rgba(16, 185, 129, 0.3)'
            }
          >
            <View style={styles.forecastHeader}>
              <Text style={styles.chartTitle}>🔮 월말 지출 예측</Text>
              <View style={[
                styles.forecastBadge,
                spendingForecast.status === 'danger' && styles.forecastBadgeDanger,
                spendingForecast.status === 'warning' && styles.forecastBadgeWarning,
              ]}>
                <Text style={styles.forecastBadgeText}>
                  {spendingForecast.budgetPercent}%
                </Text>
              </View>
            </View>

            <View style={styles.forecastMain}>
              <View style={styles.forecastProjection}>
                <Text style={styles.forecastLabel}>예상 총 지출</Text>
                <Text style={[
                  styles.forecastValue,
                  spendingForecast.status === 'danger' && styles.forecastValueDanger,
                  spendingForecast.status === 'warning' && styles.forecastValueWarning,
                ]}>
                  ₩{spendingForecast.projectedTotal.toLocaleString()}
                </Text>
                <Text style={styles.forecastBudget}>
                  예산: ₩{monthlyBudget.toLocaleString()}
                </Text>
              </View>

              <View style={styles.forecastBar}>
                <View style={styles.forecastBarBg}>
                  <View
                    style={[
                      styles.forecastBarFill,
                      { width: `${Math.min(spendingForecast.budgetPercent, 100)}%` },
                      spendingForecast.status === 'danger' && styles.forecastBarDanger,
                      spendingForecast.status === 'warning' && styles.forecastBarWarning,
                    ]}
                  />
                  {spendingForecast.budgetPercent > 100 && (
                    <View
                      style={[
                        styles.forecastBarExcess,
                        { width: `${Math.min(spendingForecast.budgetPercent - 100, 50)}%` },
                      ]}
                    />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.forecastStatus}>
              <Text style={styles.forecastStatusIcon}>{spendingForecast.statusIcon}</Text>
              <Text style={styles.forecastStatusText}>{spendingForecast.statusMessage}</Text>
            </View>

            <View style={styles.forecastGrid}>
              <View style={styles.forecastGridItem}>
                <Text style={styles.forecastGridIcon}>📅</Text>
                <Text style={styles.forecastGridLabel}>남은 일수</Text>
                <Text style={styles.forecastGridValue}>{spendingForecast.daysRemaining}일</Text>
              </View>
              <View style={styles.forecastGridItem}>
                <Text style={styles.forecastGridIcon}>📊</Text>
                <Text style={styles.forecastGridLabel}>현재 일평균</Text>
                <Text style={styles.forecastGridValue}>₩{spendingForecast.dailyAverage.toLocaleString()}</Text>
              </View>
              <View style={styles.forecastGridItem}>
                <Text style={styles.forecastGridIcon}>🎯</Text>
                <Text style={styles.forecastGridLabel}>권장 일예산</Text>
                <Text style={[
                  styles.forecastGridValue,
                  { color: spendingForecast.recommendedDaily < spendingForecast.dailyAverage ? colors.success : colors.textPrimary }
                ]}>
                  ₩{spendingForecast.recommendedDaily.toLocaleString()}
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

        {/* Calendar Spending Heatmap */}
        <Animated.View entering={FadeInDown.delay(310).duration(500)}>
          <GlassCard>
            <View style={styles.heatmapHeader}>
              <Text style={styles.chartTitle}>📅 월간 지출 캘린더</Text>
            </View>
            <SpendingHeatmap
              expenses={expenses}
              monthlyBudget={monthlyBudget}
              selectedMonth={new Date()}
              onDayPress={(date, dayExpenses) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
          </GlassCard>
        </Animated.View>

        {/* Weekly Report Card */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(59, 130, 246, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(59, 130, 246, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}
          >
            <View style={styles.reportHeader}>
              <Text style={styles.chartTitle}>📋 주간 리포트</Text>
              <View style={[
                styles.weeklyChangeBadge,
                weeklyReport.weeklyChange > 0 ? styles.changeUpBadge : styles.changeDownBadge
              ]}>
                <Text style={[
                  styles.weeklyChangeText,
                  weeklyReport.weeklyChange > 0 ? styles.changeUp : styles.changeDown
                ]}>
                  {weeklyReport.weeklyChange > 0 ? '+' : ''}{weeklyReport.weeklyChange}%
                </Text>
              </View>
            </View>

            <View style={styles.reportGrid}>
              <View style={styles.reportItem}>
                <Text style={styles.reportItemIcon}>📊</Text>
                <Text style={styles.reportItemLabel}>일 평균</Text>
                <Text style={styles.reportItemValue}>
                  ₩{weeklyReport.dailyAverage.toLocaleString()}
                </Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={styles.reportItemIcon}>🎯</Text>
                <Text style={styles.reportItemLabel}>일 예산</Text>
                <Text style={styles.reportItemValue}>
                  ₩{weeklyReport.dailyBudget.toLocaleString()}
                </Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={styles.reportItemIcon}>✅</Text>
                <Text style={styles.reportItemLabel}>예산 내</Text>
                <Text style={styles.reportItemValue}>
                  {weeklyReport.daysUnderBudget}/7일
                </Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={styles.reportItemIcon}>🚫</Text>
                <Text style={styles.reportItemLabel}>무지출</Text>
                <Text style={styles.reportItemValue}>
                  {weeklyReport.noSpendDays}일
                </Text>
              </View>
            </View>

            <View style={styles.reportHighlights}>
              <View style={styles.reportHighlight}>
                <Text style={styles.highlightLabel}>최소 지출</Text>
                <View style={styles.highlightRow}>
                  <Text style={styles.highlightDay}>{weeklyReport.bestDay.day}요일</Text>
                  <Text style={[styles.highlightAmount, { color: Colors.success }]}>
                    ₩{weeklyReport.bestDay.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportHighlight}>
                <Text style={styles.highlightLabel}>최대 지출</Text>
                <View style={styles.highlightRow}>
                  <Text style={styles.highlightDay}>{weeklyReport.worstDay.day}요일</Text>
                  <Text style={[styles.highlightAmount, { color: Colors.error }]}>
                    ₩{weeklyReport.worstDay.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.reportTip}>
              <Text style={styles.reportTipIcon}>{weeklyReport.tipIcon}</Text>
              <Text style={styles.reportTipText}>{weeklyReport.tip}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Monthly Comparison */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <GlassCard gradient={isDark ? Gradients.cardGold : ['#ffffff', '#fafafa']} borderColor={colors.borderGold}>
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

        {/* Time of Day Spending */}
        <Animated.View entering={FadeInDown.delay(450).duration(500)}>
          <GlassCard>
            <View style={styles.timeHeader}>
              <Text style={styles.chartTitle}>⏰ 시간대별 지출</Text>
              {peakTime && peakTime.total > 0 && (
                <View style={styles.peakBadge}>
                  <Text style={styles.peakIcon}>{peakTime.icon}</Text>
                  <Text style={styles.peakText}>{peakTime.label} 최다</Text>
                </View>
              )}
            </View>
            <View style={styles.timeGrid}>
              {timeOfDaySpending.map((slot) => {
                const percent = (slot.total / maxTimeSpending) * 100;
                const isPeak = slot.id === peakTime?.id && slot.total > 0;
                return (
                  <View key={slot.id} style={styles.timeSlot}>
                    <Text style={styles.timeIcon}>{slot.icon}</Text>
                    <Text style={styles.timeLabel}>{slot.label}</Text>
                    <Text style={styles.timeRange}>{slot.range}</Text>
                    <View style={styles.timeBarContainer}>
                      <LinearGradient
                        colors={isPeak ? Gradients.gold as [string, string] : Gradients.purple as [string, string]}
                        style={[styles.timeBar, { height: `${Math.max(percent, 5)}%` }]}
                      />
                    </View>
                    <Text style={[styles.timeAmount, isPeak && styles.timeAmountPeak]}>
                      ₩{(slot.total / 1000).toFixed(0)}k
                    </Text>
                    <Text style={styles.timeCount}>{slot.count}건</Text>
                  </View>
                );
              })}
            </View>
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
          <GlassCard gradient={isDark ? Gradients.cardPurple : ['#ffffff', '#fafafa']} borderColor={colors.borderPurple}>
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

        {/* Budget Recommendations */}
        {budgetRecommendations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(700).duration(500)}>
            <GlassCard
              gradient={isDark ? ['rgba(16, 185, 129, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(16, 185, 129, 0.08)', 'rgba(255, 255, 255, 0.95)']}
              borderColor={isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}
            >
              <Text style={styles.chartTitle}>💰 예산 추천</Text>
              <View style={styles.recommendationsList}>
                {budgetRecommendations.map((rec) => (
                  <View
                    key={rec.id}
                    style={[
                      styles.recommendationItem,
                      rec.priority === 'high' && styles.recommendationHigh,
                      rec.priority === 'medium' && styles.recommendationMedium,
                    ]}
                  >
                    <Text style={styles.recommendationIcon}>{rec.icon}</Text>
                    <View style={styles.recommendationContent}>
                      <Text style={styles.recommendationTitle}>{rec.title}</Text>
                      <Text style={styles.recommendationDescription}>{rec.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* 50/30/20 Budget Recommendations */}
        <Animated.View entering={FadeInDown.delay(750).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(139, 92, 246, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(139, 92, 246, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}
          >
            <Text style={styles.chartTitle}>📊 스마트 예산 추천</Text>
            <BudgetRecommendations
              monthlyIncome={monthlyIncome}
              currentBudget={monthlyBudget}
              expenses={expenses}
              savingsGoal={getTotalTarget()}
              onApplyRecommendation={handleApplyBudget}
            />
          </GlassCard>
        </Animated.View>

        {/* Month Comparison */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <GlassCard>
            <Text style={styles.chartTitle}>📊 월별 비교</Text>
            <MonthComparison
              expenses={expenses}
              monthlyBudget={monthlyBudget}
            />
          </GlassCard>
        </Animated.View>

        {/* Spending Patterns */}
        <Animated.View entering={FadeInDown.delay(510).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(245, 158, 11, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(245, 158, 11, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}
          >
            <Text style={styles.chartTitle}>⏰ 지출 패턴 분석</Text>
            <SpendingPatterns expenses={expenses} />
          </GlassCard>
        </Animated.View>

        {/* Location Insights */}
        <Animated.View entering={FadeInDown.delay(520).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(59, 130, 246, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(59, 130, 246, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}
          >
            <Text style={styles.chartTitle}>📍 장소별 지출</Text>
            <LocationInsights expenses={expenses} />
          </GlassCard>
        </Animated.View>

        {/* Savings Calculator */}
        <Animated.View entering={FadeInDown.delay(530).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(34, 197, 94, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(34, 197, 94, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}
          >
            <Text style={styles.chartTitle}>💰 저축 계산기</Text>
            <SavingsCalculator
              currentSavings={currentSavings}
              monthlyIncome={monthlyIncome}
              monthlyExpenses={monthlyTotal}
            />
          </GlassCard>
        </Animated.View>

        {/* Category Budgets */}
        <Animated.View entering={FadeInDown.delay(540).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(236, 72, 153, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(236, 72, 153, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)'}
          >
            <Text style={styles.chartTitle}>🏷️ 카테고리별 예산</Text>
            <CategoryBudgets
              budgets={budgets}
              expenses={expenses}
              onSetBudget={setBudget}
              onRemoveBudget={removeBudget}
              getCategorySpending={getCategorySpending}
            />
          </GlassCard>
        </Animated.View>

        {/* Spending Forecast */}
        <Animated.View entering={FadeInDown.delay(550).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(139, 92, 246, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(139, 92, 246, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}
          >
            <Text style={styles.chartTitle}>🔮 지출 예측</Text>
            <SpendingForecast
              expenses={expenses}
              monthlyBudget={monthlyBudget}
              monthlyIncome={monthlyIncome}
            />
          </GlassCard>
        </Animated.View>

        {/* Financial Health Score */}
        <Animated.View entering={FadeInDown.delay(560).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(16, 185, 129, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(16, 185, 129, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}
          >
            <Text style={styles.chartTitle}>💪 재정 건강 점수</Text>
            <FinancialHealthScore
              monthlyIncome={monthlyIncome}
              monthlyExpenses={monthlyTotal}
              monthlyBudget={monthlyBudget}
              totalSavings={currentSavings}
              totalDebt={getTotalOwed()}
              savingsGoalProgress={getOverallProgress()}
              categoryBudgetAdherence={
                budgets.length > 0
                  ? budgets.filter((b) => getCategorySpending(b.category, expenses) <= b.limit).length / budgets.length * 100
                  : 100
              }
            />
          </GlassCard>
        </Animated.View>

        {/* Monthly Summary Report */}
        <Animated.View entering={FadeInDown.delay(570).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(99, 102, 241, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(99, 102, 241, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}
          >
            <Text style={styles.chartTitle}>📑 월간 리포트</Text>
            <MonthlySummaryReport />
          </GlassCard>
        </Animated.View>

        {/* Tags Manager */}
        <Animated.View entering={FadeInDown.delay(580).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(236, 72, 153, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(236, 72, 153, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)'}
          >
            <Text style={styles.chartTitle}>🏷️ 지출 태그 관리</Text>
            <TagManager mode="manage" />
          </GlassCard>
        </Animated.View>

        {/* Currency Converter */}
        <Animated.View entering={FadeInDown.delay(590).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(14, 165, 233, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(14, 165, 233, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.2)'}
          >
            <CurrencyConverter />
          </GlassCard>
        </Animated.View>

        {/* Weekly Digest */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(34, 197, 94, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(34, 197, 94, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}
          >
            <WeeklyDigest />
          </GlassCard>
        </Animated.View>

        {/* Spending Streaks */}
        <Animated.View entering={FadeInDown.delay(650).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(245, 158, 11, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(245, 158, 11, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}
          >
            <SpendingStreaks
              todaySpending={getTodayTotal()}
              dailyBudget={Math.round(settings.monthlyBudget / 30)}
            />
          </GlassCard>
        </Animated.View>

        {/* Net Worth Tracker */}
        <Animated.View entering={FadeInDown.delay(700).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(59, 130, 246, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(59, 130, 246, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}
          >
            <NetWorthTracker />
          </GlassCard>
        </Animated.View>

        {/* Investment Dashboard */}
        <Animated.View entering={FadeInDown.delay(720).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(245, 158, 11, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(245, 158, 11, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}
          >
            <Text style={styles.chartTitle}>📈 투자 포트폴리오</Text>
            <InvestmentDashboard />
          </GlassCard>
        </Animated.View>

        {/* Category Manager */}
        <Animated.View entering={FadeInDown.delay(750).duration(500)}>
          <GlassCard
            gradient={isDark ? ['rgba(168, 85, 247, 0.1)', 'rgba(10, 10, 15, 0.95)'] : ['rgba(168, 85, 247, 0.08)', 'rgba(255, 255, 255, 0.95)']}
            borderColor={isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)'}
          >
            <CategoryManager />
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
  heatmapHeader: {
    marginBottom: Spacing.sm,
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
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  peakIcon: {
    fontSize: 12,
  },
  peakText: {
    fontSize: FontSizes.xs,
    color: Colors.goldPrimary,
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSlot: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  timeIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  timeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  timeRange: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  timeBarContainer: {
    width: 24,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  timeBar: {
    width: '100%',
    borderRadius: 12,
    minHeight: 4,
  },
  timeAmount: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timeAmountPeak: {
    color: Colors.goldPrimary,
  },
  timeCount: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  weeklyChangeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  changeUpBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  changeDownBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  weeklyChangeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  reportItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  reportItemIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  reportItemLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  reportItemValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reportHighlights: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reportHighlight: {
    flex: 1,
    alignItems: 'center',
  },
  reportDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  highlightLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  highlightDay: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  highlightAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  reportTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  reportTipIcon: {
    fontSize: 16,
  },
  reportTipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  recommendationsList: {
    gap: Spacing.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(16, 185, 129, 0.5)',
  },
  recommendationHigh: {
    borderLeftColor: Colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  recommendationMedium: {
    borderLeftColor: Colors.goldPrimary,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  recommendationIcon: {
    fontSize: 24,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  forecastBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  forecastBadgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  forecastBadgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  forecastBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.success,
  },
  forecastMain: {
    marginBottom: Spacing.md,
  },
  forecastProjection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  forecastLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  forecastValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.success,
  },
  forecastValueDanger: {
    color: Colors.error,
  },
  forecastValueWarning: {
    color: Colors.goldPrimary,
  },
  forecastBudget: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  forecastBar: {
    marginBottom: Spacing.md,
  },
  forecastBarBg: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  forecastBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 6,
  },
  forecastBarDanger: {
    backgroundColor: Colors.error,
  },
  forecastBarWarning: {
    backgroundColor: Colors.goldPrimary,
  },
  forecastBarExcess: {
    height: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
  },
  forecastStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  forecastStatusIcon: {
    fontSize: 18,
  },
  forecastStatusText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  forecastGrid: {
    flexDirection: 'row',
  },
  forecastGridItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  forecastGridIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  forecastGridLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  forecastGridValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
