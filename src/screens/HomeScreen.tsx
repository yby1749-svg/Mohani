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
import { useExpenses } from '../context/ExpenseContext';
import { useDiary } from '../context/DiaryContext';
import { useSettings } from '../context/SettingsContext';
import { useGoals } from '../context/GoalsContext';
import { useExpenseTemplates } from '../context/ExpenseTemplateContext';
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
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  const { expenses, addExpense, getTodayExpenses, getTodayTotal, getMonthlyTotal, getCategoryTotals } = useExpenses();
  const { entries: diaryEntries, addEntry, getTodayEntry } = useDiary();
  const { settings } = useSettings();
  const { getTotalSaved, getOverallProgress } = useGoals();
  const { templates, useTemplate, getFrequentTemplates, addTemplate } = useExpenseTemplates();
  const todayDiary = getTodayEntry();
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
            { icon: '📋', label: 'History', action: 'history' },
            { icon: '🎯', label: 'Goals', action: 'goals' },
            { icon: '✨', label: 'AI Diary', action: 'diary' },
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

        {/* Statistics Summary Card */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
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
});
