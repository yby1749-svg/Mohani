import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUniqueId } from '../utils/generateId';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline?: Date;
  createdAt: Date;
  isCompleted: boolean;
}

interface GoalsContextType {
  goals: SavingsGoal[];
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount' | 'isCompleted'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  addSavings: (id: string, amount: number) => void;
  withdrawSavings: (id: string, amount: number) => void;
  getTotalSaved: () => number;
  getTotalTarget: () => number;
  getOverallProgress: () => number;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_goals';

export const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveGoals();
    }
  }, [goals, isLoaded]);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((goal: any) => ({
          ...goal,
          createdAt: new Date(goal.createdAt),
          deadline: goal.deadline ? new Date(goal.deadline) : undefined,
        }));
        setGoals(withDates);
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveGoals = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  };

  const addGoal = (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount' | 'isCompleted'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: generateUniqueId(),
      currentAmount: 0,
      isCompleted: false,
      createdAt: new Date(),
    };
    setGoals((prev) => [newGoal, ...prev]);
  };

  const updateGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal))
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  const addSavings = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === id) {
          const newAmount = goal.currentAmount + amount;
          const isCompleted = newAmount >= goal.targetAmount;
          return {
            ...goal,
            currentAmount: newAmount,
            isCompleted,
          };
        }
        return goal;
      })
    );
  };

  const withdrawSavings = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === id) {
          const newAmount = Math.max(0, goal.currentAmount - amount);
          return {
            ...goal,
            currentAmount: newAmount,
            isCompleted: false,
          };
        }
        return goal;
      })
    );
  };

  const getTotalSaved = () => {
    return goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  };

  const getTotalTarget = () => {
    return goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  };

  const getOverallProgress = () => {
    const totalTarget = getTotalTarget();
    if (totalTarget === 0) return 0;
    return Math.round((getTotalSaved() / totalTarget) * 100);
  };

  return (
    <GoalsContext.Provider
      value={{
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        addSavings,
        withdrawSavings,
        getTotalSaved,
        getTotalTarget,
        getOverallProgress,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};
