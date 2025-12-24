import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  usageCount: number;
  createdAt: Date;
  lastUsedAt?: Date;
}

interface ExpenseTemplateContextType {
  templates: ExpenseTemplate[];
  addTemplate: (template: Omit<ExpenseTemplate, 'id' | 'usageCount' | 'createdAt'>) => void;
  deleteTemplate: (id: string) => void;
  useTemplate: (id: string) => ExpenseTemplate | undefined;
  getFrequentTemplates: (limit?: number) => ExpenseTemplate[];
}

const ExpenseTemplateContext = createContext<ExpenseTemplateContextType | undefined>(undefined);

const STORAGE_KEY = '@mohani_expense_templates';

export const ExpenseTemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (templates.length > 0) {
      saveTemplates();
    }
  }, [templates]);

  const loadTemplates = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          lastUsedAt: t.lastUsedAt ? new Date(t.lastUsedAt) : undefined,
        }));
        setTemplates(withDates);
      }
    } catch (error) {
      console.error('Failed to load expense templates:', error);
    }
  };

  const saveTemplates = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save expense templates:', error);
    }
  };

  const addTemplate = (template: Omit<ExpenseTemplate, 'id' | 'usageCount' | 'createdAt'>) => {
    const newTemplate: ExpenseTemplate = {
      ...template,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      usageCount: 0,
      createdAt: new Date(),
    };
    setTemplates((prev) => [newTemplate, ...prev]);
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const useTemplate = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, usageCount: t.usageCount + 1, lastUsedAt: new Date() }
            : t
        )
      );
    }
    return template;
  };

  const getFrequentTemplates = (limit = 5) => {
    return [...templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  };

  return (
    <ExpenseTemplateContext.Provider
      value={{
        templates,
        addTemplate,
        deleteTemplate,
        useTemplate,
        getFrequentTemplates,
      }}
    >
      {children}
    </ExpenseTemplateContext.Provider>
  );
};

export const useExpenseTemplates = () => {
  const context = useContext(ExpenseTemplateContext);
  if (!context) {
    throw new Error('useExpenseTemplates must be used within an ExpenseTemplateProvider');
  }
  return context;
};
