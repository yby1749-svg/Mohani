import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useExpenses, Expense } from '../context/ExpenseContext';
import { AnimatedBackground, GlassCard } from '../components';

interface LocationSummary {
  name: string;
  total: number;
  count: number;
  expenses: Expense[];
  lastVisit: Date;
}

const SpendingByLocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { expenses } = useExpenses();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'total' | 'count' | 'recent'>('total');

  // Group expenses by location
  const locationSummaries = useMemo(() => {
    const summaryMap: Record<string, LocationSummary> = {};

    expenses.forEach((expense) => {
      if (!expense.location?.name) return;

      const locationName = expense.location.name;

      if (!summaryMap[locationName]) {
        summaryMap[locationName] = {
          name: locationName,
          total: 0,
          count: 0,
          expenses: [],
          lastVisit: new Date(expense.date),
        };
      }

      summaryMap[locationName].total += expense.amount;
      summaryMap[locationName].count += 1;
      summaryMap[locationName].expenses.push(expense);

      const expenseDate = new Date(expense.date);
      if (expenseDate > summaryMap[locationName].lastVisit) {
        summaryMap[locationName].lastVisit = expenseDate;
      }
    });

    let sorted = Object.values(summaryMap);

    switch (sortBy) {
      case 'total':
        sorted = sorted.sort((a, b) => b.total - a.total);
        break;
      case 'count':
        sorted = sorted.sort((a, b) => b.count - a.count);
        break;
      case 'recent':
        sorted = sorted.sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());
        break;
    }

    return sorted;
  }, [expenses, sortBy]);

  const totalSpentWithLocation = locationSummaries.reduce((sum, loc) => sum + loc.total, 0);
  const expensesWithLocation = locationSummaries.reduce((sum, loc) => sum + loc.count, 0);
  const uniqueLocations = locationSummaries.length;

  const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return amount.toLocaleString();
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const getLocationIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('스타벅스') || lowerName.includes('커피') || lowerName.includes('카페')) return '☕';
    if (lowerName.includes('편의점') || lowerName.includes('GS') || lowerName.includes('CU')) return '🏪';
    if (lowerName.includes('마트') || lowerName.includes('이마트') || lowerName.includes('홈플러스')) return '🛒';
    if (lowerName.includes('병원') || lowerName.includes('약국')) return '🏥';
    if (lowerName.includes('주유') || lowerName.includes('SK') || lowerName.includes('GS칼텍스')) return '⛽';
    if (lowerName.includes('백화점') || lowerName.includes('롯데') || lowerName.includes('신세계')) return '🏬';
    if (lowerName.includes('역') || lowerName.includes('터미널')) return '🚉';
    if (lowerName.includes('공항')) return '✈️';
    if (lowerName.includes('학교') || lowerName.includes('대학')) return '🏫';
    if (lowerName.includes('회사') || lowerName.includes('오피스')) return '🏢';
    return '📍';
  };

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
            <Text style={styles.headerTitle}>장소별 지출</Text>
            <Text style={styles.headerSubtitle}>Spending by Location</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Summary Cards */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryRow}>
            <GlassCard style={styles.summaryCard}>
              <Ionicons name="location" size={24} color={Colors.purpleLight} />
              <Text style={styles.summaryValue}>{uniqueLocations}</Text>
              <Text style={styles.summaryLabel}>장소</Text>
            </GlassCard>
            <GlassCard style={styles.summaryCard}>
              <Ionicons name="receipt" size={24} color={Colors.success} />
              <Text style={styles.summaryValue}>{expensesWithLocation}</Text>
              <Text style={styles.summaryLabel}>지출</Text>
            </GlassCard>
            <GlassCard style={styles.summaryCard}>
              <Ionicons name="cash" size={24} color={Colors.goldPrimary} />
              <Text style={styles.summaryValue}>₩{formatAmount(totalSpentWithLocation)}</Text>
              <Text style={styles.summaryLabel}>총액</Text>
            </GlassCard>
          </Animated.View>

          {/* Sort Options */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.sortContainer}>
            {[
              { key: 'total', label: '금액순' },
              { key: 'count', label: '방문순' },
              { key: 'recent', label: '최근순' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSortBy(option.key as typeof sortBy);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.key && styles.sortOptionTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Location List */}
          {locationSummaries.length > 0 ? (
            locationSummaries.map((location, index) => (
              <Animated.View
                key={location.name}
                entering={FadeInDown.delay(300 + index * 50)}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedLocation(
                      selectedLocation === location.name ? null : location.name
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <GlassCard style={styles.locationCard}>
                    <View style={styles.locationHeader}>
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationIcon}>
                          {getLocationIcon(location.name)}
                        </Text>
                        <View style={styles.locationDetails}>
                          <Text style={styles.locationName} numberOfLines={1}>
                            {location.name}
                          </Text>
                          <Text style={styles.locationMeta}>
                            {location.count}회 방문 • 마지막 {formatDate(location.lastVisit)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.locationRight}>
                        <Text style={styles.locationTotal}>
                          ₩{location.total.toLocaleString()}
                        </Text>
                        <Ionicons
                          name={selectedLocation === location.name ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={Colors.textMuted}
                        />
                      </View>
                    </View>

                    {/* Expanded expense list */}
                    {selectedLocation === location.name && (
                      <View style={styles.expensesList}>
                        {location.expenses
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 5)
                          .map((expense) => (
                            <View key={expense.id} style={styles.expenseRow}>
                              <Text style={styles.expenseIcon}>{expense.categoryIcon}</Text>
                              <View style={styles.expenseInfo}>
                                <Text style={styles.expenseNote} numberOfLines={1}>
                                  {expense.note || expense.categoryLabel}
                                </Text>
                                <Text style={styles.expenseDate}>
                                  {formatDate(new Date(expense.date))}
                                </Text>
                              </View>
                              <Text style={styles.expenseAmount}>
                                ₩{expense.amount.toLocaleString()}
                              </Text>
                            </View>
                          ))}
                        {location.expenses.length > 5 && (
                          <Text style={styles.moreExpenses}>
                            +{location.expenses.length - 5}건 더보기
                          </Text>
                        )}
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <Animated.View entering={FadeInDown.delay(300)}>
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="location-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>위치 정보가 없어요</Text>
                <Text style={styles.emptySubtitle}>
                  지출 추가시 위치를 입력하면{'\n'}장소별 지출을 확인할 수 있어요
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
    paddingHorizontal: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  sortOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  sortOptionActive: {
    backgroundColor: Colors.purplePrimary,
  },
  sortOptionText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: Colors.text,
  },
  locationCard: {
    marginBottom: Spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  locationIcon: {
    fontSize: 28,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  locationMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  locationRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  locationTotal: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.purpleLight,
  },
  expensesList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: Spacing.sm,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseNote: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  expenseDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  moreExpenses: {
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
    textAlign: 'center',
    marginTop: Spacing.xs,
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

export default SpendingByLocationScreen;
