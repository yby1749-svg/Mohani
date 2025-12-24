import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Priority = 'high' | 'medium' | 'low';

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  estimatedPrice: number;
  isCompleted: boolean;
  actualPrice?: number;
  priority: Priority;
  createdAt: Date;
  completedAt?: Date;
}

interface ShoppingContextType {
  items: ShoppingItem[];
  addItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'isCompleted'>) => void;
  updateItem: (id: string, updates: Partial<ShoppingItem>) => void;
  deleteItem: (id: string) => void;
  toggleComplete: (id: string, actualPrice?: number) => void;
  clearCompleted: () => void;
  getActiveItems: () => ShoppingItem[];
  getCompletedItems: () => ShoppingItem[];
  getTotalEstimated: () => number;
  getTotalActual: () => number;
  getProgress: () => number;
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_shopping';

const CATEGORIES = ['식료품', '생활용품', '의류', '전자기기', '기타'];

export const ShoppingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    saveItems();
  }, [items]);

  const loadItems = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
        }));
        setItems(withDates);
      }
    } catch (error) {
      console.error('Failed to load shopping items:', error);
    }
  };

  const saveItems = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save shopping items:', error);
    }
  };

  const addItem = (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'isCompleted'>) => {
    const newItem: ShoppingItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isCompleted: false,
      priority: item.priority || 'medium',
      createdAt: new Date(),
    };
    setItems((prev) => [newItem, ...prev]);
  };

  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

  const updateItem = (id: string, updates: Partial<ShoppingItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleComplete = (id: string, actualPrice?: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isCompleted = !item.isCompleted;
          return {
            ...item,
            isCompleted,
            actualPrice: isCompleted ? (actualPrice ?? item.estimatedPrice) : undefined,
            completedAt: isCompleted ? new Date() : undefined,
          };
        }
        return item;
      })
    );
  };

  const clearCompleted = () => {
    setItems((prev) => prev.filter((item) => !item.isCompleted));
  };

  const getActiveItems = () =>
    items
      .filter((item) => !item.isCompleted)
      .sort((a, b) => priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium']);
  const getCompletedItems = () => items.filter((item) => item.isCompleted);

  const getTotalEstimated = () =>
    items.filter((i) => !i.isCompleted).reduce((sum, item) => sum + item.estimatedPrice, 0);

  const getTotalActual = () =>
    items.filter((i) => i.isCompleted).reduce((sum, item) => sum + (item.actualPrice || 0), 0);

  const getProgress = () => {
    if (items.length === 0) return 0;
    return Math.round((getCompletedItems().length / items.length) * 100);
  };

  return (
    <ShoppingContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
        toggleComplete,
        clearCompleted,
        getActiveItems,
        getCompletedItems,
        getTotalEstimated,
        getTotalActual,
        getProgress,
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
};

export const useShopping = () => {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error('useShopping must be used within a ShoppingProvider');
  }
  return context;
};
