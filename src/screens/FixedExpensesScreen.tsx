import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeOutRight, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground } from '../components';
import { AddRecurringModal } from '../components/AddRecurringModal';
import { useRecurringExpenses } from '../context/RecurringExpenseContext';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

const FREQUENCY_LABELS: Record<string, string> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
  yearly: '매년',
};

export default function FixedExpensesScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const {
    recurringExpenses,
    addRecurring,
    deleteRecurring,
    toggleActive,
    getTotalMonthly,
  } = useRecurringExpenses();

  const monthlyTotal = getTotalMonthly();
  const activeCount = recurringExpenses.filter((e) => e.isActive).length;

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '삭제 확인',
      `"${name}"을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteRecurring(id);
          },
        },
      ]
    );
  };

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleActive(id);
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header showBack />

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
          <Text style={styles.screenTitle}>Fixed Expenses</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.addBtnGradient}
            >
              <Ionicons name="add" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Summary Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard gradient={Gradients.cardGold} borderColor={Colors.borderGold}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>월간 고정 지출</Text>
              <Text style={styles.summaryCount}>{activeCount}개 활성</Text>
            </View>
            <View style={styles.summaryAmount}>
              <Text style={styles.currency}>₩</Text>
              <Text style={styles.amount}>{Math.round(monthlyTotal).toLocaleString()}</Text>
            </View>
            <Text style={styles.summaryNote}>
              매월 자동으로 발생하는 지출 총액이에요
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Expenses List */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💳 고정 지출 목록</Text>
            </View>

            {recurringExpenses.length > 0 ? (
              <View style={styles.expensesList}>
                {recurringExpenses.map((expense, index) => (
                  <Animated.View
                    key={expense.id}
                    entering={FadeInRight.delay(index * 50)}
                    exiting={FadeOutRight}
                    layout={Layout.springify()}
                  >
                    <TouchableOpacity
                      style={[
                        styles.expenseItem,
                        !expense.isActive && styles.expenseItemInactive,
                      ]}
                      onPress={() => handleToggle(expense.id)}
                      onLongPress={() => handleDelete(expense.id, expense.name)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.expenseIcon}>
                        <Text style={styles.iconText}>{expense.categoryIcon}</Text>
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={[
                          styles.expenseName,
                          !expense.isActive && styles.textInactive,
                        ]}>
                          {expense.name}
                        </Text>
                        <View style={styles.expenseMeta}>
                          <Text style={styles.expenseFrequency}>
                            {FREQUENCY_LABELS[expense.frequency]}
                            {expense.dayOfMonth && ` ${expense.dayOfMonth}일`}
                          </Text>
                          <Text style={styles.expenseCategory}>
                            {expense.categoryLabel}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.expenseRight}>
                        <Text style={[
                          styles.expenseAmount,
                          !expense.isActive && styles.textInactive,
                        ]}>
                          ₩{expense.amount.toLocaleString()}
                        </Text>
                        <View style={[
                          styles.statusDot,
                          expense.isActive ? styles.statusActive : styles.statusInactive,
                        ]} />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💸</Text>
                <Text style={styles.emptyText}>고정 지출이 없어요</Text>
                <Text style={styles.emptySubtext}>
                  + 버튼을 눌러 월세, 구독료 등을 추가해보세요
                </Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              탭하면 활성/비활성 전환, 길게 누르면 삭제할 수 있어요.{'\n'}
              비활성 항목은 월간 총액에서 제외됩니다.
            </Text>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Modal */}
      <AddRecurringModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(expense) => {
          addRecurring(expense);
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
  addBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  addBtnGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryCount: {
    fontSize: FontSizes.sm,
    color: Colors.goldPrimary,
  },
  summaryAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  currency: {
    fontSize: FontSizes.xl,
    fontWeight: '500',
    color: Colors.goldPrimary,
    marginRight: Spacing.xs,
  },
  amount: {
    fontSize: FontSizes.giant,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryNote: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  expensesList: {
    gap: Spacing.sm,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  expenseItemInactive: {
    opacity: 0.5,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  expenseMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  expenseFrequency: {
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
  },
  expenseCategory: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  expenseAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.goldPrimary,
  },
  textInactive: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#4ade80',
  },
  statusInactive: {
    backgroundColor: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.purplePrimary,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});
