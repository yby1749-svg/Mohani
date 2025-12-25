import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
  reminderEnabled: boolean;
  reminderDaysBefore: number; // How many days before to remind
  note?: string;
}

export interface UpcomingExpense {
  expense: RecurringExpense;
  dueDate: Date;
  daysUntilDue: number;
}

interface RecurringExpenseContextType {
  recurringExpenses: RecurringExpense[];
  addRecurring: (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive' | 'reminderEnabled' | 'reminderDaysBefore'> & { reminderEnabled?: boolean; reminderDaysBefore?: number }) => void;
  updateRecurring: (id: string, updates: Partial<RecurringExpense>) => void;
  deleteRecurring: (id: string) => void;
  toggleActive: (id: string) => void;
  toggleReminder: (id: string) => void;
  getTotalMonthly: () => number;
  getDueToday: () => RecurringExpense[];
  getUpcoming: (days?: number) => UpcomingExpense[];
  getNextDueDate: (expense: RecurringExpense) => Date;
  scheduleReminders: () => Promise<void>;
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

  const addRecurring = (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive' | 'reminderEnabled' | 'reminderDaysBefore'> & { reminderEnabled?: boolean; reminderDaysBefore?: number }) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isActive: true,
      createdAt: new Date(),
      reminderEnabled: expense.reminderEnabled ?? true,
      reminderDaysBefore: expense.reminderDaysBefore ?? 1,
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

  const toggleReminder = (id: string) => {
    setRecurringExpenses((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, reminderEnabled: !item.reminderEnabled } : item
      )
    );
  };

  const getNextDueDate = useCallback((expense: RecurringExpense): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (expense.frequency) {
      case 'daily':
        return today;

      case 'weekly': {
        const targetDay = expense.dayOfWeek ?? 0;
        const currentDay = today.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntil);
        return nextDate;
      }

      case 'monthly': {
        const targetDay = expense.dayOfMonth ?? 1;
        const currentDay = today.getDate();
        const nextDate = new Date(today);

        if (currentDay >= targetDay) {
          // Move to next month
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        nextDate.setDate(Math.min(targetDay, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
        return nextDate;
      }

      case 'yearly': {
        const created = new Date(expense.createdAt);
        const nextDate = new Date(today.getFullYear(), created.getMonth(), created.getDate());
        if (nextDate <= today) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        return nextDate;
      }

      default:
        return today;
    }
  }, []);

  const getUpcoming = useCallback((days: number = 7): UpcomingExpense[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return recurringExpenses
      .filter((e) => e.isActive)
      .map((expense) => {
        const dueDate = getNextDueDate(expense);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { expense, dueDate, daysUntilDue };
      })
      .filter((item) => item.daysUntilDue >= 0 && item.daysUntilDue <= days)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [recurringExpenses, getNextDueDate]);

  const scheduleReminders = useCallback(async () => {
    try {
      // Cancel all existing recurring expense notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduled) {
        if (notification.identifier.startsWith('recurring_')) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      // Schedule new reminders for active expenses with reminders enabled
      for (const expense of recurringExpenses) {
        if (!expense.isActive || !expense.reminderEnabled) continue;

        const nextDue = getNextDueDate(expense);
        const reminderDate = new Date(nextDue);
        reminderDate.setDate(reminderDate.getDate() - expense.reminderDaysBefore);
        reminderDate.setHours(9, 0, 0, 0); // 9 AM reminder

        // Only schedule if reminder date is in the future
        if (reminderDate > new Date()) {
          await Notifications.scheduleNotificationAsync({
            identifier: `recurring_${expense.id}`,
            content: {
              title: `📅 ${expense.name} 결제 예정`,
              body: expense.reminderDaysBefore === 0
                ? `오늘 ₩${expense.amount.toLocaleString()} 결제 예정입니다.`
                : `${expense.reminderDaysBefore}일 후 ₩${expense.amount.toLocaleString()} 결제 예정입니다.`,
              sound: true,
              data: { expenseId: expense.id, type: 'recurring_reminder' },
            },
            trigger: {
              date: reminderDate,
            },
          });
        }
      }
    } catch (error) {
      console.log('Failed to schedule reminders:', error);
    }
  }, [recurringExpenses, getNextDueDate]);

  // Schedule reminders when expenses change
  useEffect(() => {
    if (recurringExpenses.length > 0) {
      scheduleReminders();
    }
  }, [recurringExpenses]);

  return (
    <RecurringExpenseContext.Provider
      value={{
        recurringExpenses,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        toggleActive,
        toggleReminder,
        getTotalMonthly,
        getDueToday,
        getUpcoming,
        getNextDueDate,
        scheduleReminders,
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
