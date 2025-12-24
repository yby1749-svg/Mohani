import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DiaryEntry {
  id: string;
  date: Date;
  mood: string;
  moodLabel: string;
  content: string;
  tags: string[];
  createdAt: Date;
}

interface DiaryContextType {
  entries: DiaryEntry[];
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, entry: Partial<DiaryEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntryByDate: (date: Date) => DiaryEntry | undefined;
  getTodayEntry: () => DiaryEntry | undefined;
  getEntriesForMonth: (year: number, month: number) => DiaryEntry[];
  getMoodStats: () => { mood: string; count: number }[];
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_diary';

export const DiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    saveEntries();
  }, [entries]);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((e: any) => ({
          ...e,
          date: new Date(e.date),
          createdAt: new Date(e.createdAt),
        }));
        setEntries(withDates);
      }
    } catch (error) {
      console.error('Failed to load diary entries:', error);
    }
  };

  const saveEntries = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save diary entries:', error);
    }
  };

  const addEntry = (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const updateEntry = (id: string, updates: Partial<DiaryEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const getEntryByDate = (date: Date) => {
    return entries.find((e) => {
      const entryDate = new Date(e.date);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getTodayEntry = () => {
    return getEntryByDate(new Date());
  };

  const getEntriesForMonth = (year: number, month: number) => {
    return entries.filter((e) => {
      const entryDate = new Date(e.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });
  };

  const getMoodStats = () => {
    const moodCounts: Record<string, number> = {};
    entries.forEach((e) => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    return Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);
  };

  return (
    <DiaryContext.Provider
      value={{
        entries,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntryByDate,
        getTodayEntry,
        getEntriesForMonth,
        getMoodStats,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = () => {
  const context = useContext(DiaryContext);
  if (!context) {
    throw new Error('useDiary must be used within a DiaryProvider');
  }
  return context;
};
