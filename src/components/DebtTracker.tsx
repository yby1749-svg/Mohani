import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes, Gradients } from '../constants/theme';
import { Debt } from '../context/DebtContext';

interface DebtTrackerProps {
  debts: Debt[];
  totalOwed: number;
  totalOwedToMe: number;
  onAddDebt: () => void;
  onViewDebt: (debt: Debt) => void;
  getProgress: (debtId: string) => number;
}

export const DebtTracker: React.FC<DebtTrackerProps> = ({
  debts,
  totalOwed,
  totalOwedToMe,
  onAddDebt,
  onViewDebt,
  getProgress,
}) => {
  const activeDebts = debts.filter((d) => d.isActive);
  const priorityDebts = activeDebts
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    } else if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return amount.toLocaleString();
  };

  const getPriorityColor = (priority: Debt['priority']) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#22C55E';
    }
  };

  const getDaysUntilDue = (dueDate?: Date) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryIcon}>💸</Text>
          <Text style={styles.summaryLabel}>갚아야 할 돈</Text>
          <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
            ₩{formatCurrency(totalOwed)}
          </Text>
        </LinearGradient>

        <LinearGradient
          colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryIcon}>💰</Text>
          <Text style={styles.summaryLabel}>받아야 할 돈</Text>
          <Text style={[styles.summaryAmount, { color: '#22C55E' }]}>
            ₩{formatCurrency(totalOwedToMe)}
          </Text>
        </LinearGradient>
      </View>

      {/* Net Balance */}
      <View style={styles.netBalance}>
        <Text style={styles.netLabel}>순 부채</Text>
        <Text style={[
          styles.netAmount,
          { color: totalOwed > totalOwedToMe ? '#EF4444' : '#22C55E' }
        ]}>
          {totalOwed > totalOwedToMe ? '-' : '+'}₩{formatCurrency(Math.abs(totalOwed - totalOwedToMe))}
        </Text>
      </View>

      {/* Priority Debts */}
      {priorityDebts.length > 0 ? (
        <View style={styles.debtList}>
          <Text style={styles.listTitle}>우선 상환 대상</Text>
          {priorityDebts.map((debt, index) => {
            const progress = getProgress(debt.id);
            const daysLeft = getDaysUntilDue(debt.dueDate);

            return (
              <Animated.View
                key={debt.id}
                entering={FadeInDown.delay(index * 100).duration(300)}
              >
                <TouchableOpacity
                  style={styles.debtItem}
                  onPress={() => onViewDebt(debt)}
                  activeOpacity={0.7}
                >
                  <View style={styles.debtLeft}>
                    <View style={styles.debtIconContainer}>
                      <Text style={styles.debtIcon}>{debt.categoryIcon}</Text>
                      <View style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityColor(debt.priority) }
                      ]} />
                    </View>
                    <View style={styles.debtInfo}>
                      <Text style={styles.debtName} numberOfLines={1}>
                        {debt.name}
                      </Text>
                      <Text style={styles.debtPerson} numberOfLines={1}>
                        {debt.personOrInstitution}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.debtRight}>
                    <Text style={[
                      styles.debtAmount,
                      { color: debt.type === 'owe' ? '#EF4444' : '#22C55E' }
                    ]}>
                      {debt.type === 'owe' ? '-' : '+'}₩{debt.currentBalance.toLocaleString()}
                    </Text>
                    {daysLeft !== null && (
                      <Text style={[
                        styles.dueText,
                        daysLeft <= 7 && styles.dueSoon,
                        daysLeft <= 0 && styles.dueOverdue,
                      ]}>
                        {daysLeft <= 0 ? '기한 초과' : daysLeft <= 7 ? `D-${daysLeft}` : `${daysLeft}일 남음`}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={['#7c3aed', '#6d28d9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{progress}% 상환</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyText}>부채가 없어요!</Text>
          <Text style={styles.emptySubtext}>부채를 추가하려면 아래 버튼을 탭하세요</Text>
        </View>
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={onAddDebt}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Gradients.purpleSubtle as [string, string]}
          style={styles.addBtnGradient}
        >
          <Text style={styles.addBtnIcon}>+</Text>
          <Text style={styles.addBtnText}>부채 추가</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  netBalance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  netLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  netAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  listTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  debtList: {
    marginBottom: Spacing.md,
  },
  debtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  debtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  debtIconContainer: {
    position: 'relative',
  },
  debtIcon: {
    fontSize: 28,
  },
  priorityIndicator: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.bgSecondary,
  },
  debtInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  debtName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  debtPerson: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  debtRight: {
    alignItems: 'flex-end',
  },
  debtAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  dueText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dueSoon: {
    color: '#F59E0B',
  },
  dueOverdue: {
    color: '#EF4444',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingLeft: 40,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    minWidth: 60,
    textAlign: 'right',
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
    marginTop: Spacing.sm,
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
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
});
