import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';

const { width } = Dimensions.get('window');

interface FinancialHealthScoreProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBudget: number;
  totalSavings: number;
  totalDebt: number;
  savingsGoalProgress: number;
  categoryBudgetAdherence: number; // percentage of categories within budget
}

interface HealthFactor {
  name: string;
  score: number;
  maxScore: number;
  icon: string;
  status: 'good' | 'okay' | 'warning' | 'danger';
  tip: string;
}

export const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({
  monthlyIncome,
  monthlyExpenses,
  monthlyBudget,
  totalSavings,
  totalDebt,
  savingsGoalProgress,
  categoryBudgetAdherence,
}) => {
  const analysis = useMemo(() => {
    const factors: HealthFactor[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    // 1. Budget Adherence (25 points)
    const budgetRatio = monthlyBudget > 0 ? monthlyExpenses / monthlyBudget : 1;
    let budgetScore = 0;
    let budgetStatus: HealthFactor['status'] = 'good';
    let budgetTip = '';

    if (budgetRatio <= 0.8) {
      budgetScore = 25;
      budgetStatus = 'good';
      budgetTip = '예산을 잘 지키고 있어요!';
    } else if (budgetRatio <= 1.0) {
      budgetScore = 20;
      budgetStatus = 'okay';
      budgetTip = '예산 내에서 관리 중이에요';
    } else if (budgetRatio <= 1.2) {
      budgetScore = 10;
      budgetStatus = 'warning';
      budgetTip = '예산을 초과했어요, 지출을 줄여보세요';
    } else {
      budgetScore = 5;
      budgetStatus = 'danger';
      budgetTip = '예산을 크게 초과했어요!';
    }

    factors.push({
      name: '예산 준수',
      score: budgetScore,
      maxScore: 25,
      icon: '📊',
      status: budgetStatus,
      tip: budgetTip,
    });
    totalScore += budgetScore;
    maxPossibleScore += 25;

    // 2. Savings Rate (25 points)
    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
    let savingsScore = 0;
    let savingsStatus: HealthFactor['status'] = 'good';
    let savingsTip = '';

    if (savingsRate >= 0.3) {
      savingsScore = 25;
      savingsStatus = 'good';
      savingsTip = '훌륭한 저축률이에요!';
    } else if (savingsRate >= 0.2) {
      savingsScore = 20;
      savingsStatus = 'good';
      savingsTip = '좋은 저축 습관이에요';
    } else if (savingsRate >= 0.1) {
      savingsScore = 15;
      savingsStatus = 'okay';
      savingsTip = '저축률을 조금 더 높여보세요';
    } else if (savingsRate >= 0) {
      savingsScore = 8;
      savingsStatus = 'warning';
      savingsTip = '저축을 시작해보세요';
    } else {
      savingsScore = 0;
      savingsStatus = 'danger';
      savingsTip = '지출이 수입을 초과했어요!';
    }

    factors.push({
      name: '저축률',
      score: savingsScore,
      maxScore: 25,
      icon: '💰',
      status: savingsStatus,
      tip: savingsTip,
    });
    totalScore += savingsScore;
    maxPossibleScore += 25;

    // 3. Debt to Income Ratio (20 points)
    const debtToIncome = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 0;
    let debtScore = 0;
    let debtStatus: HealthFactor['status'] = 'good';
    let debtTip = '';

    if (totalDebt === 0) {
      debtScore = 20;
      debtStatus = 'good';
      debtTip = '부채가 없어요!';
    } else if (debtToIncome <= 0.2) {
      debtScore = 18;
      debtStatus = 'good';
      debtTip = '부채 수준이 건강해요';
    } else if (debtToIncome <= 0.5) {
      debtScore = 12;
      debtStatus = 'okay';
      debtTip = '부채를 조금씩 줄여가세요';
    } else if (debtToIncome <= 1.0) {
      debtScore = 6;
      debtStatus = 'warning';
      debtTip = '부채 상환을 우선시하세요';
    } else {
      debtScore = 2;
      debtStatus = 'danger';
      debtTip = '부채 관리가 시급해요!';
    }

    factors.push({
      name: '부채 비율',
      score: debtScore,
      maxScore: 20,
      icon: '💳',
      status: debtStatus,
      tip: debtTip,
    });
    totalScore += debtScore;
    maxPossibleScore += 20;

    // 4. Category Budget Adherence (15 points)
    let catScore = Math.round(categoryBudgetAdherence * 15 / 100);
    let catStatus: HealthFactor['status'] = 'good';

    if (categoryBudgetAdherence >= 80) catStatus = 'good';
    else if (categoryBudgetAdherence >= 60) catStatus = 'okay';
    else if (categoryBudgetAdherence >= 40) catStatus = 'warning';
    else catStatus = 'danger';

    factors.push({
      name: '카테고리 예산',
      score: catScore,
      maxScore: 15,
      icon: '🏷️',
      status: catStatus,
      tip: categoryBudgetAdherence >= 80 ? '카테고리별 관리를 잘하고 있어요' : '일부 카테고리가 초과됐어요',
    });
    totalScore += catScore;
    maxPossibleScore += 15;

    // 5. Goals Progress (15 points)
    let goalScore = Math.round(savingsGoalProgress * 15 / 100);
    let goalStatus: HealthFactor['status'] = 'good';

    if (savingsGoalProgress >= 80) goalStatus = 'good';
    else if (savingsGoalProgress >= 50) goalStatus = 'okay';
    else if (savingsGoalProgress >= 25) goalStatus = 'warning';
    else goalStatus = 'danger';

    factors.push({
      name: '목표 달성',
      score: goalScore,
      maxScore: 15,
      icon: '🎯',
      status: goalStatus,
      tip: savingsGoalProgress >= 50 ? '목표를 향해 잘 가고 있어요' : '목표 달성을 위해 더 노력해보세요',
    });
    totalScore += goalScore;
    maxPossibleScore += 15;

    // Calculate overall score and grade
    const overallScore = Math.round((totalScore / maxPossibleScore) * 100);

    let grade = '';
    let gradeColor = '';
    let gradeMessage = '';

    if (overallScore >= 90) {
      grade = 'A+';
      gradeColor = '#22C55E';
      gradeMessage = '재정 건강이 최상이에요!';
    } else if (overallScore >= 80) {
      grade = 'A';
      gradeColor = '#22C55E';
      gradeMessage = '훌륭한 재정 관리 상태에요';
    } else if (overallScore >= 70) {
      grade = 'B+';
      gradeColor = '#3B82F6';
      gradeMessage = '양호한 상태, 조금만 더 노력해요';
    } else if (overallScore >= 60) {
      grade = 'B';
      gradeColor = '#3B82F6';
      gradeMessage = '개선의 여지가 있어요';
    } else if (overallScore >= 50) {
      grade = 'C';
      gradeColor = '#F59E0B';
      gradeMessage = '재정 관리에 신경써주세요';
    } else if (overallScore >= 40) {
      grade = 'D';
      gradeColor = '#F59E0B';
      gradeMessage = '재정 상태 개선이 필요해요';
    } else {
      grade = 'F';
      gradeColor = '#EF4444';
      gradeMessage = '재정 관리를 시작해보세요';
    }

    return {
      factors,
      totalScore,
      maxPossibleScore,
      overallScore,
      grade,
      gradeColor,
      gradeMessage,
    };
  }, [monthlyIncome, monthlyExpenses, monthlyBudget, totalSavings, totalDebt, savingsGoalProgress, categoryBudgetAdherence]);

  // Circular progress
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (analysis.overallScore / 100) * circumference;

  const getStatusColor = (status: HealthFactor['status']) => {
    switch (status) {
      case 'good': return '#22C55E';
      case 'okay': return '#3B82F6';
      case 'warning': return '#F59E0B';
      case 'danger': return '#EF4444';
    }
  };

  return (
    <View style={styles.container}>
      {/* Score Circle */}
      <View style={styles.scoreSection}>
        <View style={styles.circleContainer}>
          <Svg width={size} height={size}>
            <Defs>
              <SvgGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={analysis.gradeColor} />
                <Stop offset="100%" stopColor={analysis.gradeColor} stopOpacity="0.5" />
              </SvgGradient>
            </Defs>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#scoreGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={styles.scoreInner}>
            <Text style={[styles.grade, { color: analysis.gradeColor }]}>
              {analysis.grade}
            </Text>
            <Text style={styles.scoreNumber}>{analysis.overallScore}점</Text>
          </View>
        </View>
        <Text style={styles.gradeMessage}>{analysis.gradeMessage}</Text>
      </View>

      {/* Factors Breakdown */}
      <View style={styles.factorsSection}>
        <Text style={styles.factorsTitle}>세부 분석</Text>
        {analysis.factors.map((factor, index) => (
          <Animated.View
            key={factor.name}
            entering={FadeInDown.delay(index * 100).duration(300)}
            style={styles.factorItem}
          >
            <View style={styles.factorHeader}>
              <View style={styles.factorInfo}>
                <Text style={styles.factorIcon}>{factor.icon}</Text>
                <Text style={styles.factorName}>{factor.name}</Text>
              </View>
              <Text style={styles.factorScore}>
                {factor.score}/{factor.maxScore}
              </Text>
            </View>
            <View style={styles.factorBarContainer}>
              <View style={styles.factorBar}>
                <LinearGradient
                  colors={[getStatusColor(factor.status), `${getStatusColor(factor.status)}80`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.factorBarFill,
                    { width: `${(factor.score / factor.maxScore) * 100}%` },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.factorTip}>{factor.tip}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  scoreSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  circleContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  scoreInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grade: {
    fontSize: 36,
    fontWeight: '700',
  },
  scoreNumber: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  gradeMessage: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  factorsSection: {},
  factorsTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  factorItem: {
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  factorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  factorIcon: {
    fontSize: 18,
  },
  factorName: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  factorScore: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  factorBarContainer: {
    marginBottom: Spacing.xs,
  },
  factorBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  factorTip: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
});
