import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys used by the app
const STORAGE_KEYS = {
  expenses: '@mohani_expenses',
  friends: '@mohani_friends',
  goals: '@mohani_goals',
  budgets: '@mohani_budgets',
  templates: '@mohani_quick_templates',
  achievements: '@mohani_achievements',
  settings: '@mohani_settings',
};

export interface BackupData {
  version: string;
  createdAt: string;
  data: {
    expenses: any[];
    friends: any[];
    goals: any[];
    budgets: any[];
    templates: any[];
    achievements: any[];
    settings: any;
  };
  stats: {
    expenseCount: number;
    friendCount: number;
    goalCount: number;
    totalAmount: number;
  };
}

export interface BackupResult {
  success: boolean;
  message: string;
  filePath?: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  stats?: {
    expensesRestored: number;
    friendsRestored: number;
    goalsRestored: number;
  };
}

/**
 * Creates a backup of all app data
 */
export async function createBackup(): Promise<BackupResult> {
  try {
    // Gather all data from AsyncStorage
    const expenses = await AsyncStorage.getItem(STORAGE_KEYS.expenses);
    const friends = await AsyncStorage.getItem(STORAGE_KEYS.friends);
    const goals = await AsyncStorage.getItem(STORAGE_KEYS.goals);
    const budgets = await AsyncStorage.getItem(STORAGE_KEYS.budgets);
    const templates = await AsyncStorage.getItem(STORAGE_KEYS.templates);
    const achievements = await AsyncStorage.getItem(STORAGE_KEYS.achievements);
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.settings);

    const expenseData = expenses ? JSON.parse(expenses) : [];
    const friendData = friends ? JSON.parse(friends) : [];
    const goalData = goals ? JSON.parse(goals) : [];

    // Calculate total amount
    const totalAmount = expenseData.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const backupData: BackupData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      data: {
        expenses: expenseData,
        friends: friendData,
        goals: goalData,
        budgets: budgets ? JSON.parse(budgets) : [],
        templates: templates ? JSON.parse(templates) : [],
        achievements: achievements ? JSON.parse(achievements) : [],
        settings: settings ? JSON.parse(settings) : null,
      },
      stats: {
        expenseCount: expenseData.length,
        friendCount: friendData.length,
        goalCount: goalData.length,
        totalAmount,
      },
    };

    // Generate filename with date
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const fileName = `mohani_backup_${dateStr}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // Write backup file
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData, null, 2));

    // Share the file
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'MOHANI 백업 저장',
        UTI: 'public.json',
      });
    }

    // Save last backup time
    await AsyncStorage.setItem('@mohani_last_backup', new Date().toISOString());

    return {
      success: true,
      message: '백업이 성공적으로 생성되었습니다.',
      filePath,
    };
  } catch (error) {
    console.error('Backup failed:', error);
    return {
      success: false,
      message: `백업 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * Restores data from a backup file
 */
export async function restoreFromBackup(): Promise<RestoreResult> {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        message: '파일 선택이 취소되었습니다.',
      };
    }

    const file = result.assets[0];

    // Read the file
    const content = await FileSystem.readAsStringAsync(file.uri);
    const backupData: BackupData = JSON.parse(content);

    // Validate backup format
    if (!backupData.version || !backupData.data) {
      return {
        success: false,
        message: '유효하지 않은 백업 파일입니다.',
      };
    }

    // Restore data to AsyncStorage
    if (backupData.data.expenses && backupData.data.expenses.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(backupData.data.expenses));
    }

    if (backupData.data.friends && backupData.data.friends.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.friends, JSON.stringify(backupData.data.friends));
    }

    if (backupData.data.goals && backupData.data.goals.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(backupData.data.goals));
    }

    if (backupData.data.budgets && backupData.data.budgets.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(backupData.data.budgets));
    }

    if (backupData.data.templates && backupData.data.templates.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(backupData.data.templates));
    }

    if (backupData.data.achievements && backupData.data.achievements.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify(backupData.data.achievements));
    }

    if (backupData.data.settings) {
      await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(backupData.data.settings));
    }

    // Save restore time
    await AsyncStorage.setItem('@mohani_last_restore', new Date().toISOString());

    return {
      success: true,
      message: '데이터가 성공적으로 복원되었습니다. 앱을 다시 시작해주세요.',
      stats: {
        expensesRestored: backupData.data.expenses?.length || 0,
        friendsRestored: backupData.data.friends?.length || 0,
        goalsRestored: backupData.data.goals?.length || 0,
      },
    };
  } catch (error) {
    console.error('Restore failed:', error);
    return {
      success: false,
      message: `복원 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * Get the last backup timestamp
 */
export async function getLastBackupTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('@mohani_last_backup');
  } catch {
    return null;
  }
}

/**
 * Get current data stats
 */
export async function getDataStats(): Promise<{
  expenseCount: number;
  friendCount: number;
  goalCount: number;
  totalAmount: number;
}> {
  try {
    const expenses = await AsyncStorage.getItem(STORAGE_KEYS.expenses);
    const friends = await AsyncStorage.getItem(STORAGE_KEYS.friends);
    const goals = await AsyncStorage.getItem(STORAGE_KEYS.goals);

    const expenseData = expenses ? JSON.parse(expenses) : [];
    const friendData = friends ? JSON.parse(friends) : [];
    const goalData = goals ? JSON.parse(goals) : [];

    const totalAmount = expenseData.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    return {
      expenseCount: expenseData.length,
      friendCount: friendData.length,
      goalCount: goalData.length,
      totalAmount,
    };
  } catch {
    return {
      expenseCount: 0,
      friendCount: 0,
      goalCount: 0,
      totalAmount: 0,
    };
  }
}

/**
 * Clear all app data
 */
export async function clearAllData(): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch {
    return false;
  }
}
