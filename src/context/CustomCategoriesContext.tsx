import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomCategory {
  id: string;
  key: string;
  label: string;
  icon: string;
  color: string;
  isDefault: boolean;
  order: number;
  isHidden: boolean;
  createdAt: Date;
}

interface CustomCategoriesContextType {
  categories: CustomCategory[];
  addCategory: (category: Omit<CustomCategory, 'id' | 'createdAt' | 'isDefault' | 'order'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<CustomCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
  toggleHidden: (id: string) => Promise<void>;
  getVisibleCategories: () => CustomCategory[];
  getCategoryByKey: (key: string) => CustomCategory | undefined;
}

const CustomCategoriesContext = createContext<CustomCategoriesContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_custom_categories';

const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'cat_food', key: 'food', label: '식비', icon: '🍚', color: '#F97316', isDefault: true, order: 0, isHidden: false, createdAt: new Date() },
  { id: 'cat_transport', key: 'transport', label: '교통', icon: '🚌', color: '#3B82F6', isDefault: true, order: 1, isHidden: false, createdAt: new Date() },
  { id: 'cat_shopping', key: 'shopping', label: '쇼핑', icon: '🛍️', color: '#EC4899', isDefault: true, order: 2, isHidden: false, createdAt: new Date() },
  { id: 'cat_entertainment', key: 'entertainment', label: '여가', icon: '🎮', color: '#8B5CF6', isDefault: true, order: 3, isHidden: false, createdAt: new Date() },
  { id: 'cat_cafe', key: 'cafe', label: '카페', icon: '☕', color: '#92400E', isDefault: true, order: 4, isHidden: false, createdAt: new Date() },
  { id: 'cat_health', key: 'health', label: '건강', icon: '💊', color: '#10B981', isDefault: true, order: 5, isHidden: false, createdAt: new Date() },
  { id: 'cat_bills', key: 'bills', label: '공과금', icon: '📄', color: '#6366F1', isDefault: true, order: 6, isHidden: false, createdAt: new Date() },
  { id: 'cat_education', key: 'education', label: '교육', icon: '📚', color: '#14B8A6', isDefault: true, order: 7, isHidden: false, createdAt: new Date() },
  { id: 'cat_beauty', key: 'beauty', label: '미용', icon: '💄', color: '#F472B6', isDefault: true, order: 8, isHidden: false, createdAt: new Date() },
  { id: 'cat_pet', key: 'pet', label: '반려동물', icon: '🐾', color: '#A78BFA', isDefault: true, order: 9, isHidden: false, createdAt: new Date() },
  { id: 'cat_gift', key: 'gift', label: '선물', icon: '🎁', color: '#FB7185', isDefault: true, order: 10, isHidden: false, createdAt: new Date() },
  { id: 'cat_other', key: 'other', label: '기타', icon: '📦', color: '#6B7280', isDefault: true, order: 11, isHidden: false, createdAt: new Date() },
];

const CATEGORY_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#6B7280', '#78716C',
];

const CATEGORY_ICONS = [
  '🍚', '🍜', '🍕', '🍔', '🥗', '🍱', '🥐', '🍦',
  '🚌', '🚗', '🚕', '🚆', '✈️', '🚲',
  '🛍️', '👕', '👟', '💻', '📱', '🎧',
  '🎮', '🎬', '🎵', '📚', '🎨', '⚽',
  '☕', '🍺', '🍷', '🧋',
  '💊', '🏥', '💪', '🧘',
  '📄', '🏠', '💡', '📞',
  '💄', '💅', '✂️',
  '🐾', '🐶', '🐱',
  '🎁', '💐', '💍',
  '✈️', '🏨', '🗺️',
  '📦', '🔧', '🛠️',
];

export { CATEGORY_COLORS, CATEGORY_ICONS };

export const CustomCategoriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCategories(parsed.map((c: CustomCategory) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })));
      }
    } catch (error) {
      console.error('Failed to load custom categories:', error);
    }
  };

  const saveCategories = async (newCategories: CustomCategory[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
    } catch (error) {
      console.error('Failed to save custom categories:', error);
    }
  };

  const addCategory = async (categoryData: Omit<CustomCategory, 'id' | 'createdAt' | 'isDefault' | 'order'>) => {
    const maxOrder = Math.max(...categories.map((c) => c.order), -1);
    const newCategory: CustomCategory = {
      ...categoryData,
      id: `cat_${Date.now()}`,
      isDefault: false,
      order: maxOrder + 1,
      createdAt: new Date(),
    };
    const updated = [...categories, newCategory];
    setCategories(updated);
    await saveCategories(updated);
  };

  const updateCategory = async (id: string, updates: Partial<CustomCategory>) => {
    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, ...updates } : cat
    );
    setCategories(updated);
    await saveCategories(updated);
  };

  const deleteCategory = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category?.isDefault) {
      console.warn('Cannot delete default category');
      return;
    }
    const updated = categories.filter((cat) => cat.id !== id);
    setCategories(updated);
    await saveCategories(updated);
  };

  const reorderCategories = async (orderedIds: string[]) => {
    const updated = categories.map((cat) => ({
      ...cat,
      order: orderedIds.indexOf(cat.id),
    }));
    setCategories(updated.sort((a, b) => a.order - b.order));
    await saveCategories(updated);
  };

  const toggleHidden = async (id: string) => {
    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, isHidden: !cat.isHidden } : cat
    );
    setCategories(updated);
    await saveCategories(updated);
  };

  const getVisibleCategories = (): CustomCategory[] => {
    return categories.filter((c) => !c.isHidden).sort((a, b) => a.order - b.order);
  };

  const getCategoryByKey = (key: string): CustomCategory | undefined => {
    return categories.find((c) => c.key === key);
  };

  return (
    <CustomCategoriesContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        toggleHidden,
        getVisibleCategories,
        getCategoryByKey,
      }}
    >
      {children}
    </CustomCategoriesContext.Provider>
  );
};

export const useCustomCategories = () => {
  const context = useContext(CustomCategoriesContext);
  if (!context) {
    throw new Error('useCustomCategories must be used within a CustomCategoriesProvider');
  }
  return context;
};
