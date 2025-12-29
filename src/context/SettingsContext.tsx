import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CategoryLimit {
  category: string;
  limit: number;
  enabled: boolean;
}

export interface UserSettings {
  // User Profile
  userName: string;
  profileEmoji: string;

  // Budget Settings
  monthlyBudget: number;
  dailyBudgetAlert: boolean;
  budgetAlertThreshold: number; // percentage
  categoryLimits: CategoryLimit[];

  // Notification Settings
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  weeklyReport: boolean;

  // App Settings
  currency: string;
  language: string;
  hapticFeedback: boolean;
  darkMode: boolean;

  // Privacy
  useBiometrics: boolean;
}

const DEFAULT_CATEGORY_LIMITS: CategoryLimit[] = [
  { category: 'food', limit: 500000, enabled: true },
  { category: 'transport', limit: 200000, enabled: false },
  { category: 'shopping', limit: 300000, enabled: true },
  { category: 'entertainment', limit: 200000, enabled: false },
  { category: 'cafe', limit: 100000, enabled: true },
  { category: 'health', limit: 100000, enabled: false },
  { category: 'bills', limit: 500000, enabled: false },
  { category: 'other', limit: 200000, enabled: false },
];

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'User',
  profileEmoji: '😊',
  monthlyBudget: 2500000,
  dailyBudgetAlert: true,
  budgetAlertThreshold: 80,
  categoryLimits: DEFAULT_CATEGORY_LIMITS,
  dailyReminder: true,
  reminderTime: '21:00',
  weeklyReport: true,
  currency: 'KRW',
  language: 'ko',
  hapticFeedback: true,
  darkMode: true,
  useBiometrics: false,
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
  updateCategoryLimit: (category: string, limit: number, enabled: boolean) => void;
  getCategoryLimit: (category: string) => CategoryLimit | undefined;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_settings';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveSettings();
    }
  }, [settings, isLoaded]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const updateCategoryLimit = useCallback((category: string, limit: number, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      categoryLimits: prev.categoryLimits.map((cl) =>
        cl.category === category ? { ...cl, limit, enabled } : cl
      ),
    }));
  }, []);

  const getCategoryLimit = useCallback((category: string) => {
    return settings.categoryLimits.find((cl) => cl.category === category);
  }, [settings.categoryLimits]);

  const contextValue = useMemo(() => ({
    settings,
    updateSettings,
    resetSettings,
    updateCategoryLimit,
    getCategoryLimit,
  }), [settings, updateSettings, resetSettings, updateCategoryLimit, getCategoryLimit]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
