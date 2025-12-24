import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';

interface Expense {
  id: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  note: string;
  date: Date;
}

interface ExpenseSearchProps {
  visible: boolean;
  onClose: () => void;
  expenses: Expense[];
}

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
];

export const ExpenseSearch: React.FC<ExpenseSearchProps> = ({
  visible,
  onClose,
  expenses,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAmountRange, setSelectedAmountRange] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and search expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.note.toLowerCase().includes(query) ||
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
        // Today
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

  // Calculate summary
  const summary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = filteredExpenses.length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg };
  }, [filteredExpenses]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedAmountRange('all');
    setSelectedDateRange('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseIconContainer}>
        <Text style={styles.expenseIcon}>{item.categoryIcon}</Text>
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseNote} numberOfLines={1}>
          {item.note || item.categoryLabel}
        </Text>
        <Text style={styles.expenseDate}>{formatDate(item.date)} • {item.categoryLabel}</Text>
      </View>
      <Text style={styles.expenseAmount}>₩{item.amount.toLocaleString()}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>지출 검색</Text>
            <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
              <Text style={styles.resetText}>초기화</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="메모, 카테고리 검색..."
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {/* Category Filter */}
            <View style={styles.filterGroup}>
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
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={styles.filterChipIcon}>{cat.icon}</Text>
                      <Text style={[
                        styles.filterChipText,
                        selectedCategory === cat.id && styles.filterChipTextActive,
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>

          {/* Amount & Date Filters */}
          <View style={styles.filterRow}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>금액</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {AMOUNT_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    style={[
                      styles.miniChip,
                      selectedAmountRange === range.id && styles.miniChipActive,
                    ]}
                    onPress={() => setSelectedAmountRange(range.id)}
                  >
                    <Text style={[
                      styles.miniChipText,
                      selectedAmountRange === range.id && styles.miniChipTextActive,
                    ]}>
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>기간</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {DATE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    style={[
                      styles.miniChip,
                      selectedDateRange === range.id && styles.miniChipActive,
                    ]}
                    onPress={() => setSelectedDateRange(range.id)}
                  >
                    <Text style={[
                      styles.miniChipText,
                      selectedDateRange === range.id && styles.miniChipTextActive,
                    ]}>
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.sortRow}>
            <TouchableOpacity
              style={[styles.sortBtn, sortBy === 'date' && styles.sortBtnActive]}
              onPress={() => {
                if (sortBy === 'date') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('date');
                  setSortOrder('desc');
                }
              }}
            >
              <Text style={[styles.sortBtnText, sortBy === 'date' && styles.sortBtnTextActive]}>
                날짜순
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
              onPress={() => {
                if (sortBy === 'amount') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('amount');
                  setSortOrder('desc');
                }
              }}
            >
              <Text style={[styles.sortBtnText, sortBy === 'amount' && styles.sortBtnTextActive]}>
                금액순
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

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.count}건</Text>
              <Text style={styles.summaryLabel}>검색 결과</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>₩{summary.total.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>총 금액</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>₩{Math.round(summary.avg).toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>평균</Text>
            </View>
          </View>

          {/* Results */}
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            renderItem={renderExpenseItem}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
              </View>
            }
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    marginTop: 50,
    backgroundColor: 'rgba(10, 10, 15, 0.98)',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  resetBtn: {
    padding: Spacing.xs,
  },
  resetText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  filtersScroll: {
    maxHeight: 80,
    paddingHorizontal: Spacing.lg,
  },
  filterGroup: {
    marginRight: Spacing.lg,
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
    marginRight: Spacing.xs,
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
  filterRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.sm,
  },
  miniChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
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
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
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
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  expenseIcon: {
    fontSize: 18,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseNote: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginBottom: 2,
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
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
});
