import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface CategoryBudget {
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  limit: number;
  alertAt: number; // Percentage (e.g., 80 = alert at 80%)
  enabled: boolean;
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'danger' | 'exceeded';
  category: string | null; // null = total budget
  message: string;
  percentage: number;
  timestamp: Date;
  dismissed: boolean;
}

interface BudgetAlertContextType {
  categoryBudgets: CategoryBudget[];
  alerts: BudgetAlert[];
  totalBudgetAlertAt: number; // Percentage for total budget alert
  setCategoryBudget: (budget: CategoryBudget) => void;
  removeCategoryBudget: (category: string) => void;
  setTotalBudgetAlertAt: (percentage: number) => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  checkBudgets: (expenses: any[], monthlyBudget: number) => void;
  getActiveAlerts: () => BudgetAlert[];
  requestNotificationPermission: () => Promise<boolean>;
}

const BudgetAlertContext = createContext<BudgetAlertContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_category_budgets';
const ALERTS_KEY = '@mohani_budget_alerts';
const SETTINGS_KEY = '@mohani_budget_alert_settings';

export const BudgetAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [totalBudgetAlertAt, setTotalAlertAt] = useState(80); // Default 80%
  const [lastNotifiedCategories, setLastNotifiedCategories] = useState<Set<string>>(new Set());

  // Load data on mount
  useEffect(() => {
    loadData();
    requestNotificationPermission();
  }, []);

  // Save data when it changes
  useEffect(() => {
    saveData();
  }, [categoryBudgets, alerts, totalBudgetAlertAt]);

  const loadData = async () => {
    try {
      const [budgetsData, alertsData, settingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ALERTS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);

      if (budgetsData) {
        setCategoryBudgets(JSON.parse(budgetsData));
      }
      if (alertsData) {
        const parsed = JSON.parse(alertsData);
        setAlerts(parsed.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })));
      }
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        setTotalAlertAt(settings.totalBudgetAlertAt || 80);
      }
    } catch (error) {
      console.error('Failed to load budget data:', error);
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categoryBudgets)),
        AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts)),
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ totalBudgetAlertAt })),
      ]);
    } catch (error) {
      console.error('Failed to save budget data:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('budget-alerts', {
          name: '예산 알림',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
        });
      }

      return true;
    } catch {
      return false;
    }
  };

  const sendNotification = async (title: string, body: string, type: 'warning' | 'danger' | 'exceeded') => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.log('Notification error:', error);
    }
  };

  const setCategoryBudget = (budget: CategoryBudget) => {
    setCategoryBudgets((prev) => {
      const existing = prev.findIndex((b) => b.category === budget.category);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = budget;
        return updated;
      }
      return [...prev, budget];
    });
  };

  const removeCategoryBudget = (category: string) => {
    setCategoryBudgets((prev) => prev.filter((b) => b.category !== category));
  };

  const setTotalBudgetAlertAt = (percentage: number) => {
    setTotalAlertAt(percentage);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a))
    );
  };

  const clearAlerts = () => {
    setAlerts([]);
    setLastNotifiedCategories(new Set());
  };

  const checkBudgets = useCallback((expenses: any[], monthlyBudget: number) => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Filter to this month's expenses
    const monthlyExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= monthStart;
    });

    const newAlerts: BudgetAlert[] = [];
    const notifiedCategories = new Set(lastNotifiedCategories);

    // Check total budget
    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPercentage = Math.round((totalSpent / monthlyBudget) * 100);

    if (totalPercentage >= 100 && !notifiedCategories.has('total_exceeded')) {
      newAlerts.push({
        id: `total_exceeded_${Date.now()}`,
        type: 'exceeded',
        category: null,
        message: `이번 달 예산을 초과했습니다! (${totalPercentage}%)`,
        percentage: totalPercentage,
        timestamp: new Date(),
        dismissed: false,
      });
      sendNotification(
        '🚨 예산 초과!',
        `이번 달 예산 ₩${monthlyBudget.toLocaleString()}을 초과했습니다.`,
        'exceeded'
      );
      notifiedCategories.add('total_exceeded');
    } else if (totalPercentage >= totalBudgetAlertAt && !notifiedCategories.has('total_warning')) {
      newAlerts.push({
        id: `total_warning_${Date.now()}`,
        type: 'warning',
        category: null,
        message: `이번 달 예산의 ${totalPercentage}%를 사용했습니다.`,
        percentage: totalPercentage,
        timestamp: new Date(),
        dismissed: false,
      });
      sendNotification(
        '⚠️ 예산 경고',
        `이번 달 예산의 ${totalPercentage}%를 사용했습니다. 남은 예산: ₩${(monthlyBudget - totalSpent).toLocaleString()}`,
        'warning'
      );
      notifiedCategories.add('total_warning');
    }

    // Check category budgets
    categoryBudgets.forEach((budget) => {
      if (!budget.enabled) return;

      const categoryExpenses = monthlyExpenses.filter((e) => e.category === budget.category);
      const categorySpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const categoryPercentage = Math.round((categorySpent / budget.limit) * 100);

      const categoryKey = `${budget.category}_${categoryPercentage >= 100 ? 'exceeded' : 'warning'}`;

      if (categoryPercentage >= 100 && !notifiedCategories.has(`${budget.category}_exceeded`)) {
        newAlerts.push({
          id: `${budget.category}_exceeded_${Date.now()}`,
          type: 'exceeded',
          category: budget.category,
          message: `${budget.categoryIcon} ${budget.categoryLabel} 예산을 초과했습니다! (${categoryPercentage}%)`,
          percentage: categoryPercentage,
          timestamp: new Date(),
          dismissed: false,
        });
        sendNotification(
          `🚨 ${budget.categoryLabel} 예산 초과!`,
          `${budget.categoryIcon} ${budget.categoryLabel} 예산 ₩${budget.limit.toLocaleString()}을 초과했습니다.`,
          'exceeded'
        );
        notifiedCategories.add(`${budget.category}_exceeded`);
      } else if (categoryPercentage >= budget.alertAt && !notifiedCategories.has(`${budget.category}_warning`)) {
        newAlerts.push({
          id: `${budget.category}_warning_${Date.now()}`,
          type: 'warning',
          category: budget.category,
          message: `${budget.categoryIcon} ${budget.categoryLabel} 예산의 ${categoryPercentage}%를 사용했습니다.`,
          percentage: categoryPercentage,
          timestamp: new Date(),
          dismissed: false,
        });
        sendNotification(
          `⚠️ ${budget.categoryLabel} 예산 경고`,
          `${budget.categoryIcon} ${budget.categoryLabel} 예산의 ${categoryPercentage}%를 사용했습니다.`,
          'warning'
        );
        notifiedCategories.add(`${budget.category}_warning`);
      }
    });

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
      setLastNotifiedCategories(notifiedCategories);
    }
  }, [categoryBudgets, totalBudgetAlertAt, lastNotifiedCategories]);

  const getActiveAlerts = () => {
    return alerts.filter((a) => !a.dismissed);
  };

  return (
    <BudgetAlertContext.Provider
      value={{
        categoryBudgets,
        alerts,
        totalBudgetAlertAt,
        setCategoryBudget,
        removeCategoryBudget,
        setTotalBudgetAlertAt,
        dismissAlert,
        clearAlerts,
        checkBudgets,
        getActiveAlerts,
        requestNotificationPermission,
      }}
    >
      {children}
    </BudgetAlertContext.Provider>
  );
};

export const useBudgetAlerts = () => {
  const context = useContext(BudgetAlertContext);
  if (!context) {
    throw new Error('useBudgetAlerts must be used within a BudgetAlertProvider');
  }
  return context;
};
