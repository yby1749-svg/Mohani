import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  note: string;
  date: Date;
  receiptImage?: string; // Base64 or file URI for receipt photo
  split?: ExpenseSplit; // Split expense data
}

export interface SplitParticipant {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
}

export interface ExpenseSplit {
  totalAmount: number;
  participants: SplitParticipant[];
  myShare: number;
  paidByMe: boolean;
}

export interface Friend {
  id: string;
  name: string;
  emoji: string;
}

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  getTodayExpenses: () => Expense[];
  getTodayTotal: () => number;
  getMonthlyTotal: () => number;
  getCategoryTotals: () => { category: string; label: string; icon: string; total: number }[];
  // Friends & Split
  friends: Friend[];
  addFriend: (name: string, emoji: string) => void;
  removeFriend: (id: string) => void;
  markSplitAsPaid: (expenseId: string, participantId: string) => void;
  getSplitBalances: () => { friend: Friend; balance: number; expenses: Expense[] }[];
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_expenses';
const FRIENDS_STORAGE_KEY = '@mohani_friends';

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  // Load expenses and friends from storage on mount
  useEffect(() => {
    loadExpenses();
    loadFriends();
  }, []);

  // Save expenses to storage whenever they change
  useEffect(() => {
    saveExpenses();
  }, [expenses]);

  // Save friends to storage whenever they change
  useEffect(() => {
    saveFriends();
  }, [friends]);

  const loadExpenses = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const withDates = parsed.map((e: any) => ({
          ...e,
          date: new Date(e.date),
        }));
        setExpenses(withDates);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const saveExpenses = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const stored = await AsyncStorage.getItem(FRIENDS_STORAGE_KEY);
      if (stored) {
        setFriends(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const saveFriends = async () => {
    try {
      await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
    } catch (error) {
      console.error('Failed to save friends:', error);
    }
  };

  const addFriend = (name: string, emoji: string) => {
    const newFriend: Friend = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      emoji,
    };
    setFriends((prev) => [...prev, newFriend]);
  };

  const removeFriend = (id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const markSplitAsPaid = (expenseId: string, participantId: string) => {
    setExpenses((prev) =>
      prev.map((expense) => {
        if (expense.id === expenseId && expense.split) {
          return {
            ...expense,
            split: {
              ...expense.split,
              participants: expense.split.participants.map((p) =>
                p.id === participantId ? { ...p, isPaid: true } : p
              ),
            },
          };
        }
        return expense;
      })
    );
  };

  const getSplitBalances = () => {
    const balanceMap: Record<string, { friend: Friend; balance: number; expenses: Expense[] }> = {};

    expenses.forEach((expense) => {
      const split = expense.split;
      if (!split) return;

      split.participants.forEach((participant) => {
        // Find matching friend
        const friend = friends.find((f) => f.id === participant.id);
        if (!friend) return;

        if (!balanceMap[friend.id]) {
          balanceMap[friend.id] = { friend, balance: 0, expenses: [] };
        }

        // If I paid and they haven't paid back yet, they owe me
        if (split.paidByMe && !participant.isPaid) {
          balanceMap[friend.id].balance += participant.amount;
          balanceMap[friend.id].expenses.push(expense);
        }
        // If they paid (paidByMe = false means someone else paid), I owe them
        else if (!split.paidByMe && !participant.isPaid) {
          balanceMap[friend.id].balance -= participant.amount;
          balanceMap[friend.id].expenses.push(expense);
        }
      });
    });

    return Object.values(balanceMap).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const getTodayExpenses = () => {
    const today = new Date();
    return expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return (
        expenseDate.getDate() === today.getDate() &&
        expenseDate.getMonth() === today.getMonth() &&
        expenseDate.getFullYear() === today.getFullYear()
      );
    });
  };

  const getTodayTotal = () => {
    return getTodayExpenses().reduce((sum, e) => sum + e.amount, 0);
  };

  const getMonthlyTotal = () => {
    const today = new Date();
    return expenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getMonth() === today.getMonth() &&
          expenseDate.getFullYear() === today.getFullYear()
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryTotals = () => {
    const today = new Date();
    const monthlyExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return (
        expenseDate.getMonth() === today.getMonth() &&
        expenseDate.getFullYear() === today.getFullYear()
      );
    });

    const totals: Record<string, { label: string; icon: string; total: number }> = {};

    monthlyExpenses.forEach((e) => {
      if (!totals[e.category]) {
        totals[e.category] = {
          label: e.categoryLabel,
          icon: e.categoryIcon,
          total: 0,
        };
      }
      totals[e.category].total += e.amount;
    });

    return Object.entries(totals)
      .map(([category, data]) => ({
        category,
        ...data,
      }))
      .sort((a, b) => b.total - a.total);
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        addExpense,
        removeExpense,
        getTodayExpenses,
        getTodayTotal,
        getMonthlyTotal,
        getCategoryTotals,
        friends,
        addFriend,
        removeFriend,
        markSplitAsPaid,
        getSplitBalances,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
