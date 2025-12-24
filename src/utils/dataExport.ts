import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Expense } from '../context/ExpenseContext';
import { DiaryEntry } from '../context/DiaryContext';
import { ShoppingItem } from '../context/ShoppingContext';
import { RecurringExpense } from '../context/RecurringExpenseContext';
import { Income } from '../context/IncomeContext';

export interface ExportData {
  expenses: Expense[];
  diaryEntries: DiaryEntry[];
  shoppingItems: ShoppingItem[];
  recurringExpenses: RecurringExpense[];
  incomes?: Income[];
  exportDate: string;
}

// Convert expenses to CSV format
export const expensesToCSV = (expenses: Expense[]): string => {
  const headers = ['날짜', '카테고리', '금액', '메모'];
  const rows = expenses.map((e) => {
    const date = new Date(e.date);
    return [
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      e.categoryLabel,
      e.amount.toString(),
      `"${e.note.replace(/"/g, '""')}"`,
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};

// Convert diary entries to CSV format
export const diaryToCSV = (entries: DiaryEntry[]): string => {
  const headers = ['날짜', '기분', '내용', '태그'];
  const moodLabels: Record<string, string> = {
    great: '최고',
    good: '좋음',
    okay: '보통',
    bad: '별로',
    awful: '최악',
  };
  const rows = entries.map((e) => {
    const date = new Date(e.date);
    return [
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      moodLabels[e.mood] || e.mood,
      `"${e.content.replace(/"/g, '""')}"`,
      `"${e.tags.join(', ')}"`,
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};

// Export all data as JSON
export const exportAllDataAsJSON = async (data: ExportData): Promise<void> => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `mohani_backup_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'MOHANI 데이터 내보내기',
      });
    }
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
};

// Export expenses as CSV
export const exportExpensesAsCSV = async (expenses: Expense[]): Promise<void> => {
  try {
    const csvString = expensesToCSV(expenses);
    const fileName = `mohani_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: '지출 내역 내보내기',
      });
    }
  } catch (error) {
    console.error('Failed to export expenses:', error);
    throw error;
  }
};

// Export diary as CSV
export const exportDiaryAsCSV = async (entries: DiaryEntry[]): Promise<void> => {
  try {
    const csvString = diaryToCSV(entries);
    const fileName = `mohani_diary_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: '일기 내보내기',
      });
    }
  } catch (error) {
    console.error('Failed to export diary:', error);
    throw error;
  }
};

// Convert incomes to CSV format
export const incomesToCSV = (incomes: Income[]): string => {
  const headers = ['날짜', '유형', '금액', '메모', '반복여부'];
  const rows = incomes.map((i) => {
    const date = new Date(i.date);
    return [
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      i.source,
      i.amount.toString(),
      `"${(i.note || '').replace(/"/g, '""')}"`,
      i.isRecurring ? '예' : '아니오',
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};

// Export incomes as CSV
export const exportIncomesAsCSV = async (incomes: Income[]): Promise<void> => {
  try {
    const csvString = incomesToCSV(incomes);
    const fileName = `mohani_incomes_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: '수입 내역 내보내기',
      });
    }
  } catch (error) {
    console.error('Failed to export incomes:', error);
    throw error;
  }
};

// Export complete financial report
export const exportFinancialReportAsCSV = async (
  expenses: Expense[],
  incomes: Income[]
): Promise<void> => {
  try {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);

    let csvContent = '=== MOHANI 재정 리포트 ===\n\n';
    csvContent += '=== 요약 ===\n';
    csvContent += `총 수입,₩${totalIncomes.toLocaleString()}\n`;
    csvContent += `총 지출,₩${totalExpenses.toLocaleString()}\n`;
    csvContent += `순 잔액,₩${(totalIncomes - totalExpenses).toLocaleString()}\n\n`;

    csvContent += '=== 수입 내역 ===\n';
    csvContent += incomesToCSV(incomes);
    csvContent += '\n\n';

    csvContent += '=== 지출 내역 ===\n';
    csvContent += expensesToCSV(expenses);

    const fileName = `mohani_financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: '재정 리포트 내보내기',
      });
    }
  } catch (error) {
    console.error('Failed to export financial report:', error);
    throw error;
  }
};

// Generate summary report
export const generateMonthlyReport = (expenses: Expense[], diaryEntries: DiaryEntry[]): string => {
  const today = new Date();
  const monthExpenses = expenses.filter((e) => {
    const date = new Date(e.date);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  });

  const monthDiaries = diaryEntries.filter((e) => {
    const date = new Date(e.date);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    categoryTotals[e.categoryLabel] = (categoryTotals[e.categoryLabel] || 0) + e.amount;
  });

  const moodCounts: Record<string, number> = {};
  monthDiaries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  let report = `MOHANI 월간 리포트\n`;
  report += `${today.getFullYear()}년 ${today.getMonth() + 1}월\n`;
  report += `${'='.repeat(30)}\n\n`;

  report += `총 지출: ₩${totalSpent.toLocaleString()}\n`;
  report += `지출 건수: ${monthExpenses.length}건\n\n`;

  report += `카테고리별 지출:\n`;
  Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amount]) => {
      report += `  ${cat}: ₩${amount.toLocaleString()}\n`;
    });

  report += `\n일기 작성: ${monthDiaries.length}일\n`;
  if (Object.keys(moodCounts).length > 0) {
    report += `기분 분포:\n`;
    const moodLabels: Record<string, string> = {
      great: '최고',
      good: '좋음',
      okay: '보통',
      bad: '별로',
      awful: '최악',
    };
    Object.entries(moodCounts).forEach(([mood, count]) => {
      report += `  ${moodLabels[mood] || mood}: ${count}일\n`;
    });
  }

  return report;
};
