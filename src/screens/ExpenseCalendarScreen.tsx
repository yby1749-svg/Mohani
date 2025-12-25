import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useExpenses, Expense } from '../context/ExpenseContext';
import { AnimatedBackground, GlassCard } from '../components';

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - Spacing.lg * 2 - 6) / 7;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

// Heatmap colors from light (low spending) to dark (high spending)
const HEATMAP_COLORS = [
  'rgba(124, 58, 237, 0.1)',   // Level 0: Very light purple
  'rgba(124, 58, 237, 0.25)',  // Level 1
  'rgba(124, 58, 237, 0.4)',   // Level 2
  'rgba(124, 58, 237, 0.55)',  // Level 3
  'rgba(124, 58, 237, 0.7)',   // Level 4
  'rgba(124, 58, 237, 0.85)',  // Level 5: Dark purple
];

interface DayData {
  date: number;
  total: number;
  expenses: Expense[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const ExpenseCalendarScreen: React.FC = () => {
  const navigation = useNavigation();
  const { expenses } = useExpenses();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Calculate daily totals for the selected month
  const { calendarDays, monthlyTotal, maxDailySpend, averageDaily } = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    // Get expenses for this month
    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // Calculate daily totals
    const dailyTotals: Record<number, { total: number; expenses: Expense[] }> = {};
    let total = 0;
    let maxSpend = 0;

    monthExpenses.forEach((expense) => {
      const day = new Date(expense.date).getDate();
      if (!dailyTotals[day]) {
        dailyTotals[day] = { total: 0, expenses: [] };
      }
      dailyTotals[day].total += expense.amount;
      dailyTotals[day].expenses.push(expense);
      total += expense.amount;
      if (dailyTotals[day].total > maxSpend) {
        maxSpend = dailyTotals[day].total;
      }
    });

    // Build calendar grid (6 weeks max)
    const days: DayData[] = [];

    // Add padding days from previous month
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();

    for (let i = startWeekday - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        total: 0,
        expenses: [],
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today.getDate() &&
        selectedMonth === today.getMonth() &&
        selectedYear === today.getFullYear();

      days.push({
        date: day,
        total: dailyTotals[day]?.total || 0,
        expenses: dailyTotals[day]?.expenses || [],
        isCurrentMonth: true,
        isToday,
      });
    }

    // Add padding days from next month
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        total: 0,
        expenses: [],
        isCurrentMonth: false,
        isToday: false,
      });
    }

    const daysWithExpenses = Object.keys(dailyTotals).length;
    const avg = daysWithExpenses > 0 ? Math.round(total / daysWithExpenses) : 0;

    return {
      calendarDays: days,
      monthlyTotal: total,
      maxDailySpend: maxSpend,
      averageDaily: avg,
    };
  }, [expenses, selectedMonth, selectedYear]);

  const getHeatmapColor = (amount: number): string => {
    if (amount === 0) return 'transparent';
    if (maxDailySpend === 0) return HEATMAP_COLORS[0];

    const ratio = amount / maxDailySpend;
    const level = Math.min(Math.floor(ratio * 6), 5);
    return HEATMAP_COLORS[level];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(null);

    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      const now = new Date();
      if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) return;
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const handleDayPress = (day: DayData) => {
    if (!day.isCurrentMonth) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(selectedDay?.date === day.date ? null : day);
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return amount.toLocaleString();
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
            <Text style={styles.headerTitle}>지출 캘린더</Text>
            <Text style={styles.headerSubtitle}>Expense Calendar</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Month Navigator */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.monthNav}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {selectedYear}년 {MONTHS_KO[selectedMonth]}
            </Text>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('next')}
              disabled={selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth()}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth()
                  ? Colors.textMuted
                  : Colors.text}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Summary Cards */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.summaryRow}>
            <GlassCard style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>총 지출</Text>
              <Text style={styles.summaryValue}>₩{formatAmount(monthlyTotal)}</Text>
            </GlassCard>
            <GlassCard style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>일 평균</Text>
              <Text style={styles.summaryValue}>₩{formatAmount(averageDaily)}</Text>
            </GlassCard>
            <GlassCard style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>최고 지출</Text>
              <Text style={styles.summaryValue}>₩{formatAmount(maxDailySpend)}</Text>
            </GlassCard>
          </Animated.View>

          {/* Calendar */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <GlassCard style={styles.calendarCard}>
              {/* Weekday Headers */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day, index) => (
                  <View key={day} style={styles.weekdayCell}>
                    <Text style={[
                      styles.weekdayText,
                      index === 0 && styles.sundayText,
                      index === 6 && styles.saturdayText,
                    ]}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      day.isToday && styles.todayCell,
                      selectedDay?.date === day.date && day.isCurrentMonth && styles.selectedDayCell,
                    ]}
                    onPress={() => handleDayPress(day)}
                    disabled={!day.isCurrentMonth}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.dayBackground,
                        day.isCurrentMonth && { backgroundColor: getHeatmapColor(day.total) },
                      ]}
                    />
                    <Text style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.otherMonthText,
                      day.isToday && styles.todayText,
                      index % 7 === 0 && day.isCurrentMonth && styles.sundayText,
                      index % 7 === 6 && day.isCurrentMonth && styles.saturdayText,
                    ]}>
                      {day.date}
                    </Text>
                    {day.total > 0 && day.isCurrentMonth && (
                      <Text style={styles.dayAmount}>
                        {day.total >= 10000 ? `${Math.round(day.total / 10000)}만` : `${Math.round(day.total / 1000)}천`}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <Text style={styles.legendLabel}>적음</Text>
                <View style={styles.legendColors}>
                  {HEATMAP_COLORS.map((color, index) => (
                    <View key={index} style={[styles.legendBox, { backgroundColor: color }]} />
                  ))}
                </View>
                <Text style={styles.legendLabel}>많음</Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Selected Day Detail */}
          {selectedDay && selectedDay.expenses.length > 0 && (
            <Animated.View entering={FadeIn.duration(300)}>
              <GlassCard style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailDate}>
                    {selectedMonth + 1}월 {selectedDay.date}일
                  </Text>
                  <Text style={styles.detailTotal}>
                    ₩{selectedDay.total.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.expenseList}>
                  {selectedDay.expenses
                    .sort((a, b) => b.amount - a.amount)
                    .map((expense) => (
                      <View key={expense.id} style={styles.expenseRow}>
                        <Text style={styles.expenseIcon}>{expense.categoryIcon}</Text>
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseNote} numberOfLines={1}>
                            {expense.note || expense.categoryLabel}
                          </Text>
                          <Text style={styles.expenseTime}>
                            {new Date(expense.date).getHours()}:{new Date(expense.date).getMinutes().toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                          ₩{expense.amount.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Empty state for selected day */}
          {selectedDay && selectedDay.expenses.length === 0 && (
            <Animated.View entering={FadeIn.duration(300)}>
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>
                  {selectedMonth + 1}월 {selectedDay.date}일에는 지출이 없어요
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
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
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  calendarCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekdayCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  weekdayText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sundayText: {
    color: '#ef4444',
  },
  saturdayText: {
    color: '#3b82f6',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayBackground: {
    position: 'absolute',
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    borderRadius: BorderRadius.sm,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: Colors.purplePrimary,
    borderRadius: BorderRadius.sm,
  },
  selectedDayCell: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    borderRadius: BorderRadius.sm,
  },
  dayText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.text,
    zIndex: 1,
  },
  otherMonthText: {
    color: Colors.textMuted,
    opacity: 0.4,
  },
  todayText: {
    fontWeight: '700',
    color: Colors.purpleLight,
  },
  dayAmount: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 1,
    zIndex: 1,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  legendLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 2,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  detailCard: {
    marginBottom: Spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.md,
  },
  detailDate: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  detailTotal: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.purpleLight,
  },
  expenseList: {
    gap: Spacing.sm,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  expenseIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseNote: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  expenseTime: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ExpenseCalendarScreen;
