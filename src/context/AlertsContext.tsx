import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SpendingAlert {
  id: string;
  type: 'budget_percent' | 'daily_limit' | 'category_limit' | 'large_expense';
  isEnabled: boolean;
  threshold: number; // percentage for budget, amount for others
  category?: string; // for category_limit
  categoryLabel?: string;
}

interface AlertsContextType {
  alerts: SpendingAlert[];
  updateAlert: (id: string, updates: Partial<SpendingAlert>) => Promise<void>;
  toggleAlert: (id: string) => Promise<void>;
  checkAlerts: (
    monthlySpent: number,
    monthlyBudget: number,
    todaySpent: number,
    categorySpending: Map<string, number>,
    lastExpenseAmount: number
  ) => SpendingAlert[];
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_spending_alerts';

const DEFAULT_ALERTS: SpendingAlert[] = [
  {
    id: 'budget_50',
    type: 'budget_percent',
    isEnabled: true,
    threshold: 50,
  },
  {
    id: 'budget_80',
    type: 'budget_percent',
    isEnabled: true,
    threshold: 80,
  },
  {
    id: 'budget_100',
    type: 'budget_percent',
    isEnabled: true,
    threshold: 100,
  },
  {
    id: 'daily_limit',
    type: 'daily_limit',
    isEnabled: true,
    threshold: 50000,
  },
  {
    id: 'large_expense',
    type: 'large_expense',
    isEnabled: true,
    threshold: 100000,
  },
];

export const AlertsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<SpendingAlert[]>(DEFAULT_ALERTS);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAlerts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const saveAlerts = async (newAlerts: SpendingAlert[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  };

  const updateAlert = async (id: string, updates: Partial<SpendingAlert>) => {
    const updated = alerts.map((alert) =>
      alert.id === id ? { ...alert, ...updates } : alert
    );
    setAlerts(updated);
    await saveAlerts(updated);
  };

  const toggleAlert = async (id: string) => {
    const updated = alerts.map((alert) =>
      alert.id === id ? { ...alert, isEnabled: !alert.isEnabled } : alert
    );
    setAlerts(updated);
    await saveAlerts(updated);
  };

  const checkAlerts = (
    monthlySpent: number,
    monthlyBudget: number,
    todaySpent: number,
    categorySpending: Map<string, number>,
    lastExpenseAmount: number
  ): SpendingAlert[] => {
    const triggered: SpendingAlert[] = [];

    alerts.forEach((alert) => {
      if (!alert.isEnabled) return;

      switch (alert.type) {
        case 'budget_percent':
          const budgetPercent = (monthlySpent / monthlyBudget) * 100;
          if (budgetPercent >= alert.threshold) {
            triggered.push(alert);
          }
          break;

        case 'daily_limit':
          if (todaySpent >= alert.threshold) {
            triggered.push(alert);
          }
          break;

        case 'category_limit':
          if (alert.category) {
            const catSpent = categorySpending.get(alert.category) || 0;
            if (catSpent >= alert.threshold) {
              triggered.push(alert);
            }
          }
          break;

        case 'large_expense':
          if (lastExpenseAmount >= alert.threshold) {
            triggered.push(alert);
          }
          break;
      }
    });

    return triggered;
  };

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        updateAlert,
        toggleAlert,
        checkAlerts,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};
