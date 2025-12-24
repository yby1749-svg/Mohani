import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
  usageCount: number;
  createdAt: Date;
}

interface TagsContextType {
  tags: Tag[];
  addTag: (tag: Omit<Tag, 'id' | 'createdAt' | 'usageCount'>) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  incrementUsage: (id: string) => Promise<void>;
  getTagsByIds: (ids: string[]) => Tag[];
  searchTags: (query: string) => Tag[];
  getMostUsedTags: (limit?: number) => Tag[];
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_tags';

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag_1', name: '필수', color: '#EF4444', icon: '⚡', usageCount: 0, createdAt: new Date() },
  { id: 'tag_2', name: '선택', color: '#F59E0B', icon: '💫', usageCount: 0, createdAt: new Date() },
  { id: 'tag_3', name: '절약가능', color: '#22C55E', icon: '🌱', usageCount: 0, createdAt: new Date() },
  { id: 'tag_4', name: '정기', color: '#8B5CF6', icon: '🔄', usageCount: 0, createdAt: new Date() },
  { id: 'tag_5', name: '긴급', color: '#EC4899', icon: '🚨', usageCount: 0, createdAt: new Date() },
  { id: 'tag_6', name: '비즈니스', color: '#3B82F6', icon: '💼', usageCount: 0, createdAt: new Date() },
  { id: 'tag_7', name: '가족', color: '#10B981', icon: '👨‍👩‍👧', usageCount: 0, createdAt: new Date() },
  { id: 'tag_8', name: '개인', color: '#6366F1', icon: '👤', usageCount: 0, createdAt: new Date() },
];

const TAG_COLORS = [
  '#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6',
  '#EC4899', '#10B981', '#6366F1', '#F97316', '#14B8A6',
];

const TAG_ICONS = ['⚡', '💫', '🌱', '🔄', '🚨', '💼', '👨‍👩‍👧', '👤', '🎯', '💎', '🎁', '🏷️'];

export { TAG_COLORS, TAG_ICONS };

export const TagsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTags(parsed.map((t: Tag) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        })));
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const saveTags = async (newTags: Tag[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTags));
    } catch (error) {
      console.error('Failed to save tags:', error);
    }
  };

  const addTag = async (tagData: Omit<Tag, 'id' | 'createdAt' | 'usageCount'>) => {
    const newTag: Tag = {
      ...tagData,
      id: `tag_${Date.now()}`,
      usageCount: 0,
      createdAt: new Date(),
    };
    const updated = [...tags, newTag];
    setTags(updated);
    await saveTags(updated);
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    const updated = tags.map((tag) =>
      tag.id === id ? { ...tag, ...updates } : tag
    );
    setTags(updated);
    await saveTags(updated);
  };

  const deleteTag = async (id: string) => {
    const updated = tags.filter((tag) => tag.id !== id);
    setTags(updated);
    await saveTags(updated);
  };

  const incrementUsage = async (id: string) => {
    const updated = tags.map((tag) =>
      tag.id === id ? { ...tag, usageCount: tag.usageCount + 1 } : tag
    );
    setTags(updated);
    await saveTags(updated);
  };

  const getTagsByIds = (ids: string[]): Tag[] => {
    return tags.filter((tag) => ids.includes(tag.id));
  };

  const searchTags = (query: string): Tag[] => {
    const lowerQuery = query.toLowerCase();
    return tags.filter((tag) => tag.name.toLowerCase().includes(lowerQuery));
  };

  const getMostUsedTags = (limit: number = 5): Tag[] => {
    return [...tags].sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
  };

  return (
    <TagsContext.Provider
      value={{
        tags,
        addTag,
        updateTag,
        deleteTag,
        incrementUsage,
        getTagsByIds,
        searchTags,
        getMostUsedTags,
      }}
    >
      {children}
    </TagsContext.Provider>
  );
};

export const useTags = () => {
  const context = useContext(TagsContext);
  if (!context) {
    throw new Error('useTags must be used within a TagsProvider');
  }
  return context;
};
