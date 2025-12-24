import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CategoryBudget {
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  limit: number;
  color: string;
}

interface CategoryBudgetContextType {
  budgets: CategoryBudget[];
  setBudget: (category: string, limit: number) => Promise<void>;
  removeBudget: (category: string) => Promise<void>;
  getBudget: (category: string) => CategoryBudget | undefined;
  getCategorySpending: (category: string, expenses: any[]) => number;
  getCategoryProgress: (category: string, expenses: any[]) => number;
  getOverBudgetCategories: (expenses: any[]) => CategoryBudget[];
}

const CategoryBudgetContext = createContext<CategoryBudgetContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_category_budgets';

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  food: { label: '식비', icon: '🍚', color: '#7c3aed' },
  transport: { label: '교통', icon: '🚌', color: '#3b82f6' },
  shopping: { label: '쇼핑', icon: '🛍️', color: '#ec4899' },
  entertainment: { label: '여가', icon: '🎮', color: '#8b5cf6' },
  cafe: { label: '카페', icon: '☕', color: '#f59e0b' },
  health: { label: '건강', icon: '💊', color: '#10b981' },
  bills: { label: '공과금', icon: '📄', color: '#64748b' },
  other: { label: '기타', icon: '📦', color: '#6b7280' },
};

export const CategoryBudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBudgets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load category budgets:', error);
    }
  };

  const saveBudgets = async (newBudgets: CategoryBudget[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newBudgets));
    } catch (error) {
      console.error('Failed to save category budgets:', error);
    }
  };

  const setBudget = async (category: string, limit: number) => {
    const info = CATEGORY_INFO[category] || { label: category, icon: '📦', color: '#6b7280' };
    const existingIndex = budgets.findIndex((b) => b.category === category);

    let updated: CategoryBudget[];
    if (existingIndex >= 0) {
      updated = budgets.map((b, i) =>
        i === existingIndex ? { ...b, limit } : b
      );
    } else {
      updated = [
        ...budgets,
        {
          category,
          categoryLabel: info.label,
          categoryIcon: info.icon,
          limit,
          color: info.color,
        },
      ];
    }

    setBudgets(updated);
    await saveBudgets(updated);
  };

  const removeBudget = async (category: string) => {
    const updated = budgets.filter((b) => b.category !== category);
    setBudgets(updated);
    await saveBudgets(updated);
  };

  const getBudget = (category: string) => {
    return budgets.find((b) => b.category === category);
  };

  const getCategorySpending = (category: string, expenses: any[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return expenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return e.category === category && expenseDate >= startOfMonth;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryProgress = (category: string, expenses: any[]) => {
    const budget = getBudget(category);
    if (!budget || budget.limit === 0) return 0;

    const spent = getCategorySpending(category, expenses);
    return Math.min(Math.round((spent / budget.limit) * 100), 100);
  };

  const getOverBudgetCategories = (expenses: any[]) => {
    return budgets.filter((budget) => {
      const spent = getCategorySpending(budget.category, expenses);
      return spent > budget.limit;
    });
  };

  return (
    <CategoryBudgetContext.Provider
      value={{
        budgets,
        setBudget,
        removeBudget,
        getBudget,
        getCategorySpending,
        getCategoryProgress,
        getOverBudgetCategories,
      }}
    >
      {children}
    </CategoryBudgetContext.Provider>
  );
};

export const useCategoryBudgets = () => {
  const context = useContext(CategoryBudgetContext);
  if (!context) {
    throw new Error('useCategoryBudgets must be used within a CategoryBudgetProvider');
  }
  return context;
};
