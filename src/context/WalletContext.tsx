import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'card' | 'savings' | 'investment' | 'other';
  icon: string;
  color: string;
  balance: number;
  isDefault: boolean;
  isHidden: boolean;
  createdAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  toWalletId?: string; // for transfers
  note: string;
  date: Date;
}

interface WalletContextType {
  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt' | 'isDefault'>) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  setDefaultWallet: (id: string) => Promise<void>;
  updateBalance: (id: string, amount: number, isAddition: boolean) => Promise<void>;
  transfer: (fromId: string, toId: string, amount: number) => Promise<void>;
  getTotalBalance: () => number;
  getDefaultWallet: () => Wallet | undefined;
  getVisibleWallets: () => Wallet[];
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_wallets';

const WALLET_TYPES: Record<Wallet['type'], { icon: string; color: string }> = {
  cash: { icon: '💵', color: '#22C55E' },
  bank: { icon: '🏦', color: '#3B82F6' },
  card: { icon: '💳', color: '#8B5CF6' },
  savings: { icon: '🐷', color: '#EC4899' },
  investment: { icon: '📈', color: '#F59E0B' },
  other: { icon: '💰', color: '#6B7280' },
};

const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'default_cash',
    name: '현금',
    type: 'cash',
    icon: '💵',
    color: '#22C55E',
    balance: 0,
    isDefault: true,
    isHidden: false,
    createdAt: new Date(),
  },
  {
    id: 'default_bank',
    name: '은행 계좌',
    type: 'bank',
    icon: '🏦',
    color: '#3B82F6',
    balance: 0,
    isDefault: false,
    isHidden: false,
    createdAt: new Date(),
  },
  {
    id: 'default_card',
    name: '신용카드',
    type: 'card',
    icon: '💳',
    color: '#8B5CF6',
    balance: 0,
    isDefault: false,
    isHidden: false,
    createdAt: new Date(),
  },
];

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<Wallet[]>(DEFAULT_WALLETS);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWallets(parsed.map((w: Wallet) => ({
          ...w,
          createdAt: new Date(w.createdAt),
        })));
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const saveWallets = async (newWallets: Wallet[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newWallets));
    } catch (error) {
      console.error('Failed to save wallets:', error);
    }
  };

  const addWallet = async (walletData: Omit<Wallet, 'id' | 'createdAt' | 'isDefault'>) => {
    const typeInfo = WALLET_TYPES[walletData.type];
    const newWallet: Wallet = {
      ...walletData,
      id: Date.now().toString(),
      icon: walletData.icon || typeInfo.icon,
      color: walletData.color || typeInfo.color,
      isDefault: false,
      createdAt: new Date(),
    };
    const updated = [...wallets, newWallet];
    setWallets(updated);
    await saveWallets(updated);
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    const updated = wallets.map((wallet) =>
      wallet.id === id ? { ...wallet, ...updates } : wallet
    );
    setWallets(updated);
    await saveWallets(updated);
  };

  const deleteWallet = async (id: string) => {
    const wallet = wallets.find((w) => w.id === id);
    if (wallet?.isDefault) {
      // Set another wallet as default
      const otherWallet = wallets.find((w) => w.id !== id);
      if (otherWallet) {
        await setDefaultWallet(otherWallet.id);
      }
    }
    const updated = wallets.filter((wallet) => wallet.id !== id);
    setWallets(updated);
    await saveWallets(updated);
  };

  const setDefaultWallet = async (id: string) => {
    const updated = wallets.map((wallet) => ({
      ...wallet,
      isDefault: wallet.id === id,
    }));
    setWallets(updated);
    await saveWallets(updated);
  };

  const updateBalance = async (id: string, amount: number, isAddition: boolean) => {
    const updated = wallets.map((wallet) => {
      if (wallet.id === id) {
        return {
          ...wallet,
          balance: isAddition ? wallet.balance + amount : wallet.balance - amount,
        };
      }
      return wallet;
    });
    setWallets(updated);
    await saveWallets(updated);
  };

  const transfer = async (fromId: string, toId: string, amount: number) => {
    const updated = wallets.map((wallet) => {
      if (wallet.id === fromId) {
        return { ...wallet, balance: wallet.balance - amount };
      }
      if (wallet.id === toId) {
        return { ...wallet, balance: wallet.balance + amount };
      }
      return wallet;
    });
    setWallets(updated);
    await saveWallets(updated);
  };

  const getTotalBalance = () => {
    return wallets
      .filter((w) => !w.isHidden)
      .reduce((sum, w) => sum + w.balance, 0);
  };

  const getDefaultWallet = () => {
    return wallets.find((w) => w.isDefault);
  };

  const getVisibleWallets = () => {
    return wallets.filter((w) => !w.isHidden);
  };

  return (
    <WalletContext.Provider
      value={{
        wallets,
        addWallet,
        updateWallet,
        deleteWallet,
        setDefaultWallet,
        updateBalance,
        transfer,
        getTotalBalance,
        getDefaultWallet,
        getVisibleWallets,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallets = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallets must be used within a WalletProvider');
  }
  return context;
};
