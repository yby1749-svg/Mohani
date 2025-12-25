import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateTodayQuickAction } from '../hooks/useQuickActions';

const WIDGET_DATA_KEY = '@mohani_widget_data';

export interface WidgetData {
  todayTotal: number;
  todayCount: number;
  monthlyTotal: number;
  monthlyBudget: number | null;
  lastExpense: {
    amount: number;
    category: string;
    categoryIcon: string;
    note: string;
  } | null;
  updatedAt: string;
}

/**
 * Update widget data whenever expenses change
 * This syncs data that widgets can read
 */
export async function updateWidgetData(data: {
  todayTotal: number;
  todayCount: number;
  monthlyTotal: number;
  monthlyBudget?: number;
  lastExpense?: {
    amount: number;
    category: string;
    categoryIcon: string;
    note: string;
  };
}): Promise<void> {
  try {
    const widgetData: WidgetData = {
      todayTotal: data.todayTotal,
      todayCount: data.todayCount,
      monthlyTotal: data.monthlyTotal,
      monthlyBudget: data.monthlyBudget || null,
      lastExpense: data.lastExpense || null,
      updatedAt: new Date().toISOString(),
    };

    // Save to AsyncStorage (for app reference)
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));

    // Update quick action subtitle with today's spending
    await updateTodayQuickAction(data.todayTotal);

    // For native widgets, we would use App Groups here
    // This would require native module integration
    // await saveToAppGroup(widgetData);

  } catch (error) {
    console.log('Widget data update error:', error);
  }
}

/**
 * Get current widget data
 */
export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const stored = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Format amount for display
 */
export function formatWidgetAmount(amount: number): string {
  if (amount >= 10000) {
    return `₩${Math.round(amount / 10000)}만`;
  }
  return `₩${amount.toLocaleString()}`;
}

/**
 * Get greeting based on time of day
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '늦은 밤이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후에요';
  return '좋은 저녁이에요';
}

/**
 * Get spending status message
 */
export function getSpendingStatus(todayTotal: number, monthlyTotal: number, budget?: number): string {
  if (budget) {
    const percentage = (monthlyTotal / budget) * 100;
    if (percentage >= 100) return '예산을 초과했어요! 💸';
    if (percentage >= 80) return '예산의 80%를 사용했어요';
    if (percentage >= 50) return '절반 정도 사용했어요';
    return '순조롭게 진행 중이에요 ✨';
  }

  if (todayTotal === 0) return '오늘은 지출이 없어요 🎉';
  if (todayTotal < 10000) return '알뜰하게 사용 중이에요';
  if (todayTotal < 50000) return '적당히 사용 중이에요';
  return '오늘 지출이 많네요';
}
