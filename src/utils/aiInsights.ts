import { Expense } from '../context/ExpenseContext';
import { DiaryEntry } from '../context/DiaryContext';

export interface AIInsight {
  id: string;
  type: 'positive' | 'warning' | 'tip' | 'achievement' | 'mood';
  icon: string;
  title: string;
  message: string;
  priority: number;
}

const CATEGORY_NAMES: Record<string, string> = {
  food: '식비',
  transport: '교통',
  shopping: '쇼핑',
  entertainment: '여가',
  cafe: '카페',
  health: '건강',
  bills: '공과금',
  other: '기타',
};

const MOOD_LABELS: Record<string, string> = {
  great: '최고',
  good: '좋음',
  okay: '보통',
  bad: '별로',
  awful: '최악',
};

export function generateInsights(
  expenses: Expense[],
  diaryEntries: DiaryEntry[],
  monthlyBudget: number = 2500000
): AIInsight[] {
  const insights: AIInsight[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Filter this month's data
  const monthlyExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyDiaries = diaryEntries.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Today's expenses
  const todayExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  });

  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const budgetUsedPercent = (monthlyTotal / monthlyBudget) * 100;
  const expectedUsedPercent = (dayOfMonth / daysInMonth) * 100;

  // === Budget Insights ===

  // Budget pace analysis
  if (monthlyExpenses.length > 0) {
    if (budgetUsedPercent < expectedUsedPercent - 10) {
      insights.push({
        id: 'budget-ahead',
        type: 'positive',
        icon: '🎯',
        title: '예산 관리 우수!',
        message: `이번 달 예산의 ${Math.round(budgetUsedPercent)}%를 사용했어요. 예상보다 ${Math.round(expectedUsedPercent - budgetUsedPercent)}% 적게 쓰고 있어요!`,
        priority: 10,
      });
    } else if (budgetUsedPercent > expectedUsedPercent + 15) {
      insights.push({
        id: 'budget-warning',
        type: 'warning',
        icon: '⚠️',
        title: '지출 주의',
        message: `예산 대비 지출이 빠른 편이에요. 남은 ${daysInMonth - dayOfMonth}일 동안 하루 ₩${Math.round((monthlyBudget - monthlyTotal) / (daysInMonth - dayOfMonth)).toLocaleString()} 이내로 써보세요.`,
        priority: 9,
      });
    } else {
      insights.push({
        id: 'budget-ontrack',
        type: 'positive',
        icon: '✨',
        title: '순조로운 예산 관리',
        message: `예산의 ${Math.round(budgetUsedPercent)}%를 사용 중이에요. 이 페이스면 이번 달도 목표 달성할 수 있어요!`,
        priority: 7,
      });
    }
  }

  // === Spending Pattern Insights ===

  // Category analysis
  const categoryTotals: Record<string, number> = {};
  monthlyExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length > 0) {
    const [topCategory, topAmount] = sortedCategories[0];
    const topPercent = Math.round((topAmount / monthlyTotal) * 100);

    if (topPercent > 40) {
      insights.push({
        id: 'top-category',
        type: 'tip',
        icon: '💡',
        title: `${CATEGORY_NAMES[topCategory] || topCategory} 지출 집중`,
        message: `이번 달 지출의 ${topPercent}%가 ${CATEGORY_NAMES[topCategory] || topCategory}에요. 이 부분을 줄이면 절약 효과가 클 거예요!`,
        priority: 6,
      });
    }
  }

  // Cafe spending insight
  if (categoryTotals['cafe'] && categoryTotals['cafe'] > 100000) {
    const cafeDays = new Set(
      monthlyExpenses
        .filter((e) => e.category === 'cafe')
        .map((e) => new Date(e.date).getDate())
    ).size;
    insights.push({
      id: 'cafe-insight',
      type: 'tip',
      icon: '☕',
      title: '카페 지출 분석',
      message: `이번 달 카페에서 ₩${categoryTotals['cafe'].toLocaleString()} 썼어요. ${cafeDays}일 동안 방문했네요!`,
      priority: 4,
    });
  }

  // === Mood Insights ===

  if (monthlyDiaries.length > 0) {
    const moodCounts: Record<string, number> = {};
    monthlyDiaries.forEach((d) => {
      moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
    });

    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    if (dominantMood) {
      const [mood, count] = dominantMood;
      const moodPercent = Math.round((count / monthlyDiaries.length) * 100);

      if (mood === 'great' || mood === 'good') {
        insights.push({
          id: 'mood-positive',
          type: 'mood',
          icon: '😊',
          title: '긍정적인 한 달!',
          message: `일기의 ${moodPercent}%가 좋은 기분이었어요. ${monthlyDiaries.length}일 동안 기록을 남겼네요!`,
          priority: 5,
        });
      } else if (mood === 'bad' || mood === 'awful') {
        insights.push({
          id: 'mood-concern',
          type: 'mood',
          icon: '💜',
          title: '힘든 시간이었네요',
          message: `요즘 힘든 날이 많았던 것 같아요. 자신을 위한 시간을 가져보는 건 어떨까요?`,
          priority: 8,
        });
      }
    }

    // Mood-Spending correlation
    const goodMoodDays = monthlyDiaries
      .filter((d) => d.mood === 'great' || d.mood === 'good')
      .map((d) => new Date(d.date).getDate());

    const badMoodDays = monthlyDiaries
      .filter((d) => d.mood === 'bad' || d.mood === 'awful')
      .map((d) => new Date(d.date).getDate());

    let goodMoodSpending = 0;
    let badMoodSpending = 0;

    monthlyExpenses.forEach((e) => {
      const day = new Date(e.date).getDate();
      if (goodMoodDays.includes(day)) goodMoodSpending += e.amount;
      if (badMoodDays.includes(day)) badMoodSpending += e.amount;
    });

    const avgGoodMood = goodMoodDays.length > 0 ? goodMoodSpending / goodMoodDays.length : 0;
    const avgBadMood = badMoodDays.length > 0 ? badMoodSpending / badMoodDays.length : 0;

    if (avgBadMood > avgGoodMood * 1.5 && badMoodDays.length >= 2) {
      insights.push({
        id: 'emotional-spending',
        type: 'tip',
        icon: '🧠',
        title: '감정 소비 패턴 발견',
        message: `기분이 안 좋은 날에 평소보다 ${Math.round(((avgBadMood - avgGoodMood) / avgGoodMood) * 100)}% 더 지출하는 경향이 있어요.`,
        priority: 7,
      });
    }
  }

  // === Achievement Insights ===

  // No spending today
  if (todayExpenses.length === 0 && today.getHours() >= 18) {
    insights.push({
      id: 'no-spend-day',
      type: 'achievement',
      icon: '🏆',
      title: '무지출 데이!',
      message: '오늘 하루 지출 없이 보냈어요. 대단해요!',
      priority: 8,
    });
  }

  // Streak of diary entries
  let diaryStreak = 0;
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const hasEntry = diaryEntries.some((e) => {
      const d = new Date(e.date);
      return (
        d.getDate() === checkDate.getDate() &&
        d.getMonth() === checkDate.getMonth() &&
        d.getFullYear() === checkDate.getFullYear()
      );
    });
    if (hasEntry) diaryStreak++;
    else break;
  }

  if (diaryStreak >= 3) {
    insights.push({
      id: 'diary-streak',
      type: 'achievement',
      icon: '📝',
      title: `${diaryStreak}일 연속 기록!`,
      message: `${diaryStreak}일 연속으로 일기를 쓰고 있어요. 꾸준함이 대단해요!`,
      priority: 6,
    });
  }

  // Default insight if none generated
  if (insights.length === 0) {
    if (expenses.length === 0 && diaryEntries.length === 0) {
      insights.push({
        id: 'welcome',
        type: 'tip',
        icon: '👋',
        title: '환영해요!',
        message: '지출을 기록하고 일기를 써보세요. AI가 맞춤 인사이트를 알려드릴게요!',
        priority: 10,
      });
    } else {
      insights.push({
        id: 'keep-going',
        type: 'positive',
        icon: '✨',
        title: '잘 하고 있어요!',
        message: '꾸준히 기록하면 더 정확한 분석을 해드릴 수 있어요. 계속 화이팅!',
        priority: 5,
      });
    }
  }

  // Sort by priority and return
  return insights.sort((a, b) => b.priority - a.priority);
}

export function getRandomInsight(insights: AIInsight[]): AIInsight | null {
  if (insights.length === 0) return null;
  // Weighted random based on priority
  const totalWeight = insights.reduce((sum, i) => sum + i.priority, 0);
  let random = Math.random() * totalWeight;
  for (const insight of insights) {
    random -= insight.priority;
    if (random <= 0) return insight;
  }
  return insights[0];
}

export function getMoodSpendingCorrelation(
  expenses: Expense[],
  diaryEntries: DiaryEntry[]
): { mood: string; avgSpending: number; days: number }[] {
  const moodData: Record<string, { total: number; days: Set<string> }> = {
    great: { total: 0, days: new Set() },
    good: { total: 0, days: new Set() },
    okay: { total: 0, days: new Set() },
    bad: { total: 0, days: new Set() },
    awful: { total: 0, days: new Set() },
  };

  // Map diary entries to their dates
  const dateMoodMap: Record<string, string> = {};
  diaryEntries.forEach((d) => {
    const dateKey = new Date(d.date).toDateString();
    dateMoodMap[dateKey] = d.mood;
    moodData[d.mood]?.days.add(dateKey);
  });

  // Map expenses to moods
  expenses.forEach((e) => {
    const dateKey = new Date(e.date).toDateString();
    const mood = dateMoodMap[dateKey];
    if (mood && moodData[mood]) {
      moodData[mood].total += e.amount;
    }
  });

  return Object.entries(moodData)
    .map(([mood, data]) => ({
      mood,
      avgSpending: data.days.size > 0 ? Math.round(data.total / data.days.size) : 0,
      days: data.days.size,
    }))
    .filter((d) => d.days > 0);
}

export function getSpendingTrend(expenses: Expense[]): 'up' | 'down' | 'stable' {
  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - 7);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  const thisWeekTotal = expenses
    .filter((e) => new Date(e.date) >= thisWeekStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const lastWeekTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d >= lastWeekStart && d < thisWeekStart;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  if (lastWeekTotal === 0) return 'stable';
  const change = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;

  if (change > 15) return 'up';
  if (change < -15) return 'down';
  return 'stable';
}
