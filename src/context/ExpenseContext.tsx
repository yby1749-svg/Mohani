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
}

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  getTodayExpenses: () => Expense[];
  getTodayTotal: () => number;
  getMonthlyTotal: () => number;
  getCategoryTotals: () => { category: string; label: string; icon: string; total: number }[];
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_expenses';

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load expenses from storage on mount
  useEffect(() => {
    loadExpenses();
  }, []);

  // Save expenses to storage whenever they change
  useEffect(() => {
    saveExpenses();
  }, [expenses]);

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
