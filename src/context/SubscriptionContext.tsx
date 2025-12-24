import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  category: string;
  categoryIcon: string;
  nextBillingDate: Date;
  startDate: Date;
  isActive: boolean;
  notes?: string;
  color?: string;
}

interface SubscriptionContextType {
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id' | 'startDate'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleActive: (id: string) => void;
  getMonthlyTotal: () => number;
  getYearlyTotal: () => number;
  getUpcomingRenewals: (days: number) => Subscription[];
  getSubscriptionsByCategory: () => { category: string; icon: string; total: number; count: number }[];
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_subscriptions';

const SUBSCRIPTION_PRESETS = [
  { name: 'Netflix', icon: '🎬', color: '#E50914' },
  { name: 'YouTube Premium', icon: '▶️', color: '#FF0000' },
  { name: 'Spotify', icon: '🎵', color: '#1DB954' },
  { name: 'Apple Music', icon: '🎧', color: '#FA243C' },
  { name: 'Disney+', icon: '🏰', color: '#113CCF' },
  { name: 'Coupang Rocket', icon: '🚀', color: '#E31837' },
  { name: 'Naver Plus', icon: '💚', color: '#03C75A' },
  { name: 'Wavve', icon: '📺', color: '#0052FF' },
  { name: 'Tving', icon: '📱', color: '#FF153C' },
  { name: 'Melon', icon: '🍈', color: '#00CD3C' },
  { name: 'iCloud', icon: '☁️', color: '#3693F3' },
  { name: 'Google One', icon: '🔵', color: '#4285F4' },
];

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    if (subscriptions.length > 0) {
      saveSubscriptions();
    }
  }, [subscriptions]);

  const loadSubscriptions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSubscriptions(
          parsed.map((sub: Subscription) => ({
            ...sub,
            nextBillingDate: new Date(sub.nextBillingDate),
            startDate: new Date(sub.startDate),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  const saveSubscriptions = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    } catch (error) {
      console.error('Failed to save subscriptions:', error);
    }
  };

  const addSubscription = (sub: Omit<Subscription, 'id' | 'startDate'>) => {
    const newSub: Subscription = {
      ...sub,
      id: Date.now().toString(),
      startDate: new Date(),
    };
    setSubscriptions((prev) => [...prev, newSub]);
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub))
    );
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
  };

  const toggleActive = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, isActive: !sub.isActive } : sub))
    );
  };

  const getMonthlyTotal = (): number => {
    return subscriptions
      .filter((sub) => sub.isActive)
      .reduce((sum, sub) => {
        switch (sub.billingCycle) {
          case 'weekly':
            return sum + sub.amount * 4;
          case 'monthly':
            return sum + sub.amount;
          case 'yearly':
            return sum + sub.amount / 12;
          default:
            return sum;
        }
      }, 0);
  };

  const getYearlyTotal = (): number => {
    return subscriptions
      .filter((sub) => sub.isActive)
      .reduce((sum, sub) => {
        switch (sub.billingCycle) {
          case 'weekly':
            return sum + sub.amount * 52;
          case 'monthly':
            return sum + sub.amount * 12;
          case 'yearly':
            return sum + sub.amount;
          default:
            return sum;
        }
      }, 0);
  };

  const getUpcomingRenewals = (days: number): Subscription[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    return subscriptions
      .filter((sub) => {
        if (!sub.isActive) return false;
        const nextBilling = new Date(sub.nextBillingDate);
        nextBilling.setHours(0, 0, 0, 0);
        return nextBilling >= today && nextBilling <= futureDate;
      })
      .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());
  };

  const getSubscriptionsByCategory = () => {
    const categoryMap: Record<string, { icon: string; total: number; count: number }> = {};

    subscriptions
      .filter((sub) => sub.isActive)
      .forEach((sub) => {
        if (!categoryMap[sub.category]) {
          categoryMap[sub.category] = { icon: sub.categoryIcon, total: 0, count: 0 };
        }
        // Convert to monthly
        let monthlyAmount = sub.amount;
        if (sub.billingCycle === 'weekly') monthlyAmount *= 4;
        if (sub.billingCycle === 'yearly') monthlyAmount /= 12;

        categoryMap[sub.category].total += monthlyAmount;
        categoryMap[sub.category].count += 1;
      });

    return Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        icon: data.icon,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        toggleActive,
        getMonthlyTotal,
        getYearlyTotal,
        getUpcomingRenewals,
        getSubscriptionsByCategory,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
};

export { SUBSCRIPTION_PRESETS };
