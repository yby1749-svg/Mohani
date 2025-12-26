import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes, Gradients, LightGradients } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

interface Expense {
  id: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  note: string;
  date: Date;
}

interface SpendingPatternsProps {
  expenses: Expense[];
}

export const SpendingPatterns: React.FC<SpendingPatternsProps> = ({ expenses }) => {
  const { colors, isDark } = useTheme();
  const gradients = isDark ? Gradients : LightGradients;

  // Analyze spending patterns
  const patterns = useMemo(() => {
    if (expenses.length === 0) return null;

    // Time of day analysis (morning, afternoon, evening, night)
    const timeSlots = {
      morning: { label: '아침', time: '06-12시', total: 0, count: 0, icon: '🌅' },
      afternoon: { label: '오후', time: '12-18시', total: 0, count: 0, icon: '☀️' },
      evening: { label: '저녁', time: '18-22시', total: 0, count: 0, icon: '🌆' },
      night: { label: '밤', time: '22-06시', total: 0, count: 0, icon: '🌙' },
    };

    // Day of week analysis
    const dayOfWeek = {
      0: { label: '일', total: 0, count: 0 },
      1: { label: '월', total: 0, count: 0 },
      2: { label: '화', total: 0, count: 0 },
      3: { label: '수', total: 0, count: 0 },
      4: { label: '목', total: 0, count: 0 },
      5: { label: '금', total: 0, count: 0 },
      6: { label: '토', total: 0, count: 0 },
    };

    // Category by time analysis
    const categoryByTime: Record<string, { morning: number; afternoon: number; evening: number; night: number }> = {};

    // Process expenses
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const hour = date.getHours();
      const day = date.getDay();

      // Time slot
      let slot: keyof typeof timeSlots;
      if (hour >= 6 && hour < 12) slot = 'morning';
      else if (hour >= 12 && hour < 18) slot = 'afternoon';
      else if (hour >= 18 && hour < 22) slot = 'evening';
      else slot = 'night';

      timeSlots[slot].total += expense.amount;
      timeSlots[slot].count += 1;

      // Day of week
      dayOfWeek[day as keyof typeof dayOfWeek].total += expense.amount;
      dayOfWeek[day as keyof typeof dayOfWeek].count += 1;

      // Category by time
      if (!categoryByTime[expense.category]) {
        categoryByTime[expense.category] = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      }
      categoryByTime[expense.category][slot] += expense.amount;
    });

    // Find peak time
    const timeSlotArray = Object.entries(timeSlots).map(([key, value]) => ({
      key,
      ...value,
    }));
    const peakTime = timeSlotArray.reduce((max, slot) =>
      slot.total > max.total ? slot : max
    );

    // Find peak day
    const dayArray = Object.entries(dayOfWeek).map(([key, value]) => ({
      day: parseInt(key),
      ...value,
    }));
    const peakDay = dayArray.reduce((max, day) =>
      day.total > max.total ? day : max
    );

    // Calculate max values for bar scaling
    const maxTimeTotal = Math.max(...timeSlotArray.map((t) => t.total));
    const maxDayTotal = Math.max(...dayArray.map((d) => d.total));

    // Weekend vs weekday comparison
    const weekdayTotal = dayArray
      .filter((d) => d.day >= 1 && d.day <= 5)
      .reduce((sum, d) => sum + d.total, 0);
    const weekendTotal = dayArray
      .filter((d) => d.day === 0 || d.day === 6)
      .reduce((sum, d) => sum + d.total, 0);

    const weekdayAvg = weekdayTotal / 5;
    const weekendAvg = weekendTotal / 2;
    const weekendVsWeekday = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

    // Generate insights
    const insights: { icon: string; text: string; type: 'info' | 'warning' | 'tip' }[] = [];

    if (peakTime.total > 0) {
      insights.push({
        icon: peakTime.icon,
        text: `${peakTime.label} 시간대(${peakTime.time})에 가장 많이 지출해요`,
        type: 'info',
      });
    }

    if (weekendVsWeekday > 30) {
      insights.push({
        icon: '📅',
        text: `주말 지출이 평일보다 ${Math.round(weekendVsWeekday)}% 높아요`,
        type: 'warning',
      });
    } else if (weekendVsWeekday < -30) {
      insights.push({
        icon: '👍',
        text: `주말 지출을 잘 관리하고 있어요!`,
        type: 'tip',
      });
    }

    const nightSpendingPercent = (timeSlots.night.total / expenses.reduce((sum, e) => sum + e.amount, 0)) * 100;
    if (nightSpendingPercent > 20) {
      insights.push({
        icon: '🌙',
        text: `야간 지출이 ${Math.round(nightSpendingPercent)}%로 높은 편이에요`,
        type: 'warning',
      });
    }

    return {
      timeSlots: timeSlotArray,
      dayOfWeek: dayArray,
      peakTime,
      peakDay,
      maxTimeTotal,
      maxDayTotal,
      weekendVsWeekday,
      insights,
    };
  }, [expenses]);

  if (!patterns || expenses.length < 5) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>지출 데이터가 더 쌓이면 패턴을 분석해드려요</Text>
        <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>최소 5건 이상의 지출이 필요해요</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Time of Day Analysis */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>시간대별 지출</Text>
        <View style={styles.timeGrid}>
          {patterns.timeSlots.map((slot, index) => {
            const barHeight = patterns.maxTimeTotal > 0
              ? (slot.total / patterns.maxTimeTotal) * 60
              : 0;
            const isPeak = slot.key === patterns.peakTime.key;

            return (
              <Animated.View
                key={slot.key}
                entering={FadeInDown.delay(index * 100).duration(300)}
                style={styles.timeSlot}
              >
                <Text style={styles.timeIcon}>{slot.icon}</Text>
                <View style={[styles.timeBarContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  <LinearGradient
                    colors={isPeak ? gradients.purple : (isDark ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] : ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.08)'])}
                    style={[styles.timeBar, { height: Math.max(barHeight, 4) }]}
                  />
                </View>
                <Text style={[styles.timeLabel, { color: colors.textMuted }, isPeak && { color: colors.purpleLight, fontWeight: '600' }]}>
                  {slot.label}
                </Text>
                <Text style={[styles.timeAmount, { color: colors.textSecondary }]}>
                  {slot.total >= 10000
                    ? `${Math.round(slot.total / 10000)}만`
                    : `${Math.round(slot.total / 1000)}천`}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Day of Week Analysis */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>요일별 지출</Text>
        <View style={styles.dayGrid}>
          {patterns.dayOfWeek.map((day, index) => {
            const barWidth = patterns.maxDayTotal > 0
              ? (day.total / patterns.maxDayTotal) * 100
              : 0;
            const isPeak = day.day === patterns.peakDay.day;
            const isWeekend = day.day === 0 || day.day === 6;

            return (
              <View key={day.day} style={styles.dayRow}>
                <Text style={[
                  styles.dayLabel,
                  { color: colors.textMuted },
                  isWeekend && { color: colors.goldPrimary },
                  isPeak && { color: colors.purpleLight },
                ]}>
                  {day.label}
                </Text>
                <View style={[styles.dayBarContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  <LinearGradient
                    colors={isPeak ? gradients.purple : isWeekend ? gradients.gold : (isDark ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'] : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.08)'])}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.dayBar, { width: `${Math.max(barWidth, 2)}%` }]}
                  />
                </View>
                <Text style={[styles.dayAmount, { color: colors.textSecondary }]}>₩{day.total.toLocaleString()}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Weekend vs Weekday */}
      <View style={[styles.comparisonContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
        <View style={styles.comparisonItem}>
          <Text style={[styles.comparisonLabel, { color: colors.textMuted }]}>평일 평균</Text>
          <Text style={[styles.comparisonValue, { color: colors.text }]}>
            ₩{Math.round(patterns.dayOfWeek.filter(d => d.day >= 1 && d.day <= 5).reduce((sum, d) => sum + d.total, 0) / 5).toLocaleString()}
          </Text>
        </View>
        <View style={styles.comparisonVs}>
          <Text style={[
            styles.comparisonChange,
            { color: patterns.weekendVsWeekday > 0 ? colors.error : colors.success }
          ]}>
            {patterns.weekendVsWeekday > 0 ? '▲' : '▼'} {Math.abs(Math.round(patterns.weekendVsWeekday))}%
          </Text>
        </View>
        <View style={styles.comparisonItem}>
          <Text style={[styles.comparisonLabel, { color: colors.textMuted }]}>주말 평균</Text>
          <Text style={[styles.comparisonValue, { color: colors.text }]}>
            ₩{Math.round(patterns.dayOfWeek.filter(d => d.day === 0 || d.day === 6).reduce((sum, d) => sum + d.total, 0) / 2).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Insights */}
      {patterns.insights.length > 0 && (
        <View style={styles.insightsContainer}>
          {patterns.insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightItem,
                { backgroundColor: colors.purpleDark },
                insight.type === 'warning' && { backgroundColor: colors.goldDark },
                insight.type === 'tip' && { backgroundColor: colors.successDark },
              ]}
            >
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>{insight.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSlot: {
    alignItems: 'center',
    flex: 1,
  },
  timeIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  timeBarContainer: {
    height: 60,
    width: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  timeBar: {
    width: '100%',
    borderRadius: 12,
  },
  timeLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  timeLabelPeak: {
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  timeAmount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dayGrid: {
    gap: Spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayLabel: {
    width: 24,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  dayLabelWeekend: {
    color: '#F59E0B',
  },
  dayLabelPeak: {
    color: Colors.purpleLight,
  },
  dayBarContainer: {
    flex: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  dayBar: {
    height: '100%',
    borderRadius: 8,
  },
  dayAmount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    minWidth: 70,
    textAlign: 'right',
  },
  comparisonContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  comparisonValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  comparisonVs: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  comparisonChange: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  insightsContainer: {
    gap: Spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  insightWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  insightTip: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  insightIcon: {
    fontSize: 16,
  },
  insightText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
});
