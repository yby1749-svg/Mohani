import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useRecurringExpenses, RecurringExpense } from '../context/RecurringExpenseContext';
import { useExpenses } from '../context/ExpenseContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../constants/theme';

interface RecurringQuickAddProps {
  onAddSuccess?: () => void;
}

export const RecurringQuickAdd: React.FC<RecurringQuickAddProps> = ({ onAddSuccess }) => {
  const { getDueToday, updateRecurring } = useRecurringExpenses();
  const { addExpense } = useExpenses();

  const dueToday = useMemo(() => getDueToday(), [getDueToday]);

  // Check if already processed today
  const isProcessedToday = (expense: RecurringExpense): boolean => {
    if (!expense.lastProcessed) return false;
    const lastProcessed = new Date(expense.lastProcessed);
    const today = new Date();
    return (
      lastProcessed.getFullYear() === today.getFullYear() &&
      lastProcessed.getMonth() === today.getMonth() &&
      lastProcessed.getDate() === today.getDate()
    );
  };

  const pendingExpenses = useMemo(() => {
    return dueToday.filter((e) => !isProcessedToday(e));
  }, [dueToday]);

  const handleQuickAdd = (expense: RecurringExpense) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Add as expense
    addExpense({
      amount: expense.amount,
      category: expense.category,
      categoryLabel: expense.categoryLabel,
      categoryIcon: expense.categoryIcon,
      note: `${expense.name} (정기)`,
      date: new Date(),
    });

    // Mark as processed today
    updateRecurring(expense.id, { lastProcessed: new Date() });

    onAddSuccess?.();
  };

  const handleAddAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    pendingExpenses.forEach((expense) => {
      addExpense({
        amount: expense.amount,
        category: expense.category,
        categoryLabel: expense.categoryLabel,
        categoryIcon: expense.categoryIcon,
        note: `${expense.name} (정기)`,
        date: new Date(),
      });

      updateRecurring(expense.id, { lastProcessed: new Date() });
    });

    onAddSuccess?.();
  };

  const getFrequencyLabel = (frequency: RecurringExpense['frequency']): string => {
    switch (frequency) {
      case 'daily':
        return '매일';
      case 'weekly':
        return '매주';
      case 'monthly':
        return '매월';
      case 'yearly':
        return '매년';
      default:
        return '';
    }
  };

  if (pendingExpenses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🔄</Text>
          <Text style={styles.headerTitle}>오늘의 정기 지출</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingExpenses.length}</Text>
          </View>
        </View>
        {pendingExpenses.length > 1 && (
          <TouchableOpacity style={styles.addAllBtn} onPress={handleAddAll}>
            <Text style={styles.addAllText}>모두 추가</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pendingExpenses.map((expense, index) => (
          <Animated.View
            key={expense.id}
            entering={FadeInRight.delay(index * 50).duration(200)}
          >
            <TouchableOpacity
              style={styles.expenseCard}
              onPress={() => handleQuickAdd(expense)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <Text style={styles.expenseIcon}>{expense.categoryIcon}</Text>
                <View style={styles.frequencyBadge}>
                  <Text style={styles.frequencyText}>
                    {getFrequencyLabel(expense.frequency)}
                  </Text>
                </View>
              </View>
              <Text style={styles.expenseName} numberOfLines={1}>
                {expense.name}
              </Text>
              <Text style={styles.expenseAmount}>
                ₩{expense.amount.toLocaleString()}
              </Text>
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>+ 추가</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <Text style={styles.hint}>
        탭하여 오늘 지출로 빠르게 추가하세요
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.purplePrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addAllBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  addAllText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  scrollContent: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  expenseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  expenseIcon: {
    fontSize: 28,
  },
  frequencyBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  frequencyText: {
    fontSize: 10,
    color: Colors.purpleLight,
    fontWeight: '500',
  },
  expenseName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.goldPrimary,
    marginBottom: Spacing.sm,
  },
  addButton: {
    backgroundColor: Colors.purplePrimary,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  hint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});

export default RecurringQuickAdd;
