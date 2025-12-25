import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // expo-notifications not available
}

import { useExpenses } from './ExpenseContext';
import { useSettings } from './SettingsContext';

// Define types locally to avoid import issues
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysUnderBudget: number;
  totalDaysTracked: number;
  streakHistory: { date: string; underBudget: boolean }[];
  lastStreakDate: string | null;
  weeklyProgress: { date: string; underBudget: boolean }[];
  monthlyProgress: { date: string; underBudget: boolean }[];
}

interface StreakMilestone {
  days: number;
  title: string;
  titleKo: string;
  icon: string;
  description: string;
  reward: number;
}

const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, title: 'Getting Started', titleKo: '시작', icon: '🌱', description: '3일 연속 예산 내 지출', reward: 10 },
  { days: 7, title: 'One Week', titleKo: '일주일', icon: '⭐', description: '7일 연속 예산 내 지출', reward: 25 },
  { days: 14, title: 'Two Weeks', titleKo: '2주', icon: '🔥', description: '14일 연속 예산 내 지출', reward: 50 },
  { days: 30, title: 'One Month', titleKo: '한 달', icon: '🏆', description: '30일 연속 예산 내 지출', reward: 100 },
  { days: 60, title: 'Two Months', titleKo: '두 달', icon: '💎', description: '60일 연속 예산 내 지출', reward: 200 },
  { days: 90, title: 'Three Months', titleKo: '석 달', icon: '👑', description: '90일 연속 예산 내 지출', reward: 300 },
  { days: 180, title: 'Six Months', titleKo: '반년', icon: '🎖️', description: '180일 연속 예산 내 지출', reward: 500 },
  { days: 365, title: 'One Year', titleKo: '1년', icon: '🏅', description: '365일 연속 예산 내 지출', reward: 1000 },
];

// Helper functions
const getStreakData = (expenses: any[], monthlyBudget: number): StreakData => {
  const dailyBudget = monthlyBudget / 30;
  const today = new Date();
  const expensesByDate: Record<string, number> = {};

  expenses.forEach((expense) => {
    const date = new Date(expense.date).toISOString().split('T')[0];
    expensesByDate[date] = (expensesByDate[date] || 0) + expense.amount;
  });

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalDaysUnderBudget = 0;
  const streakHistory: { date: string; underBudget: boolean }[] = [];

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayExpense = expensesByDate[dateStr] || 0;
    const underBudget = dayExpense <= dailyBudget;

    streakHistory.push({ date: dateStr, underBudget });
    if (underBudget) {
      tempStreak++;
      totalDaysUnderBudget++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  currentStreak = tempStreak;

  return {
    currentStreak,
    longestStreak,
    totalDaysUnderBudget,
    totalDaysTracked: streakHistory.length,
    streakHistory,
    lastStreakDate: streakHistory[streakHistory.length - 1]?.date || null,
    weeklyProgress: streakHistory.slice(-7),
    monthlyProgress: streakHistory.slice(-30),
  };
};

const getNextMilestone = (currentStreak: number): StreakMilestone | null => {
  return STREAK_MILESTONES.find((m) => m.days > currentStreak) || null;
};

const getAchievedMilestones = (currentStreak: number): StreakMilestone[] => {
  return STREAK_MILESTONES.filter((m) => m.days <= currentStreak);
};

const getStreakStatus = (currentStreak: number): { emoji: string; message: string; color: string } => {
  if (currentStreak >= 30) return { emoji: '🔥', message: '대단해요!', color: '#F97316' };
  if (currentStreak >= 14) return { emoji: '⭐', message: '잘하고 있어요!', color: '#EAB308' };
  if (currentStreak >= 7) return { emoji: '💪', message: '좋아요!', color: '#22C55E' };
  if (currentStreak >= 3) return { emoji: '🌱', message: '시작이 좋아요!', color: '#3B82F6' };
  return { emoji: '💡', message: '오늘부터 시작!', color: '#8B5CF6' };
};

export interface UnlockedMilestone {
  milestone: StreakMilestone;
  unlockedAt: string; // ISO date string
  claimed: boolean;
}

interface SpendingStreaksContextType {
  streakData: StreakData;
  unlockedMilestones: UnlockedMilestone[];
  totalStreakPoints: number;
  currentMilestone: StreakMilestone | null;
  nextMilestone: StreakMilestone | null;
  streakStatus: { emoji: string; message: string; color: string };
  refreshStreakData: () => void;
  claimMilestoneReward: (days: number) => void;
  hasUnclaimedRewards: boolean;
}

const SpendingStreaksContext = createContext<SpendingStreaksContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_streak_milestones';
const POINTS_KEY = '@mohani_streak_points';

export const SpendingStreaksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { expenses } = useExpenses();
  const { settings } = useSettings();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysUnderBudget: 0,
    totalDaysTracked: 0,
    streakHistory: [],
    lastStreakDate: null,
    weeklyProgress: [],
    monthlyProgress: [],
  });
  const [unlockedMilestones, setUnlockedMilestones] = useState<UnlockedMilestone[]>([]);
  const [totalStreakPoints, setTotalStreakPoints] = useState(0);
  const [previousStreak, setPreviousStreak] = useState(0);

  // Load saved milestones
  useEffect(() => {
    loadSavedData();
  }, []);

  // Save data when it changes
  useEffect(() => {
    saveData();
  }, [unlockedMilestones, totalStreakPoints]);

  // Refresh streak data when expenses change
  useEffect(() => {
    refreshStreakData();
  }, [expenses, settings.monthlyBudget]);

  // Check for new milestone achievements
  useEffect(() => {
    if (streakData.currentStreak > previousStreak) {
      checkForNewMilestones(streakData.currentStreak);
    }
    setPreviousStreak(streakData.currentStreak);
  }, [streakData.currentStreak]);

  const loadSavedData = async () => {
    try {
      const [milestonesData, pointsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(POINTS_KEY),
      ]);

      if (milestonesData) {
        setUnlockedMilestones(JSON.parse(milestonesData));
      }
      if (pointsData) {
        setTotalStreakPoints(JSON.parse(pointsData));
      }
    } catch (error) {
      console.error('Failed to load streak data:', error);
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedMilestones)),
        AsyncStorage.setItem(POINTS_KEY, JSON.stringify(totalStreakPoints)),
      ]);
    } catch (error) {
      console.error('Failed to save streak data:', error);
    }
  };

  const refreshStreakData = useCallback(() => {
    const data = getStreakData(expenses, settings.monthlyBudget);
    setStreakData(data);
  }, [expenses, settings.monthlyBudget]);

  const checkForNewMilestones = async (currentStreak: number) => {
    const achievedMilestones = getAchievedMilestones(currentStreak);
    const newMilestones: UnlockedMilestone[] = [];

    for (const milestone of achievedMilestones) {
      const alreadyUnlocked = unlockedMilestones.some((u) => u.milestone.days === milestone.days);
      if (!alreadyUnlocked) {
        newMilestones.push({
          milestone,
          unlockedAt: new Date().toISOString(),
          claimed: false,
        });

        // Send notification for new milestone
        if (Notifications) {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${milestone.icon} 마일스톤 달성!`,
                body: `${milestone.titleKo} - ${milestone.description}`,
                sound: true,
                data: { type: 'streak_milestone', days: milestone.days },
              },
              trigger: null,
            });
          } catch (error) {
            // Notification failed, ignore
          }
        }
      }
    }

    if (newMilestones.length > 0) {
      setUnlockedMilestones((prev) => [...prev, ...newMilestones]);
    }
  };

  const claimMilestoneReward = (days: number) => {
    setUnlockedMilestones((prev) =>
      prev.map((u) => {
        if (u.milestone.days === days && !u.claimed) {
          setTotalStreakPoints((pts) => pts + u.milestone.reward);
          return { ...u, claimed: true };
        }
        return u;
      })
    );
  };

  // Get current milestone (the one matching current streak)
  const currentMilestone = getAchievedMilestones(streakData.currentStreak).pop() || null;

  // Get next milestone to achieve
  const nextMilestone = getNextMilestone(streakData.currentStreak);

  // Get streak status
  const streakStatus = getStreakStatus(streakData.currentStreak);

  // Check for unclaimed rewards
  const hasUnclaimedRewards = unlockedMilestones.some((u) => !u.claimed);

  return (
    <SpendingStreaksContext.Provider
      value={{
        streakData,
        unlockedMilestones,
        totalStreakPoints,
        currentMilestone,
        nextMilestone,
        streakStatus,
        refreshStreakData,
        claimMilestoneReward,
        hasUnclaimedRewards,
      }}
    >
      {children}
    </SpendingStreaksContext.Provider>
  );
};

export const useSpendingStreaks = () => {
  const context = useContext(SpendingStreaksContext);
  if (!context) {
    throw new Error('useSpendingStreaks must be used within a SpendingStreaksProvider');
  }
  return context;
};
