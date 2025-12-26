import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUniqueId } from '../utils/generateId';

export interface SplitParticipant {
  id: string;
  name: string;
  share: number; // amount they owe
  isPaid: boolean;
}

export interface SplitExpense {
  id: string;
  title: string;
  totalAmount: number;
  paidBy: string; // person who paid
  participants: SplitParticipant[];
  category: string;
  categoryIcon: string;
  date: Date;
  notes?: string;
  isSettled: boolean;
}

interface SplitExpenseContextType {
  splits: SplitExpense[];
  addSplit: (split: Omit<SplitExpense, 'id' | 'isSettled'>) => Promise<void>;
  updateSplit: (id: string, updates: Partial<SplitExpense>) => Promise<void>;
  deleteSplit: (id: string) => Promise<void>;
  markParticipantPaid: (splitId: string, participantId: string) => Promise<void>;
  settleSplit: (id: string) => Promise<void>;
  getAmountOwedToMe: () => number;
  getAmountIOwe: () => number;
  getUnsettledSplits: () => SplitExpense[];
  getRecentSplits: (count?: number) => SplitExpense[];
}

const SplitExpenseContext = createContext<SplitExpenseContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_split_expenses';

export const SplitExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [splits, setSplits] = useState<SplitExpense[]>([]);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSplits(parsed.map((s: SplitExpense) => ({
          ...s,
          date: new Date(s.date),
        })));
      }
    } catch (error) {
      console.error('Failed to load split expenses:', error);
    }
  };

  const saveSplits = async (newSplits: SplitExpense[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSplits));
    } catch (error) {
      console.error('Failed to save split expenses:', error);
    }
  };

  const addSplit = async (splitData: Omit<SplitExpense, 'id' | 'isSettled'>) => {
    const newSplit: SplitExpense = {
      ...splitData,
      id: generateUniqueId(),
      isSettled: false,
    };
    const updated = [...splits, newSplit];
    setSplits(updated);
    await saveSplits(updated);
  };

  const updateSplit = async (id: string, updates: Partial<SplitExpense>) => {
    const updated = splits.map((split) =>
      split.id === id ? { ...split, ...updates } : split
    );
    setSplits(updated);
    await saveSplits(updated);
  };

  const deleteSplit = async (id: string) => {
    const updated = splits.filter((split) => split.id !== id);
    setSplits(updated);
    await saveSplits(updated);
  };

  const markParticipantPaid = async (splitId: string, participantId: string) => {
    const updated = splits.map((split) => {
      if (split.id === splitId) {
        const updatedParticipants = split.participants.map((p) =>
          p.id === participantId ? { ...p, isPaid: true } : p
        );
        const allPaid = updatedParticipants.every((p) => p.isPaid);
        return {
          ...split,
          participants: updatedParticipants,
          isSettled: allPaid,
        };
      }
      return split;
    });
    setSplits(updated);
    await saveSplits(updated);
  };

  const settleSplit = async (id: string) => {
    const updated = splits.map((split) => {
      if (split.id === id) {
        return {
          ...split,
          participants: split.participants.map((p) => ({ ...p, isPaid: true })),
          isSettled: true,
        };
      }
      return split;
    });
    setSplits(updated);
    await saveSplits(updated);
  };

  const getAmountOwedToMe = () => {
    return splits
      .filter((s) => s.paidBy === '나' && !s.isSettled)
      .reduce((sum, split) => {
        const unpaidAmount = split.participants
          .filter((p) => !p.isPaid && p.name !== '나')
          .reduce((pSum, p) => pSum + p.share, 0);
        return sum + unpaidAmount;
      }, 0);
  };

  const getAmountIOwe = () => {
    return splits
      .filter((s) => s.paidBy !== '나' && !s.isSettled)
      .reduce((sum, split) => {
        const myShare = split.participants.find((p) => p.name === '나' && !p.isPaid);
        return sum + (myShare?.share || 0);
      }, 0);
  };

  const getUnsettledSplits = () => {
    return splits.filter((s) => !s.isSettled);
  };

  const getRecentSplits = (count = 5) => {
    return [...splits]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);
  };

  return (
    <SplitExpenseContext.Provider
      value={{
        splits,
        addSplit,
        updateSplit,
        deleteSplit,
        markParticipantPaid,
        settleSplit,
        getAmountOwedToMe,
        getAmountIOwe,
        getUnsettledSplits,
        getRecentSplits,
      }}
    >
      {children}
    </SplitExpenseContext.Provider>
  );
};

export const useSplitExpenses = () => {
  const context = useContext(SplitExpenseContext);
  if (!context) {
    throw new Error('useSplitExpenses must be used within a SplitExpenseProvider');
  }
  return context;
};
