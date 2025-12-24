import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DebtPayment {
  id: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface Debt {
  id: string;
  name: string;
  type: 'owe' | 'owed'; // 'owe' = I owe someone, 'owed' = someone owes me
  originalAmount: number;
  currentBalance: number;
  interestRate?: number;
  dueDate?: Date;
  personOrInstitution: string;
  category: 'loan' | 'credit_card' | 'personal' | 'mortgage' | 'car' | 'student' | 'other';
  categoryIcon: string;
  payments: DebtPayment[];
  createdAt: Date;
  isActive: boolean;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
}

interface DebtContextType {
  debts: Debt[];
  addDebt: (debt: Omit<Debt, 'id' | 'payments' | 'createdAt'>) => Promise<void>;
  updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addPayment: (debtId: string, amount: number, note?: string) => Promise<void>;
  getTotalOwed: () => number;
  getTotalOwedToMe: () => number;
  getActiveDebts: () => Debt[];
  getUpcomingPayments: (days?: number) => Debt[];
  getDebtProgress: (debtId: string) => number;
}

const DebtContext = createContext<DebtContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_debts';

const CATEGORY_ICONS: Record<Debt['category'], string> = {
  loan: '🏦',
  credit_card: '💳',
  personal: '🤝',
  mortgage: '🏠',
  car: '🚗',
  student: '🎓',
  other: '📋',
};

export const DebtProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [debts, setDebts] = useState<Debt[]>([]);

  // Load debts from AsyncStorage
  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDebts(parsed.map((d: Debt) => ({
          ...d,
          dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
          createdAt: new Date(d.createdAt),
          payments: d.payments.map((p: DebtPayment) => ({
            ...p,
            date: new Date(p.date),
          })),
        })));
      }
    } catch (error) {
      console.error('Failed to load debts:', error);
    }
  };

  const saveDebts = async (newDebts: Debt[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newDebts));
    } catch (error) {
      console.error('Failed to save debts:', error);
    }
  };

  const addDebt = async (debtData: Omit<Debt, 'id' | 'payments' | 'createdAt'>) => {
    const newDebt: Debt = {
      ...debtData,
      id: Date.now().toString(),
      payments: [],
      createdAt: new Date(),
      categoryIcon: CATEGORY_ICONS[debtData.category],
    };
    const updated = [...debts, newDebt];
    setDebts(updated);
    await saveDebts(updated);
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    const updated = debts.map((debt) =>
      debt.id === id ? { ...debt, ...updates } : debt
    );
    setDebts(updated);
    await saveDebts(updated);
  };

  const deleteDebt = async (id: string) => {
    const updated = debts.filter((debt) => debt.id !== id);
    setDebts(updated);
    await saveDebts(updated);
  };

  const addPayment = async (debtId: string, amount: number, note?: string) => {
    const updated = debts.map((debt) => {
      if (debt.id === debtId) {
        const payment: DebtPayment = {
          id: Date.now().toString(),
          amount,
          date: new Date(),
          note,
        };
        const newBalance = Math.max(0, debt.currentBalance - amount);
        return {
          ...debt,
          currentBalance: newBalance,
          payments: [...debt.payments, payment],
          isActive: newBalance > 0,
        };
      }
      return debt;
    });
    setDebts(updated);
    await saveDebts(updated);
  };

  const getTotalOwed = () => {
    return debts
      .filter((d) => d.type === 'owe' && d.isActive)
      .reduce((sum, d) => sum + d.currentBalance, 0);
  };

  const getTotalOwedToMe = () => {
    return debts
      .filter((d) => d.type === 'owed' && d.isActive)
      .reduce((sum, d) => sum + d.currentBalance, 0);
  };

  const getActiveDebts = () => {
    return debts.filter((d) => d.isActive);
  };

  const getUpcomingPayments = (days = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return debts.filter((debt) => {
      if (!debt.isActive || !debt.dueDate) return false;
      const dueDate = new Date(debt.dueDate);
      return dueDate >= now && dueDate <= futureDate;
    }).sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    });
  };

  const getDebtProgress = (debtId: string) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return 0;
    const paid = debt.originalAmount - debt.currentBalance;
    return Math.round((paid / debt.originalAmount) * 100);
  };

  return (
    <DebtContext.Provider
      value={{
        debts,
        addDebt,
        updateDebt,
        deleteDebt,
        addPayment,
        getTotalOwed,
        getTotalOwedToMe,
        getActiveDebts,
        getUpcomingPayments,
        getDebtProgress,
      }}
    >
      {children}
    </DebtContext.Provider>
  );
};

export const useDebts = () => {
  const context = useContext(DebtContext);
  if (!context) {
    throw new Error('useDebts must be used within a DebtProvider');
  }
  return context;
};
