import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckDate: string;
  streakHistory: { date: string; underBudget: boolean }[];
  totalUnderBudgetDays: number;
  milestones: { days: number; achieved: boolean; achievedDate?: string }[];
}

interface StreaksContextType {
  streakData: StreakData;
  checkAndUpdateStreak: (todaySpending: number, dailyBudget: number) => Promise<void>;
  getStreakEmoji: () => string;
  getNextMilestone: () => number;
  resetStreak: () => Promise<void>;
}

const StreaksContext = createContext<StreaksContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_streaks';

const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckDate: '',
  streakHistory: [],
  totalUnderBudgetDays: 0,
  milestones: MILESTONES.map((days) => ({ days, achieved: false })),
};

export const StreaksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [streakData, setStreakData] = useState<StreakData>(DEFAULT_STREAK_DATA);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setStreakData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load streak data:', error);
    }
  };

  const saveStreakData = async (data: StreakData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save streak data:', error);
    }
  };

  const getTodayString = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const getYesterdayString = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  };

  const checkAndUpdateStreak = async (todaySpending: number, dailyBudget: number) => {
    const today = getTodayString();
    const yesterday = getYesterdayString();

    // Already checked today
    if (streakData.lastCheckDate === today) {
      return;
    }

    const underBudget = todaySpending <= dailyBudget;
    let newStreak = streakData.currentStreak;
    let newLongest = streakData.longestStreak;
    let newTotal = streakData.totalUnderBudgetDays;

    // Check if streak continues or breaks
    if (underBudget) {
      if (streakData.lastCheckDate === yesterday || streakData.lastCheckDate === '') {
        newStreak += 1;
      } else {
        // Streak broken, start new
        newStreak = 1;
      }
      newTotal += 1;
    } else {
      newStreak = 0;
    }

    // Update longest streak
    if (newStreak > newLongest) {
      newLongest = newStreak;
    }

    // Update milestones
    const newMilestones = streakData.milestones.map((m) => {
      if (!m.achieved && newStreak >= m.days) {
        return { ...m, achieved: true, achievedDate: today };
      }
      return m;
    });

    // Add to history (keep last 90 days)
    const newHistory = [
      ...streakData.streakHistory.filter((h) => h.date !== today),
      { date: today, underBudget },
    ].slice(-90);

    const newData: StreakData = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCheckDate: today,
      streakHistory: newHistory,
      totalUnderBudgetDays: newTotal,
      milestones: newMilestones,
    };

    setStreakData(newData);
    await saveStreakData(newData);
  };

  const getStreakEmoji = (): string => {
    const streak = streakData.currentStreak;
    if (streak >= 365) return '👑';
    if (streak >= 180) return '💎';
    if (streak >= 90) return '🏆';
    if (streak >= 60) return '🥇';
    if (streak >= 30) return '🔥';
    if (streak >= 21) return '⭐';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '🌟';
    if (streak >= 3) return '✨';
    if (streak >= 1) return '🎯';
    return '🎮';
  };

  const getNextMilestone = (): number => {
    const nextMilestone = streakData.milestones.find((m) => !m.achieved);
    return nextMilestone?.days || 0;
  };

  const resetStreak = async () => {
    const newData = { ...DEFAULT_STREAK_DATA };
    setStreakData(newData);
    await saveStreakData(newData);
  };

  return (
    <StreaksContext.Provider
      value={{
        streakData,
        checkAndUpdateStreak,
        getStreakEmoji,
        getNextMilestone,
        resetStreak,
      }}
    >
      {children}
    </StreaksContext.Provider>
  );
};

export const useStreaks = () => {
  const context = useContext(StreaksContext);
  if (!context) {
    throw new Error('useStreaks must be used within a StreaksProvider');
  }
  return context;
};
