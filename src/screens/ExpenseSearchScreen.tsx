import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { AnimatedBackground } from '../components';
import { useExpenses, Expense } from '../context/ExpenseContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../constants/theme';

const CATEGORIES = [
  { id: 'all', label: '전체', icon: '📋' },
  { id: 'food', label: '식비', icon: '🍜' },
  { id: 'transport', label: '교통', icon: '🚇' },
  { id: 'shopping', label: '쇼핑', icon: '🛍️' },
  { id: 'entertainment', label: '여가', icon: '🎮' },
  { id: 'cafe', label: '카페', icon: '☕' },
  { id: 'health', label: '건강', icon: '💊' },
  { id: 'bills', label: '공과금', icon: '📄' },
  { id: 'other', label: '기타', icon: '📦' },
];

const AMOUNT_RANGES = [
  { id: 'all', label: '전체', min: 0, max: Infinity },
  { id: 'under10k', label: '~1만원', min: 0, max: 10000 },
  { id: '10k-50k', label: '1~5만원', min: 10000, max: 50000 },
  { id: '50k-100k', label: '5~10만원', min: 50000, max: 100000 },
  { id: 'over100k', label: '10만원+', min: 100000, max: Infinity },
];

const DATE_RANGES = [
  { id: 'all', label: '전체', days: Infinity },
  { id: 'today', label: '오늘', days: 0 },
  { id: 'week', label: '이번 주', days: 7 },
  { id: 'month', label: '이번 달', days: 30 },
  { id: '3months', label: '3개월', days: 90 },
  { id: '6months', label: '6개월', days: 180 },
  { id: 'year', label: '1년', days: 365 },
];

export default function ExpenseSearchScreen() {
  const navigation = useNavigation();
  const { expenses } = useExpenses();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAmountRange, setSelectedAmountRange] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(true);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.note?.toLowerCase().includes(query) ||
        e.categoryLabel.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((e) => e.category === selectedCategory);
    }

    // Amount range filter
    const amountRange = AMOUNT_RANGES.find((r) => r.id === selectedAmountRange);
    if (amountRange && selectedAmountRange !== 'all') {
      result = result.filter(
        (e) => e.amount >= amountRange.min && e.amount < amountRange.max
      );
    }

    // Date range filter
    const dateRange = DATE_RANGES.find((r) => r.id === selectedDateRange);
    if (dateRange && selectedDateRange !== 'all') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (dateRange.days === 0) {
        result = result.filter((e) => {
          const expenseDate = new Date(e.date);
          expenseDate.setHours(0, 0, 0, 0);
          return expenseDate.getTime() === now.getTime();
        });
      } else {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - dateRange.days);
        result = result.filter((e) => new Date(e.date) >= cutoff);
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortOrder === 'desc' ? -diff : diff;
      } else {
        const diff = a.amount - b.amount;
        return sortOrder === 'desc' ? -diff : diff;
      }
    });

    return result;
  }, [expenses, searchQuery, selectedCategory, selectedAmountRange, selectedDateRange, sortBy, sortOrder]);

  const summary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = filteredExpenses.length;
    const avg = count > 0 ? total / count : 0;
    const max = count > 0 ? Math.max(...filteredExpenses.map((e) => e.amount)) : 0;
    return { total, count, avg, max };
  }, [filteredExpenses]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedAmountRange !== 'all') count++;
    if (selectedDateRange !== 'all') count++;
    return count;
  }, [selectedCategory, selectedAmountRange, selectedDateRange]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}.${month}.${day}`;
  };

  const resetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedAmountRange('all');
    setSelectedDateRange('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const toggleSort = (type: 'date' | 'amount') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sortBy === type) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const renderExpenseItem = ({ item, index }: { item: Expense; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(200)}>
      <View style={styles.expenseItem}>
        <View style={styles.expenseIconContainer}>
          <Text style={styles.expenseIcon}>{item.categoryIcon}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseNote} numberOfLines={1}>
            {item.note || item.categoryLabel}
          </Text>
          <Text style={styles.expenseDate}>
            {formatDate(item.date)} • {item.categoryLabel}
          </Text>
        </View>
        <Text style={styles.expenseAmount}>₩{item.amount.toLocaleString()}</Text>
      </View>
    </Animated.View>
  );

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
        <Text style={styles.headerTitle}>지출 검색</Text>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name={showFilters ? 'options' : 'options-outline'}
            size={24}
            color={activeFiltersCount > 0 ? Colors.purpleLight : Colors.textPrimary}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="메모, 카테고리로 검색..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {showFilters && (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.filtersContainer}>
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>카테고리</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.filterChip,
                      selectedCategory === cat.id && styles.filterChipActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(cat.id);
                    }}
                  >
                    <Text style={styles.filterChipIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === cat.id && styles.filterChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Amount Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>금액 범위</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {AMOUNT_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    style={[
                      styles.miniChip,
                      selectedAmountRange === range.id && styles.miniChipActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedAmountRange(range.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.miniChipText,
                        selectedAmountRange === range.id && styles.miniChipTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Date Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>기간</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {DATE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    style={[
                      styles.miniChip,
                      selectedDateRange === range.id && styles.miniChipActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedDateRange(range.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.miniChipText,
                        selectedDateRange === range.id && styles.miniChipTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Reset Button */}
          {activeFiltersCount > 0 && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetText}>필터 초기화</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Sort & Summary */}
      <View style={styles.sortSummaryRow}>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'date' && styles.sortBtnActive]}
            onPress={() => toggleSort('date')}
          >
            <Text style={[styles.sortBtnText, sortBy === 'date' && styles.sortBtnTextActive]}>
              날짜
            </Text>
            {sortBy === 'date' && (
              <Ionicons
                name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'}
                size={14}
                color={Colors.purpleLight}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'amount' && styles.sortBtnActive]}
            onPress={() => toggleSort('amount')}
          >
            <Text style={[styles.sortBtnText, sortBy === 'amount' && styles.sortBtnTextActive]}>
              금액
            </Text>
            {sortBy === 'amount' && (
              <Ionicons
                name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'}
                size={14}
                color={Colors.purpleLight}
              />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.resultCount}>{summary.count}건</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>총 금액</Text>
          <Text style={styles.summaryValue}>₩{summary.total.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>평균</Text>
          <Text style={styles.summaryValue}>₩{Math.round(summary.avg).toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>최대</Text>
          <Text style={styles.summaryValue}>₩{summary.max.toLocaleString()}</Text>
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        style={styles.resultsList}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
            <Text style={styles.emptyText}>
              다른 검색어나 필터를 시도해보세요
            </Text>
          </View>
        }
      />
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
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  filterChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  miniChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.sm,
  },
  miniChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
  },
  miniChipText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  miniChipTextActive: {
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  resetBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.sm,
  },
  resetText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
  },
  sortSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  sortBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  sortBtnText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  sortBtnTextActive: {
    color: Colors.purpleLight,
  },
  resultCount: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  expenseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  expenseIcon: {
    fontSize: 20,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseNote: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  expenseAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.purpleLight,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
