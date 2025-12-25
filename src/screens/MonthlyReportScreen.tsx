import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useExpenses } from '../context/ExpenseContext';
import { AnimatedBackground, GlassCard } from '../components';

const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

const MonthlyReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { expenses, getCategoryTotals } = useExpenses();
  const viewShotRef = useRef<ViewShot>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get expenses for selected month
  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  // Get previous month expenses for comparison
  const prevMonthExpenses = useMemo(() => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const changePercent = prevMonthTotal > 0
    ? Math.round(((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 100)
    : 0;

  // Category breakdown for selected month
  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, { label: string; icon: string; total: number }> = {};
    monthlyExpenses.forEach((e) => {
      if (!totals[e.category]) {
        totals[e.category] = { label: e.categoryLabel, icon: e.categoryIcon, total: 0 };
      }
      totals[e.category].total += e.amount;
    });
    return Object.entries(totals)
      .map(([category, data]) => ({ category, ...data, percent: Math.round((data.total / monthlyTotal) * 100) || 0 }))
      .sort((a, b) => b.total - a.total);
  }, [monthlyExpenses, monthlyTotal]);

  // Top 5 expenses
  const topExpenses = useMemo(() => {
    return [...monthlyExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [monthlyExpenses]);

  // Daily average
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyAverage = Math.round(monthlyTotal / daysInMonth);

  // Expense count
  const expenseCount = monthlyExpenses.length;

  const navigateMonth = (direction: 'prev' | 'next') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      const now = new Date();
      if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) return;
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const generateHTMLReport = () => {
    const categoryRows = categoryBreakdown
      .map((cat) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <span style="font-size: 20px; margin-right: 8px;">${cat.icon}</span>
            ${cat.label}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
            ₩${cat.total.toLocaleString()}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #666;">
            ${cat.percent}%
          </td>
        </tr>
      `)
      .join('');

    const topExpenseRows = topExpenses
      .map((e, i) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${i + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <span style="font-size: 16px; margin-right: 6px;">${e.categoryIcon}</span>
            ${e.note || e.categoryLabel}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
            ₩${e.amount.toLocaleString()}
          </td>
        </tr>
      `)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>MOHANI 월간 리포트</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 24px;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
              padding-bottom: 24px;
              border-bottom: 2px solid #f0f0f0;
            }
            .logo {
              font-size: 28px;
              font-weight: 700;
              background: linear-gradient(135deg, #7c3aed, #a855f7);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .period {
              font-size: 18px;
              color: #666;
              margin-top: 8px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-bottom: 32px;
            }
            .summary-card {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
            }
            .summary-label {
              font-size: 13px;
              color: #666;
              margin-bottom: 8px;
            }
            .summary-value {
              font-size: 24px;
              font-weight: 700;
              color: #1a1a2e;
            }
            .summary-value.positive { color: #10b981; }
            .summary-value.negative { color: #ef4444; }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #1a1a2e;
              margin: 24px 0 16px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #7c3aed;
              display: inline-block;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .footer {
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 2px solid #f0f0f0;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">MOHANI</div>
              <div class="period">${selectedYear}년 ${MONTHS_KO[selectedMonth]} 지출 리포트</div>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">총 지출</div>
                <div class="summary-value">₩${monthlyTotal.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">전월 대비</div>
                <div class="summary-value ${changePercent > 0 ? 'negative' : 'positive'}">
                  ${changePercent > 0 ? '+' : ''}${changePercent}%
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-label">일 평균</div>
                <div class="summary-value">₩${dailyAverage.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">지출 횟수</div>
                <div class="summary-value">${expenseCount}건</div>
              </div>
            </div>

            <div class="section-title">카테고리별 지출</div>
            <table>
              ${categoryRows || '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">데이터 없음</td></tr>'}
            </table>

            <div class="section-title">TOP 5 지출</div>
            <table>
              ${topExpenseRows || '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">데이터 없음</td></tr>'}
            </table>

            <div class="footer">
              Generated by MOHANI • ${new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const exportAsPDF = async () => {
    try {
      setIsExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const html = generateHTMLReport();
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'MOHANI 월간 리포트 공유',
          UTI: 'com.adobe.pdf',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('알림', 'PDF가 생성되었습니다.');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert('오류', 'PDF 생성에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsImage = async () => {
    try {
      setIsExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'MOHANI 월간 리포트 공유',
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert('알림', '이미지가 생성되었습니다.');
        }
      }
    } catch (error) {
      console.error('Image export error:', error);
      Alert.alert('오류', '이미지 생성에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = ['#7c3aed', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#6366f1', '#64748b', '#78716c'];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>월간 리포트</Text>
            <Text style={styles.headerSubtitle}>Monthly Report</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Month Navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {selectedYear}년 {MONTHS_KO[selectedMonth]}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
            disabled={selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth()}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth()
                ? Colors.textMuted
                : Colors.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 0.9 }}
            style={styles.reportContainer}
          >
            {/* Summary Cards */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryGrid}>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>총 지출</Text>
                <Text style={styles.summaryValue}>₩{monthlyTotal.toLocaleString()}</Text>
              </GlassCard>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>전월 대비</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: changePercent > 0 ? Colors.error : Colors.success }
                ]}>
                  {changePercent > 0 ? '+' : ''}{changePercent}%
                </Text>
              </GlassCard>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>일 평균</Text>
                <Text style={styles.summaryValue}>₩{dailyAverage.toLocaleString()}</Text>
              </GlassCard>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>지출 횟수</Text>
                <Text style={styles.summaryValue}>{expenseCount}건</Text>
              </GlassCard>
            </Animated.View>

            {/* Category Breakdown */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <Text style={styles.sectionTitle}>카테고리별 지출</Text>
              <GlassCard style={styles.categoryCard}>
                {categoryBreakdown.length > 0 ? (
                  categoryBreakdown.map((cat, index) => (
                    <View key={cat.category} style={styles.categoryRow}>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text style={styles.categoryLabel}>{cat.label}</Text>
                      </View>
                      <View style={styles.categoryRight}>
                        <View style={styles.categoryBarContainer}>
                          <View
                            style={[
                              styles.categoryBar,
                              { width: `${cat.percent}%`, backgroundColor: getCategoryColor(index) }
                            ]}
                          />
                        </View>
                        <Text style={styles.categoryAmount}>₩{cat.total.toLocaleString()}</Text>
                        <Text style={styles.categoryPercent}>{cat.percent}%</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>이 달의 지출 내역이 없습니다</Text>
                )}
              </GlassCard>
            </Animated.View>

            {/* Top 5 Expenses */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <Text style={styles.sectionTitle}>TOP 5 지출</Text>
              <GlassCard style={styles.topExpensesCard}>
                {topExpenses.length > 0 ? (
                  topExpenses.map((expense, index) => (
                    <View key={expense.id} style={styles.topExpenseRow}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.topExpenseIcon}>{expense.categoryIcon}</Text>
                      <View style={styles.topExpenseInfo}>
                        <Text style={styles.topExpenseNote} numberOfLines={1}>
                          {expense.note || expense.categoryLabel}
                        </Text>
                        <Text style={styles.topExpenseDate}>
                          {new Date(expense.date).getDate()}일
                        </Text>
                      </View>
                      <Text style={styles.topExpenseAmount}>
                        ₩{expense.amount.toLocaleString()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>이 달의 지출 내역이 없습니다</Text>
                )}
              </GlassCard>
            </Animated.View>

            {/* Watermark for image export */}
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>MOHANI • {new Date().toLocaleDateString('ko-KR')}</Text>
            </View>
          </ViewShot>

          {/* Export Buttons */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.exportButtons}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportAsPDF}
              disabled={isExporting}
            >
              <LinearGradient
                colors={Gradients.primary as [string, string]}
                style={styles.exportButtonGradient}
              >
                {isExporting ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <>
                    <Ionicons name="document-text" size={24} color={Colors.text} />
                    <Text style={styles.exportButtonText}>PDF로 내보내기</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportAsImage}
              disabled={isExporting}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.exportButtonGradient}
              >
                {isExporting ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <>
                    <Ionicons name="image" size={24} color={Colors.text} />
                    <Text style={styles.exportButtonText}>이미지로 저장</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  reportContainer: {
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgPrimary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    marginBottom: Spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: 80,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  categoryRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.md,
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    width: 80,
    textAlign: 'right',
  },
  categoryPercent: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    width: 35,
    textAlign: 'right',
  },
  topExpensesCard: {
    marginBottom: Spacing.lg,
  },
  topExpenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rankText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.purpleLight,
  },
  topExpenseIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  topExpenseInfo: {
    flex: 1,
  },
  topExpenseNote: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  topExpenseDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  topExpenseAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  watermark: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  watermarkText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    paddingVertical: Spacing.lg,
  },
  exportButtons: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  exportButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  exportButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default MonthlyReportScreen;
