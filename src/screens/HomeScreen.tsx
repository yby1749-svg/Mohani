import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  Header,
  GlassCard,
  AnimatedBackground,
  Button,
  ProgressBar,
} from '../components';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { AddDiaryModal } from '../components/AddDiaryModal';
import { AddIncomeModal } from '../components/AddIncomeModal';
import { AddBillModal } from '../components/AddBillModal';
import { AddSubscriptionModal } from '../components/AddSubscriptionModal';
import { ExpenseSearch } from '../components/ExpenseSearch';
import { DebtTracker } from '../components/DebtTracker';
import { AddDebtModal } from '../components/AddDebtModal';
import QuickExpenseNote from '../components/QuickExpenseNote';
import { useExpenses } from '../context/ExpenseContext';
import { useDiary } from '../context/DiaryContext';
import { useSettings } from '../context/SettingsContext';
import { useGoals } from '../context/GoalsContext';
import { useExpenseTemplates } from '../context/ExpenseTemplateContext';
import { useIncome } from '../context/IncomeContext';
import { useAchievements } from '../context/AchievementContext';
import { useBills } from '../context/BillContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useChallenges } from '../context/ChallengeContext';
import { useDebts } from '../context/DebtContext';
import { generateInsights, AIInsight } from '../utils/aiInsights';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddDiary, setShowAddDiary] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [showExpenseSearch, setShowExpenseSearch] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  const { expenses, addExpense, getTodayExpenses, getTodayTotal, getMonthlyTotal, getCategoryTotals } = useExpenses();
  const { entries: diaryEntries, addEntry, getTodayEntry } = useDiary();
  const { settings } = useSettings();
  const { getTotalSaved, getOverallProgress } = useGoals();
  const { templates, useTemplate, getFrequentTemplates, addTemplate } = useExpenseTemplates();
  const { addIncome, getTotalIncomeThisMonth, getIncomeByType, getRecentIncomes, incomes } = useIncome();
  const { achievements, unlockedCount, totalCount, recentUnlocked, updateProgress } = useAchievements();
  const { bills, addBill, markAsPaid, getUpcomingBills, getOverdueBills, getTotalDue, getDaysUntilDue } = useBills();
  const { subscriptions, addSubscription, getMonthlyTotal: getSubsMonthlyTotal, getUpcomingRenewals } = useSubscriptions();
  const { activeChallenges, totalPoints, getLevel, claimReward } = useChallenges();
  const { debts, addDebt, getTotalOwed, getTotalOwedToMe, getDebtProgress } = useDebts();
  const todayDiary = getTodayEntry();
  const userLevel = getLevel();
  const frequentTemplates = getFrequentTemplates(4);

  // Generate AI insights
  const aiInsights = generateInsights(expenses, diaryEntries, settings.monthlyBudget);
  const currentInsight = aiInsights[currentInsightIndex] || null;

  const waveRotation = useSharedValue(0);

  const todayExpenses = getTodayExpenses();
  const todayTotal = getTodayTotal();
  const monthlyTotal = getMonthlyTotal();
  const monthlyBudget = settings.monthlyBudget;
  const budgetPercent = Math.min(Math.round((monthlyTotal / monthlyBudget) * 100), 100);
  const rawBudgetPercent = Math.round((monthlyTotal / monthlyBudget) * 100);
  const remaining = monthlyBudget - monthlyTotal;
  const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
  const dailyAvailable = daysLeft > 0 ? Math.floor(remaining / daysLeft) : remaining;

  // Budget warning logic
  const getBudgetWarning = () => {
    if (rawBudgetPercent >= 100) {
      return {
        type: 'danger' as const,
        icon: '🚨',
        title: '예산 초과!',
        message: `예산을 ₩${Math.abs(remaining).toLocaleString()} 초과했습니다.`,
        color: '#EF4444',
      };
    } else if (rawBudgetPercent >= 90) {
      return {
        type: 'critical' as const,
        icon: '⚠️',
        title: '예산 위험!',
        message: `예산의 ${rawBudgetPercent}%를 사용했습니다. ₩${remaining.toLocaleString()} 남음.`,
        color: '#F97316',
      };
    } else if (rawBudgetPercent >= 75) {
      return {
        type: 'warning' as const,
        icon: '💡',
        title: '예산 주의',
        message: `예산의 ${rawBudgetPercent}%를 사용 중입니다. 소비 속도를 조절하세요.`,
        color: '#EAB308',
      };
    }
    return null;
  };

  const budgetWarning = getBudgetWarning();

  // Calculate spending streaks
  const getSpendingStreaks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // No-spend streak (consecutive days without spending)
    let noSpendStreak = 0;
    let checkDate = new Date(today);

    // Check if today has expenses, if so start from yesterday
    const todayHasExpenses = expenses.some((e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (todayHasExpenses) {
      noSpendStreak = 0;
    } else {
      noSpendStreak = 1; // Today counts
      checkDate.setDate(checkDate.getDate() - 1);

      while (true) {
        const dayHasExpenses = expenses.some((e) => {
          const d = new Date(e.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === checkDate.getTime();
        });

        if (dayHasExpenses) break;
        noSpendStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        if (noSpendStreak > 30) break; // Cap at 30 days
      }
    }

    // Under budget streak (days spending less than daily budget)
    const dailyBudget = monthlyBudget / 30;
    let underBudgetStreak = 0;
    checkDate = new Date(today);

    for (let i = 0; i < 30; i++) {
      const dayExpenses = expenses.filter((e) => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === checkDate.getTime();
      });
      const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

      if (dayTotal <= dailyBudget) {
        underBudgetStreak++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Savings streak (days where you added to savings)
    const savingsStreak = 0; // Would need savings history to track

    return { noSpendStreak, underBudgetStreak, savingsStreak };
  };

  const streaks = getSpendingStreaks();

  // Check category limits
  const getCategoryAlerts = () => {
    const categoryTotals = getCategoryTotals();
    const alerts: { category: string; label: string; icon: string; spent: number; limit: number; percent: number }[] = [];

    const categoryLabels: Record<string, { label: string; icon: string }> = {
      food: { label: '식비', icon: '🍜' },
      transport: { label: '교통', icon: '🚇' },
      shopping: { label: '쇼핑', icon: '🛍️' },
      entertainment: { label: '여가', icon: '🎮' },
      cafe: { label: '카페', icon: '☕' },
      health: { label: '건강', icon: '💊' },
      bills: { label: '공과금', icon: '📄' },
      other: { label: '기타', icon: '📦' },
    };

    settings.categoryLimits?.forEach((cl) => {
      if (cl.enabled) {
        const catTotal = categoryTotals.find((ct) => ct.category === cl.category);
        if (catTotal && catTotal.total >= cl.limit * 0.8) {
          const percent = Math.round((catTotal.total / cl.limit) * 100);
          const info = categoryLabels[cl.category] || { label: cl.category, icon: '📦' };
          alerts.push({
            category: cl.category,
            label: info.label,
            icon: info.icon,
            spent: catTotal.total,
            limit: cl.limit,
            percent,
          });
        }
      }
    });

    return alerts.sort((a, b) => b.percent - a.percent);
  };

  const categoryAlerts = getCategoryAlerts();

  // Calculate Financial Health Score
  const getFinancialHealthScore = () => {
    let score = 0;
    const factors: { name: string; label: string; score: number; maxScore: number; icon: string }[] = [];

    // 1. Budget Adherence (0-30 points)
    // Lower budget usage = higher score
    const budgetAdherence = Math.max(0, 30 - (rawBudgetPercent * 0.3));
    factors.push({
      name: 'budget',
      label: '예산 관리',
      score: Math.round(budgetAdherence),
      maxScore: 30,
      icon: '💰',
    });
    score += budgetAdherence;

    // 2. Spending Consistency (0-20 points)
    // Consistent daily spending without big spikes
    const last7Days: number[] = [];
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      const dayTotal = expenses.filter((e) => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === checkDate.getTime();
      }).reduce((sum, e) => sum + e.amount, 0);
      last7Days.push(dayTotal);
    }
    const avgDaily = last7Days.reduce((a, b) => a + b, 0) / 7;
    const maxDaily = Math.max(...last7Days);
    const consistencyRatio = avgDaily > 0 ? Math.min(1, avgDaily / (maxDaily || 1)) : 1;
    const consistencyScore = Math.round(consistencyRatio * 20);
    factors.push({
      name: 'consistency',
      label: '지출 안정성',
      score: consistencyScore,
      maxScore: 20,
      icon: '📊',
    });
    score += consistencyScore;

    // 3. Savings Progress (0-25 points)
    const savingsProgress = getOverallProgress();
    const savingsScore = Math.round((savingsProgress / 100) * 25);
    factors.push({
      name: 'savings',
      label: '저축 달성',
      score: savingsScore,
      maxScore: 25,
      icon: '🎯',
    });
    score += savingsScore;

    // 4. Good Habits (0-15 points)
    // Based on streaks
    const noSpendBonus = Math.min(5, streaks.noSpendStreak);
    const underBudgetBonus = Math.min(10, streaks.underBudgetStreak);
    const habitsScore = noSpendBonus + underBudgetBonus;
    factors.push({
      name: 'habits',
      label: '소비 습관',
      score: habitsScore,
      maxScore: 15,
      icon: '🔥',
    });
    score += habitsScore;

    // 5. Category Balance (0-10 points)
    // Penalize if one category is >50% of total
    const categoryTotals = getCategoryTotals();
    const totalSpent = categoryTotals.reduce((sum, c) => sum + c.total, 0);
    const maxCategoryPercent = totalSpent > 0
      ? Math.max(...categoryTotals.map((c) => (c.total / totalSpent) * 100))
      : 0;
    const balanceScore = maxCategoryPercent > 50 ? Math.round(10 - (maxCategoryPercent - 50) / 5) : 10;
    factors.push({
      name: 'balance',
      label: '지출 균형',
      score: Math.max(0, balanceScore),
      maxScore: 10,
      icon: '⚖️',
    });
    score += Math.max(0, balanceScore);

    // Determine grade
    let grade: { label: string; color: string; emoji: string };
    if (score >= 90) {
      grade = { label: '최고', color: '#22C55E', emoji: '🏆' };
    } else if (score >= 75) {
      grade = { label: '우수', color: '#3B82F6', emoji: '⭐' };
    } else if (score >= 60) {
      grade = { label: '양호', color: '#F59E0B', emoji: '👍' };
    } else if (score >= 40) {
      grade = { label: '주의', color: '#F97316', emoji: '💪' };
    } else {
      grade = { label: '개선필요', color: '#EF4444', emoji: '📈' };
    }

    // Generate tip
    const lowestFactor = factors.reduce((min, f) =>
      (f.score / f.maxScore) < (min.score / min.maxScore) ? f : min
    );
    let tip = '';
    switch (lowestFactor.name) {
      case 'budget':
        tip = '예산 내에서 지출을 줄여보세요';
        break;
      case 'consistency':
        tip = '매일 일정한 금액으로 지출해보세요';
        break;
      case 'savings':
        tip = '저축 목표를 위해 조금씩 모아보세요';
        break;
      case 'habits':
        tip = '무지출 데이를 늘려보세요';
        break;
      case 'balance':
        tip = '다양한 카테고리로 분산 지출하세요';
        break;
    }

    return {
      score: Math.round(Math.min(100, Math.max(0, score))),
      factors,
      grade,
      tip,
    };
  };

  const healthScore = getFinancialHealthScore();

  useEffect(() => {
    // Wave animation for greeting
    waveRotation.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 200 }),
        withTiming(-15, { duration: 200 }),
        withTiming(0, { duration: 200 })
      ),
      3,
      false
    );
  }, []);

  // Check achievements
  useEffect(() => {
    // Check expense count achievements
    updateProgress('expenses_10', expenses.length);
    updateProgress('expenses_100', expenses.length);
    updateProgress('expenses_500', expenses.length);

    // Check savings achievements
    const totalSaved = getTotalSaved();
    updateProgress('savings_100k', totalSaved);
    updateProgress('savings_500k', totalSaved);
    updateProgress('savings_1m', totalSaved);
    updateProgress('savings_5m', totalSaved);

    // Check streak achievements
    updateProgress('no_spend_3', streaks.noSpendStreak);
    updateProgress('no_spend_7', streaks.noSpendStreak);
    updateProgress('no_spend_14', streaks.noSpendStreak);
    updateProgress('under_budget_week', streaks.underBudgetStreak);
    updateProgress('under_budget_month', streaks.underBudgetStreak);

    // Check health score achievement
    updateProgress('health_90', healthScore.score);

    // Check income achievement
    if (incomes.length > 0) {
      updateProgress('income_tracked', 1);
    }

    // Check positive balance
    if (getTotalIncomeThisMonth() > monthlyTotal) {
      updateProgress('positive_balance', 1);
    }
  }, [expenses.length, streaks, healthScore.score, incomes.length, monthlyTotal]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${waveRotation.value}deg` }],
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const today = new Date();
  const dayOfMonth = today.getDate();
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const currentMonth = monthNames[today.getMonth()];
  const currentDay = dayNames[today.getDay()];

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (action) {
      case 'diary':
        setShowAddDiary(true);
        break;
      case 'history':
        navigation.navigate('ExpenseHistory');
        break;
      case 'goals':
        navigation.navigate('Goals');
        break;
      case 'analytics':
        navigation.getParent()?.navigate('Analytics');
        break;
      case 'search':
        setShowExpenseSearch(true);
        break;
    }
  };

  const handleUseTemplate = (templateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const template = useTemplate(templateId);
    if (template) {
      addExpense({
        amount: template.amount,
        category: template.category,
        categoryLabel: template.categoryLabel,
        categoryIcon: template.categoryIcon,
        note: template.name,
        date: new Date(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.greetingSection}
        >
          <View style={styles.greetingText}>
            <Text style={styles.greetingTime}>{getGreeting()}</Text>
            <View style={styles.greetingNameRow}>
              <Text style={styles.greetingName}>{settings.userName}</Text>
              <Animated.Text style={[styles.greetingWave, waveStyle]}>
                !
              </Animated.Text>
            </View>
          </View>

          <View style={styles.dateWeather}>
            <LinearGradient
              colors={[Colors.purpleDark, 'transparent']}
              style={styles.dateContainer}
            >
              <Text style={styles.dateDay}>{dayOfMonth}</Text>
              <View style={styles.dateInfo}>
                <Text style={styles.dateMonth}>{currentMonth}</Text>
                <Text style={styles.dateWeekday}>{currentDay}</Text>
              </View>
            </LinearGradient>
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherIcon}>🌙</Text>
              <Text style={styles.weatherTemp}>5°C</Text>
            </View>
          </View>
        </Animated.View>

        {/* Budget Warning Alert */}
        {budgetWarning && (
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.getParent()?.navigate('Analytics')}
            >
              <View style={[styles.warningCard, { borderColor: budgetWarning.color }]}>
                <View style={[styles.warningIconContainer, { backgroundColor: `${budgetWarning.color}20` }]}>
                  <Text style={styles.warningIcon}>{budgetWarning.icon}</Text>
                </View>
                <View style={styles.warningContent}>
                  <Text style={[styles.warningTitle, { color: budgetWarning.color }]}>
                    {budgetWarning.title}
                  </Text>
                  <Text style={styles.warningMessage}>{budgetWarning.message}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Category Limit Alerts */}
        {categoryAlerts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(175).duration(400)}>
            <View style={styles.categoryAlertsContainer}>
              {categoryAlerts.slice(0, 2).map((alert) => (
                <View
                  key={alert.category}
                  style={[
                    styles.categoryAlert,
                    { borderColor: alert.percent >= 100 ? '#EF4444' : '#F59E0B' }
                  ]}
                >
                  <Text style={styles.categoryAlertIcon}>{alert.icon}</Text>
                  <View style={styles.categoryAlertContent}>
                    <Text style={styles.categoryAlertLabel}>{alert.label}</Text>
                    <View style={styles.categoryAlertBar}>
                      <View
                        style={[
                          styles.categoryAlertFill,
                          {
                            width: `${Math.min(alert.percent, 100)}%`,
                            backgroundColor: alert.percent >= 100 ? '#EF4444' : '#F59E0B'
                          }
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[
                    styles.categoryAlertPercent,
                    { color: alert.percent >= 100 ? '#EF4444' : '#F59E0B' }
                  ]}>
                    {alert.percent}%
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Overdue Bills Alert */}
        {getOverdueBills().length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowAddBill(true)}
            >
              <View style={[styles.warningCard, { borderColor: '#EF4444' }]}>
                <View style={[styles.warningIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Text style={styles.warningIcon}>🔔</Text>
                </View>
                <View style={styles.warningContent}>
                  <Text style={[styles.warningTitle, { color: '#EF4444' }]}>
                    연체된 청구서 {getOverdueBills().length}건
                  </Text>
                  <Text style={styles.warningMessage}>
                    ₩{getOverdueBills().reduce((sum, b) => sum + b.amount, 0).toLocaleString()} 미납
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Today's Expense Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard
            gradient={Gradients.cardPurple}
            borderColor={Colors.borderPurple}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>💰</Text>
                <Text style={styles.cardTitleText}>TODAY'S SPENDING</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>{todayExpenses.length} items</Text>
              </View>
            </View>

            <View style={styles.expenseAmount}>
              <Text style={styles.currency}>₩</Text>
              <LinearGradient
                colors={Gradients.gold as [string, string]}
                style={styles.amountGradient}
              >
                <Text style={styles.amount}>{todayTotal.toLocaleString()}</Text>
              </LinearGradient>
            </View>

            <View style={styles.expenseCategories}>
              {todayExpenses.length > 0 ? (
                todayExpenses.slice(0, 3).map((expense, index) => (
                  <View key={expense.id} style={styles.categoryPill}>
                    <Text style={styles.catIcon}>{expense.categoryIcon}</Text>
                    <Text style={styles.catAmount}>₩{expense.amount.toLocaleString()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noExpenses}>No expenses yet today</Text>
              )}
            </View>

            <Button
              title="Add Expense"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAddExpense(true);
              }}
              icon={<Ionicons name="add" size={20} color="white" />}
            />
          </GlassCard>
        </Animated.View>

        {/* Budget Progress Card */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard
            gradient={Gradients.cardGold}
            borderColor={Colors.borderGold}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>📊</Text>
                <Text style={styles.cardTitleText}>MONTHLY BUDGET</Text>
              </View>
              <Text style={styles.budgetPercent}>{budgetPercent}%</Text>
            </View>

            <View style={styles.budgetProgress}>
              <ProgressBar progress={budgetPercent} />
              <View style={styles.budgetLabels}>
                <Text style={styles.budgetSpent}>₩{monthlyTotal.toLocaleString()}</Text>
                <Text style={styles.budgetTotal}>₩{monthlyBudget.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.budgetStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>REMAINING</Text>
                <Text style={styles.statValue}>₩{remaining.toLocaleString()}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>DAILY AVAILABLE</Text>
                <Text style={styles.statValue}>₩{dailyAvailable.toLocaleString()}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Income Summary Card */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <GlassCard
            gradient={['rgba(34, 197, 94, 0.1)', 'rgba(10, 10, 15, 0.95)']}
            borderColor="rgba(34, 197, 94, 0.3)"
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>💵</Text>
                <Text style={styles.cardTitleText}>이번 달 수입</Text>
              </View>
              <TouchableOpacity
                style={styles.addIncomeBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddIncome(true);
                }}
              >
                <Ionicons name="add" size={16} color="#22C55E" />
              </TouchableOpacity>
            </View>

            <View style={styles.incomeAmount}>
              <Text style={styles.incomeCurrency}>₩</Text>
              <Text style={styles.incomeValue}>
                {getTotalIncomeThisMonth().toLocaleString()}
              </Text>
            </View>

            {getIncomeByType().length > 0 ? (
              <View style={styles.incomeTypes}>
                {getIncomeByType().slice(0, 3).map((type) => (
                  <View key={type.type} style={styles.incomeTypePill}>
                    <Text style={styles.incomeTypeIcon}>{type.icon}</Text>
                    <Text style={styles.incomeTypeAmount}>
                      ₩{type.total.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noIncome}>아직 기록된 수입이 없습니다</Text>
            )}

            <View style={styles.incomeBalance}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>수입</Text>
                <Text style={[styles.balanceValue, { color: '#22C55E' }]}>
                  +₩{getTotalIncomeThisMonth().toLocaleString()}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>지출</Text>
                <Text style={[styles.balanceValue, { color: '#EF4444' }]}>
                  -₩{monthlyTotal.toLocaleString()}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>잔액</Text>
                <Text style={[
                  styles.balanceValue,
                  { color: getTotalIncomeThisMonth() - monthlyTotal >= 0 ? '#22C55E' : '#EF4444' }
                ]}>
                  ₩{(getTotalIncomeThisMonth() - monthlyTotal).toLocaleString()}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Bill Reminders Card */}
        <Animated.View entering={FadeInDown.delay(375).duration(500)}>
          <GlassCard
            gradient={['rgba(239, 68, 68, 0.1)', 'rgba(10, 10, 15, 0.95)']}
            borderColor="rgba(239, 68, 68, 0.3)"
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>🔔</Text>
                <Text style={styles.cardTitleText}>청구서 알림</Text>
              </View>
              <TouchableOpacity
                style={styles.addBillBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddBill(true);
                }}
              >
                <Ionicons name="add" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* Total Due */}
            {bills.length > 0 && (
              <View style={styles.billTotalContainer}>
                <Text style={styles.billTotalLabel}>이번 달 납부 예정</Text>
                <View style={styles.billTotalRow}>
                  <Text style={styles.billTotalCurrency}>₩</Text>
                  <Text style={styles.billTotalValue}>{getTotalDue().toLocaleString()}</Text>
                </View>
              </View>
            )}

            {/* Upcoming Bills */}
            {getUpcomingBills().length > 0 ? (
              <View style={styles.billsList}>
                <Text style={styles.billsSubtitle}>다가오는 납부일</Text>
                {getUpcomingBills().slice(0, 3).map((bill) => (
                  <TouchableOpacity
                    key={bill.id}
                    style={styles.billItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      markAsPaid(bill.id);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.billIconContainer}>
                      <Text style={styles.billIcon}>{bill.categoryIcon}</Text>
                    </View>
                    <View style={styles.billInfo}>
                      <Text style={styles.billName}>{bill.name}</Text>
                      <Text style={styles.billDue}>
                        {getDaysUntilDue(bill) === 0 ? '오늘' : `${getDaysUntilDue(bill)}일 후`} • {bill.dueDay}일
                      </Text>
                    </View>
                    <View style={styles.billAmountContainer}>
                      <Text style={styles.billAmount}>₩{bill.amount.toLocaleString()}</Text>
                      {bill.isAutoPay && (
                        <View style={styles.autoPayBadge}>
                          <Text style={styles.autoPayText}>자동</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : bills.length > 0 ? (
              <View style={styles.noBillsUpcoming}>
                <Text style={styles.noBillsIcon}>✅</Text>
                <Text style={styles.noBillsText}>이번 주 납부할 청구서가 없습니다</Text>
              </View>
            ) : (
              <View style={styles.noBillsContainer}>
                <Text style={styles.noBillsIcon}>📋</Text>
                <Text style={styles.noBillsText}>청구서를 추가하고 납부일 알림을 받으세요</Text>
                <TouchableOpacity
                  style={styles.addFirstBillBtn}
                  onPress={() => setShowAddBill(true)}
                >
                  <Text style={styles.addFirstBillText}>청구서 추가</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Overdue Summary in Card */}
            {getOverdueBills().length > 0 && (
              <View style={styles.overdueContainer}>
                <View style={styles.overdueHeader}>
                  <Text style={styles.overdueIcon}>⚠️</Text>
                  <Text style={styles.overdueTitle}>연체된 청구서</Text>
                </View>
                {getOverdueBills().slice(0, 2).map((bill) => (
                  <TouchableOpacity
                    key={bill.id}
                    style={styles.overdueItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      markAsPaid(bill.id);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Text style={styles.overdueItemIcon}>{bill.categoryIcon}</Text>
                    <Text style={styles.overdueItemName}>{bill.name}</Text>
                    <Text style={styles.overdueItemAmount}>₩{bill.amount.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Subscription Tracker Card */}
        <Animated.View entering={FadeInDown.delay(385).duration(500)}>
          <GlassCard
            gradient={['rgba(124, 58, 237, 0.1)', 'rgba(10, 10, 15, 0.95)']}
            borderColor="rgba(124, 58, 237, 0.3)"
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>📱</Text>
                <Text style={styles.cardTitleText}>구독 서비스</Text>
              </View>
              <TouchableOpacity
                style={styles.addSubBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddSubscription(true);
                }}
              >
                <Ionicons name="add" size={16} color={Colors.purpleLight} />
              </TouchableOpacity>
            </View>

            {/* Monthly Total */}
            {subscriptions.length > 0 && (
              <View style={styles.subTotalContainer}>
                <Text style={styles.subTotalLabel}>월 구독료</Text>
                <View style={styles.subTotalRow}>
                  <Text style={styles.subTotalCurrency}>₩</Text>
                  <Text style={styles.subTotalValue}>{Math.round(getSubsMonthlyTotal()).toLocaleString()}</Text>
                </View>
              </View>
            )}

            {/* Upcoming Renewals */}
            {getUpcomingRenewals(7).length > 0 ? (
              <View style={styles.subsList}>
                <Text style={styles.subsSubtitle}>다가오는 결제</Text>
                {getUpcomingRenewals(7).slice(0, 3).map((sub) => {
                  const daysUntil = Math.ceil((new Date(sub.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <View key={sub.id} style={styles.subItem}>
                      <View style={[styles.subIconContainer, sub.color ? { backgroundColor: `${sub.color}20` } : {}]}>
                        <Text style={styles.subIcon}>{sub.categoryIcon}</Text>
                      </View>
                      <View style={styles.subInfo}>
                        <Text style={styles.subName}>{sub.name}</Text>
                        <Text style={styles.subDue}>
                          {daysUntil === 0 ? '오늘' : daysUntil === 1 ? '내일' : `${daysUntil}일 후`}
                        </Text>
                      </View>
                      <Text style={styles.subAmount}>₩{sub.amount.toLocaleString()}</Text>
                    </View>
                  );
                })}
              </View>
            ) : subscriptions.length > 0 ? (
              <View style={styles.noSubsUpcoming}>
                <Text style={styles.noSubsIcon}>✨</Text>
                <Text style={styles.noSubsText}>이번 주 결제 예정 없음</Text>
              </View>
            ) : (
              <View style={styles.noSubsContainer}>
                <Text style={styles.noSubsIcon}>📱</Text>
                <Text style={styles.noSubsText}>구독 서비스를 추가하고 결제일을 관리하세요</Text>
                <TouchableOpacity
                  style={styles.addFirstSubBtn}
                  onPress={() => setShowAddSubscription(true)}
                >
                  <Text style={styles.addFirstSubText}>구독 추가</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Active Subscriptions Summary */}
            {subscriptions.length > 0 && (
              <View style={styles.subsSummary}>
                <View style={styles.subsSummaryItem}>
                  <Text style={styles.subsSummaryValue}>{subscriptions.filter(s => s.isActive).length}</Text>
                  <Text style={styles.subsSummaryLabel}>활성 구독</Text>
                </View>
                <View style={styles.subsSummaryDivider} />
                <View style={styles.subsSummaryItem}>
                  <Text style={styles.subsSummaryValue}>₩{Math.round(getSubsMonthlyTotal() * 12).toLocaleString()}</Text>
                  <Text style={styles.subsSummaryLabel}>연간 비용</Text>
                </View>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* AI Insight Card */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentInsightIndex((prev) => (prev + 1) % aiInsights.length);
            }}
          >
            <GlassCard borderColor={Colors.borderPurple}>
              <View style={styles.aiCard}>
                <View style={styles.aiAvatar}>
                  <LinearGradient
                    colors={Gradients.mixed as [string, string]}
                    style={styles.aiGlow}
                  />
                  <Text style={styles.aiEmoji}>
                    {currentInsight?.icon || '🤖'}
                  </Text>
                </View>
                <View style={styles.aiContent}>
                  <View style={styles.aiHeader}>
                    <Text style={styles.aiLabel}>AI INSIGHT</Text>
                    {aiInsights.length > 1 && (
                      <Text style={styles.aiCount}>
                        {currentInsightIndex + 1}/{aiInsights.length}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.aiTitle}>
                    {currentInsight?.title || 'AI 분석 중...'}
                  </Text>
                  <Text style={styles.aiMessage}>
                    {currentInsight?.message || '데이터를 기록하면 맞춤 인사이트를 제공해드려요!'}
                  </Text>
                </View>
              </View>
              {aiInsights.length > 1 && (
                <Text style={styles.aiTapHint}>탭해서 더 보기</Text>
              )}
            </GlassCard>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          style={styles.quickActions}
        >
          {[
            { icon: '🔍', label: 'Search', action: 'search' },
            { icon: '📋', label: 'History', action: 'history' },
            { icon: '🎯', label: 'Goals', action: 'goals' },
            { icon: '📊', label: 'Analytics', action: 'analytics' },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickBtn}
              onPress={() => handleQuickAction(item.action)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={Gradients.glass as [string, string]}
                style={styles.quickBtnGradient}
              >
                <Text style={styles.quickIcon}>{item.icon}</Text>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Quick Expense Note */}
        <Animated.View entering={FadeInDown.delay(520).duration(500)}>
          <GlassCard>
            <QuickExpenseNote onAddExpense={addExpense} />
          </GlassCard>
        </Animated.View>

        {/* Quick Templates */}
        {frequentTemplates.length > 0 && (
          <Animated.View entering={FadeInDown.delay(550).duration(500)}>
            <GlassCard>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitle}>
                  <Text style={styles.cardIcon}>⚡</Text>
                  <Text style={styles.cardTitleText}>빠른 지출</Text>
                </View>
                <Text style={styles.templateHint}>탭하여 추가</Text>
              </View>
              <View style={styles.templateGrid}>
                {frequentTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.templateItem}
                    onPress={() => handleUseTemplate(template.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.templateIcon}>{template.categoryIcon}</Text>
                    <Text style={styles.templateName} numberOfLines={1}>{template.name}</Text>
                    <Text style={styles.templateAmount}>₩{template.amount.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Spending Streaks */}
        <Animated.View entering={FadeInDown.delay(580).duration(500)}>
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>🔥</Text>
                <Text style={styles.cardTitleText}>소비 습관</Text>
              </View>
            </View>
            <View style={styles.streaksGrid}>
              <View style={styles.streakItem}>
                <View style={[styles.streakIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                  <Text style={styles.streakEmoji}>🚫</Text>
                </View>
                <Text style={styles.streakValue}>{streaks.noSpendStreak}</Text>
                <Text style={styles.streakLabel}>무지출{'\n'}연속일</Text>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakItem}>
                <View style={[styles.streakIconBg, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
                  <Text style={styles.streakEmoji}>💪</Text>
                </View>
                <Text style={styles.streakValue}>{streaks.underBudgetStreak}</Text>
                <Text style={styles.streakLabel}>예산 내{'\n'}연속일</Text>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakItem}>
                <View style={[styles.streakIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Text style={styles.streakEmoji}>📊</Text>
                </View>
                <Text style={styles.streakValue}>{todayExpenses.length}</Text>
                <Text style={styles.streakLabel}>오늘{'\n'}지출 건수</Text>
              </View>
            </View>
            {streaks.noSpendStreak >= 3 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakBadgeText}>🎉 {streaks.noSpendStreak}일 연속 무지출! 대단해요!</Text>
              </View>
            )}
            {streaks.underBudgetStreak >= 7 && (
              <View style={[styles.streakBadge, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
                <Text style={[styles.streakBadgeText, { color: Colors.purpleLight }]}>💜 {streaks.underBudgetStreak}일 연속 예산 내 지출!</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Financial Health Score */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <GlassCard
            gradient={['rgba(34, 197, 94, 0.1)', 'rgba(10, 10, 15, 0.95)']}
            borderColor={healthScore.grade.color}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>💚</Text>
                <Text style={styles.cardTitleText}>금융 건강 점수</Text>
              </View>
              <View style={[styles.healthGradeBadge, { backgroundColor: `${healthScore.grade.color}20` }]}>
                <Text style={styles.healthGradeEmoji}>{healthScore.grade.emoji}</Text>
                <Text style={[styles.healthGradeLabel, { color: healthScore.grade.color }]}>
                  {healthScore.grade.label}
                </Text>
              </View>
            </View>

            <View style={styles.healthScoreMain}>
              <View style={styles.healthScoreCircle}>
                <View style={[styles.healthScoreInner, { borderColor: healthScore.grade.color }]}>
                  <Text style={[styles.healthScoreValue, { color: healthScore.grade.color }]}>
                    {healthScore.score}
                  </Text>
                  <Text style={styles.healthScoreMax}>/100</Text>
                </View>
              </View>
              <View style={styles.healthFactors}>
                {healthScore.factors.map((factor) => (
                  <View key={factor.name} style={styles.healthFactor}>
                    <View style={styles.healthFactorHeader}>
                      <Text style={styles.healthFactorIcon}>{factor.icon}</Text>
                      <Text style={styles.healthFactorLabel}>{factor.label}</Text>
                      <Text style={styles.healthFactorScore}>
                        {factor.score}/{factor.maxScore}
                      </Text>
                    </View>
                    <View style={styles.healthFactorBar}>
                      <View
                        style={[
                          styles.healthFactorFill,
                          {
                            width: `${(factor.score / factor.maxScore) * 100}%`,
                            backgroundColor: healthScore.grade.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {healthScore.tip && (
              <View style={styles.healthTip}>
                <Text style={styles.healthTipIcon}>💡</Text>
                <Text style={styles.healthTipText}>{healthScore.tip}</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Statistics Summary Card */}
        <Animated.View entering={FadeInDown.delay(650).duration(500)}>
          <GlassCard borderColor={Colors.borderPurple}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>📈</Text>
                <Text style={styles.cardTitleText}>이번 달 요약</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statsItem}>
                <View style={[styles.statsIconBg, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
                  <Text style={styles.statsIcon}>💰</Text>
                </View>
                <Text style={styles.statsValue}>₩{monthlyTotal.toLocaleString()}</Text>
                <Text style={styles.statsLabel}>총 지출</Text>
              </View>

              <View style={styles.statsItem}>
                <View style={[styles.statsIconBg, { backgroundColor: 'rgba(234, 179, 8, 0.2)' }]}>
                  <Text style={styles.statsIcon}>📊</Text>
                </View>
                <Text style={styles.statsValue}>
                  ₩{daysLeft > 0 ? Math.round(monthlyTotal / (new Date().getDate())).toLocaleString() : monthlyTotal.toLocaleString()}
                </Text>
                <Text style={styles.statsLabel}>일 평균</Text>
              </View>

              <View style={styles.statsItem}>
                <View style={[styles.statsIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                  <Text style={styles.statsIcon}>🎯</Text>
                </View>
                <Text style={styles.statsValue}>{Math.round(getOverallProgress())}%</Text>
                <Text style={styles.statsLabel}>저축 달성</Text>
              </View>

              <View style={styles.statsItem}>
                <View style={[styles.statsIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <Text style={styles.statsIcon}>📅</Text>
                </View>
                <Text style={styles.statsValue}>{daysLeft}일</Text>
                <Text style={styles.statsLabel}>남은 기간</Text>
              </View>
            </View>

            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>총 저축액</Text>
              <Text style={styles.savingsValue}>₩{getTotalSaved().toLocaleString()}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Achievements Card */}
        <Animated.View entering={FadeInDown.delay(700).duration(500)}>
          <GlassCard
            gradient={['rgba(245, 158, 11, 0.1)', 'rgba(10, 10, 15, 0.95)']}
            borderColor="rgba(245, 158, 11, 0.3)"
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>🏆</Text>
                <Text style={styles.cardTitleText}>업적</Text>
              </View>
              <View style={styles.achievementProgress}>
                <Text style={styles.achievementCount}>{unlockedCount}/{totalCount}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.achievementProgressBar}>
              <View
                style={[
                  styles.achievementProgressFill,
                  { width: `${(unlockedCount / totalCount) * 100}%` },
                ]}
              />
            </View>

            {/* Recent Unlocked or Next to Unlock */}
            {recentUnlocked.length > 0 ? (
              <View style={styles.achievementsList}>
                <Text style={styles.achievementsSubtitle}>최근 달성</Text>
                <View style={styles.achievementBadges}>
                  {recentUnlocked.map((achievement) => (
                    <View
                      key={achievement.id}
                      style={[
                        styles.achievementBadge,
                        achievement.tier === 'gold' && styles.achievementGold,
                        achievement.tier === 'silver' && styles.achievementSilver,
                        achievement.tier === 'platinum' && styles.achievementPlatinum,
                      ]}
                    >
                      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                      <Text style={styles.achievementName}>{achievement.titleKo}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.achievementsList}>
                <Text style={styles.achievementsSubtitle}>다음 목표</Text>
                <View style={styles.achievementBadges}>
                  {achievements
                    .filter((a) => !a.isUnlocked)
                    .sort((a, b) => (b.progress / b.requirement) - (a.progress / a.requirement))
                    .slice(0, 3)
                    .map((achievement) => (
                      <View key={achievement.id} style={styles.achievementBadgeLocked}>
                        <Text style={styles.achievementIconLocked}>{achievement.icon}</Text>
                        <Text style={styles.achievementNameLocked}>{achievement.titleKo}</Text>
                        <Text style={styles.achievementProgressText}>
                          {Math.round((achievement.progress / achievement.requirement) * 100)}%
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Challenges Card */}
        <Animated.View entering={FadeInDown.delay(720).duration(500)}>
          <GlassCard
            gradient={['rgba(59, 130, 246, 0.1)', 'rgba(10, 10, 15, 0.95)']}
            borderColor="rgba(59, 130, 246, 0.3)"
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>🎯</Text>
                <Text style={styles.cardTitleText}>챌린지</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelIcon}>⭐</Text>
                <Text style={styles.levelText}>Lv.{userLevel.level}</Text>
              </View>
            </View>

            {/* Level Progress */}
            <View style={styles.levelContainer}>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>{userLevel.title}</Text>
                <Text style={styles.levelPoints}>{totalPoints.toLocaleString()} 포인트</Text>
              </View>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, { width: `${userLevel.progress}%` }]} />
              </View>
              {userLevel.pointsToNext > 0 && (
                <Text style={styles.levelNextText}>다음 레벨까지 {userLevel.pointsToNext.toLocaleString()}P</Text>
              )}
            </View>

            {/* Active Challenges */}
            {activeChallenges.length > 0 ? (
              <View style={styles.challengesList}>
                <Text style={styles.challengesSubtitle}>진행 중인 챌린지</Text>
                {activeChallenges.slice(0, 3).map((challenge) => {
                  const progressPercent = Math.round((challenge.progress / challenge.target) * 100);
                  const typeColor = challenge.type === 'daily' ? '#22C55E'
                    : challenge.type === 'weekly' ? '#3B82F6' : '#8B5CF6';
                  return (
                    <View key={challenge.id} style={styles.challengeItem}>
                      <View style={styles.challengeIconContainer}>
                        <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                      </View>
                      <View style={styles.challengeInfo}>
                        <View style={styles.challengeHeader}>
                          <Text style={styles.challengeName}>{challenge.titleKo}</Text>
                          <View style={[styles.challengeTypeBadge, { backgroundColor: `${typeColor}20` }]}>
                            <Text style={[styles.challengeTypeText, { color: typeColor }]}>
                              {challenge.type === 'daily' ? '일간' : challenge.type === 'weekly' ? '주간' : '월간'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.challengeProgressContainer}>
                          <View style={styles.challengeProgressBar}>
                            <View
                              style={[
                                styles.challengeProgressFill,
                                { width: `${progressPercent}%`, backgroundColor: typeColor }
                              ]}
                            />
                          </View>
                          <Text style={styles.challengeProgressText}>{progressPercent}%</Text>
                        </View>
                      </View>
                      <View style={styles.challengeReward}>
                        <Text style={styles.rewardIcon}>🪙</Text>
                        <Text style={styles.rewardText}>+{challenge.reward}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noChallengesContainer}>
                <Text style={styles.noChallengesIcon}>🎉</Text>
                <Text style={styles.noChallengesText}>모든 챌린지를 완료했어요!</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Debt Tracker Card */}
        <Animated.View entering={FadeInDown.delay(870).duration(500)}>
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardIcon}>💳</Text>
                <Text style={styles.cardTitleText}>부채 관리</Text>
              </View>
            </View>
            <DebtTracker
              debts={debts}
              totalOwed={getTotalOwed()}
              totalOwedToMe={getTotalOwedToMe()}
              onAddDebt={() => setShowAddDebt(true)}
              onViewDebt={(debt) => {
                // For now just log, can add detail modal later
                console.log('View debt:', debt);
              }}
              getProgress={getDebtProgress}
            />
          </GlassCard>
        </Animated.View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAdd={(expense) => {
          addExpense(expense);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onSaveTemplate={(template) => {
          addTemplate(template);
        }}
      />

      {/* Add Diary Modal */}
      <AddDiaryModal
        visible={showAddDiary}
        onClose={() => setShowAddDiary(false)}
        onAdd={(entry) => {
          addEntry(entry);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        existingEntry={todayDiary ? {
          mood: todayDiary.mood,
          content: todayDiary.content,
          tags: todayDiary.tags,
        } : undefined}
      />

      {/* Add Income Modal */}
      <AddIncomeModal
        visible={showAddIncome}
        onClose={() => setShowAddIncome(false)}
        onAdd={(income) => {
          addIncome(income);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      {/* Add Bill Modal */}
      <AddBillModal
        visible={showAddBill}
        onClose={() => setShowAddBill(false)}
        onAdd={(bill) => {
          addBill(bill);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      {/* Add Subscription Modal */}
      <AddSubscriptionModal
        visible={showAddSubscription}
        onClose={() => setShowAddSubscription(false)}
        onAdd={(subscription) => {
          addSubscription(subscription);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      {/* Expense Search Modal */}
      <ExpenseSearch
        visible={showExpenseSearch}
        onClose={() => setShowExpenseSearch(false)}
        expenses={expenses}
      />

      {/* Add Debt Modal */}
      <AddDebtModal
        visible={showAddDebt}
        onClose={() => setShowAddDebt(false)}
        onAdd={(debt) => {
          addDebt(debt);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
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
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xxl,
  },
  greetingText: {},
  greetingTime: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  greetingNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  greetingName: {
    fontSize: FontSizes.hero,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  greetingWave: {
    fontSize: FontSizes.hero,
    fontWeight: '700',
    color: Colors.goldPrimary,
  },
  dateWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderPurple,
  },
  dateDay: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.purpleLight,
  },
  dateInfo: {
    gap: 2,
  },
  dateMonth: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  dateWeekday: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  weatherIcon: {
    fontSize: 20,
  },
  weatherTemp: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitleText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    letterSpacing: 1,
    fontWeight: '500',
  },
  cardBadge: {
    backgroundColor: Colors.purpleDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  cardBadgeText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
  },
  expenseAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xl,
  },
  currency: {
    fontSize: FontSizes.xxl,
    fontWeight: '500',
    color: Colors.goldPrimary,
    marginRight: Spacing.xs,
  },
  amountGradient: {
    borderRadius: BorderRadius.sm,
  },
  amount: {
    fontSize: FontSizes.giant,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  expenseCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  catIcon: {
    fontSize: 16,
  },
  catAmount: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  noExpenses: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  budgetPercent: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.goldPrimary,
  },
  budgetProgress: {
    marginBottom: Spacing.lg,
  },
  budgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  budgetSpent: {
    fontSize: FontSizes.sm,
    color: Colors.goldPrimary,
  },
  budgetTotal: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  budgetStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  aiCard: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  aiAvatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    opacity: 0.5,
  },
  aiEmoji: {
    fontSize: 28,
  },
  aiContent: {
    flex: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  aiLabel: {
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
    letterSpacing: 2,
  },
  aiCount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  aiTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  aiMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  aiTapHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  quickBtnGradient: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  quickLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  scheduleList: {
    gap: Spacing.md,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.md,
  },
  scheduleCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  scheduleBudget: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.goldPrimary,
  },
  bottomSpacing: {
    height: 100,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 20, 0.9)',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  warningIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIcon: {
    fontSize: 22,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  warningMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  statsItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statsIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statsIcon: {
    fontSize: 20,
  },
  statsValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  savingsLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  savingsValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.purpleLight,
  },
  templateHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  templateItem: {
    width: '48%',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderPurple,
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  templateName: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  templateAmount: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  streaksGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  streakIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  streakLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 14,
  },
  streakDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
  streakBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  streakBadgeText: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryAlertsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 20, 0.9)',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  categoryAlertIcon: {
    fontSize: 20,
  },
  categoryAlertContent: {
    flex: 1,
  },
  categoryAlertLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryAlertBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryAlertFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryAlertPercent: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  healthGradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  healthGradeEmoji: {
    fontSize: 14,
  },
  healthGradeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  healthScoreMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  healthScoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScoreInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  healthScoreValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  healthScoreMax: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: -2,
  },
  healthFactors: {
    flex: 1,
    gap: Spacing.sm,
  },
  healthFactor: {
    gap: 4,
  },
  healthFactorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  healthFactorIcon: {
    fontSize: 12,
  },
  healthFactorLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  healthFactorScore: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  healthFactorBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  healthFactorFill: {
    height: '100%',
    borderRadius: 2,
  },
  healthTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  healthTipIcon: {
    fontSize: 14,
  },
  healthTipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  addIncomeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  incomeCurrency: {
    fontSize: FontSizes.xxl,
    fontWeight: '500',
    color: '#22C55E',
    marginRight: Spacing.xs,
  },
  incomeValue: {
    fontSize: FontSizes.giant,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  incomeTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  incomeTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  incomeTypeIcon: {
    fontSize: 14,
  },
  incomeTypeAmount: {
    fontSize: FontSizes.sm,
    color: '#22C55E',
    fontWeight: '500',
  },
  noIncome: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  incomeBalance: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  achievementProgress: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  achievementCount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#F59E0B',
  },
  achievementProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  achievementsList: {
    gap: Spacing.sm,
  },
  achievementsSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  achievementBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(205, 127, 50, 0.4)',
    gap: Spacing.xs,
  },
  achievementSilver: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    borderColor: 'rgba(192, 192, 192, 0.4)',
  },
  achievementGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  achievementPlatinum: {
    backgroundColor: 'rgba(229, 228, 226, 0.2)',
    borderColor: 'rgba(229, 228, 226, 0.4)',
  },
  achievementIcon: {
    fontSize: 16,
  },
  achievementName: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  achievementBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: Spacing.xs,
  },
  achievementIconLocked: {
    fontSize: 16,
    opacity: 0.5,
  },
  achievementNameLocked: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  achievementProgressText: {
    fontSize: FontSizes.xs,
    color: '#F59E0B',
    fontWeight: '600',
  },
  // Bill Reminders Styles
  addBillBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billTotalContainer: {
    marginBottom: Spacing.lg,
  },
  billTotalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  billTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  billTotalCurrency: {
    fontSize: FontSizes.xl,
    fontWeight: '500',
    color: '#EF4444',
    marginRight: Spacing.xs,
  },
  billTotalValue: {
    fontSize: FontSizes.giant,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  billsList: {
    gap: Spacing.sm,
  },
  billsSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  billIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billIcon: {
    fontSize: 18,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  billDue: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  billAmountContainer: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#EF4444',
  },
  autoPayBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  autoPayText: {
    fontSize: FontSizes.xs,
    color: '#22C55E',
    fontWeight: '500',
  },
  noBillsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  noBillsUpcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  noBillsIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  noBillsText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  addFirstBillBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  addFirstBillText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#EF4444',
  },
  overdueContainer: {
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  overdueIcon: {
    fontSize: 14,
  },
  overdueTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#EF4444',
  },
  overdueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  overdueItemIcon: {
    fontSize: 16,
  },
  overdueItemName: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  overdueItemAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Subscription Styles
  addSubBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTotalContainer: {
    marginBottom: Spacing.lg,
  },
  subTotalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  subTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  subTotalCurrency: {
    fontSize: FontSizes.xl,
    fontWeight: '500',
    color: Colors.purpleLight,
    marginRight: Spacing.xs,
  },
  subTotalValue: {
    fontSize: FontSizes.giant,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subsList: {
    gap: Spacing.sm,
  },
  subsSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  subIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subIcon: {
    fontSize: 18,
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subDue: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  subAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.purpleLight,
  },
  noSubsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  noSubsUpcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  noSubsIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  noSubsText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  addFirstSubBtn: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  addFirstSubText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.purpleLight,
  },
  subsSummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  subsSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  subsSummaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  subsSummaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subsSummaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  // Challenge Styles
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  levelIcon: {
    fontSize: 12,
  },
  levelText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#3B82F6',
  },
  levelContainer: {
    marginBottom: Spacing.lg,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  levelTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  levelPoints: {
    fontSize: FontSizes.sm,
    color: '#3B82F6',
    fontWeight: '500',
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  levelNextText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  challengesList: {
    gap: Spacing.sm,
  },
  challengesSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  challengeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeIcon: {
    fontSize: 18,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  challengeName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  challengeTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  challengeTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  challengeProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  challengeProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  challengeProgressText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    minWidth: 30,
    textAlign: 'right',
  },
  challengeReward: {
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardText: {
    fontSize: FontSizes.xs,
    color: '#F59E0B',
    fontWeight: '600',
  },
  noChallengesContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  noChallengesIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  noChallengesText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
