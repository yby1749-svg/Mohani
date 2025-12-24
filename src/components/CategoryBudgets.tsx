import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { CategoryBudget } from '../context/CategoryBudgetContext';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: Date;
}

interface CategoryBudgetsProps {
  budgets: CategoryBudget[];
  expenses: Expense[];
  onSetBudget: (category: string, limit: number) => void;
  onRemoveBudget: (category: string) => void;
  getCategorySpending: (category: string, expenses: Expense[]) => number;
}

const ALL_CATEGORIES = [
  { key: 'food', label: '식비', icon: '🍚', color: '#7c3aed' },
  { key: 'transport', label: '교통', icon: '🚌', color: '#3b82f6' },
  { key: 'shopping', label: '쇼핑', icon: '🛍️', color: '#ec4899' },
  { key: 'entertainment', label: '여가', icon: '🎮', color: '#8b5cf6' },
  { key: 'cafe', label: '카페', icon: '☕', color: '#f59e0b' },
  { key: 'health', label: '건강', icon: '💊', color: '#10b981' },
  { key: 'bills', label: '공과금', icon: '📄', color: '#64748b' },
  { key: 'other', label: '기타', icon: '📦', color: '#6b7280' },
];

export const CategoryBudgets: React.FC<CategoryBudgetsProps> = ({
  budgets,
  expenses,
  onSetBudget,
  onRemoveBudget,
  getCategorySpending,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');

  const handleSaveBudget = () => {
    if (selectedCategory && budgetAmount) {
      onSetBudget(selectedCategory, parseFloat(budgetAmount));
      setShowAddModal(false);
      setSelectedCategory(null);
      setBudgetAmount('');
    }
  };

  const getProgress = (budget: CategoryBudget) => {
    const spent = getCategorySpending(budget.category, expenses);
    return Math.min((spent / budget.limit) * 100, 100);
  };

  const getStatus = (budget: CategoryBudget) => {
    const spent = getCategorySpending(budget.category, expenses);
    const percent = (spent / budget.limit) * 100;

    if (percent >= 100) return { color: '#EF4444', label: '초과', icon: '🚨' };
    if (percent >= 80) return { color: '#F59E0B', label: '주의', icon: '⚠️' };
    if (percent >= 50) return { color: '#3B82F6', label: '보통', icon: '📊' };
    return { color: '#22C55E', label: '양호', icon: '✅' };
  };

  const unbdgetedCategories = ALL_CATEGORIES.filter(
    (c) => !budgets.find((b) => b.category === c.key)
  );

  return (
    <View style={styles.container}>
      {/* Budget List */}
      {budgets.length > 0 ? (
        <View style={styles.budgetList}>
          {budgets.map((budget, index) => {
            const spent = getCategorySpending(budget.category, expenses);
            const progress = getProgress(budget);
            const status = getStatus(budget);
            const remaining = budget.limit - spent;

            return (
              <Animated.View
                key={budget.category}
                entering={FadeInDown.delay(index * 100).duration(300)}
              >
                <TouchableOpacity
                  style={styles.budgetItem}
                  onLongPress={() => onRemoveBudget(budget.category)}
                  activeOpacity={0.8}
                >
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetIcon}>{budget.categoryIcon}</Text>
                      <View>
                        <Text style={styles.budgetLabel}>{budget.categoryLabel}</Text>
                        <Text style={styles.budgetSubtext}>
                          ₩{spent.toLocaleString()} / ₩{budget.limit.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusIcon}>{status.icon}</Text>
                      <Text style={[styles.statusLabel, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <LinearGradient
                        colors={
                          progress >= 100
                            ? ['#EF4444', '#DC2626']
                            : progress >= 80
                            ? ['#F59E0B', '#D97706']
                            : [budget.color, budget.color]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${progress}%` }]}
                      />
                    </View>
                    <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                  </View>

                  <View style={styles.budgetFooter}>
                    <Text style={[
                      styles.remainingText,
                      { color: remaining < 0 ? '#EF4444' : '#22C55E' }
                    ]}>
                      {remaining >= 0 ? `₩${remaining.toLocaleString()} 남음` : `₩${Math.abs(remaining).toLocaleString()} 초과`}
                    </Text>
                    <Text style={styles.holdText}>길게 눌러서 삭제</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>카테고리별 예산을 설정해보세요</Text>
          <Text style={styles.emptySubtext}>지출 관리가 더 쉬워져요</Text>
        </View>
      )}

      {/* Add Budget Button */}
      {unbdgetedCategories.length > 0 && (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnIcon}>+</Text>
          <Text style={styles.addBtnText}>예산 추가</Text>
        </TouchableOpacity>
      )}

      {/* Add Budget Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <BlurView intensity={20} tint="dark" style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>카테고리 예산 설정</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Category Selection */}
            <Text style={styles.sectionLabel}>카테고리 선택</Text>
            <View style={styles.categoryGrid}>
              {unbdgetedCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryBtn,
                    selectedCategory === cat.key && styles.categoryBtnActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    selectedCategory === cat.key && styles.categoryLabelActive,
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Budget Amount */}
            <Text style={styles.sectionLabel}>월 예산</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₩</Text>
              <TextInput
                style={styles.amountInput}
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmounts}>
              {[50000, 100000, 200000, 300000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountBtn}
                  onPress={() => setBudgetAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>
                    {amount >= 10000 ? `${amount / 10000}만` : amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!selectedCategory || !budgetAmount) && styles.saveBtnDisabled,
              ]}
              onPress={handleSaveBudget}
              disabled={!selectedCategory || !budgetAmount}
            >
              <Text style={styles.saveBtnText}>저장</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  budgetList: {
    gap: Spacing.md,
  },
  budgetItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  budgetIcon: {
    fontSize: 28,
  },
  budgetLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  budgetSubtext: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  remainingText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  holdText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderWidth: 1,
    borderColor: Colors.borderPurple,
    borderStyle: 'dashed',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  addBtnIcon: {
    fontSize: FontSizes.lg,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  addBtnText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryBtn: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 70,
  },
  categoryBtnActive: {
    borderColor: Colors.purpleLight,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  categoryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  categoryLabelActive: {
    color: Colors.purpleLight,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontSize: FontSizes.xl,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickAmountBtn: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: Colors.purpleLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
