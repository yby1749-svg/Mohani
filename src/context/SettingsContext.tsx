import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSettings {
  // User Profile
  userName: string;
  profileEmoji: string;

  // Budget Settings
  monthlyBudget: number;
  dailyBudgetAlert: boolean;
  budgetAlertThreshold: number; // percentage

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

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'User',
  profileEmoji: '😊',
  monthlyBudget: 2500000,
  dailyBudgetAlert: true,
  budgetAlertThreshold: 80,
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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_settings';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    saveSettings();
  }, [settings]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
      }}
    >
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
