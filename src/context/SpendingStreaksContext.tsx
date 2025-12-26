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
import {
  StreakData,
  StreakMilestone,
  STREAK_MILESTONES,
  getStreakData,
  getNextMilestone,
  getAchievedMilestones,
  getStreakStatus,
} from '../utils/streaks';

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

const INITIAL_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  totalDaysUnderBudget: 0,
  totalDaysTracked: 0,
  streakHistory: [],
  lastStreakDate: null,
  weeklyProgress: [],
  monthlyProgress: [],
};

export const SpendingStreaksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { expenses } = useExpenses();
  const { settings } = useSettings();
  const [streakData, setStreakData] = useState<StreakData>(INITIAL_STREAK_DATA);
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
