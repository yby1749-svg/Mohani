import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground } from '../components';
import { AddDiaryModal } from '../components/AddDiaryModal';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { useDiary } from '../context/DiaryContext';
import { useExpenses } from '../context/ExpenseContext';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MOOD_EMOJIS: Record<string, string> = {
  great: '😊',
  good: '🙂',
  okay: '😐',
  bad: '😔',
  awful: '😢',
};

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎬',
  health: '💊',
  bills: '📄',
  education: '📚',
  other: '💰',
};

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const { entries, addEntry, getEntryByDate, getEntriesForMonth } = useDiary();
  const { expenses, addExpense } = useExpenses();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthlyEntries = getEntriesForMonth(year, month);

  // Get expenses for a specific day
  const getExpensesForDay = (day: number) => {
    const dayExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return (
        expenseDate.getDate() === day &&
        expenseDate.getMonth() === month &&
        expenseDate.getFullYear() === year
      );
    });
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    if (total === 0) return null;
    if (total >= 1000000) return `${(total / 1000000).toFixed(1)}M`;
    if (total >= 1000) return `${Math.round(total / 1000)}k`;
    return total.toString();
  };

  // Check if a day has a diary entry
  const getDiaryForDay = (day: number) => {
    const date = new Date(year, month, day);
    return getEntryByDate(date);
  };

  const selectedDate = selectedDay ? new Date(year, month, selectedDay) : null;
  const selectedDiary = selectedDate ? getEntryByDate(selectedDate) : null;

  // Get expenses for selected day
  const selectedDayExpenses = selectedDay
    ? expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year;
      })
    : [];
  const selectedDayTotal = selectedDayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const navigateMonth = (direction: 'prev' | 'next') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
    setSelectedDay(null);
  };

  const selectDay = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(day);
  };

  const handleAddDiary = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDiaryModal(true);
  };

  const handleAddExpense = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowExpenseModal(true);
  };

  const renderCalendarDays = () => {
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected = day === selectedDay;
      const diary = getDiaryForDay(day);
      const expense = getExpensesForDay(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell]}
          onPress={() => selectDay(day)}
          activeOpacity={0.7}
        >
          {isToday || isSelected ? (
            <LinearGradient
              colors={Gradients.purple as [string, string]}
              style={styles.dayGradient}
            >
              <Text style={[styles.dayNumber, styles.dayNumberActive]}>
                {day}
              </Text>
              {expense && (
                <Text style={[styles.dayExpense, styles.dayExpenseActive]}>
                  {expense}
                </Text>
              )}
            </LinearGradient>
          ) : (
            <View style={styles.dayContent}>
              <Text style={styles.dayNumber}>{day}</Text>
              {expense && <Text style={styles.dayExpense}>{expense}</Text>}
            </View>
          )}
          {diary && (
            <View style={[styles.diaryDot, isToday || isSelected ? styles.diaryDotActive : null]}>
              <Text style={styles.diaryDotEmoji}>{MOOD_EMOJIS[diary.mood]}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  // Calculate monthly stats
  const monthlyExpenseTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const daysWithExpenses = new Set(
    expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map((e) => new Date(e.date).getDate())
  ).size;

  const dailyAvg = daysWithExpenses > 0 ? Math.round(monthlyExpenseTotal / daysWithExpenses) : 0;

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.calendarHeader}
        >
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Calendar Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard>
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((day, index) => (
                <View key={index} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.daysGrid}>{renderCalendarDays()}</View>
          </GlassCard>
        </Animated.View>

        {/* Selected Day Diary */}
        {selectedDay && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <GlassCard gradient={Gradients.cardPurple} borderColor={Colors.borderPurple}>
              <View style={styles.diaryHeader}>
                <View>
                  <Text style={styles.diaryDate}>
                    {month + 1}월 {selectedDay}일
                  </Text>
                  <Text style={styles.diarySubtitle}>
                    {selectedDiary ? '오늘의 일기' : '일기가 없습니다'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.addDiaryBtn} onPress={handleAddDiary}>
                  <LinearGradient
                    colors={Gradients.purple as [string, string]}
                    style={styles.addDiaryBtnGradient}
                  >
                    <Ionicons
                      name={selectedDiary ? "pencil" : "add"}
                      size={20}
                      color="white"
                    />
                    <Text style={styles.addDiaryBtnText}>
                      {selectedDiary ? '수정' : '일기 쓰기'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {selectedDiary ? (
                <View style={styles.diaryContent}>
                  <View style={styles.diaryMood}>
                    <Text style={styles.diaryMoodEmoji}>{MOOD_EMOJIS[selectedDiary.mood]}</Text>
                    <Text style={styles.diaryMoodLabel}>{selectedDiary.moodLabel}</Text>
                  </View>
                  <Text style={styles.diaryText} numberOfLines={4}>
                    {selectedDiary.content}
                  </Text>
                  {selectedDiary.tags.length > 0 && (
                    <View style={styles.diaryTags}>
                      {selectedDiary.tags.map((tag) => (
                        <View key={tag} style={styles.diaryTag}>
                          <Text style={styles.diaryTagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noDiary}>
                  <Text style={styles.noDiaryIcon}>✨</Text>
                  <Text style={styles.noDiaryText}>
                    오늘 하루를 기록해보세요
                  </Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* Selected Day Expenses */}
        {selectedDay && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <GlassCard>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseTitle}>💸 지출 내역</Text>
                <TouchableOpacity style={styles.addExpenseBtn} onPress={handleAddExpense}>
                  <LinearGradient
                    colors={Gradients.gold as [string, string]}
                    style={styles.addExpenseBtnGradient}
                  >
                    <Ionicons name="add" size={18} color="white" />
                    <Text style={styles.addExpenseBtnText}>지출 추가</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              {selectedDayExpenses.length > 0 ? (
                <>
                  <Text style={styles.expenseDayTotal}>
                    총 ₩{selectedDayTotal.toLocaleString()}
                  </Text>
                  <View style={styles.expenseList}>
                    {selectedDayExpenses.map((expense, index) => (
                      <View key={expense.id} style={[
                        styles.expenseItem,
                        index < selectedDayExpenses.length - 1 && styles.expenseItemBorder
                      ]}>
                        <View style={styles.expenseIcon}>
                          <Text style={styles.expenseIconText}>
                            {CATEGORY_ICONS[expense.category] || '💰'}
                          </Text>
                        </View>
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseNote} numberOfLines={1}>
                            {expense.note || expense.category}
                          </Text>
                          <Text style={styles.expenseCategory}>
                            {expense.category}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                          ₩{expense.amount.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.noExpenses}>
                  <Text style={styles.noExpensesIcon}>💳</Text>
                  <Text style={styles.noExpensesText}>이 날 지출 내역이 없습니다</Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* Monthly Summary */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard>
            <Text style={styles.summaryTitle}>{MONTHS[month]} Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={styles.summaryValue}>
                  ₩{monthlyExpenseTotal.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Daily Avg</Text>
                <Text style={styles.summaryValue}>
                  ₩{dailyAvg.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Diary Entries</Text>
                <Text style={styles.summaryValue}>{monthlyEntries.length} days</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Diary Modal */}
      <AddDiaryModal
        visible={showDiaryModal}
        onClose={() => setShowDiaryModal(false)}
        onAdd={(entry) => {
          addEntry(entry);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        existingEntry={selectedDiary ? {
          mood: selectedDiary.mood,
          content: selectedDiary.content,
          tags: selectedDiary.tags,
        } : undefined}
        selectedDate={selectedDate || undefined}
      />

      {/* Expense Modal */}
      <AddExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onAdd={(expense) => {
          // Override the date to selected date
          const expenseWithDate = {
            ...expense,
            date: selectedDate || new Date(),
          };
          addExpense(expenseWithDate);
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
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  weekdayText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayContent: {
    alignItems: 'center',
  },
  dayGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dayNumberActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  dayExpense: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dayExpenseActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  diaryDot: {
    position: 'absolute',
    bottom: 2,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryDotActive: {
    bottom: -8,
  },
  diaryDotEmoji: {
    fontSize: 10,
  },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  diaryDate: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  diarySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addDiaryBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  addDiaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addDiaryBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  diaryContent: {
    gap: Spacing.md,
  },
  diaryMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  diaryMoodEmoji: {
    fontSize: 24,
  },
  diaryMoodLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  diaryText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  diaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  diaryTag: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  diaryTagText: {
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
  },
  noDiary: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noDiaryIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  noDiaryText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  summaryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.purpleLight,
  },
  bottomSpacing: {
    height: 100,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  expenseTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  expenseTotal: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.purpleLight,
  },
  expenseList: {
    gap: Spacing.xs,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  expenseItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  expenseIconText: {
    fontSize: 18,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseNote: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  expenseCategory: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  expenseAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  addExpenseBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  addExpenseBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addExpenseBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  expenseDayTotal: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.purpleLight,
    marginBottom: Spacing.md,
  },
  noExpenses: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noExpensesIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  noExpensesText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
