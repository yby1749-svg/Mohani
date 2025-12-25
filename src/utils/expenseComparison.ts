import { Expense } from '../context/ExpenseContext';

export interface PeriodSummary {
  total: number;
  count: number;
  average: number;
  categories: CategorySummary[];
  dailyAverage: number;
  topExpense: Expense | null;
}

export interface CategorySummary {
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ComparisonResult {
  current: PeriodSummary;
  previous: PeriodSummary;
  totalDifference: number;
  totalPercentChange: number;
  categoryChanges: CategoryChange[];
  insights: ComparisonInsight[];
}

export interface CategoryChange {
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  currentTotal: number;
  previousTotal: number;
  difference: number;
  percentChange: number;
}

export interface ComparisonInsight {
  type: 'positive' | 'negative' | 'neutral';
  icon: string;
  message: string;
}

type PeriodType = 'month' | 'week' | 'year';

/**
 * Get date range for a period
 */
export function getPeriodRange(
  periodType: PeriodType,
  offset: number = 0
): { start: Date; end: Date; label: string } {
  const now = new Date();
  let start: Date;
  let end: Date;
  let label: string;

  switch (periodType) {
    case 'week': {
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek - (offset * 7));
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const weekNum = Math.ceil((start.getDate()) / 7);
      label = offset === 0 ? '이번 주' : offset === 1 ? '지난 주' : `${offset}주 전`;
      break;
    }

    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999);

      const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
      label = offset === 0 ? '이번 달' : offset === 1 ? '지난 달' : `${start.getFullYear()}년 ${monthNames[start.getMonth()]}`;
      break;
    }

    case 'year': {
      start = new Date(now.getFullYear() - offset, 0, 1);
      end = new Date(now.getFullYear() - offset, 11, 31, 23, 59, 59, 999);

      label = offset === 0 ? '올해' : offset === 1 ? '작년' : `${start.getFullYear()}년`;
      break;
    }
  }

  return { start, end, label };
}

/**
 * Filter expenses for a date range
 */
export function filterExpensesByPeriod(
  expenses: Expense[],
  start: Date,
  end: Date
): Expense[] {
  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });
}

/**
 * Calculate summary for a list of expenses
 */
export function calculatePeriodSummary(
  expenses: Expense[],
  periodDays: number
): PeriodSummary {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const count = expenses.length;
  const average = count > 0 ? total / count : 0;
  const dailyAverage = periodDays > 0 ? total / periodDays : 0;

  // Group by category
  const categoryMap: Record<string, { label: string; icon: string; total: number; count: number }> = {};

  expenses.forEach((expense) => {
    if (!categoryMap[expense.category]) {
      categoryMap[expense.category] = {
        label: expense.categoryLabel,
        icon: expense.categoryIcon,
        total: 0,
        count: 0,
      };
    }
    categoryMap[expense.category].total += expense.amount;
    categoryMap[expense.category].count += 1;
  });

  const categories: CategorySummary[] = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      categoryLabel: data.label,
      categoryIcon: data.icon,
      total: data.total,
      count: data.count,
      percentage: total > 0 ? (data.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Find top expense
  const topExpense = expenses.length > 0
    ? expenses.reduce((max, e) => (e.amount > max.amount ? e : max), expenses[0])
    : null;

  return {
    total,
    count,
    average,
    dailyAverage,
    categories,
    topExpense,
  };
}

/**
 * Compare two periods
 */
export function comparePeriods(
  expenses: Expense[],
  periodType: PeriodType
): ComparisonResult {
  const currentRange = getPeriodRange(periodType, 0);
  const previousRange = getPeriodRange(periodType, 1);

  const currentExpenses = filterExpensesByPeriod(expenses, currentRange.start, currentRange.end);
  const previousExpenses = filterExpensesByPeriod(expenses, previousRange.start, previousRange.end);

  // Calculate days in each period
  const currentDays = Math.ceil((currentRange.end.getTime() - currentRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const previousDays = Math.ceil((previousRange.end.getTime() - previousRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const current = calculatePeriodSummary(currentExpenses, currentDays);
  const previous = calculatePeriodSummary(previousExpenses, previousDays);

  const totalDifference = current.total - previous.total;
  const totalPercentChange = previous.total > 0
    ? ((current.total - previous.total) / previous.total) * 100
    : current.total > 0 ? 100 : 0;

  // Calculate category changes
  const allCategories = new Set([
    ...current.categories.map(c => c.category),
    ...previous.categories.map(c => c.category),
  ]);

  const categoryChanges: CategoryChange[] = Array.from(allCategories).map((category) => {
    const currentCat = current.categories.find(c => c.category === category);
    const previousCat = previous.categories.find(c => c.category === category);

    const currentTotal = currentCat?.total || 0;
    const previousTotal = previousCat?.total || 0;
    const difference = currentTotal - previousTotal;
    const percentChange = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : currentTotal > 0 ? 100 : 0;

    return {
      category,
      categoryLabel: currentCat?.categoryLabel || previousCat?.categoryLabel || category,
      categoryIcon: currentCat?.categoryIcon || previousCat?.categoryIcon || '📦',
      currentTotal,
      previousTotal,
      difference,
      percentChange,
    };
  }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  // Generate insights
  const insights = generateInsights(current, previous, categoryChanges, periodType);

  return {
    current,
    previous,
    totalDifference,
    totalPercentChange,
    categoryChanges,
    insights,
  };
}

/**
 * Generate comparison insights
 */
function generateInsights(
  current: PeriodSummary,
  previous: PeriodSummary,
  categoryChanges: CategoryChange[],
  periodType: PeriodType
): ComparisonInsight[] {
  const insights: ComparisonInsight[] = [];
  const periodLabel = periodType === 'month' ? '월' : periodType === 'week' ? '주' : '년';

  // Total spending change
  const totalChange = current.total - previous.total;
  const totalPercentChange = previous.total > 0
    ? ((current.total - previous.total) / previous.total) * 100
    : 0;

  if (Math.abs(totalPercentChange) >= 20) {
    if (totalChange < 0) {
      insights.push({
        type: 'positive',
        icon: '🎉',
        message: `지난 ${periodLabel} 대비 ${Math.abs(totalPercentChange).toFixed(0)}% 절약했어요!`,
      });
    } else {
      insights.push({
        type: 'negative',
        icon: '📈',
        message: `지난 ${periodLabel} 대비 ${totalPercentChange.toFixed(0)}% 더 지출했어요.`,
      });
    }
  } else if (Math.abs(totalPercentChange) < 5) {
    insights.push({
      type: 'neutral',
      icon: '📊',
      message: `지난 ${periodLabel}과 비슷한 지출 패턴이에요.`,
    });
  }

  // Category with biggest increase
  const biggestIncrease = categoryChanges.find(c => c.difference > 0 && c.percentChange > 30);
  if (biggestIncrease) {
    insights.push({
      type: 'negative',
      icon: biggestIncrease.categoryIcon,
      message: `${biggestIncrease.categoryLabel} 지출이 ${biggestIncrease.percentChange.toFixed(0)}% 증가했어요.`,
    });
  }

  // Category with biggest decrease
  const biggestDecrease = categoryChanges.find(c => c.difference < 0 && c.percentChange < -30);
  if (biggestDecrease) {
    insights.push({
      type: 'positive',
      icon: biggestDecrease.categoryIcon,
      message: `${biggestDecrease.categoryLabel} 지출을 ${Math.abs(biggestDecrease.percentChange).toFixed(0)}% 줄였어요!`,
    });
  }

  // Daily average comparison
  if (current.dailyAverage > 0 && previous.dailyAverage > 0) {
    const dailyDiff = current.dailyAverage - previous.dailyAverage;
    if (Math.abs(dailyDiff) >= 5000) {
      insights.push({
        type: dailyDiff < 0 ? 'positive' : 'negative',
        icon: dailyDiff < 0 ? '💰' : '💸',
        message: `일 평균 지출이 ₩${Math.abs(dailyDiff).toLocaleString()} ${dailyDiff < 0 ? '감소' : '증가'}했어요.`,
      });
    }
  }

  // New category spending
  const newCategories = categoryChanges.filter(c => c.previousTotal === 0 && c.currentTotal > 10000);
  if (newCategories.length > 0) {
    insights.push({
      type: 'neutral',
      icon: '🆕',
      message: `${newCategories[0].categoryLabel}에서 새로운 지출이 발생했어요.`,
    });
  }

  return insights.slice(0, 4); // Limit to 4 insights
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    return `${(amount / 10000).toFixed(1)}만`;
  }
  return amount.toLocaleString();
}

/**
 * Format percent change with sign
 */
export function formatPercentChange(percent: number): string {
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}
