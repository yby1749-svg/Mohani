import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUniqueId } from '../utils/generateId';

export interface Asset {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'investment' | 'property' | 'vehicle' | 'other';
  value: number;
  icon: string;
  color: string;
  lastUpdated: Date;
}

export interface Liability {
  id: string;
  name: string;
  type: 'mortgage' | 'car_loan' | 'credit_card' | 'student_loan' | 'personal_loan' | 'other';
  amount: number;
  icon: string;
  color: string;
  interestRate?: number;
  lastUpdated: Date;
}

export interface NetWorthSnapshot {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

interface NetWorthContextType {
  assets: Asset[];
  liabilities: Liability[];
  snapshots: NetWorthSnapshot[];
  addAsset: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addLiability: (liability: Omit<Liability, 'id' | 'lastUpdated'>) => Promise<void>;
  updateLiability: (id: string, updates: Partial<Liability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  getTotalAssets: () => number;
  getTotalLiabilities: () => number;
  getNetWorth: () => number;
  takeSnapshot: () => Promise<void>;
  getNetWorthChange: () => { amount: number; percent: number };
}

const NetWorthContext = createContext<NetWorthContextType | undefined>(undefined);

const STORAGE_KEY_ASSETS = '@mohani_assets';
const STORAGE_KEY_LIABILITIES = '@mohani_liabilities';
const STORAGE_KEY_SNAPSHOTS = '@mohani_networth_snapshots';

const ASSET_TYPES: Record<Asset['type'], { icon: string; color: string }> = {
  cash: { icon: '💵', color: '#22C55E' },
  bank: { icon: '🏦', color: '#3B82F6' },
  investment: { icon: '📈', color: '#8B5CF6' },
  property: { icon: '🏠', color: '#F59E0B' },
  vehicle: { icon: '🚗', color: '#EC4899' },
  other: { icon: '💎', color: '#6B7280' },
};

const LIABILITY_TYPES: Record<Liability['type'], { icon: string; color: string }> = {
  mortgage: { icon: '🏠', color: '#EF4444' },
  car_loan: { icon: '🚗', color: '#F97316' },
  credit_card: { icon: '💳', color: '#DC2626' },
  student_loan: { icon: '📚', color: '#7C3AED' },
  personal_loan: { icon: '💰', color: '#EA580C' },
  other: { icon: '📋', color: '#6B7280' },
};

export { ASSET_TYPES, LIABILITY_TYPES };

export const NetWorthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assetsData, liabilitiesData, snapshotsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_ASSETS),
        AsyncStorage.getItem(STORAGE_KEY_LIABILITIES),
        AsyncStorage.getItem(STORAGE_KEY_SNAPSHOTS),
      ]);

      if (assetsData) {
        setAssets(JSON.parse(assetsData).map((a: Asset) => ({
          ...a,
          lastUpdated: new Date(a.lastUpdated),
        })));
      }

      if (liabilitiesData) {
        setLiabilities(JSON.parse(liabilitiesData).map((l: Liability) => ({
          ...l,
          lastUpdated: new Date(l.lastUpdated),
        })));
      }

      if (snapshotsData) {
        setSnapshots(JSON.parse(snapshotsData));
      }
    } catch (error) {
      console.error('Failed to load net worth data:', error);
    }
  };

  const saveAssets = async (newAssets: Asset[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(newAssets));
    } catch (error) {
      console.error('Failed to save assets:', error);
    }
  };

  const saveLiabilities = async (newLiabilities: Liability[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LIABILITIES, JSON.stringify(newLiabilities));
    } catch (error) {
      console.error('Failed to save liabilities:', error);
    }
  };

  const saveSnapshots = async (newSnapshots: NetWorthSnapshot[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(newSnapshots));
    } catch (error) {
      console.error('Failed to save snapshots:', error);
    }
  };

  const addAsset = async (assetData: Omit<Asset, 'id' | 'lastUpdated'>) => {
    const typeInfo = ASSET_TYPES[assetData.type];
    const newAsset: Asset = {
      ...assetData,
      id: generateUniqueId(),
      icon: assetData.icon || typeInfo.icon,
      color: assetData.color || typeInfo.color,
      lastUpdated: new Date(),
    };
    const updated = [...assets, newAsset];
    setAssets(updated);
    await saveAssets(updated);
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    const updated = assets.map((asset) =>
      asset.id === id ? { ...asset, ...updates, lastUpdated: new Date() } : asset
    );
    setAssets(updated);
    await saveAssets(updated);
  };

  const deleteAsset = async (id: string) => {
    const updated = assets.filter((asset) => asset.id !== id);
    setAssets(updated);
    await saveAssets(updated);
  };

  const addLiability = async (liabilityData: Omit<Liability, 'id' | 'lastUpdated'>) => {
    const typeInfo = LIABILITY_TYPES[liabilityData.type];
    const newLiability: Liability = {
      ...liabilityData,
      id: generateUniqueId(),
      icon: liabilityData.icon || typeInfo.icon,
      color: liabilityData.color || typeInfo.color,
      lastUpdated: new Date(),
    };
    const updated = [...liabilities, newLiability];
    setLiabilities(updated);
    await saveLiabilities(updated);
  };

  const updateLiability = async (id: string, updates: Partial<Liability>) => {
    const updated = liabilities.map((liability) =>
      liability.id === id ? { ...liability, ...updates, lastUpdated: new Date() } : liability
    );
    setLiabilities(updated);
    await saveLiabilities(updated);
  };

  const deleteLiability = async (id: string) => {
    const updated = liabilities.filter((liability) => liability.id !== id);
    setLiabilities(updated);
    await saveLiabilities(updated);
  };

  const getTotalAssets = (): number => {
    return assets.reduce((sum, a) => sum + a.value, 0);
  };

  const getTotalLiabilities = (): number => {
    return liabilities.reduce((sum, l) => sum + l.amount, 0);
  };

  const getNetWorth = (): number => {
    return getTotalAssets() - getTotalLiabilities();
  };

  const takeSnapshot = async () => {
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = snapshots.findIndex((s) => s.date === today);

    const newSnapshot: NetWorthSnapshot = {
      date: today,
      totalAssets: getTotalAssets(),
      totalLiabilities: getTotalLiabilities(),
      netWorth: getNetWorth(),
    };

    let updated: NetWorthSnapshot[];
    if (existingIndex >= 0) {
      updated = [...snapshots];
      updated[existingIndex] = newSnapshot;
    } else {
      updated = [...snapshots, newSnapshot].slice(-365); // Keep last year
    }

    setSnapshots(updated);
    await saveSnapshots(updated);
  };

  const getNetWorthChange = (): { amount: number; percent: number } => {
    if (snapshots.length < 2) {
      return { amount: 0, percent: 0 };
    }

    const currentNetWorth = getNetWorth();
    const previousSnapshot = snapshots[snapshots.length - 2];
    const change = currentNetWorth - previousSnapshot.netWorth;
    const percent = previousSnapshot.netWorth !== 0
      ? (change / Math.abs(previousSnapshot.netWorth)) * 100
      : 0;

    return { amount: change, percent };
  };

  return (
    <NetWorthContext.Provider
      value={{
        assets,
        liabilities,
        snapshots,
        addAsset,
        updateAsset,
        deleteAsset,
        addLiability,
        updateLiability,
        deleteLiability,
        getTotalAssets,
        getTotalLiabilities,
        getNetWorth,
        takeSnapshot,
        getNetWorthChange,
      }}
    >
      {children}
    </NetWorthContext.Provider>
  );
};

export const useNetWorth = () => {
  const context = useContext(NetWorthContext);
  if (!context) {
    throw new Error('useNetWorth must be used within a NetWorthProvider');
  }
  return context;
};
