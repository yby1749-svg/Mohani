import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Income {
  id: string;
  amount: number;
  source: string;
  sourceIcon: string;
  type: 'salary' | 'bonus' | 'freelance' | 'investment' | 'gift' | 'other';
  date: Date;
  note?: string;
  isRecurring: boolean;
  recurringDay?: number; // Day of month for recurring income
}

export type IncomeType = Income['type'];

export const INCOME_TYPES: { id: IncomeType; label: string; icon: string }[] = [
  { id: 'salary', label: '급여', icon: '💼' },
  { id: 'bonus', label: '보너스', icon: '🎁' },
  { id: 'freelance', label: '프리랜서', icon: '💻' },
  { id: 'investment', label: '투자 수익', icon: '📈' },
  { id: 'gift', label: '용돈/선물', icon: '🎀' },
  { id: 'other', label: '기타', icon: '💵' },
];

interface IncomeContextType {
  incomes: Income[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  getMonthlyIncome: () => number;
  getTotalIncomeThisMonth: () => number;
  getIncomeByType: () => { type: IncomeType; total: number; label: string; icon: string }[];
  getRecentIncomes: (limit?: number) => Income[];
}

// Context already exposes incomes array in the provider value

const IncomeContext = createContext<IncomeContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_incomes';

export const IncomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);

  useEffect(() => {
    loadIncomes();
  }, []);

  useEffect(() => {
    saveIncomes();
  }, [incomes]);

  const loadIncomes = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setIncomes(
          parsed.map((income: Income) => ({
            ...income,
            date: new Date(income.date),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load incomes:', error);
    }
  };

  const saveIncomes = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(incomes));
    } catch (error) {
      console.error('Failed to save incomes:', error);
    }
  };

  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome: Income = {
      ...income,
      id: Date.now().toString(),
    };
    setIncomes((prev) => [newIncome, ...prev]);
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    setIncomes((prev) =>
      prev.map((income) => (income.id === id ? { ...income, ...updates } : income))
    );
  };

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((income) => income.id !== id));
  };

  const getMonthlyIncome = () => {
    // Calculate expected monthly income from recurring incomes
    return incomes
      .filter((income) => income.isRecurring)
      .reduce((sum, income) => sum + income.amount, 0);
  };

  const getTotalIncomeThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return incomes
      .filter((income) => {
        const incomeDate = new Date(income.date);
        return incomeDate >= startOfMonth && incomeDate <= endOfMonth;
      })
      .reduce((sum, income) => sum + income.amount, 0);
  };

  const getIncomeByType = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyIncomes = incomes.filter((income) => {
      const incomeDate = new Date(income.date);
      return incomeDate >= startOfMonth && incomeDate <= endOfMonth;
    });

    const typeMap = new Map<IncomeType, number>();
    monthlyIncomes.forEach((income) => {
      const current = typeMap.get(income.type) || 0;
      typeMap.set(income.type, current + income.amount);
    });

    return INCOME_TYPES.map((t) => ({
      type: t.id,
      total: typeMap.get(t.id) || 0,
      label: t.label,
      icon: t.icon,
    })).filter((t) => t.total > 0);
  };

  const getRecentIncomes = (limit = 5) => {
    return incomes.slice(0, limit);
  };

  return (
    <IncomeContext.Provider
      value={{
        incomes,
        addIncome,
        updateIncome,
        deleteIncome,
        getMonthlyIncome,
        getTotalIncomeThisMonth,
        getIncomeByType,
        getRecentIncomes,
      }}
    >
      {children}
    </IncomeContext.Provider>
  );
};

export const useIncome = () => {
  const context = useContext(IncomeContext);
  if (!context) {
    throw new Error('useIncome must be used within an IncomeProvider');
  }
  return context;
};
