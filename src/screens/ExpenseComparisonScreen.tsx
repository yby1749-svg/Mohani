import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { AnimatedBackground, GlassCard } from '../components';
import { useExpenses } from '../context/ExpenseContext';
import {
  comparePeriods,
  getPeriodRange,
  formatAmount,
  formatPercentChange,
  ComparisonResult,
} from '../utils/expenseComparison';

type PeriodType = 'week' | 'month' | 'year';

const ExpenseComparisonScreen: React.FC = () => {
  const navigation = useNavigation();
  const { expenses } = useExpenses();
  const [periodType, setPeriodType] = useState<PeriodType>('month');

  const comparison = useMemo(() => {
    return comparePeriods(expenses, periodType);
  }, [expenses, periodType]);

  const currentRange = getPeriodRange(periodType, 0);
  const previousRange = getPeriodRange(periodType, 1);

  const getChangeColor = (change: number): string => {
    if (change < -5) return Colors.success;
    if (change > 5) return Colors.error;
    return Colors.textMuted;
  };

  const getChangeIcon = (change: number): string => {
    if (change < -5) return 'trending-down';
    if (change > 5) return 'trending-up';
    return 'remove';
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>지출 비교</Text>
            <Text style={styles.headerSubtitle}>Expense Comparison</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Period Selector */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.periodSelector}>
            {[
              { key: 'week', label: '주간' },
              { key: 'month', label: '월간' },
              { key: 'year', label: '연간' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.periodOption,
                  periodType === option.key && styles.periodOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPeriodType(option.key as PeriodType);
                }}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    periodType === option.key && styles.periodOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Main Comparison Card */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <GlassCard style={styles.mainCard}>
              <View style={styles.periodLabels}>
                <View style={styles.periodLabelBox}>
                  <Text style={styles.periodLabelTitle}>{currentRange.label}</Text>
                  <Text style={styles.periodAmount}>
                    ₩{comparison.current.total.toLocaleString()}
                  </Text>
                  <Text style={styles.periodCount}>
                    {comparison.current.count}건
                  </Text>
                </View>

                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                  <Ionicons
                    name={getChangeIcon(comparison.totalPercentChange) as any}
                    size={24}
                    color={getChangeColor(comparison.totalPercentChange)}
                  />
                </View>

                <View style={styles.periodLabelBox}>
                  <Text style={styles.periodLabelTitle}>{previousRange.label}</Text>
                  <Text style={[styles.periodAmount, styles.previousAmount]}>
                    ₩{comparison.previous.total.toLocaleString()}
                  </Text>
                  <Text style={styles.periodCount}>
                    {comparison.previous.count}건
                  </Text>
                </View>
              </View>

              {/* Difference Summary */}
              <View style={styles.differenceBox}>
                <Text style={styles.differenceLabel}>차이</Text>
                <Text
                  style={[
                    styles.differenceValue,
                    { color: getChangeColor(comparison.totalPercentChange) },
                  ]}
                >
                  {comparison.totalDifference >= 0 ? '+' : ''}
                  ₩{comparison.totalDifference.toLocaleString()}
                </Text>
                <View
                  style={[
                    styles.percentBadge,
                    { backgroundColor: getChangeColor(comparison.totalPercentChange) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.percentText,
                      { color: getChangeColor(comparison.totalPercentChange) },
                    ]}
                  >
                    {formatPercentChange(comparison.totalPercentChange)}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Insights */}
          {comparison.insights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)}>
              <Text style={styles.sectionTitle}>💡 인사이트</Text>
              <GlassCard style={styles.insightsCard}>
                {comparison.insights.map((insight, index) => (
                  <View
                    key={index}
                    style={[
                      styles.insightItem,
                      index < comparison.insights.length - 1 && styles.insightItemBorder,
                    ]}
                  >
                    <Text style={styles.insightIcon}>{insight.icon}</Text>
                    <Text
                      style={[
                        styles.insightMessage,
                        insight.type === 'positive' && styles.insightPositive,
                        insight.type === 'negative' && styles.insightNegative,
                      ]}
                    >
                      {insight.message}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          {/* Category Comparison */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text style={styles.sectionTitle}>📊 카테고리별 비교</Text>
            {comparison.categoryChanges.length > 0 ? (
              comparison.categoryChanges.slice(0, 8).map((cat, index) => (
                <Animated.View
                  key={cat.category}
                  entering={FadeInDown.delay(450 + index * 50)}
                >
                  <GlassCard style={styles.categoryCard}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryIcon}>{cat.categoryIcon}</Text>
                        <Text style={styles.categoryLabel}>{cat.categoryLabel}</Text>
                      </View>
                      <View
                        style={[
                          styles.changeBadge,
                          { backgroundColor: getChangeColor(cat.percentChange) + '20' },
                        ]}
                      >
                        <Ionicons
                          name={getChangeIcon(cat.percentChange) as any}
                          size={14}
                          color={getChangeColor(cat.percentChange)}
                        />
                        <Text
                          style={[
                            styles.changeBadgeText,
                            { color: getChangeColor(cat.percentChange) },
                          ]}
                        >
                          {formatPercentChange(cat.percentChange)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryBars}>
                      {/* Current Period Bar */}
                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>{currentRange.label}</Text>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.bar,
                              styles.barCurrent,
                              {
                                width: `${Math.min(
                                  (cat.currentTotal /
                                    Math.max(cat.currentTotal, cat.previousTotal)) *
                                    100,
                                  100
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barAmount}>
                          ₩{formatAmount(cat.currentTotal)}
                        </Text>
                      </View>

                      {/* Previous Period Bar */}
                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>{previousRange.label}</Text>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.bar,
                              styles.barPrevious,
                              {
                                width: `${Math.min(
                                  (cat.previousTotal /
                                    Math.max(cat.currentTotal, cat.previousTotal)) *
                                    100,
                                  100
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barAmount}>
                          ₩{formatAmount(cat.previousTotal)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryDifference}>
                      <Text style={styles.categoryDiffLabel}>차이:</Text>
                      <Text
                        style={[
                          styles.categoryDiffValue,
                          { color: getChangeColor(cat.percentChange) },
                        ]}
                      >
                        {cat.difference >= 0 ? '+' : ''}₩{formatAmount(cat.difference)}
                      </Text>
                    </View>
                  </GlassCard>
                </Animated.View>
              ))
            ) : (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="analytics-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>비교할 데이터가 없어요</Text>
                <Text style={styles.emptySubtitle}>
                  지출을 기록하면 기간별 비교를{'\n'}확인할 수 있어요
                </Text>
              </GlassCard>
            )}
          </Animated.View>

          {/* Daily Average Comparison */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <Text style={styles.sectionTitle}>📈 일 평균 지출</Text>
            <GlassCard style={styles.dailyCard}>
              <View style={styles.dailyRow}>
                <View style={styles.dailyItem}>
                  <Text style={styles.dailyLabel}>{currentRange.label}</Text>
                  <Text style={styles.dailyValue}>
                    ₩{Math.round(comparison.current.dailyAverage).toLocaleString()}
                  </Text>
                  <Text style={styles.dailySubtext}>/일</Text>
                </View>
                <View style={styles.dailyDivider} />
                <View style={styles.dailyItem}>
                  <Text style={styles.dailyLabel}>{previousRange.label}</Text>
                  <Text style={[styles.dailyValue, styles.previousAmount]}>
                    ₩{Math.round(comparison.previous.dailyAverage).toLocaleString()}
                  </Text>
                  <Text style={styles.dailySubtext}>/일</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  periodOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  periodOptionActive: {
    backgroundColor: Colors.purplePrimary,
  },
  periodOptionText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  periodOptionTextActive: {
    color: Colors.text,
  },
  mainCard: {
    marginBottom: Spacing.lg,
  },
  periodLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodLabelBox: {
    flex: 1,
    alignItems: 'center',
  },
  periodLabelTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  periodAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  previousAmount: {
    color: Colors.textSecondary,
  },
  periodCount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  vsText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  differenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: Spacing.sm,
  },
  differenceLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  differenceValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  percentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  percentText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  insightsCard: {
    marginBottom: Spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  insightItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  insightIcon: {
    fontSize: 20,
  },
  insightMessage: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  insightPositive: {
    color: Colors.success,
  },
  insightNegative: {
    color: Colors.error,
  },
  categoryCard: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  changeBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  categoryBars: {
    gap: Spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    width: 50,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  barCurrent: {
    backgroundColor: Colors.purplePrimary,
  },
  barPrevious: {
    backgroundColor: Colors.textMuted,
  },
  barAmount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    width: 60,
    textAlign: 'right',
  },
  categoryDifference: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryDiffLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  categoryDiffValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  dailyCard: {
    marginBottom: Spacing.lg,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyItem: {
    flex: 1,
    alignItems: 'center',
  },
  dailyLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  dailyValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  dailySubtext: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dailyDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ExpenseComparisonScreen;
