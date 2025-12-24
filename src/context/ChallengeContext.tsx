import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Challenge {
  id: string;
  title: string;
  titleKo: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: 'saving' | 'spending' | 'habit' | 'special';
  target: number;
  progress: number;
  reward: number; // Points
  icon: string;
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

interface ChallengeContextType {
  challenges: Challenge[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  totalPoints: number;
  updateChallengeProgress: (id: string, progress: number) => void;
  claimReward: (id: string) => void;
  generateNewChallenges: () => void;
  getLevel: () => { level: number; title: string; pointsToNext: number; progress: number };
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_challenges';
const POINTS_KEY = '@mohani_challenge_points';

const CHALLENGE_TEMPLATES = [
  // Daily Challenges
  {
    id: 'no_spend_day',
    title: 'No Spend Day',
    titleKo: '무지출 데이',
    description: '오늘 하루 지출 없이 보내기',
    type: 'daily' as const,
    category: 'saving' as const,
    target: 1,
    reward: 50,
    icon: '🚫',
  },
  {
    id: 'budget_day',
    title: 'Budget Day',
    titleKo: '예산 내 하루',
    description: '일일 예산 내에서 지출하기',
    type: 'daily' as const,
    category: 'spending' as const,
    target: 1,
    reward: 30,
    icon: '💪',
  },
  {
    id: 'track_all',
    title: 'Track Everything',
    titleKo: '모든 지출 기록',
    description: '오늘 모든 지출을 빠짐없이 기록하기',
    type: 'daily' as const,
    category: 'habit' as const,
    target: 1,
    reward: 20,
    icon: '📝',
  },
  // Weekly Challenges
  {
    id: 'no_cafe_week',
    title: 'No Cafe Week',
    titleKo: '카페 없는 일주일',
    description: '일주일간 카페 지출 0원',
    type: 'weekly' as const,
    category: 'saving' as const,
    target: 7,
    reward: 200,
    icon: '☕',
  },
  {
    id: 'cook_home',
    title: 'Home Chef',
    titleKo: '집밥 챌린지',
    description: '일주일간 외식비 50% 줄이기',
    type: 'weekly' as const,
    category: 'saving' as const,
    target: 50,
    reward: 250,
    icon: '🍳',
  },
  {
    id: 'weekly_under_budget',
    title: 'Budget Master',
    titleKo: '예산 마스터',
    description: '일주일간 매일 예산 내 지출',
    type: 'weekly' as const,
    category: 'spending' as const,
    target: 7,
    reward: 300,
    icon: '🎯',
  },
  {
    id: 'no_impulse',
    title: 'Mindful Spending',
    titleKo: '현명한 소비',
    description: '충동구매 없이 일주일 보내기',
    type: 'weekly' as const,
    category: 'habit' as const,
    target: 7,
    reward: 200,
    icon: '🧘',
  },
  // Monthly Challenges
  {
    id: 'save_10_percent',
    title: 'Save 10%',
    titleKo: '10% 절약',
    description: '지난달 대비 10% 덜 쓰기',
    type: 'monthly' as const,
    category: 'saving' as const,
    target: 10,
    reward: 500,
    icon: '💰',
  },
  {
    id: 'no_shopping_month',
    title: 'No Shopping Month',
    titleKo: '쇼핑 금지',
    description: '한 달간 불필요한 쇼핑 자제',
    type: 'monthly' as const,
    category: 'saving' as const,
    target: 30,
    reward: 600,
    icon: '🛍️',
  },
  {
    id: 'streak_30',
    title: '30 Day Streak',
    titleKo: '30일 연속 기록',
    description: '30일 연속 지출 기록하기',
    type: 'monthly' as const,
    category: 'habit' as const,
    target: 30,
    reward: 1000,
    icon: '🔥',
  },
];

const LEVELS = [
  { level: 1, title: '초보 절약러', minPoints: 0 },
  { level: 2, title: '절약 입문자', minPoints: 500 },
  { level: 3, title: '예산 관리자', minPoints: 1500 },
  { level: 4, title: '소비 전략가', minPoints: 3000 },
  { level: 5, title: '저축 전문가', minPoints: 5000 },
  { level: 6, title: '재정 마스터', minPoints: 8000 },
  { level: 7, title: '부자 수습', minPoints: 12000 },
  { level: 8, title: '부의 달인', minPoints: 20000 },
  { level: 9, title: '금융 귀재', minPoints: 35000 },
  { level: 10, title: '전설의 절약왕', minPoints: 50000 },
];

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (challenges.length > 0) {
      saveData();
    }
  }, [challenges, totalPoints]);

  const loadData = async () => {
    try {
      const [storedChallenges, storedPoints] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(POINTS_KEY),
      ]);

      if (storedPoints) {
        setTotalPoints(parseInt(storedPoints, 10));
      }

      if (storedChallenges) {
        const parsed = JSON.parse(storedChallenges);
        setChallenges(
          parsed.map((c: Challenge) => ({
            ...c,
            startDate: new Date(c.startDate),
            endDate: new Date(c.endDate),
            completedAt: c.completedAt ? new Date(c.completedAt) : undefined,
          }))
        );
      } else {
        // Generate initial challenges
        generateNewChallenges();
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
      generateNewChallenges();
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(challenges)),
        AsyncStorage.setItem(POINTS_KEY, totalPoints.toString()),
      ]);
    } catch (error) {
      console.error('Failed to save challenges:', error);
    }
  };

  const generateNewChallenges = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Select random challenges
    const dailyTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'daily');
    const weeklyTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'weekly');
    const monthlyTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'monthly');

    const selectedDaily = dailyTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((t) => ({
        ...t,
        progress: 0,
        startDate: now,
        endDate: endOfDay,
        isCompleted: false,
      }));

    const selectedWeekly = weeklyTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((t) => ({
        ...t,
        progress: 0,
        startDate: now,
        endDate: endOfWeek,
        isCompleted: false,
      }));

    const selectedMonthly = monthlyTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, 1)
      .map((t) => ({
        ...t,
        progress: 0,
        startDate: now,
        endDate: endOfMonth,
        isCompleted: false,
      }));

    setChallenges([...selectedDaily, ...selectedWeekly, ...selectedMonthly]);
  };

  const updateChallengeProgress = (id: string, progress: number) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id && !c.isCompleted) {
          const newProgress = Math.min(progress, c.target);
          const isNowCompleted = newProgress >= c.target;
          return {
            ...c,
            progress: newProgress,
            isCompleted: isNowCompleted,
            completedAt: isNowCompleted ? new Date() : undefined,
          };
        }
        return c;
      })
    );
  };

  const claimReward = (id: string) => {
    const challenge = challenges.find((c) => c.id === id);
    if (challenge && challenge.isCompleted) {
      setTotalPoints((prev) => prev + challenge.reward);
    }
  };

  const activeChallenges = useMemo(() => {
    const now = new Date();
    return challenges.filter(
      (c) => !c.isCompleted && new Date(c.endDate) > now
    );
  }, [challenges]);

  const completedChallenges = useMemo(() => {
    return challenges.filter((c) => c.isCompleted);
  }, [challenges]);

  const getLevel = () => {
    const currentLevel = LEVELS.reduce((acc, level) => {
      if (totalPoints >= level.minPoints) return level;
      return acc;
    }, LEVELS[0]);

    const nextLevel = LEVELS.find((l) => l.minPoints > totalPoints);
    const pointsToNext = nextLevel ? nextLevel.minPoints - totalPoints : 0;
    const progress = nextLevel
      ? ((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
      : 100;

    return {
      level: currentLevel.level,
      title: currentLevel.title,
      pointsToNext,
      progress: Math.min(progress, 100),
    };
  };

  return (
    <ChallengeContext.Provider
      value={{
        challenges,
        activeChallenges,
        completedChallenges,
        totalPoints,
        updateChallengeProgress,
        claimReward,
        generateNewChallenges,
        getLevel,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenges = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenges must be used within a ChallengeProvider');
  }
  return context;
};
