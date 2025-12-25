import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

interface SpendingBarChartProps {
  expenses: Array<{ date: Date | string; amount: number }>;
  budget?: number;
  title?: string;
  showComparison?: boolean;
}

export const SpendingBarChart: React.FC<SpendingBarChartProps> = ({
  expenses,
  budget = 0,
  title = '일별 지출',
  showComparison = true,
}) => {
  const chartData = useMemo(() => {
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dailyData: { day: string; amount: number; date: number; isToday: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayExpenses = expenses.filter((e) => {
        const expDate = new Date(e.date).toISOString().split('T')[0];
        return expDate === dateStr;
      });

      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

      dailyData.push({
        day: dayNames[date.getDay()],
        amount: total,
        date: date.getDate(),
        isToday: i === 0,
      });
    }

    return dailyData;
  }, [expenses]);

  const labels = chartData.map((d) => d.day);
  const data = chartData.map((d) => d.amount);
  const maxAmount = Math.max(...data, 1);
  const totalWeek = data.reduce((sum, val) => sum + val, 0);
  const avgDaily = Math.round(totalWeek / 7);
  const dailyBudget = budget > 0 ? Math.round(budget / 30) : 0;

  // Calculate trend
  const firstHalf = data.slice(0, 3).reduce((sum, val) => sum + val, 0);
  const secondHalf = data.slice(4).reduce((sum, val) => sum + val, 0);
  const trend = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable';

  if (data.every((d) => d === 0)) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
          style={styles.gradient}
        >
          <Text style={styles.title}>{title}</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>이번 주 지출 데이터가 없습니다</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {showComparison && (
            <View style={styles.trendBadge}>
              <Text style={styles.trendIcon}>
                {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
              </Text>
              <Text style={[styles.trendText, { color: trend === 'down' ? '#10B981' : trend === 'up' ? '#EF4444' : Colors.textMuted }]}>
                {trend === 'up' ? '증가 추세' : trend === 'down' ? '감소 추세' : '유지'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>주간 총합</Text>
            <Text style={styles.statValue}>₩{totalWeek.toLocaleString()}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>일 평균</Text>
            <Text style={styles.statValue}>₩{avgDaily.toLocaleString()}</Text>
          </View>
          {dailyBudget > 0 && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>일 예산</Text>
              <Text style={[styles.statValue, { color: avgDaily > dailyBudget ? '#EF4444' : '#10B981' }]}>
                ₩{dailyBudget.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <BarChart
          data={{
            labels,
            datasets: [{ data: data.map((d) => d || 0.1) }], // Prevent 0 height bars
          }}
          width={width - Spacing.lg * 2 - Spacing.md * 2}
          height={200}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: 'transparent',
            backgroundGradientTo: 'transparent',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
            barPercentage: 0.6,
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: 'rgba(255, 255, 255, 0.1)',
            },
            formatYLabel: (value) => {
              const num = parseInt(value);
              if (num >= 10000) {
                return `${Math.round(num / 10000)}만`;
              }
              if (num >= 1000) {
                return `${Math.round(num / 1000)}천`;
              }
              return `${num}`;
            },
          }}
          style={styles.chart}
          withInnerLines={true}
          showValuesOnTopOfBars={false}
          fromZero={true}
          yAxisLabel=""
          yAxisSuffix=""
        />

        {/* Day indicators */}
        <View style={styles.dayIndicators}>
          {chartData.map((d, i) => (
            <View key={i} style={styles.dayItem}>
              <Text style={[styles.dayDate, d.isToday && styles.todayDate]}>
                {d.date}일
              </Text>
              {d.isToday && <View style={styles.todayDot} />}
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  gradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  trendIcon: {
    fontSize: 12,
  },
  trendText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#3B82F6',
  },
  chart: {
    marginLeft: -Spacing.md,
    borderRadius: BorderRadius.md,
  },
  dayIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  dayItem: {
    alignItems: 'center',
  },
  dayDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  todayDate: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginTop: 2,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
});

export default SpendingBarChart;
