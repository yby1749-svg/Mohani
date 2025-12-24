import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // Day of month (1-31)
  category: string;
  categoryIcon: string;
  isAutoPay: boolean;
  isPaid: boolean;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
}

interface BillContextType {
  bills: Bill[];
  addBill: (bill: Omit<Bill, 'id' | 'isPaid' | 'createdAt'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  markAsPaid: (id: string) => void;
  resetMonthlyBills: () => void;
  getUpcomingBills: () => Bill[];
  getOverdueBills: () => Bill[];
  getTotalDue: () => number;
  getDaysUntilDue: (bill: Bill) => number;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_bills';

export const BillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    loadBills();
  }, []);

  useEffect(() => {
    if (bills.length > 0) {
      saveBills();
    }
  }, [bills]);

  // Reset paid status at the start of each month
  useEffect(() => {
    const checkMonthReset = () => {
      const today = new Date();
      if (today.getDate() === 1) {
        resetMonthlyBills();
      }
    };
    checkMonthReset();
  }, []);

  const loadBills = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBills(
          parsed.map((bill: Bill) => ({
            ...bill,
            createdAt: new Date(bill.createdAt),
            paidDate: bill.paidDate ? new Date(bill.paidDate) : undefined,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load bills:', error);
    }
  };

  const saveBills = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    } catch (error) {
      console.error('Failed to save bills:', error);
    }
  };

  const addBill = (bill: Omit<Bill, 'id' | 'isPaid' | 'createdAt'>) => {
    const newBill: Bill = {
      ...bill,
      id: Date.now().toString(),
      isPaid: false,
      createdAt: new Date(),
    };
    setBills((prev) => [...prev, newBill]);
  };

  const updateBill = (id: string, updates: Partial<Bill>) => {
    setBills((prev) =>
      prev.map((bill) => (bill.id === id ? { ...bill, ...updates } : bill))
    );
  };

  const deleteBill = (id: string) => {
    setBills((prev) => prev.filter((bill) => bill.id !== id));
  };

  const markAsPaid = (id: string) => {
    setBills((prev) =>
      prev.map((bill) =>
        bill.id === id ? { ...bill, isPaid: true, paidDate: new Date() } : bill
      )
    );
  };

  const resetMonthlyBills = () => {
    setBills((prev) =>
      prev.map((bill) => ({ ...bill, isPaid: false, paidDate: undefined }))
    );
  };

  const getDaysUntilDue = (bill: Bill): number => {
    const today = new Date();
    const currentDay = today.getDate();
    const dueDay = bill.dueDay;

    if (dueDay >= currentDay) {
      return dueDay - currentDay;
    } else {
      // Due date has passed this month
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return daysInMonth - currentDay + dueDay;
    }
  };

  const getUpcomingBills = (): Bill[] => {
    const today = new Date();
    const currentDay = today.getDate();

    return bills
      .filter((bill) => !bill.isPaid)
      .filter((bill) => {
        const daysUntil = getDaysUntilDue(bill);
        return daysUntil >= 0 && daysUntil <= 7; // Due within 7 days
      })
      .sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));
  };

  const getOverdueBills = (): Bill[] => {
    const today = new Date();
    const currentDay = today.getDate();

    return bills
      .filter((bill) => !bill.isPaid && bill.dueDay < currentDay)
      .sort((a, b) => a.dueDay - b.dueDay);
  };

  const getTotalDue = (): number => {
    return bills
      .filter((bill) => !bill.isPaid)
      .reduce((sum, bill) => sum + bill.amount, 0);
  };

  return (
    <BillContext.Provider
      value={{
        bills,
        addBill,
        updateBill,
        deleteBill,
        markAsPaid,
        resetMonthlyBills,
        getUpcomingBills,
        getOverdueBills,
        getTotalDue,
        getDaysUntilDue,
      }}
    >
      {children}
    </BillContext.Provider>
  );
};

export const useBills = () => {
  const context = useContext(BillContext);
  if (!context) {
    throw new Error('useBills must be used within a BillProvider');
  }
  return context;
};
