import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { AnimatedBackground, GlassCard } from '../components';
import { useBudgetAlerts, CategoryBudget } from '../context/BudgetAlertContext';
import { useSettings } from '../context/SettingsContext';
import { useExpenses } from '../context/ExpenseContext';

const CATEGORIES = [
  { id: 'food', label: '식비', icon: '🍔' },
  { id: 'transport', label: '교통', icon: '🚗' },
  { id: 'shopping', label: '쇼핑', icon: '🛍️' },
  { id: 'entertainment', label: '여가', icon: '🎬' },
  { id: 'health', label: '건강', icon: '💊' },
  { id: 'education', label: '교육', icon: '📚' },
  { id: 'housing', label: '주거', icon: '🏠' },
  { id: 'utilities', label: '공과금', icon: '💡' },
  { id: 'cafe', label: '카페', icon: '☕' },
  { id: 'other', label: '기타', icon: '📦' },
];

const ALERT_THRESHOLDS = [50, 60, 70, 80, 90];

const BudgetSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { getCategoryTotals } = useExpenses();
  const {
    categoryBudgets,
    totalBudgetAlertAt,
    setCategoryBudget,
    removeCategoryBudget,
    setTotalBudgetAlertAt,
    getActiveAlerts,
    clearAlerts,
  } = useBudgetAlerts();

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);

  const activeAlerts = getActiveAlerts();
  const categoryTotals = getCategoryTotals();

  const handleAddBudget = () => {
    if (!selectedCategory || !budgetAmount) {
      Alert.alert('오류', '카테고리와 예산 금액을 입력해주세요.');
      return;
    }

    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return;

    const amount = parseInt(budgetAmount.replace(/,/g, ''), 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('오류', '올바른 금액을 입력해주세요.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setCategoryBudget({
      category: category.id,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      limit: amount,
      alertAt: alertThreshold,
      enabled: true,
    });

    setShowAddCategory(false);
    setSelectedCategory(null);
    setBudgetAmount('');
    setAlertThreshold(80);
  };

  const handleToggleBudget = (budget: CategoryBudget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryBudget({ ...budget, enabled: !budget.enabled });
  };

  const handleDeleteBudget = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      '예산 삭제',
      '이 카테고리의 예산 설정을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => removeCategoryBudget(category),
        },
      ]
    );
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString();
  };

  const getCategorySpent = (category: string): number => {
    const found = categoryTotals.find((c) => c.category === category);
    return found?.total || 0;
  };

  const availableCategories = CATEGORIES.filter(
    (c) => !categoryBudgets.find((b) => b.category === c.id)
  );

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
            <Text style={styles.headerTitle}>예산 알림</Text>
            <Text style={styles.headerSubtitle}>Budget Alerts</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>활성 알림</Text>
                <TouchableOpacity onPress={clearAlerts}>
                  <Text style={styles.clearButton}>모두 지우기</Text>
                </TouchableOpacity>
              </View>
              {activeAlerts.slice(0, 3).map((alert) => (
                <GlassCard
                  key={alert.id}
                  style={{
                    ...styles.alertCard,
                    ...(alert.type === 'exceeded' ? styles.alertCardDanger : {}),
                  }}
                >
                  <View style={styles.alertContent}>
                    <Text style={styles.alertIcon}>
                      {alert.type === 'exceeded' ? '🚨' : '⚠️'}
                    </Text>
                    <View style={styles.alertTextContainer}>
                      <Text style={styles.alertMessage}>{alert.message}</Text>
                      <Text style={styles.alertTime}>
                        {new Date(alert.timestamp).toLocaleDateString('ko-KR')}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </Animated.View>
          )}

          {/* Total Budget Alert Setting */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text style={styles.sectionTitle}>전체 예산 알림</Text>
            <GlassCard style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>월 예산</Text>
                  <Text style={styles.settingValue}>
                    ₩{formatAmount(settings.monthlyBudget)}
                  </Text>
                </View>
              </View>
              <View style={styles.thresholdContainer}>
                <Text style={styles.thresholdLabel}>
                  알림 기준: {totalBudgetAlertAt}% 사용 시
                </Text>
                <View style={styles.thresholdButtons}>
                  {ALERT_THRESHOLDS.map((threshold) => (
                    <TouchableOpacity
                      key={threshold}
                      style={[
                        styles.thresholdButton,
                        totalBudgetAlertAt === threshold && styles.thresholdButtonActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTotalBudgetAlertAt(threshold);
                      }}
                    >
                      <Text
                        style={[
                          styles.thresholdButtonText,
                          totalBudgetAlertAt === threshold && styles.thresholdButtonTextActive,
                        ]}
                      >
                        {threshold}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Category Budgets */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>카테고리별 예산</Text>
              {availableCategories.length > 0 && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddCategory(true);
                  }}
                >
                  <Ionicons name="add" size={20} color={Colors.purpleLight} />
                  <Text style={styles.addButtonText}>추가</Text>
                </TouchableOpacity>
              )}
            </View>

            {categoryBudgets.length > 0 ? (
              categoryBudgets.map((budget, index) => {
                const spent = getCategorySpent(budget.category);
                const percentage = Math.round((spent / budget.limit) * 100);
                const isOverBudget = percentage >= 100;
                const isWarning = percentage >= budget.alertAt;

                return (
                  <Animated.View
                    key={budget.category}
                    entering={FadeInDown.delay(350 + index * 50)}
                  >
                    <GlassCard style={styles.budgetCard}>
                      <View style={styles.budgetHeader}>
                        <View style={styles.budgetInfo}>
                          <Text style={styles.budgetIcon}>{budget.categoryIcon}</Text>
                          <View>
                            <Text style={styles.budgetLabel}>{budget.categoryLabel}</Text>
                            <Text style={styles.budgetMeta}>
                              알림: {budget.alertAt}% 도달 시
                            </Text>
                          </View>
                        </View>
                        <View style={styles.budgetActions}>
                          <Switch
                            value={budget.enabled}
                            onValueChange={() => handleToggleBudget(budget)}
                            trackColor={{ false: Colors.bgCard, true: Colors.purplePrimary }}
                            thumbColor={Colors.text}
                          />
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteBudget(budget.category)}
                          >
                            <Ionicons name="trash-outline" size={18} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.budgetProgress}>
                        <View style={styles.budgetAmounts}>
                          <Text style={[
                            styles.budgetSpent,
                            isOverBudget && styles.textDanger,
                            isWarning && !isOverBudget && styles.textWarning,
                          ]}>
                            ₩{formatAmount(spent)}
                          </Text>
                          <Text style={styles.budgetLimit}>
                            / ₩{formatAmount(budget.limit)}
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${Math.min(percentage, 100)}%` },
                              isOverBudget && styles.progressDanger,
                              isWarning && !isOverBudget && styles.progressWarning,
                            ]}
                          />
                        </View>
                        <Text style={[
                          styles.percentageText,
                          isOverBudget && styles.textDanger,
                          isWarning && !isOverBudget && styles.textWarning,
                        ]}>
                          {percentage}%
                        </Text>
                      </View>
                    </GlassCard>
                  </Animated.View>
                );
              })
            ) : (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="pie-chart-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>카테고리 예산이 없어요</Text>
                <Text style={styles.emptySubtitle}>
                  카테고리별로 예산을 설정하고{'\n'}알림을 받아보세요
                </Text>
              </GlassCard>
            )}
          </Animated.View>

          {/* Add Category Budget Modal */}
          {showAddCategory && (
            <Animated.View entering={FadeInDown} style={styles.addModal}>
              <GlassCard style={styles.addModalCard}>
                <Text style={styles.addModalTitle}>카테고리 예산 추가</Text>

                <Text style={styles.inputLabel}>카테고리 선택</Text>
                <View style={styles.categoryGrid}>
                  {availableCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        selectedCategory === category.id && styles.categoryOptionActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCategory(category.id);
                      }}
                    >
                      <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                      <Text style={[
                        styles.categoryOptionLabel,
                        selectedCategory === category.id && styles.categoryOptionLabelActive,
                      ]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>예산 금액</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencyPrefix}>₩</Text>
                  <TextInput
                    style={styles.input}
                    value={budgetAmount}
                    onChangeText={(text) => {
                      const numOnly = text.replace(/[^0-9]/g, '');
                      setBudgetAmount(numOnly ? parseInt(numOnly).toLocaleString() : '');
                    }}
                    placeholder="100,000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <Text style={styles.inputLabel}>알림 기준</Text>
                <View style={styles.thresholdButtons}>
                  {ALERT_THRESHOLDS.map((threshold) => (
                    <TouchableOpacity
                      key={threshold}
                      style={[
                        styles.thresholdButton,
                        alertThreshold === threshold && styles.thresholdButtonActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAlertThreshold(threshold);
                      }}
                    >
                      <Text
                        style={[
                          styles.thresholdButtonText,
                          alertThreshold === threshold && styles.thresholdButtonTextActive,
                        ]}
                      >
                        {threshold}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.addModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowAddCategory(false);
                      setSelectedCategory(null);
                      setBudgetAmount('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddBudget}
                  >
                    <Text style={styles.saveButtonText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </Animated.View>
          )}

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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  clearButton: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
  },
  alertCard: {
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  alertCardDanger: {
    borderLeftColor: Colors.error,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  alertIcon: {
    fontSize: 24,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertMessage: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  alertTime: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingCard: {
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    gap: 4,
  },
  settingLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  settingValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  thresholdContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  thresholdLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  thresholdButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  thresholdButtonActive: {
    backgroundColor: Colors.purplePrimary,
  },
  thresholdButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  thresholdButtonTextActive: {
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
  },
  budgetCard: {
    marginBottom: Spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  budgetIcon: {
    fontSize: 28,
  },
  budgetLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  budgetMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  budgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  budgetProgress: {
    marginTop: Spacing.md,
  },
  budgetAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  budgetSpent: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  budgetLimit: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.purplePrimary,
    borderRadius: 3,
  },
  progressWarning: {
    backgroundColor: Colors.warning,
  },
  progressDanger: {
    backgroundColor: Colors.error,
  },
  percentageText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  textWarning: {
    color: Colors.warning,
  },
  textDanger: {
    color: Colors.error,
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
  addModal: {
    marginTop: Spacing.lg,
  },
  addModalCard: {
    padding: Spacing.lg,
  },
  addModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: Spacing.xs,
  },
  categoryOptionActive: {
    backgroundColor: Colors.purplePrimary,
  },
  categoryOptionIcon: {
    fontSize: 16,
  },
  categoryOptionLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  categoryOptionLabelActive: {
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencyPrefix: {
    fontSize: FontSizes.lg,
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.lg,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  addModalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.purplePrimary,
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default BudgetSettingsScreen;
