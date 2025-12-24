import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';

interface Expense {
  id: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  note: string;
  date: Date;
}

interface Income {
  id: string;
  amount: number;
  type: string;
  typeLabel: string;
  note: string;
  date: Date;
}

interface DataExportProps {
  visible: boolean;
  onClose: () => void;
  expenses: Expense[];
  incomes: Income[];
  monthlyBudget: number;
}

type ExportPeriod = 'week' | 'month' | '3months' | 'year' | 'all';
type ExportFormat = 'csv' | 'json';

const PERIODS: { key: ExportPeriod; label: string }[] = [
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: '3months', label: '3개월' },
  { key: 'year', label: '올해' },
  { key: 'all', label: '전체' },
];

export const DataExport: React.FC<DataExportProps> = ({
  visible,
  onClose,
  expenses,
  incomes,
  monthlyBudget,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('month');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const filterByPeriod = <T extends { date: Date }>(data: T[], period: ExportPeriod): T[] => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        return data;
    }

    return data.filter((item) => new Date(item.date) >= startDate);
  };

  const generateCSV = (filteredExpenses: Expense[], filteredIncomes: Income[]): string => {
    let csv = '';

    // Expenses section
    csv += '=== 지출 내역 ===\n';
    csv += '날짜,카테고리,금액,메모\n';
    filteredExpenses.forEach((exp) => {
      const date = new Date(exp.date).toLocaleDateString('ko-KR');
      const note = exp.note.replace(/,/g, ';').replace(/\n/g, ' ');
      csv += `${date},${exp.categoryLabel},${exp.amount},${note}\n`;
    });

    csv += '\n';

    // Income section
    csv += '=== 수입 내역 ===\n';
    csv += '날짜,유형,금액,메모\n';
    filteredIncomes.forEach((inc) => {
      const date = new Date(inc.date).toLocaleDateString('ko-KR');
      const note = (inc.note || '').replace(/,/g, ';').replace(/\n/g, ' ');
      csv += `${date},${inc.typeLabel},${inc.amount},${note}\n`;
    });

    csv += '\n';

    // Summary section
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncomes = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const balance = totalIncomes - totalExpenses;

    csv += '=== 요약 ===\n';
    csv += `총 지출,${totalExpenses}\n`;
    csv += `총 수입,${totalIncomes}\n`;
    csv += `잔액,${balance}\n`;
    csv += `월 예산,${monthlyBudget}\n`;

    // Category breakdown
    csv += '\n=== 카테고리별 지출 ===\n';
    csv += '카테고리,금액,비율\n';
    const categoryTotals = new Map<string, { label: string; total: number }>();
    filteredExpenses.forEach((exp) => {
      const existing = categoryTotals.get(exp.category);
      if (existing) {
        existing.total += exp.amount;
      } else {
        categoryTotals.set(exp.category, { label: exp.categoryLabel, total: exp.amount });
      }
    });
    categoryTotals.forEach((data) => {
      const percent = totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 100) : 0;
      csv += `${data.label},${data.total},${percent}%\n`;
    });

    return csv;
  };

  const generateJSON = (filteredExpenses: Expense[], filteredIncomes: Income[]): string => {
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncomes = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);

    const data = {
      exportDate: new Date().toISOString(),
      period: selectedPeriod,
      summary: {
        totalExpenses,
        totalIncomes,
        balance: totalIncomes - totalExpenses,
        monthlyBudget,
        expenseCount: filteredExpenses.length,
        incomeCount: filteredIncomes.length,
      },
      expenses: filteredExpenses.map((e) => ({
        date: new Date(e.date).toISOString(),
        category: e.categoryLabel,
        amount: e.amount,
        note: e.note,
      })),
      incomes: filteredIncomes.map((i) => ({
        date: new Date(i.date).toISOString(),
        type: i.typeLabel,
        amount: i.amount,
        note: i.note,
      })),
    };

    return JSON.stringify(data, null, 2);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const filteredExpenses = filterByPeriod(expenses, selectedPeriod);
      const filteredIncomes = filterByPeriod(incomes, selectedPeriod);

      let content: string;
      let filename: string;
      let mimeType: string;

      if (selectedFormat === 'csv') {
        content = generateCSV(filteredExpenses, filteredIncomes);
        filename = `mohani_export_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        content = generateJSON(filteredExpenses, filteredIncomes);
        filename = `mohani_export_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: '데이터 내보내기',
        });
      } else {
        // Fallback to Share API
        await Share.share({
          message: content,
          title: filename,
        });
      }

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('오류', '데이터 내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const getPreviewStats = () => {
    const filteredExpenses = filterByPeriod(expenses, selectedPeriod);
    const filteredIncomes = filterByPeriod(incomes, selectedPeriod);
    return {
      expenseCount: filteredExpenses.length,
      incomeCount: filteredIncomes.length,
      totalExpense: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalIncome: filteredIncomes.reduce((sum, i) => sum + i.amount, 0),
    };
  };

  const stats = getPreviewStats();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>데이터 내보내기</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Period Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>기간 선택</Text>
            <View style={styles.periodGrid}>
              {PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodBtn,
                    selectedPeriod === period.key && styles.periodBtnActive,
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                >
                  <Text style={[
                    styles.periodText,
                    selectedPeriod === period.key && styles.periodTextActive,
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Format Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>형식 선택</Text>
            <View style={styles.formatGrid}>
              <TouchableOpacity
                style={[
                  styles.formatBtn,
                  selectedFormat === 'csv' && styles.formatBtnActive,
                ]}
                onPress={() => setSelectedFormat('csv')}
              >
                <Text style={styles.formatIcon}>📊</Text>
                <Text style={[
                  styles.formatText,
                  selectedFormat === 'csv' && styles.formatTextActive,
                ]}>
                  CSV
                </Text>
                <Text style={styles.formatDesc}>엑셀 호환</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.formatBtn,
                  selectedFormat === 'json' && styles.formatBtnActive,
                ]}
                onPress={() => setSelectedFormat('json')}
              >
                <Text style={styles.formatIcon}>📁</Text>
                <Text style={[
                  styles.formatText,
                  selectedFormat === 'json' && styles.formatTextActive,
                ]}>
                  JSON
                </Text>
                <Text style={styles.formatDesc}>데이터 백업</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preview Stats */}
          <View style={styles.previewSection}>
            <Text style={styles.sectionLabel}>내보낼 데이터</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.expenseCount}</Text>
                <Text style={styles.statLabel}>지출 건수</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.incomeCount}</Text>
                <Text style={styles.statLabel}>수입 건수</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  ₩{(stats.totalExpense / 10000).toFixed(1)}만
                </Text>
                <Text style={styles.statLabel}>총 지출</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#22C55E' }]}>
                  ₩{(stats.totalIncome / 10000).toFixed(1)}만
                </Text>
                <Text style={styles.statLabel}>총 수입</Text>
              </View>
            </View>
          </View>

          {/* Export Button */}
          <TouchableOpacity
            style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
            onPress={handleExport}
            disabled={isExporting}
          >
            <LinearGradient
              colors={['#7c3aed', '#6d28d9']}
              style={styles.exportBtnGradient}
            >
              <Ionicons
                name={isExporting ? 'hourglass' : 'share-outline'}
                size={20}
                color={Colors.textPrimary}
              />
              <Text style={styles.exportBtnText}>
                {isExporting ? '내보내는 중...' : '내보내기'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  periodBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodBtnActive: {
    borderColor: Colors.purpleLight,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  periodText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  periodTextActive: {
    color: Colors.purpleLight,
    fontWeight: '500',
  },
  formatGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formatBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  formatBtnActive: {
    borderColor: Colors.purpleLight,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  formatIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  formatText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  formatTextActive: {
    color: Colors.purpleLight,
  },
  formatDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  previewSection: {
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  exportBtn: {},
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  exportBtnText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
