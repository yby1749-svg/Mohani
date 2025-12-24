import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  titleKo: string;
  description: string;
  icon: string;
  category: 'savings' | 'spending' | 'streak' | 'milestone' | 'special';
  requirement: number;
  progress: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const ACHIEVEMENTS_CONFIG: Omit<Achievement, 'progress' | 'unlockedAt' | 'isUnlocked'>[] = [
  // Savings Achievements
  {
    id: 'first_save',
    title: 'First Step',
    titleKo: '첫 걸음',
    description: '첫 저축 목표 달성',
    icon: '🌱',
    category: 'savings',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'savings_100k',
    title: 'Piggy Bank',
    titleKo: '저금통',
    description: '총 10만원 저축',
    icon: '🐷',
    category: 'savings',
    requirement: 100000,
    tier: 'bronze',
  },
  {
    id: 'savings_500k',
    title: 'Money Tree',
    titleKo: '돈나무',
    description: '총 50만원 저축',
    icon: '🌳',
    category: 'savings',
    requirement: 500000,
    tier: 'silver',
  },
  {
    id: 'savings_1m',
    title: 'Millionaire',
    titleKo: '백만장자',
    description: '총 100만원 저축',
    icon: '💰',
    category: 'savings',
    requirement: 1000000,
    tier: 'gold',
  },
  {
    id: 'savings_5m',
    title: 'Wealth Master',
    titleKo: '재테크 마스터',
    description: '총 500만원 저축',
    icon: '👑',
    category: 'savings',
    requirement: 5000000,
    tier: 'platinum',
  },

  // Spending Control Achievements
  {
    id: 'under_budget_week',
    title: 'Budget Keeper',
    titleKo: '예산 수호자',
    description: '7일 연속 예산 내 지출',
    icon: '🛡️',
    category: 'spending',
    requirement: 7,
    tier: 'bronze',
  },
  {
    id: 'under_budget_month',
    title: 'Budget Master',
    titleKo: '예산 마스터',
    description: '30일 연속 예산 내 지출',
    icon: '🏆',
    category: 'spending',
    requirement: 30,
    tier: 'gold',
  },
  {
    id: 'category_balance',
    title: 'Balanced Life',
    titleKo: '균형 잡힌 삶',
    description: '모든 카테고리 한도 내 유지',
    icon: '⚖️',
    category: 'spending',
    requirement: 1,
    tier: 'silver',
  },

  // Streak Achievements
  {
    id: 'no_spend_3',
    title: 'Frugal Start',
    titleKo: '절약 시작',
    description: '3일 연속 무지출',
    icon: '✨',
    category: 'streak',
    requirement: 3,
    tier: 'bronze',
  },
  {
    id: 'no_spend_7',
    title: 'Frugal Week',
    titleKo: '절약의 달인',
    description: '7일 연속 무지출',
    icon: '🌟',
    category: 'streak',
    requirement: 7,
    tier: 'silver',
  },
  {
    id: 'no_spend_14',
    title: 'Frugal Master',
    titleKo: '절약 마스터',
    description: '14일 연속 무지출',
    icon: '💫',
    category: 'streak',
    requirement: 14,
    tier: 'gold',
  },
  {
    id: 'logging_7',
    title: 'Habit Maker',
    titleKo: '습관 형성',
    description: '7일 연속 지출 기록',
    icon: '📝',
    category: 'streak',
    requirement: 7,
    tier: 'bronze',
  },
  {
    id: 'logging_30',
    title: 'Diary Master',
    titleKo: '기록 마스터',
    description: '30일 연속 지출 기록',
    icon: '📚',
    category: 'streak',
    requirement: 30,
    tier: 'gold',
  },

  // Milestone Achievements
  {
    id: 'expenses_10',
    title: 'Getting Started',
    titleKo: '시작이 반',
    description: '10건 지출 기록',
    icon: '🎯',
    category: 'milestone',
    requirement: 10,
    tier: 'bronze',
  },
  {
    id: 'expenses_100',
    title: 'Consistent',
    titleKo: '꾸준함',
    description: '100건 지출 기록',
    icon: '📊',
    category: 'milestone',
    requirement: 100,
    tier: 'silver',
  },
  {
    id: 'expenses_500',
    title: 'Data Lover',
    titleKo: '데이터 수집가',
    description: '500건 지출 기록',
    icon: '📈',
    category: 'milestone',
    requirement: 500,
    tier: 'gold',
  },
  {
    id: 'goals_3',
    title: 'Goal Setter',
    titleKo: '목표 설정자',
    description: '3개 저축 목표 완료',
    icon: '🎯',
    category: 'milestone',
    requirement: 3,
    tier: 'silver',
  },

  // Special Achievements
  {
    id: 'health_90',
    title: 'Financial Health',
    titleKo: '금융 건강',
    description: '금융 건강 점수 90점 이상',
    icon: '💚',
    category: 'special',
    requirement: 90,
    tier: 'gold',
  },
  {
    id: 'income_tracked',
    title: 'Income Tracker',
    titleKo: '수입 추적',
    description: '첫 수입 기록',
    icon: '💵',
    category: 'special',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'positive_balance',
    title: 'In The Black',
    titleKo: '흑자 달성',
    description: '수입이 지출보다 많은 달',
    icon: '📗',
    category: 'special',
    requirement: 1,
    tier: 'silver',
  },
];

interface AchievementContextType {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  recentUnlocked: Achievement[];
  checkAndUnlock: (id: string, currentProgress: number) => boolean;
  updateProgress: (id: string, progress: number) => void;
  getAchievementsByCategory: (category: Achievement['category']) => Achievement[];
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_achievements';

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadAchievements();
  }, []);

  useEffect(() => {
    if (achievements.length > 0) {
      saveAchievements();
    }
  }, [achievements]);

  const loadAchievements = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with config to get any new achievements
        const merged = ACHIEVEMENTS_CONFIG.map((config) => {
          const saved = parsed.find((a: Achievement) => a.id === config.id);
          if (saved) {
            return {
              ...config,
              progress: saved.progress || 0,
              unlockedAt: saved.unlockedAt ? new Date(saved.unlockedAt) : undefined,
              isUnlocked: saved.isUnlocked || false,
            };
          }
          return { ...config, progress: 0, isUnlocked: false };
        });
        setAchievements(merged);
      } else {
        // Initialize with default progress
        setAchievements(
          ACHIEVEMENTS_CONFIG.map((config) => ({
            ...config,
            progress: 0,
            isUnlocked: false,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  const saveAchievements = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  };

  const checkAndUnlock = (id: string, currentProgress: number): boolean => {
    const achievement = achievements.find((a) => a.id === id);
    if (!achievement || achievement.isUnlocked) return false;

    if (currentProgress >= achievement.requirement) {
      setAchievements((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, progress: currentProgress, isUnlocked: true, unlockedAt: new Date() }
            : a
        )
      );
      return true;
    }

    // Update progress even if not unlocked
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, progress: currentProgress } : a))
    );
    return false;
  };

  const updateProgress = (id: string, progress: number) => {
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.id === id && !a.isUnlocked) {
          const newProgress = Math.max(a.progress, progress);
          const isUnlocked = newProgress >= a.requirement;
          return {
            ...a,
            progress: newProgress,
            isUnlocked,
            unlockedAt: isUnlocked ? new Date() : undefined,
          };
        }
        return a;
      })
    );
  };

  const getAchievementsByCategory = (category: Achievement['category']) => {
    return achievements.filter((a) => a.category === category);
  };

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const recentUnlocked = achievements
    .filter((a) => a.isUnlocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3);

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        unlockedCount,
        totalCount,
        recentUnlocked,
        checkAndUnlock,
        updateProgress,
        getAchievementsByCategory,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
