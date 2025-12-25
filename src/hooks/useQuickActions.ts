import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

let QuickActions: any = null;
try {
  QuickActions = require('expo-quick-actions');
} catch (e) {
  // expo-quick-actions not available
}

export type QuickActionType = 'add_expense' | 'view_today';

interface QuickActionCallbacks {
  onAddExpense?: () => void;
  onViewToday?: () => void;
}

/**
 * Hook to set up and handle quick actions (3D Touch / long-press shortcuts)
 */
export function useQuickActions(callbacks: QuickActionCallbacks = {}) {
  // Set up dynamic quick actions on mount
  useEffect(() => {
    if (QuickActions) {
      setupQuickActions();
    }
  }, []);

  // Listen for quick action events
  useEffect(() => {
    if (!QuickActions) return;

    try {
      const subscription = QuickActions.addListener((action: any) => {
        handleQuickAction(action.id as QuickActionType);
      });

      // Check if app was launched from a quick action
      if (QuickActions.initial) {
        handleQuickAction(QuickActions.initial.id as QuickActionType);
      }

      return () => {
        subscription?.remove();
      };
    } catch (e) {
      // Quick actions not supported
    }
  }, [callbacks]);

  const handleQuickAction = useCallback((actionType: QuickActionType) => {
    switch (actionType) {
      case 'add_expense':
        callbacks.onAddExpense?.();
        break;
      case 'view_today':
        callbacks.onViewToday?.();
        break;
    }
  }, [callbacks]);

  return { handleQuickAction };
}

/**
 * Set up quick actions programmatically
 * This allows for dynamic updates based on app state
 */
export async function setupQuickActions() {
  if (!QuickActions) return;
  try {
    await QuickActions.setItems([
      {
        id: 'add_expense',
        title: '지출 추가',
        subtitle: '새 지출 기록하기',
        icon: Platform.select({
          ios: 'symbol:plus.circle.fill',
          android: 'add_icon',
        }),
      },
      {
        id: 'view_today',
        title: '오늘 지출',
        subtitle: '오늘 지출 현황 보기',
        icon: Platform.select({
          ios: 'symbol:calendar',
          android: 'shortcut_today',
        }),
      },
    ]);
  } catch (error) {
    console.log('Quick actions setup error:', error);
  }
}

/**
 * Update quick action with today's spending info
 */
export async function updateTodayQuickAction(todayTotal: number) {
  if (!QuickActions) return;
  try {
    const formattedAmount = todayTotal >= 10000
      ? `${Math.round(todayTotal / 10000)}만원`
      : `${todayTotal.toLocaleString()}원`;

    await QuickActions.setItems([
      {
        id: 'add_expense',
        title: '지출 추가',
        subtitle: '새 지출 기록하기',
        icon: Platform.select({
          ios: 'symbol:plus.circle.fill',
          android: 'add_icon',
        }),
      },
      {
        id: 'view_today',
        title: '오늘 지출',
        subtitle: `현재 ${formattedAmount} 사용`,
        icon: Platform.select({
          ios: 'symbol:calendar',
          android: 'shortcut_today',
        }),
      },
    ]);
  } catch (error) {
    console.log('Quick actions update error:', error);
  }
}
