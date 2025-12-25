import { Expense } from '../context/ExpenseContext';

export interface DayStatus {
  date: Date;
  dateString: string; // YYYY-MM-DD
  spent: number;
  budget: number;
  isUnderBudget: boolean;
  savingsAmount: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysUnderBudget: number;
  totalDaysTracked: number;
  streakHistory: DayStatus[];
  lastStreakDate: string | null;
  weeklyProgress: DayStatus[];
  monthlyProgress: DayStatus[];
}

export interface StreakMilestone {
  days: number;
  icon: string;
  title: string;
  titleKo: string;
  description: string;
  reward: number; // points
}

// Milestones for streak achievements
export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, icon: '🌱', title: 'Seedling', titleKo: '새싹', description: '3일 연속 예산 내 지출', reward: 50 },
  { days: 7, icon: '🔥', title: 'On Fire', titleKo: '불꽃', description: '7일 연속 예산 내 지출', reward: 100 },
  { days: 14, icon: '⚡', title: 'Unstoppable', titleKo: '멈출 수 없어', description: '14일 연속 예산 내 지출', reward: 200 },
  { days: 21, icon: '💎', title: 'Diamond', titleKo: '다이아몬드', description: '21일 연속 예산 내 지출', reward: 350 },
  { days: 30, icon: '🏆', title: 'Champion', titleKo: '챔피언', description: '30일 연속 예산 내 지출', reward: 500 },
  { days: 50, icon: '👑', title: 'Legend', titleKo: '전설', description: '50일 연속 예산 내 지출', reward: 800 },
  { days: 100, icon: '🌟', title: 'Master', titleKo: '마스터', description: '100일 연속 예산 내 지출', reward: 1500 },
  { days: 365, icon: '🎖️', title: 'Annual Hero', titleKo: '연간 영웅', description: '365일 연속 예산 내 지출', reward: 5000 },
];

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get daily budget based on monthly budget
 */
export function getDailyBudget(monthlyBudget: number, date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.floor(monthlyBudget / daysInMonth);
}

/**
 * Get spending for a specific date
 */
export function getDaySpending(expenses: Expense[], date: Date): number {
  const dateString = formatDateString(date);
  return expenses
    .filter((e) => formatDateString(new Date(e.date)) === dateString)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate day status - whether budget was met
 */
export function getDayStatus(
  expenses: Expense[],
  date: Date,
  monthlyBudget: number
): DayStatus {
  const dateString = formatDateString(date);
  const dailyBudget = getDailyBudget(monthlyBudget, date);
  const spent = getDaySpending(expenses, date);
  const isUnderBudget = spent <= dailyBudget;
  const savingsAmount = dailyBudget - spent;

  return {
    date,
    dateString,
    spent,
    budget: dailyBudget,
    isUnderBudget,
    savingsAmount,
  };
}

/**
 * Calculate current streak (consecutive days under budget ending today or yesterday)
 */
export function calculateCurrentStreak(
  expenses: Expense[],
  monthlyBudget: number
): { streak: number; lastDate: string | null } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let lastDate: string | null = null;
  let currentDate = new Date(today);

  // Check if today has any expenses - if not, start from yesterday
  const todaySpending = getDaySpending(expenses, today);
  if (todaySpending === 0) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Count consecutive days under budget going backward
  while (true) {
    const status = getDayStatus(expenses, currentDate, monthlyBudget);

    // If no spending recorded, skip to previous day (don't break streak)
    if (status.spent === 0 && streak === 0) {
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    // If no spending and we have a streak, it means we haven't spent yet today
    if (status.spent === 0 && streak > 0) {
      break;
    }

    if (status.isUnderBudget) {
      streak++;
      lastDate = status.dateString;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }

    // Safety limit - don't go back more than 2 years
    if (streak > 730) break;
  }

  return { streak, lastDate };
}

/**
 * Calculate longest streak ever
 */
export function calculateLongestStreak(
  expenses: Expense[],
  monthlyBudget: number
): number {
  if (expenses.length === 0) return 0;

  // Find date range
  const sortedDates = expenses
    .map((e) => new Date(e.date))
    .sort((a, b) => a.getTime() - b.getTime());

  const startDate = new Date(sortedDates[0]);
  const endDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  let longestStreak = 0;
  let currentStreak = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const status = getDayStatus(expenses, currentDate, monthlyBudget);

    // Only count days with actual spending
    if (status.spent > 0) {
      if (status.isUnderBudget) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return longestStreak;
}

/**
 * Get weekly progress (last 7 days)
 */
export function getWeeklyProgress(
  expenses: Expense[],
  monthlyBudget: number
): DayStatus[] {
  const result: DayStatus[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    result.push(getDayStatus(expenses, date, monthlyBudget));
  }

  return result;
}

/**
 * Get monthly progress (current month)
 */
export function getMonthlyProgress(
  expenses: Expense[],
  monthlyBudget: number
): DayStatus[] {
  const result: DayStatus[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  let currentDate = new Date(monthStart);
  while (currentDate <= today) {
    result.push(getDayStatus(expenses, currentDate, monthlyBudget));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/**
 * Get full streak data
 */
export function getStreakData(
  expenses: Expense[],
  monthlyBudget: number
): StreakData {
  const { streak: currentStreak, lastDate: lastStreakDate } = calculateCurrentStreak(
    expenses,
    monthlyBudget
  );
  const longestStreak = calculateLongestStreak(expenses, monthlyBudget);
  const weeklyProgress = getWeeklyProgress(expenses, monthlyBudget);
  const monthlyProgress = getMonthlyProgress(expenses, monthlyBudget);

  const totalDaysTracked = monthlyProgress.filter((d) => d.spent > 0).length;
  const totalDaysUnderBudget = monthlyProgress.filter(
    (d) => d.spent > 0 && d.isUnderBudget
  ).length;

  return {
    currentStreak,
    longestStreak,
    totalDaysUnderBudget,
    totalDaysTracked,
    streakHistory: monthlyProgress,
    lastStreakDate,
    weeklyProgress,
    monthlyProgress,
  };
}

/**
 * Get next milestone to achieve
 */
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m.days > currentStreak) || null;
}

/**
 * Get achieved milestones
 */
export function getAchievedMilestones(currentStreak: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter((m) => m.days <= currentStreak);
}

/**
 * Get streak status emoji and message
 */
export function getStreakStatus(currentStreak: number): {
  emoji: string;
  message: string;
  color: string;
} {
  if (currentStreak === 0) {
    return { emoji: '😴', message: '오늘부터 시작해보세요!', color: '#9ca3af' };
  }
  if (currentStreak < 3) {
    return { emoji: '🌱', message: '좋은 시작이에요!', color: '#22c55e' };
  }
  if (currentStreak < 7) {
    return { emoji: '🔥', message: '잘하고 있어요!', color: '#f59e0b' };
  }
  if (currentStreak < 14) {
    return { emoji: '⚡', message: '대단해요!', color: '#8b5cf6' };
  }
  if (currentStreak < 30) {
    return { emoji: '💎', message: '놀라워요!', color: '#3b82f6' };
  }
  if (currentStreak < 50) {
    return { emoji: '🏆', message: '챔피언이에요!', color: '#f59e0b' };
  }
  if (currentStreak < 100) {
    return { emoji: '👑', message: '전설이 되어가고 있어요!', color: '#eab308' };
  }
  return { emoji: '🌟', message: '마스터 레벨 달성!', color: '#fbbf24' };
}

/**
 * Format streak for display
 */
export function formatStreak(streak: number): string {
  if (streak === 0) return '0일';
  if (streak === 1) return '1일';
  return `${streak}일`;
}

/**
 * Get day name in Korean
 */
export function getDayNameKo(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

/**
 * Calculate savings rate for the streak period
 */
export function calculateSavingsRate(streakData: StreakData): number {
  const trackedDays = streakData.monthlyProgress.filter((d) => d.spent > 0);
  if (trackedDays.length === 0) return 0;

  const totalBudget = trackedDays.reduce((sum, d) => sum + d.budget, 0);
  const totalSpent = trackedDays.reduce((sum, d) => sum + d.spent, 0);

  if (totalBudget === 0) return 0;
  return Math.round(((totalBudget - totalSpent) / totalBudget) * 100);
}
