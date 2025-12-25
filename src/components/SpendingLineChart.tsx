import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

interface SpendingLineChartProps {
  expenses: Array<{ date: Date | string; amount: number }>;
  period?: 'week' | 'month' | '3months';
  title?: string;
}

export const SpendingLineChart: React.FC<SpendingLineChartProps> = ({
  expenses,
  period = 'week',
  title = '지출 추이',
}) => {
  const chartData = useMemo(() => {
    const today = new Date();
    let days: number;
    let labelFormat: 'day' | 'week' | 'month';

    switch (period) {
      case 'week':
        days = 7;
        labelFormat = 'day';
        break;
      case 'month':
        days = 30;
        labelFormat = 'week';
        break;
      case '3months':
        days = 90;
        labelFormat = 'month';
        break;
      default:
        days = 7;
        labelFormat = 'day';
    }

    const dailyTotals: Record<string, number> = {};

    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyTotals[dateStr] = 0;
    }

    // Sum up expenses by day
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const dateStr = date.toISOString().split('T')[0];
      if (dailyTotals[dateStr] !== undefined) {
        dailyTotals[dateStr] += expense.amount;
      }
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    const data = sortedDates.map((date) => dailyTotals[date]);

    // Generate labels based on period
    let labels: string[];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    if (labelFormat === 'day') {
      labels = sortedDates.map((dateStr) => {
        const date = new Date(dateStr);
        return dayNames[date.getDay()];
      });
    } else if (labelFormat === 'week') {
      // Show every 7th day
      labels = sortedDates.map((dateStr, i) => {
        if (i % 7 === 0 || i === sortedDates.length - 1) {
          const date = new Date(dateStr);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
        return '';
      });
    } else {
      // Show month labels
      labels = sortedDates.map((dateStr, i) => {
        if (i % 30 === 0 || i === sortedDates.length - 1) {
          const date = new Date(dateStr);
          return `${date.getMonth() + 1}월`;
        }
        return '';
      });
    }

    return { labels, data };
  }, [expenses, period]);

  const totalSpending = chartData.data.reduce((sum, val) => sum + val, 0);
  const avgSpending = Math.round(totalSpending / chartData.data.length);

  if (chartData.data.every((d) => d === 0)) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
          style={styles.gradient}
        >
          <Text style={styles.title}>{title}</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>데이터가 없습니다</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>평균</Text>
              <Text style={styles.statValue}>₩{avgSpending.toLocaleString()}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>총합</Text>
              <Text style={styles.statValue}>₩{totalSpending.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <LineChart
          data={{
            labels: chartData.labels.length > 0 ? chartData.labels : [''],
            datasets: [{ data: chartData.data.length > 0 ? chartData.data.map(d => d || 0) : [0] }],
          }}
          width={width - Spacing.lg * 2 - Spacing.md * 2}
          height={180}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: 'transparent',
            backgroundGradientTo: 'transparent',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#8B5CF6',
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: 'rgba(255, 255, 255, 0.1)',
            },
            formatYLabel: (value) => {
              const num = parseInt(value);
              if (num >= 10000) {
                return `${Math.round(num / 10000)}만`;
              }
              return `${Math.round(num / 1000)}천`;
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
        />
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
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  header: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  statValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.purplePrimary,
  },
  chart: {
    marginLeft: -Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
});

export default SpendingLineChart;
