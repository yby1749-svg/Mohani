import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - Spacing.lg * 2 - Spacing.sm * 8) / 7;

interface Expense {
  id: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  note: string;
  date: Date;
}

interface SpendingHeatmapProps {
  expenses: Expense[];
  monthlyBudget: number;
  selectedMonth?: Date;
  onDayPress?: (date: Date, dayExpenses: Expense[]) => void;
}

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({
  expenses,
  monthlyBudget,
  selectedMonth = new Date(),
  onDayPress,
}) => {
  const { colors, isDark } = useTheme();
  const dailyBudget = monthlyBudget / 30;

  // Generate calendar data
  const calendarData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    // Days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create spending map
    const spendingMap: Record<number, { total: number; expenses: Expense[] }> = {};

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getFullYear() === year && expenseDate.getMonth() === month) {
        const day = expenseDate.getDate();
        if (!spendingMap[day]) {
          spendingMap[day] = { total: 0, expenses: [] };
        }
        spendingMap[day].total += expense.amount;
        spendingMap[day].expenses.push(expense);
      }
    });

    // Find max spending for intensity calculation
    const maxSpending = Math.max(...Object.values(spendingMap).map((d) => d.total), dailyBudget);

    // Build calendar grid
    const weeks: { day: number | null; isToday: boolean; isPast: boolean; spending: number; intensity: number; expenses: Expense[] }[][] = [];
    let currentWeek: { day: number | null; isToday: boolean; isPast: boolean; spending: number; intensity: number; expenses: Expense[] }[] = [];

    // Add empty cells for days before first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ day: null, isToday: false, isPast: true, spending: 0, intensity: 0, expenses: [] });
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      currentDate.setHours(0, 0, 0, 0);

      const isToday = currentDate.getTime() === today.getTime();
      const isPast = currentDate < today;
      const dayData = spendingMap[day] || { total: 0, expenses: [] };
      const intensity = dayData.total > 0 ? Math.min(dayData.total / maxSpending, 1) : 0;

      currentWeek.push({
        day,
        isToday,
        isPast,
        spending: dayData.total,
        intensity,
        expenses: dayData.expenses,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining empty cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ day: null, isToday: false, isPast: false, spending: 0, intensity: 0, expenses: [] });
      }
      weeks.push(currentWeek);
    }

    return { weeks, maxSpending };
  }, [expenses, selectedMonth, dailyBudget]);

  // Get color based on spending intensity
  const getHeatColor = (intensity: number, spending: number) => {
    if (spending === 0) {
      return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
    }

    const baseAlpha = isDark ? 0.3 : 0.2;
    const intensityMultiplier = isDark ? 0.7 : 0.6;

    if (spending > dailyBudget * 1.5) {
      // Over budget - red
      return `rgba(239, 68, 68, ${baseAlpha + intensity * intensityMultiplier})`;
    } else if (spending > dailyBudget) {
      // At budget - orange
      return `rgba(245, 158, 11, ${baseAlpha + intensity * intensityMultiplier})`;
    } else if (spending > dailyBudget * 0.5) {
      // Under budget - yellow
      const yellowAlpha = isDark ? 0.2 : 0.15;
      return `rgba(234, 179, 8, ${yellowAlpha + intensity * 0.5})`;
    } else {
      // Low spending - green
      const greenAlpha = isDark ? 0.2 : 0.15;
      return `rgba(34, 197, 94, ${greenAlpha + intensity * 0.5})`;
    }
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {selectedMonth.getFullYear()}년 {monthNames[selectedMonth.getMonth()]}
        </Text>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.6)' : 'rgba(34, 197, 94, 0.7)' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>적음</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.6)' : 'rgba(245, 158, 11, 0.7)' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>보통</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.7)' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>많음</Text>
          </View>
        </View>
      </View>

      {/* Week Day Headers */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={[
              styles.weekDayText,
              { color: colors.textSecondary },
              index === 0 && styles.sundayText,
              index === 6 && styles.saturdayText,
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {calendarData.weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((dayData, dayIndex) => (
            <Animated.View
              key={`${weekIndex}-${dayIndex}`}
              entering={FadeIn.delay((weekIndex * 7 + dayIndex) * 20).duration(300)}
            >
              <TouchableOpacity
                style={[
                  styles.dayCell,
                  dayData.day === null && styles.emptyCell,
                  dayData.isToday && { borderWidth: 2, borderColor: colors.purpleLight },
                  dayData.day !== null && {
                    backgroundColor: getHeatColor(dayData.intensity, dayData.spending),
                  },
                ]}
                disabled={dayData.day === null}
                onPress={() => {
                  if (dayData.day !== null && onDayPress) {
                    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), dayData.day);
                    onDayPress(date, dayData.expenses);
                  }
                }}
                activeOpacity={0.7}
              >
                {dayData.day !== null && (
                  <>
                    <Text style={[
                      styles.dayNumber,
                      { color: colors.text },
                      dayIndex === 0 && styles.sundayText,
                      dayIndex === 6 && styles.saturdayText,
                      dayData.isToday && { color: colors.purpleLight, fontWeight: '700' },
                    ]}>
                      {dayData.day}
                    </Text>
                    {dayData.spending > 0 && (
                      <Text style={[styles.daySpending, { color: colors.textSecondary }]} numberOfLines={1}>
                        {dayData.spending >= 10000
                          ? `${Math.floor(dayData.spending / 10000)}만`
                          : `${Math.floor(dayData.spending / 1000)}천`}
                      </Text>
                    )}
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      ))}

      {/* Summary Stats */}
      <View style={[styles.summaryContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>일평균 예산</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>₩{Math.round(dailyBudget).toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>무지출일</Text>
          <Text style={[styles.summaryValue, { color: '#22C55E' }]}>
            {calendarData.weeks.flat().filter((d) => d.day !== null && d.isPast && d.spending === 0).length}일
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>초과일</Text>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
            {calendarData.weeks.flat().filter((d) => d.day !== null && d.spending > dailyBudget).length}일
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  monthTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekDayCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  weekDayText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sundayText: {
    color: '#EF4444',
  },
  saturdayText: {
    color: '#3B82F6',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs / 2,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: Colors.purpleLight,
  },
  dayNumber: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  todayText: {
    color: Colors.purpleLight,
    fontWeight: '700',
  },
  daySpending: {
    fontSize: 8,
    color: Colors.textMuted,
    marginTop: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
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
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
});
