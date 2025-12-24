import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useNavigation } from '@react-navigation/native';
import { Header, GlassCard, AnimatedBackground } from '../components';
import { useSettings } from '../context/SettingsContext';
import { useRecurringExpenses } from '../context/RecurringExpenseContext';
import { useExpenses } from '../context/ExpenseContext';
import { useDiary } from '../context/DiaryContext';
import { useShopping } from '../context/ShoppingContext';
import { useIncome } from '../context/IncomeContext';
import { exportAllDataAsJSON, exportExpensesAsCSV, exportIncomesAsCSV, exportFinancialReportAsCSV } from '../utils/dataExport';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
  Shadows,
} from '../constants/theme';

type SettingItemProps = {
  icon: string;
  label: string;
  value?: string;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
};

const SettingItem = ({
  icon,
  label,
  value,
  isToggle,
  toggleValue,
  onToggle,
  onPress,
}: SettingItemProps) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    activeOpacity={isToggle ? 1 : 0.7}
  >
    <Text style={styles.settingIcon}>{icon}</Text>
    <Text style={styles.settingLabel}>{label}</Text>
    {isToggle ? (
      <Switch
        value={toggleValue}
        onValueChange={(val) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle?.(val);
        }}
        trackColor={{ false: Colors.border, true: Colors.purplePrimary }}
        thumbColor={Colors.textPrimary}
      />
    ) : value ? (
      <Text style={styles.settingValue}>{value}</Text>
    ) : (
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    )}
  </TouchableOpacity>
);

const PROFILE_EMOJIS = ['😊', '😎', '🤗', '🥳', '🤓', '😇', '🦊', '🐱', '🐶', '🦄', '🌟', '💜'];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { getTotalMonthly, recurringExpenses } = useRecurringExpenses();
  const { expenses } = useExpenses();
  const { entries: diaryEntries } = useDiary();
  const { items: shoppingItems } = useShopping();
  const { incomes } = useIncome();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fixedExpensesTotal = getTotalMonthly();

  const handleExportData = async () => {
    if (isExporting) return;

    Alert.alert(
      '데이터 내보내기',
      '어떤 형식으로 내보내시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '지출 내역 (CSV)',
          onPress: async () => {
            try {
              setIsExporting(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await exportExpensesAsCSV(expenses);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('오류', '내보내기에 실패했습니다.');
            } finally {
              setIsExporting(false);
            }
          },
        },
        {
          text: '수입 내역 (CSV)',
          onPress: async () => {
            try {
              setIsExporting(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await exportIncomesAsCSV(incomes);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('오류', '내보내기에 실패했습니다.');
            } finally {
              setIsExporting(false);
            }
          },
        },
        {
          text: '재정 리포트 (CSV)',
          onPress: async () => {
            try {
              setIsExporting(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await exportFinancialReportAsCSV(expenses, incomes);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('오류', '내보내기에 실패했습니다.');
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleExportBackup = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await exportAllDataAsJSON({
        expenses,
        diaryEntries,
        shoppingItems,
        recurringExpenses,
        incomes,
        exportDate: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('오류', '백업에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };
  const [editName, setEditName] = useState(settings.userName);
  const [editEmoji, setEditEmoji] = useState(settings.profileEmoji);
  const [editBudget, setEditBudget] = useState(settings.monthlyBudget.toLocaleString());

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    updateSettings({
      userName: editName.trim(),
      profileEmoji: editEmoji,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowProfileModal(false);
  };

  const handleSaveBudget = () => {
    const budget = parseInt(editBudget.replace(/,/g, ''), 10);
    if (isNaN(budget) || budget <= 0) return;
    updateSettings({ monthlyBudget: budget });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowBudgetModal(false);
  };

  const formatBudget = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers) {
      return parseInt(numbers, 10).toLocaleString();
    }
    return '';
  };

  const handleResetSettings = () => {
    Alert.alert(
      '설정 초기화',
      '모든 설정을 기본값으로 되돌리시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetSettings();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header showMenu={false} showNotification={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.screenHeader}
        >
          <Text style={styles.screenTitle}>Settings</Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard>
            <View style={styles.profileCard}>
              <LinearGradient
                colors={Gradients.purple as [string, string]}
                style={styles.profileAvatar}
              >
                <Text style={styles.profileAvatarText}>{settings.profileEmoji}</Text>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{settings.userName}</Text>
                <Text style={styles.profileEmail}>MOHANI 사용자</Text>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setEditName(settings.userName);
                  setEditEmoji(settings.profileEmoji);
                  setShowProfileModal(true);
                }}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Budget Settings */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <GlassCard style={styles.settingsGroup}>
            <SettingItem
              icon="💰"
              label="월간 예산"
              value={`₩${settings.monthlyBudget.toLocaleString()}`}
              onPress={() => {
                setEditBudget(settings.monthlyBudget.toLocaleString());
                setShowBudgetModal(true);
              }}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="⚠️"
              label="예산 알림 기준"
              value={`${settings.budgetAlertThreshold}%`}
              onPress={() => {}}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="🔔"
              label="일일 예산 알림"
              isToggle
              toggleValue={settings.dailyBudgetAlert}
              onToggle={(val) => updateSettings({ dailyBudgetAlert: val })}
            />
          </GlassCard>
        </Animated.View>

        {/* Fixed Expenses */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <GlassCard>
            <TouchableOpacity
              style={styles.fixedExpenseRow}
              onPress={() => navigation.navigate('FixedExpenses')}
              activeOpacity={0.7}
            >
              <View style={styles.fixedExpenseInfo}>
                <Text style={styles.fixedExpenseIcon}>💳</Text>
                <View>
                  <Text style={styles.fixedExpenseLabel}>고정 지출</Text>
                  <Text style={styles.fixedExpenseCount}>
                    {recurringExpenses.length}개 항목
                  </Text>
                </View>
              </View>
              <View style={styles.fixedExpenseRight}>
                <Text style={styles.fixedExpenseAmount}>
                  ₩{Math.round(fixedExpensesTotal).toLocaleString()}/월
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* Notifications Settings */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <GlassCard style={styles.settingsGroup}>
            <SettingItem
              icon="📖"
              label={`일기 알림 (${settings.reminderTime})`}
              isToggle
              toggleValue={settings.dailyReminder}
              onToggle={(val) => updateSettings({ dailyReminder: val })}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="📊"
              label="주간 리포트"
              isToggle
              toggleValue={settings.weeklyReport}
              onToggle={(val) => updateSettings({ weeklyReport: val })}
            />
          </GlassCard>
        </Animated.View>

        {/* App Settings */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Text style={styles.sectionTitle}>App</Text>
          <GlassCard style={styles.settingsGroup}>
            <SettingItem
              icon="📳"
              label="햅틱 피드백"
              isToggle
              toggleValue={settings.hapticFeedback}
              onToggle={(val) => updateSettings({ hapticFeedback: val })}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="🌙"
              label="다크 모드"
              isToggle
              toggleValue={settings.darkMode}
              onToggle={(val) => updateSettings({ darkMode: val })}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="🔐"
              label="생체 인증"
              isToggle
              toggleValue={settings.useBiometrics}
              onToggle={(val) => updateSettings({ useBiometrics: val })}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="💱"
              label="통화"
              value={settings.currency}
              onPress={() => {}}
            />
          </GlassCard>
        </Animated.View>

        {/* Data Settings */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Text style={styles.sectionTitle}>Data</Text>
          <GlassCard style={styles.settingsGroup}>
            <SettingItem
              icon="☁️"
              label="백업 & 동기화"
              onPress={() => {}}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="📤"
              label="데이터 내보내기"
              onPress={handleExportData}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="🔄"
              label="설정 초기화"
              onPress={handleResetSettings}
            />
          </GlassCard>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(700).duration(500)}>
          <Text style={styles.sectionTitle}>About</Text>
          <GlassCard style={styles.settingsGroup}>
            <SettingItem
              icon="📄"
              label="이용약관"
              onPress={() => {}}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="🔒"
              label="개인정보처리방침"
              onPress={() => {}}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="💬"
              label="문의하기"
              onPress={() => {}}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="⭐"
              label="앱 평가하기"
              onPress={() => {}}
            />
          </GlassCard>
        </Animated.View>

        {/* Version */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(500)}
          style={styles.versionContainer}
        >
          <Text style={styles.versionText}>MOHANI v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with 💜 for your finances</Text>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal visible={showProfileModal} transparent animationType="none" onRequestClose={() => setShowProfileModal(false)}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowProfileModal(false)} activeOpacity={1} />

          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown.duration(200)}
            style={styles.modalContainer}
          >
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.15)', 'rgba(10, 10, 15, 0.98)']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>프로필 편집</Text>
              </View>

              <View style={styles.modalContent}>
                {/* Emoji Picker */}
                <Text style={styles.inputLabel}>프로필 이모지</Text>
                <View style={styles.emojiGrid}>
                  {PROFILE_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiItem,
                        editEmoji === emoji && styles.emojiItemSelected,
                      ]}
                      onPress={() => setEditEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Name Input */}
                <Text style={styles.inputLabel}>이름</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="이름을 입력하세요"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    maxLength={20}
                  />
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowProfileModal(false)}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                    <LinearGradient colors={Gradients.primary} style={styles.saveButtonGradient}>
                      <Text style={styles.saveButtonText}>저장</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Budget Edit Modal */}
      <Modal visible={showBudgetModal} transparent animationType="none" onRequestClose={() => setShowBudgetModal(false)}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowBudgetModal(false)} activeOpacity={1} />

          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown.duration(200)}
            style={styles.modalContainer}
          >
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.15)', 'rgba(10, 10, 15, 0.98)']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>월간 예산 설정</Text>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.inputLabel}>월간 예산</Text>
                <View style={styles.budgetInputContainer}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.budgetInput}
                    value={editBudget}
                    onChangeText={(text) => setEditBudget(formatBudget(text))}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={15}
                  />
                </View>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmounts}>
                  {[1000000, 2000000, 3000000, 5000000].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.quickAmountBtn}
                      onPress={() => setEditBudget(amount.toLocaleString())}
                    >
                      <Text style={styles.quickAmountText}>₩{(amount / 10000).toFixed(0)}만</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowBudgetModal(false)}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveBudget}>
                    <LinearGradient colors={Gradients.primary} style={styles.saveButtonGradient}>
                      <Text style={styles.saveButtonText}>저장</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  screenHeader: {
    marginBottom: Spacing.xxl,
  },
  screenTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowPurple,
  },
  profileAvatarText: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  editBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  editBtnText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  settingsGroup: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  settingIcon: {
    fontSize: 20,
    width: 28,
  },
  settingLabel: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  settingValue: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  fixedExpenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fixedExpenseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fixedExpenseIcon: {
    fontSize: 28,
  },
  fixedExpenseLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fixedExpenseCount: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  fixedExpenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fixedExpenseAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.goldPrimary,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  versionText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  versionSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  bottomSpacing: {
    height: 100,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '70%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  modalGradient: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    borderBottomWidth: 0,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  emojiItem: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emojiItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    borderColor: Colors.purplePrimary,
    borderWidth: 2,
  },
  emojiText: {
    fontSize: 24,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.xl,
  },
  textInput: {
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  currencySymbol: {
    fontSize: FontSizes.xxl,
    color: Colors.purplePrimary,
    marginRight: Spacing.sm,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
