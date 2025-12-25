import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground } from '../components';
import { useBills, Bill } from '../context/BillContext';
import { useSubscriptions, Subscription } from '../context/SubscriptionContext';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

export default function UpcomingPaymentsScreen() {
  const navigation = useNavigation();
  const {
    bills,
    getUpcomingBills,
    getOverdueBills,
    getTotalDue,
    getDaysUntilDue,
    markAsPaid,
  } = useBills();
  const { subscriptions, getUpcomingRenewals, getMonthlyTotal } = useSubscriptions();

  const overdueBills = useMemo(() => getOverdueBills(), [bills]);
  const upcomingBills = useMemo(() => getUpcomingBills(), [bills]);
  const upcomingSubscriptions = useMemo(() => getUpcomingRenewals(7), [subscriptions]);
  const totalBillsDue = useMemo(() => getTotalDue(), [bills]);
  const monthlySubscriptions = useMemo(() => getMonthlyTotal(), [subscriptions]);

  const handleMarkPaid = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAsPaid(id);
  };

  const getDaysText = (days: number): string => {
    if (days === 0) return '오늘';
    if (days === 1) return '내일';
    return `${days}일 후`;
  };

  const getSubscriptionDaysUntil = (sub: Subscription): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextBilling = new Date(sub.nextBillingDate);
    nextBilling.setHours(0, 0, 0, 0);
    const diff = nextBilling.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const totalUpcoming = totalBillsDue + upcomingSubscriptions.reduce((sum, s) => sum + s.amount, 0);

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>예정된 결제</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassCard gradient={Gradients.cardPurple} borderColor={Colors.borderPurple}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryIcon}>💳</Text>
              <Text style={styles.summaryTitle}>결제 요약</Text>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>미납 청구서</Text>
                <Text style={[styles.summaryValue, { color: Colors.error }]}>
                  ₩{totalBillsDue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>월간 구독료</Text>
                <Text style={[styles.summaryValue, { color: Colors.purpleLight }]}>
                  ₩{Math.round(monthlySubscriptions).toLocaleString()}
                </Text>
              </View>
            </View>
            {(overdueBills.length > 0 || upcomingBills.length > 0) && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  {overdueBills.length > 0
                    ? `${overdueBills.length}개 청구서가 연체되었습니다`
                    : `${upcomingBills.length}개 청구서가 곧 납부 기한입니다`}
                </Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Overdue Bills */}
        {overdueBills.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={styles.sectionTitle}>🚨 연체된 청구서</Text>
            <GlassCard
              gradient={['rgba(239, 68, 68, 0.15)', 'rgba(10, 10, 15, 0.95)']}
              borderColor="rgba(239, 68, 68, 0.3)"
            >
              {overdueBills.map((bill, index) => (
                <View
                  key={bill.id}
                  style={[
                    styles.paymentItem,
                    index < overdueBills.length - 1 && styles.paymentItemBorder,
                  ]}
                >
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentIcon}>{bill.categoryIcon}</Text>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>{bill.name}</Text>
                      <Text style={[styles.paymentDue, { color: Colors.error }]}>
                        {bill.dueDay}일 납부 예정 (연체)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>
                      ₩{bill.amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      style={styles.paidBtn}
                      onPress={() => handleMarkPaid(bill.id)}
                    >
                      <Text style={styles.paidBtnText}>납부</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        )}

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={styles.sectionTitle}>📋 다가오는 청구서</Text>
            <GlassCard>
              {upcomingBills.map((bill, index) => {
                const daysUntil = getDaysUntilDue(bill);
                const isUrgent = daysUntil <= 2;

                return (
                  <View
                    key={bill.id}
                    style={[
                      styles.paymentItem,
                      index < upcomingBills.length - 1 && styles.paymentItemBorder,
                    ]}
                  >
                    <View style={styles.paymentLeft}>
                      <Text style={styles.paymentIcon}>{bill.categoryIcon}</Text>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentName}>{bill.name}</Text>
                        <View style={styles.dueBadgeRow}>
                          <View style={[
                            styles.dueBadge,
                            isUrgent && styles.dueBadgeUrgent,
                          ]}>
                            <Text style={[
                              styles.dueBadgeText,
                              isUrgent && styles.dueBadgeTextUrgent,
                            ]}>
                              {getDaysText(daysUntil)}
                            </Text>
                          </View>
                          {bill.isAutoPay && (
                            <View style={styles.autoPayBadge}>
                              <Text style={styles.autoPayText}>자동결제</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.paymentRight}>
                      <Text style={styles.paymentAmount}>
                        ₩{bill.amount.toLocaleString()}
                      </Text>
                      {!bill.isAutoPay && (
                        <TouchableOpacity
                          style={styles.paidBtn}
                          onPress={() => handleMarkPaid(bill.id)}
                        >
                          <Text style={styles.paidBtnText}>납부</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </GlassCard>
          </Animated.View>
        )}

        {/* Upcoming Subscriptions */}
        {upcomingSubscriptions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Text style={styles.sectionTitle}>🔄 갱신 예정 구독</Text>
            <GlassCard>
              {upcomingSubscriptions.map((sub, index) => {
                const daysUntil = getSubscriptionDaysUntil(sub);

                return (
                  <View
                    key={sub.id}
                    style={[
                      styles.paymentItem,
                      index < upcomingSubscriptions.length - 1 && styles.paymentItemBorder,
                    ]}
                  >
                    <View style={styles.paymentLeft}>
                      <View style={[
                        styles.subIconContainer,
                        { backgroundColor: (sub.color || Colors.purplePrimary) + '20' },
                      ]}>
                        <Text style={styles.paymentIcon}>{sub.categoryIcon}</Text>
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentName}>{sub.name}</Text>
                        <View style={styles.dueBadgeRow}>
                          <View style={styles.dueBadge}>
                            <Text style={styles.dueBadgeText}>
                              {formatDate(sub.nextBillingDate)} ({getDaysText(daysUntil)})
                            </Text>
                          </View>
                          <View style={styles.cycleBadge}>
                            <Text style={styles.cycleBadgeText}>
                              {sub.billingCycle === 'monthly' ? '월간' : sub.billingCycle === 'yearly' ? '연간' : '주간'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.paymentAmount}>
                      ₩{sub.amount.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </GlassCard>
          </Animated.View>
        )}

        {/* Empty State */}
        {overdueBills.length === 0 && upcomingBills.length === 0 && upcomingSubscriptions.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <GlassCard>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyTitle}>모든 결제가 완료되었습니다!</Text>
                <Text style={styles.emptyText}>
                  다가오는 청구서나 구독 갱신이 없습니다
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* All Bills List */}
        {bills.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).duration(500)}>
            <Text style={styles.sectionTitle}>📑 전체 청구서</Text>
            <GlassCard>
              {bills.map((bill, index) => (
                <View
                  key={bill.id}
                  style={[
                    styles.allBillItem,
                    index < bills.length - 1 && styles.paymentItemBorder,
                  ]}
                >
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentIcon}>{bill.categoryIcon}</Text>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>{bill.name}</Text>
                      <Text style={styles.allBillDue}>
                        매월 {bill.dueDay}일
                      </Text>
                    </View>
                  </View>
                  <View style={styles.allBillRight}>
                    <Text style={styles.paymentAmount}>
                      ₩{bill.amount.toLocaleString()}
                    </Text>
                    {bill.isPaid ? (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>납부완료</Text>
                      </View>
                    ) : (
                      <View style={styles.unpaidBadge}>
                        <Text style={styles.unpaidBadgeText}>미납</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryIcon: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  warningIcon: {
    fontSize: 16,
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.goldPrimary,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  paymentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  paymentIcon: {
    fontSize: 24,
  },
  subIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  paymentDue: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  dueBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dueBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dueBadgeUrgent: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  dueBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
  },
  dueBadgeTextUrgent: {
    color: Colors.goldPrimary,
  },
  autoPayBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoPayText: {
    fontSize: FontSizes.xs,
    color: Colors.success,
  },
  cycleBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cycleBadgeText: {
    fontSize: FontSizes.xs,
    color: '#3B82F6',
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  paymentAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paidBtn: {
    backgroundColor: Colors.purplePrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  paidBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  allBillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  allBillDue: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  allBillRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paidBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.success,
  },
  unpaidBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unpaidBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  bottomSpacing: {
    height: 100,
  },
});
