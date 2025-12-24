import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeOutRight, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground } from '../components';
import { useExpenses, Expense } from '../context/ExpenseContext';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

const FILTER_OPTIONS = [
  { id: 'all', label: '전체' },
  { id: 'week', label: '이번 주' },
  { id: 'month', label: '이번 달' },
];

export default function ExpenseHistoryScreen() {
  const { expenses, removeExpense } = useExpenses();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Apply time filter
    const now = new Date();
    if (activeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((e) => new Date(e.date) >= weekAgo);
    } else if (activeFilter === 'month') {
      result = result.filter((e) => {
        const date = new Date(e.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.note.toLowerCase().includes(query) ||
          e.categoryLabel.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [expenses, searchQuery, activeFilter]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: { date: string; expenses: Expense[]; total: number }[] = [];
    let currentDate = '';
    let currentGroup: Expense[] = [];

    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

      if (dateStr !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            expenses: currentGroup,
            total: currentGroup.reduce((sum, e) => sum + e.amount, 0),
          });
        }
        currentDate = dateStr;
        currentGroup = [expense];
      } else {
        currentGroup.push(expense);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        expenses: currentGroup,
        total: currentGroup.reduce((sum, e) => sum + e.amount, 0),
      });
    }

    return groups;
  }, [filteredExpenses]);

  const handleDelete = (expense: Expense) => {
    Alert.alert(
      '지출 삭제',
      `"${expense.note || expense.categoryLabel}" 항목을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeExpense(expense.id);
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return '오늘';
    }
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return '어제';
    }

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${month}월 ${day}일 (${days[date.getDay()]})`;
  };

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const renderExpenseItem = ({ item: expense, index }: { item: Expense; index: number }) => (
    <Animated.View
      entering={FadeInRight.delay(index * 30)}
      exiting={FadeOutRight}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={styles.expenseItem}
        onLongPress={() => handleDelete(expense)}
        activeOpacity={0.7}
      >
        <View style={styles.expenseIcon}>
          <Text style={styles.iconText}>{expense.categoryIcon}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseNote} numberOfLines={1}>
            {expense.note || expense.categoryLabel}
          </Text>
          <Text style={styles.expenseCategory}>{expense.categoryLabel}</Text>
        </View>
        <Text style={styles.expenseAmount}>
          -₩{expense.amount.toLocaleString()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDateGroup = ({ item: group }: { item: typeof groupedExpenses[0] }) => (
    <View style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{formatDate(group.date)}</Text>
        <Text style={styles.dateTotalText}>₩{group.total.toLocaleString()}</Text>
      </View>
      {group.expenses.map((expense, index) => (
        <View key={expense.id}>
          {renderExpenseItem({ item: expense, index })}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header showBack />

      <View style={styles.content}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.screenHeader}
        >
          <Text style={styles.screenTitle}>지출 내역</Text>
          <Text style={styles.totalText}>₩{totalFiltered.toLocaleString()}</Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="검색..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={styles.filterTabs}>
            {FILTER_OPTIONS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterTab,
                  activeFilter === filter.id && styles.filterTabActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveFilter(filter.id);
                }}
              >
                {activeFilter === filter.id ? (
                  <LinearGradient
                    colors={Gradients.purple as [string, string]}
                    style={styles.filterTabGradient}
                  >
                    <Text style={styles.filterTabTextActive}>{filter.label}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.filterTabText}>{filter.label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Expense List */}
        {groupedExpenses.length > 0 ? (
          <FlatList
            data={groupedExpenses}
            renderItem={renderDateGroup}
            keyExtractor={(item) => item.date}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다' : '지출 내역이 없습니다'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? '다른 검색어를 시도해보세요' : '지출을 기록하면 여기에 표시됩니다'}
            </Text>
          </View>
        )}

        {/* Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>길게 누르면 삭제할 수 있어요</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  screenTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.goldPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterTab: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  filterTabActive: {},
  filterTabGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterTabText: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  filterTabTextActive: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  dateGroup: {
    marginBottom: Spacing.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  dateText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateTotalText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
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
  expenseNote: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  expenseAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.error,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: BorderRadius.md,
    position: 'absolute',
    bottom: Spacing.xl + 80,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  tipIcon: {
    fontSize: 16,
  },
  tipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});
