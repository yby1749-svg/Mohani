import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useExpenses } from '../context/ExpenseContext';
import { AnimatedBackground, GlassCard } from '../components';

const SplitBalancesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { getSplitBalances, markSplitAsPaid, expenses } = useExpenses();
  const [expandedFriend, setExpandedFriend] = useState<string | null>(null);

  const balances = getSplitBalances();

  const totalOwedToMe = balances.reduce((sum, b) => sum + (b.balance > 0 ? b.balance : 0), 0);
  const totalIOwe = balances.reduce((sum, b) => sum + (b.balance < 0 ? Math.abs(b.balance) : 0), 0);

  const handleMarkPaid = (expenseId: string, participantId: string, name: string) => {
    Alert.alert(
      '정산 완료',
      `${name}님의 정산을 완료했나요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '완료',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markSplitAsPaid(expenseId, participantId);
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}`;
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>정산 현황</Text>
            <Text style={styles.headerSubtitle}>Split Balances</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryCard}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
                style={styles.summaryGradient}
              >
                <Ionicons name="arrow-down-circle" size={28} color={Colors.success} />
                <Text style={styles.summaryLabel}>받을 금액</Text>
                <Text style={[styles.summaryAmount, { color: Colors.success }]}>
                  ₩{totalOwedToMe.toLocaleString()}
                </Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200)} style={styles.summaryCard}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
                style={styles.summaryGradient}
              >
                <Ionicons name="arrow-up-circle" size={28} color={Colors.error} />
                <Text style={styles.summaryLabel}>보낼 금액</Text>
                <Text style={[styles.summaryAmount, { color: Colors.error }]}>
                  ₩{totalIOwe.toLocaleString()}
                </Text>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Balances List */}
          {balances.length > 0 ? (
            balances.map((item, index) => (
              <Animated.View
                key={item.friend.id}
                entering={FadeInDown.delay(300 + index * 100)}
              >
                <GlassCard style={styles.balanceCard}>
                  <TouchableOpacity
                    style={styles.balanceHeader}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpandedFriend(
                        expandedFriend === item.friend.id ? null : item.friend.id
                      );
                    }}
                  >
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendEmoji}>{item.friend.emoji}</Text>
                      <View>
                        <Text style={styles.friendName}>{item.friend.name}</Text>
                        <Text style={styles.expenseCount}>
                          {item.expenses.length}건의 정산
                        </Text>
                      </View>
                    </View>
                    <View style={styles.balanceInfo}>
                      <Text
                        style={[
                          styles.balanceAmount,
                          { color: item.balance > 0 ? Colors.success : Colors.error },
                        ]}
                      >
                        {item.balance > 0 ? '+' : ''}₩{item.balance.toLocaleString()}
                      </Text>
                      <Text style={styles.balanceStatus}>
                        {item.balance > 0 ? '받을 금액' : '보낼 금액'}
                      </Text>
                    </View>
                    <Ionicons
                      name={expandedFriend === item.friend.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>

                  {expandedFriend === item.friend.id && (
                    <View style={styles.expensesList}>
                      {item.expenses.map((expense) => {
                        const participant = expense.split?.participants.find(
                          (p) => p.id === item.friend.id
                        );
                        if (!participant) return null;

                        return (
                          <View key={expense.id} style={styles.expenseItem}>
                            <View style={styles.expenseInfo}>
                              <Text style={styles.expenseIcon}>{expense.categoryIcon}</Text>
                              <View style={styles.expenseDetails}>
                                <Text style={styles.expenseNote}>
                                  {expense.note || expense.categoryLabel}
                                </Text>
                                <Text style={styles.expenseDate}>
                                  {formatDate(expense.date)}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.expenseRight}>
                              <Text style={styles.expenseAmount}>
                                ₩{participant.amount.toLocaleString()}
                              </Text>
                              {!participant.isPaid && (
                                <TouchableOpacity
                                  style={styles.markPaidBtn}
                                  onPress={() =>
                                    handleMarkPaid(expense.id, participant.id, item.friend.name)
                                  }
                                >
                                  <Text style={styles.markPaidText}>정산 완료</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </GlassCard>
              </Animated.View>
            ))
          ) : (
            <Animated.View entering={FadeInDown.delay(300)}>
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>정산 내역이 없어요</Text>
                <Text style={styles.emptySubtitle}>
                  지출을 추가할 때 "나누기" 버튼으로{'\n'}친구와 함께 나눠보세요
                </Text>
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
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  summaryAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  balanceCard: {
    marginBottom: Spacing.md,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  friendEmoji: {
    fontSize: 32,
  },
  friendName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  expenseCount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  balanceInfo: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  balanceAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  balanceStatus: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  expensesList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: Spacing.sm,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  expenseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  expenseIcon: {
    fontSize: 20,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseNote: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  expenseDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  expenseAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  markPaidBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  markPaidText: {
    fontSize: FontSizes.xs,
    color: Colors.success,
    fontWeight: '500',
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

export default SplitBalancesScreen;
