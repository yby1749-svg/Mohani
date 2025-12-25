import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes, Gradients } from '../constants/theme';

interface SavingsCalculatorProps {
  currentSavings?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
}

export const SavingsCalculator: React.FC<SavingsCalculatorProps> = ({
  currentSavings = 0,
  monthlyIncome = 0,
  monthlyExpenses = 0,
}) => {
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlySavings, setMonthlySavings] = useState('');
  const [activeTab, setActiveTab] = useState<'time' | 'amount'>('time');

  const formatNumber = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers) {
      return parseInt(numbers, 10).toLocaleString();
    }
    return '';
  };

  const parseNumber = (text: string) => {
    return parseInt(text.replace(/,/g, ''), 10) || 0;
  };

  // Calculate time to reach goal
  const timeCalculation = useMemo(() => {
    const target = parseNumber(targetAmount);
    const monthly = parseNumber(monthlySavings);

    if (target <= 0 || monthly <= 0) return null;

    const remaining = target - currentSavings;
    if (remaining <= 0) {
      return {
        months: 0,
        years: 0,
        targetDate: new Date(),
        already: true,
        progressPercent: 100,
        totalContribution: 0,
      };
    }

    const months = Math.ceil(remaining / monthly);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);

    return {
      months,
      years,
      remainingMonths,
      targetDate,
      already: false,
      totalContribution: monthly * months,
      progressPercent: Math.round((currentSavings / target) * 100),
    };
  }, [targetAmount, monthlySavings, currentSavings]);

  // Calculate required monthly savings
  const amountCalculation = useMemo(() => {
    const target = parseNumber(targetAmount);
    const targetMonths = parseNumber(monthlySavings); // In amount tab, this field is used for months

    if (target <= 0 || targetMonths <= 0) return null;

    const remaining = target - currentSavings;
    if (remaining <= 0) {
      return {
        monthlyRequired: 0,
        weeklyRequired: 0,
        dailyRequired: 0,
        targetDate: new Date(),
        already: true,
        progressPercent: 100,
      };
    }

    const monthlyRequired = Math.ceil(remaining / targetMonths);
    const weeklyRequired = Math.ceil(monthlyRequired / 4);
    const dailyRequired = Math.ceil(monthlyRequired / 30);

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    return {
      monthlyRequired,
      weeklyRequired,
      dailyRequired,
      targetDate,
      already: false,
      progressPercent: Math.round((currentSavings / target) * 100),
    };
  }, [targetAmount, monthlySavings, currentSavings]);

  // Savings tips based on current data
  const savingsTips = useMemo(() => {
    const tips: { icon: string; text: string; type: 'positive' | 'neutral' | 'negative' }[] = [];
    const disposable = monthlyIncome - monthlyExpenses;

    if (disposable > 0) {
      tips.push({
        icon: '💰',
        text: `월 가용 금액: ₩${disposable.toLocaleString()}`,
        type: 'positive',
      });

      if (disposable >= monthlyIncome * 0.2) {
        tips.push({
          icon: '🎯',
          text: '20% 이상 저축 가능! 좋은 재정 상태입니다',
          type: 'positive',
        });
      }
    }

    if (monthlyExpenses > monthlyIncome * 0.8) {
      tips.push({
        icon: '⚠️',
        text: '지출이 수입의 80% 이상입니다. 절약을 고려해보세요',
        type: 'negative',
      });
    }

    if (currentSavings > 0) {
      tips.push({
        icon: '✨',
        text: `현재 ₩${currentSavings.toLocaleString()} 저축됨`,
        type: 'neutral',
      });
    }

    return tips;
  }, [monthlyIncome, monthlyExpenses, currentSavings]);

  // Preset amounts
  const presetAmounts = [
    { label: '100만', value: 1000000 },
    { label: '500만', value: 5000000 },
    { label: '1000만', value: 10000000 },
    { label: '5000만', value: 50000000 },
  ];

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'time' && styles.activeTab]}
          onPress={() => setActiveTab('time')}
        >
          <Text style={[styles.tabText, activeTab === 'time' && styles.activeTabText]}>
            기간 계산
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'amount' && styles.activeTab]}
          onPress={() => setActiveTab('amount')}
        >
          <Text style={[styles.tabText, activeTab === 'amount' && styles.activeTabText]}>
            금액 계산
          </Text>
        </TouchableOpacity>
      </View>

      {/* Target Amount Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>목표 금액</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.currencySymbol}>₩</Text>
          <TextInput
            style={styles.input}
            value={targetAmount}
            onChangeText={(text) => setTargetAmount(formatNumber(text))}
            placeholder="10,000,000"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.presetContainer}>
          {presetAmounts.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={styles.presetBtn}
              onPress={() => setTargetAmount(preset.value.toLocaleString())}
            >
              <Text style={styles.presetText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Secondary Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>
          {activeTab === 'time' ? '월 저축 금액' : '목표 기간 (개월)'}
        </Text>
        <View style={styles.inputContainer}>
          {activeTab === 'time' && <Text style={styles.currencySymbol}>₩</Text>}
          <TextInput
            style={styles.input}
            value={monthlySavings}
            onChangeText={(text) => setMonthlySavings(formatNumber(text))}
            placeholder={activeTab === 'time' ? '500,000' : '12'}
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="numeric"
          />
          {activeTab === 'amount' && <Text style={styles.unitLabel}>개월</Text>}
        </View>
      </View>

      {/* Results */}
      {activeTab === 'time' && timeCalculation && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.resultContainer}>
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.2)', 'rgba(10, 10, 15, 0.9)']}
            style={styles.resultGradient}
          >
            {timeCalculation.already ? (
              <View style={styles.resultSuccess}>
                <Text style={styles.successIcon}>🎉</Text>
                <Text style={styles.successText}>이미 목표를 달성했습니다!</Text>
              </View>
            ) : (
              <>
                <View style={styles.resultMain}>
                  <Text style={styles.resultLabel}>목표 달성까지</Text>
                  <View style={styles.resultValueRow}>
                    {timeCalculation.years > 0 && (
                      <>
                        <Text style={styles.resultValue}>{timeCalculation.years}</Text>
                        <Text style={styles.resultUnit}>년</Text>
                      </>
                    )}
                    <Text style={styles.resultValue}>{timeCalculation.remainingMonths}</Text>
                    <Text style={styles.resultUnit}>개월</Text>
                  </View>
                  <Text style={styles.resultDate}>
                    {timeCalculation.targetDate.getFullYear()}년 {timeCalculation.targetDate.getMonth() + 1}월 달성 예정
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>현재 진행률</Text>
                    <Text style={styles.progressPercent}>{timeCalculation.progressPercent}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(timeCalculation.progressPercent, 100)}%` },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.resultStats}>
                  <View style={styles.resultStat}>
                    <Text style={styles.statLabel}>총 저축 필요액</Text>
                    <Text style={styles.statValue}>
                      ₩{(parseNumber(targetAmount) - currentSavings).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.resultStat}>
                    <Text style={styles.statLabel}>총 {timeCalculation.months}회 저축</Text>
                    <Text style={styles.statValue}>
                      ₩{timeCalculation.totalContribution?.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      )}

      {activeTab === 'amount' && amountCalculation && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.resultContainer}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.2)', 'rgba(10, 10, 15, 0.9)']}
            style={styles.resultGradient}
          >
            {amountCalculation.already ? (
              <View style={styles.resultSuccess}>
                <Text style={styles.successIcon}>🎉</Text>
                <Text style={styles.successText}>이미 목표를 달성했습니다!</Text>
              </View>
            ) : (
              <>
                <View style={styles.resultMain}>
                  <Text style={styles.resultLabel}>필요 저축 금액</Text>
                  <View style={styles.resultValueRow}>
                    <Text style={styles.resultCurrency}>₩</Text>
                    <Text style={styles.resultValue}>
                      {amountCalculation.monthlyRequired.toLocaleString()}
                    </Text>
                    <Text style={styles.resultUnit}>/월</Text>
                  </View>
                  <Text style={styles.resultDate}>
                    {amountCalculation.targetDate.getFullYear()}년 {amountCalculation.targetDate.getMonth() + 1}월 달성 예정
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>현재 진행률</Text>
                    <Text style={styles.progressPercent}>{amountCalculation.progressPercent}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(amountCalculation.progressPercent, 100)}%` },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.resultStats}>
                  <View style={styles.resultStat}>
                    <Text style={styles.statLabel}>주간</Text>
                    <Text style={styles.statValue}>
                      ₩{amountCalculation.weeklyRequired.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.resultStat}>
                    <Text style={styles.statLabel}>일간</Text>
                    <Text style={styles.statValue}>
                      ₩{amountCalculation.dailyRequired.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      )}

      {/* Savings Tips */}
      {savingsTips.length > 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 저축 팁</Text>
          {savingsTips.map((tip, index) => (
            <View
              key={index}
              style={[
                styles.tipItem,
                tip.type === 'positive' && styles.tipPositive,
                tip.type === 'negative' && styles.tipNegative,
              ]}
            >
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  activeTab: {
    backgroundColor: Colors.purplePrimary,
  },
  tabText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.text,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: FontSizes.xl,
    fontWeight: '300',
    color: Colors.purpleLight,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  unitLabel: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  presetContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  presetBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  presetText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
    fontWeight: '500',
  },
  resultContainer: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  resultGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  resultMain: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  resultLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  resultCurrency: {
    fontSize: FontSizes.xl,
    color: Colors.purpleLight,
    marginRight: Spacing.xs,
  },
  resultValue: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.text,
  },
  resultUnit: {
    fontSize: FontSizes.lg,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
  resultDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  resultSuccess: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  successText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#22C55E',
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  progressPercent: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.purpleLight,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.purpleLight,
    borderRadius: 4,
  },
  resultStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  resultStat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  tipsTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  tipPositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  tipNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  tipIcon: {
    fontSize: 16,
  },
  tipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
});
