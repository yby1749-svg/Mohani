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
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground } from '../components';
import { AddSplitExpenseModal } from '../components/AddSplitExpenseModal';
import { useSplitExpenses, SplitExpense } from '../context/SplitExpenseContext';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

export default function SplitExpenseScreen() {
  const {
    splits,
    addSplit,
    markParticipantPaid,
    settleSplit,
    deleteSplit,
    getAmountOwedToMe,
    getAmountIOwe,
    getUnsettledSplits,
  } = useSplitExpenses();

  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unsettled' | 'settled'>('unsettled');

  const amountOwedToMe = getAmountOwedToMe();
  const amountIOwe = getAmountIOwe();
  const unsettledSplits = getUnsettledSplits();

  const filteredSplits = splits.filter((split) => {
    if (activeTab === 'unsettled') return !split.isSettled;
    if (activeTab === 'settled') return split.isSettled;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return amount.toLocaleString();
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleMarkPaid = (splitId: string, participantId: string, participantName: string) => {
    Alert.alert(
      '정산 확인',
      `${participantName}님이 정산했나요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markParticipantPaid(splitId, participantId);
          },
        },
      ]
    );
  };

  const handleSettleAll = (splitId: string) => {
    Alert.alert(
      '전체 정산',
      '모든 참여자가 정산했나요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            settleSplit(splitId);
          },
        },
      ]
    );
  };

  const handleDelete = (splitId: string) => {
    Alert.alert(
      '삭제',
      '이 정산 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteSplit(splitId);
          },
        },
      ]
    );
  };

  const renderSplitCard = (split: SplitExpense, index: number) => {
    const unpaidParticipants = split.participants.filter((p) => !p.isPaid && p.name !== split.paidBy);
    const paidParticipants = split.participants.filter((p) => p.isPaid || p.name === split.paidBy);

    return (
      <Animated.View
        key={split.id}
        entering={FadeInDown.delay(index * 80).duration(300)}
      >
        <GlassCard style={styles.splitCard}>
          {/* Header */}
          <View style={styles.splitHeader}>
            <View style={styles.splitInfo}>
              <Text style={styles.splitIcon}>{split.categoryIcon}</Text>
              <View>
                <Text style={styles.splitTitle}>{split.title}</Text>
                <Text style={styles.splitDate}>{formatDate(split.date)}</Text>
              </View>
            </View>
            <View style={styles.splitAmountContainer}>
              <Text style={styles.splitAmount}>₩{formatCurrency(split.totalAmount)}</Text>
              {split.isSettled ? (
                <View style={styles.settledBadge}>
                  <Text style={styles.settledBadgeText}>완료</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.settleAllBtn}
                  onPress={() => handleSettleAll(split.id)}
                >
                  <Text style={styles.settleAllBtnText}>전체 정산</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Paid By */}
          <View style={styles.paidByRow}>
            <Text style={styles.paidByLabel}>결제자:</Text>
            <View style={styles.paidByBadge}>
              <Text style={styles.paidByText}>{split.paidBy}</Text>
            </View>
          </View>

          {/* Participants */}
          <View style={styles.participantsList}>
            {split.participants.map((participant) => {
              if (participant.name === split.paidBy) return null;

              return (
                <View key={participant.id} style={styles.participantRow}>
                  <View style={styles.participantInfo}>
                    <View style={[
                      styles.participantAvatar,
                      participant.isPaid && styles.participantAvatarPaid,
                    ]}>
                      <Text style={styles.participantInitial}>
                        {participant.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.participantName,
                      participant.isPaid && styles.participantNamePaid,
                    ]}>
                      {participant.name}
                    </Text>
                  </View>
                  <View style={styles.participantRight}>
                    <Text style={[
                      styles.participantShare,
                      participant.isPaid && styles.participantSharePaid,
                    ]}>
                      ₩{formatCurrency(participant.share)}
                    </Text>
                    {!split.isSettled && (
                      participant.isPaid ? (
                        <View style={styles.paidCheckmark}>
                          <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.markPaidBtn}
                          onPress={() => handleMarkPaid(split.id, participant.id, participant.name)}
                        >
                          <Text style={styles.markPaidBtnText}>정산</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Notes */}
          {split.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{split.notes}</Text>
            </View>
          )}

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(split.id)}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header showMenu={false} showNotification={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.screenHeader}
        >
          <Text style={styles.screenTitle}>더치페이</Text>
          <Text style={styles.screenSubtitle}>Split Expenses</Text>
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.summaryContainer}
        >
          <GlassCard style={styles.summaryCard}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']}
              style={styles.summaryGradient}
            >
              <Text style={styles.summaryLabel}>받을 금액</Text>
              <Text style={[styles.summaryAmount, { color: '#22C55E' }]}>
                ₩{formatCurrency(amountOwedToMe)}
              </Text>
            </LinearGradient>
          </GlassCard>

          <GlassCard style={styles.summaryCard}>
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
              style={styles.summaryGradient}
            >
              <Text style={styles.summaryLabel}>보낼 금액</Text>
              <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
                ₩{formatCurrency(amountIOwe)}
              </Text>
            </LinearGradient>
          </GlassCard>
        </Animated.View>

        {/* Tabs */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.tabsContainer}
        >
          {(['unsettled', 'all', 'settled'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'unsettled' ? '진행중' : tab === 'all' ? '전체' : '완료'}
              </Text>
              {tab === 'unsettled' && unsettledSplits.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unsettledSplits.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Split List */}
        {filteredSplits.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            style={styles.emptyState}
          >
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'unsettled'
                ? '진행중인 정산이 없어요'
                : activeTab === 'settled'
                ? '완료된 정산이 없어요'
                : '정산 기록이 없어요'}
            </Text>
            <Text style={styles.emptySubtext}>
              + 버튼을 눌러 새 정산을 추가해보세요
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.splitsList}>
            {filteredSplits.map((split, index) => renderSplitCard(split, index))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Gradients.primary as [string, string]}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={28} color={Colors.textPrimary} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Modal */}
      <AddSplitExpenseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addSplit}
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
    marginBottom: Spacing.xl,
  },
  screenTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.purplePrimary,
  },
  tabText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: {
    fontSize: 10,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  splitsList: {
    gap: Spacing.md,
  },
  splitCard: {
    position: 'relative',
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  splitIcon: {
    fontSize: 28,
  },
  splitTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  splitDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  splitAmountContainer: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  splitAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settledBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  settledBadgeText: {
    fontSize: FontSizes.xs,
    color: '#22C55E',
    fontWeight: '600',
  },
  settleAllBtn: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  settleAllBtnText: {
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  paidByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paidByLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  paidByBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  paidByText: {
    fontSize: FontSizes.sm,
    color: Colors.goldPrimary,
    fontWeight: '600',
  },
  participantsList: {
    gap: Spacing.sm,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarPaid: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  participantInitial: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  participantName: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  participantNamePaid: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  participantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  participantShare: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  participantSharePaid: {
    color: Colors.textMuted,
  },
  paidCheckmark: {
    width: 48,
    alignItems: 'center',
  },
  markPaidBtn: {
    backgroundColor: Colors.purplePrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  markPaidBtnText: {
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notesText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  deleteBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  bottomSpacing: {
    height: 100,
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.xl,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: Colors.purplePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
