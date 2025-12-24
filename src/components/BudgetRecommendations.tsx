import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

interface BudgetRecommendationsProps {
  monthlyIncome: number;
  currentBudget: number;
  expenses: Expense[];
  savingsGoal: number;
  onApplyRecommendation?: (budget: number) => void;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  suggestedBudget: number;
  savingsRate: number;
  icon: string;
  type: 'conservative' | 'balanced' | 'aggressive';
  color: string;
  benefits: string[];
}

// 50/30/20 rule and variations
const BUDGET_RULES = {
  conservative: { needs: 0.5, wants: 0.2, savings: 0.3 },
  balanced: { needs: 0.5, wants: 0.3, savings: 0.2 },
  aggressive: { needs: 0.6, wants: 0.25, savings: 0.15 },
};

export const BudgetRecommendations: React.FC<BudgetRecommendationsProps> = ({
  monthlyIncome,
  currentBudget,
  expenses,
  savingsGoal,
  onApplyRecommendation,
}) => {
  const recommendations = useMemo((): Recommendation[] => {
    if (monthlyIncome <= 0) return [];

    const now = new Date();
    const thisMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    // Calculate average monthly spending by category
    const categoryAvg = new Map<string, number>();
    thisMonthExpenses.forEach((e) => {
      categoryAvg.set(e.category, (categoryAvg.get(e.category) || 0) + e.amount);
    });

    // Identify needs vs wants
    const needsCategories = ['food', 'transport', 'bills', 'health'];
    const totalNeeds = Array.from(categoryAvg.entries())
      .filter(([cat]) => needsCategories.includes(cat))
      .reduce((sum, [, amount]) => sum + amount, 0);

    const totalWants = Array.from(categoryAvg.entries())
      .filter(([cat]) => !needsCategories.includes(cat))
      .reduce((sum, [, amount]) => sum + amount, 0);

    const currentTotal = totalNeeds + totalWants;
    const currentSavingsRate = monthlyIncome > 0 ? (monthlyIncome - currentTotal) / monthlyIncome : 0;

    const recs: Recommendation[] = [];

    // Conservative recommendation (30% savings)
    const conservativeBudget = Math.round(monthlyIncome * 0.7);
    recs.push({
      id: 'conservative',
      title: '절약형',
      description: '50/20/30 규칙 기반',
      suggestedBudget: conservativeBudget,
      savingsRate: 30,
      icon: '🐢',
      type: 'conservative',
      color: '#22C55E',
      benefits: [
        '빠른 목표 달성',
        '비상금 확보',
        '재정 안정성 향상',
      ],
    });

    // Balanced recommendation (20% savings)
    const balancedBudget = Math.round(monthlyIncome * 0.8);
    recs.push({
      id: 'balanced',
      title: '균형형',
      description: '50/30/20 규칙 기반',
      suggestedBudget: balancedBudget,
      savingsRate: 20,
      icon: '⚖️',
      type: 'balanced',
      color: '#3B82F6',
      benefits: [
        '생활과 저축의 균형',
        '적당한 여유 유지',
        '꾸준한 자산 형성',
      ],
    });

    // Flexible recommendation (10-15% savings)
    const flexibleBudget = Math.round(monthlyIncome * 0.85);
    recs.push({
      id: 'aggressive',
      title: '유연형',
      description: '생활비 우선',
      suggestedBudget: flexibleBudget,
      savingsRate: 15,
      icon: '🌊',
      type: 'aggressive',
      color: '#F59E0B',
      benefits: [
        '생활 여유 확보',
        '스트레스 감소',
        '기본 저축 유지',
      ],
    });

    // Custom recommendation based on savings goal
    if (savingsGoal > 0) {
      const monthsToGoal = 12; // Assume 1 year target
      const monthlySavingsNeeded = savingsGoal / monthsToGoal;
      const goalBasedBudget = Math.round(monthlyIncome - monthlySavingsNeeded);
      const goalSavingsRate = Math.round((monthlySavingsNeeded / monthlyIncome) * 100);

      if (goalBasedBudget > 0 && goalSavingsRate >= 5 && goalSavingsRate <= 50) {
        recs.push({
          id: 'goal-based',
          title: '목표 맞춤형',
          description: `${savingsGoal.toLocaleString()}원 목표 달성용`,
          suggestedBudget: goalBasedBudget,
          savingsRate: goalSavingsRate,
          icon: '🎯',
          type: 'balanced',
          color: '#8B5CF6',
          benefits: [
            `${monthsToGoal}개월 내 목표 달성`,
            '맞춤형 저축 계획',
            '동기부여 향상',
          ],
        });
      }
    }

    return recs;
  }, [monthlyIncome, expenses, savingsGoal]);

  if (monthlyIncome <= 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💡</Text>
        <Text style={styles.emptyText}>수입을 입력하면 예산을 추천해드려요</Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만원`;
    }
    return `${amount.toLocaleString()}원`;
  };

  return (
    <View style={styles.container}>
      {/* Current Status */}
      <View style={styles.currentStatus}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>월 수입</Text>
          <Text style={styles.statusValue}>₩{formatCurrency(monthlyIncome)}</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>현재 예산</Text>
          <Text style={styles.statusValue}>₩{formatCurrency(currentBudget)}</Text>
        </View>
      </View>

      {/* Recommendations */}
      <Text style={styles.sectionTitle}>추천 예산안</Text>
      {recommendations.map((rec, index) => {
        const monthlySavings = monthlyIncome - rec.suggestedBudget;
        const isCurrentPlan = Math.abs(currentBudget - rec.suggestedBudget) < 10000;

        return (
          <Animated.View
            key={rec.id}
            entering={FadeInDown.delay(index * 100).duration(300)}
          >
            <TouchableOpacity
              style={[
                styles.recCard,
                isCurrentPlan && styles.recCardActive,
                { borderColor: rec.color + '40' },
              ]}
              onPress={() => onApplyRecommendation?.(rec.suggestedBudget)}
              activeOpacity={0.8}
            >
              <View style={styles.recHeader}>
                <View style={styles.recTitleRow}>
                  <Text style={styles.recIcon}>{rec.icon}</Text>
                  <View>
                    <Text style={styles.recTitle}>{rec.title}</Text>
                    <Text style={styles.recDesc}>{rec.description}</Text>
                  </View>
                </View>
                {isCurrentPlan && (
                  <View style={[styles.currentBadge, { backgroundColor: rec.color }]}>
                    <Text style={styles.currentBadgeText}>현재</Text>
                  </View>
                )}
              </View>

              <View style={styles.recDetails}>
                <View style={styles.recDetailItem}>
                  <Text style={styles.recDetailLabel}>월 예산</Text>
                  <Text style={[styles.recDetailValue, { color: rec.color }]}>
                    ₩{formatCurrency(rec.suggestedBudget)}
                  </Text>
                </View>
                <View style={styles.recDetailItem}>
                  <Text style={styles.recDetailLabel}>월 저축</Text>
                  <Text style={styles.recDetailValue}>
                    ₩{formatCurrency(monthlySavings)}
                  </Text>
                </View>
                <View style={styles.recDetailItem}>
                  <Text style={styles.recDetailLabel}>저축률</Text>
                  <Text style={[styles.recDetailValue, { color: '#22C55E' }]}>
                    {rec.savingsRate}%
                  </Text>
                </View>
              </View>

              <View style={styles.benefitsList}>
                {rec.benefits.map((benefit, i) => (
                  <View key={i} style={styles.benefitItem}>
                    <Text style={styles.benefitCheck}>✓</Text>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              {!isCurrentPlan && (
                <LinearGradient
                  colors={[rec.color + '20', rec.color + '10']}
                  style={styles.applyBtn}
                >
                  <Text style={[styles.applyBtnText, { color: rec.color }]}>
                    이 예산 적용하기
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Tip */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          50/30/20 규칙: 수입의 50%는 필수지출, 30%는 원하는 것, 20%는 저축에 배분하는 것이 좋아요
        </Text>
      </View>
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
    color: Colors.textMuted,
  },
  currentStatus: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statusLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  recCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  recCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  recTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recIcon: {
    fontSize: 28,
  },
  recTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  recDetails: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  recDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  recDetailLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  recDetailValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  benefitsList: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  benefitCheck: {
    fontSize: FontSizes.xs,
    color: '#22C55E',
  },
  benefitText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  applyBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  tipIcon: {
    fontSize: 16,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
