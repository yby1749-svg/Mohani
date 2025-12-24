import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dayOfMonth?: number; // For monthly
  dayOfWeek?: number; // For weekly (0-6)
  isActive: boolean;
  lastProcessed?: Date;
  createdAt: Date;
}

interface RecurringExpenseContextType {
  recurringExpenses: RecurringExpense[];
  addRecurring: (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) => void;
  updateRecurring: (id: string, updates: Partial<RecurringExpense>) => void;
  deleteRecurring: (id: string) => void;
  toggleActive: (id: string) => void;
  getTotalMonthly: () => number;
  getDueToday: () => RecurringExpense[];
}

const RecurringExpenseContext = createContext<RecurringExpenseContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_recurring';

export const RecurringExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  useEffect(() => {
    loadRecurring();
  }, []);

  useEffect(() => {
    saveRecurring();
  }, [recurringExpenses]);

  const loadRecurring = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          lastProcessed: item.lastProcessed ? new Date(item.lastProcessed) : undefined,
        }));
        setRecurringExpenses(withDates);
      }
    } catch (error) {
      console.error('Failed to load recurring expenses:', error);
    }
  };

  const saveRecurring = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recurringExpenses));
    } catch (error) {
      console.error('Failed to save recurring expenses:', error);
    }
  };

  const addRecurring = (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isActive: true,
      createdAt: new Date(),
    };
    setRecurringExpenses((prev) => [newExpense, ...prev]);
  };

  const updateRecurring = (id: string, updates: Partial<RecurringExpense>) => {
    setRecurringExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteRecurring = (id: string) => {
    setRecurringExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleActive = (id: string) => {
    setRecurringExpenses((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  const getTotalMonthly = () => {
    return recurringExpenses
      .filter((e) => e.isActive)
      .reduce((sum, e) => {
        switch (e.frequency) {
          case 'daily':
            return sum + e.amount * 30;
          case 'weekly':
            return sum + e.amount * 4;
          case 'monthly':
            return sum + e.amount;
          case 'yearly':
            return sum + e.amount / 12;
          default:
            return sum;
        }
      }, 0);
  };

  const getDueToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();

    return recurringExpenses.filter((e) => {
      if (!e.isActive) return false;

      switch (e.frequency) {
        case 'daily':
          return true;
        case 'weekly':
          return e.dayOfWeek === dayOfWeek;
        case 'monthly':
          return e.dayOfMonth === dayOfMonth;
        case 'yearly':
          // Check if today matches the creation date month and day
          const created = new Date(e.createdAt);
          return (
            created.getMonth() === today.getMonth() &&
            created.getDate() === today.getDate()
          );
        default:
          return false;
      }
    });
  };

  return (
    <RecurringExpenseContext.Provider
      value={{
        recurringExpenses,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        toggleActive,
        getTotalMonthly,
        getDueToday,
      }}
    >
      {children}
    </RecurringExpenseContext.Provider>
  );
};

export const useRecurringExpenses = () => {
  const context = useContext(RecurringExpenseContext);
  if (!context) {
    throw new Error('useRecurringExpenses must be used within a RecurringExpenseProvider');
  }
  return context;
};
