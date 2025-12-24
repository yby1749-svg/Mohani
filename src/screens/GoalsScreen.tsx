import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground, ProgressBar } from '../components';
import { useGoals } from '../context/GoalsContext';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

const GOAL_ICONS = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '👗', '💍', '🎓', '💰', '🎁', '🏖️'];
const GOAL_COLORS = ['#7c3aed', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

export default function GoalsScreen() {
  const {
    goals,
    addGoal,
    deleteGoal,
    addSavings,
    getTotalSaved,
    getTotalTarget,
    getOverallProgress,
  } = useGoals();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Add modal state
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState('#7c3aed');

  // Save modal state
  const [saveAmount, setSaveAmount] = useState('');

  const formatAmount = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers) {
      return parseInt(numbers, 10).toLocaleString();
    }
    return '';
  };

  const handleAddGoal = () => {
    if (!goalName.trim() || !targetAmount) return;

    addGoal({
      name: goalName.trim(),
      targetAmount: parseInt(targetAmount.replace(/,/g, ''), 10),
      icon: selectedIcon,
      color: selectedColor,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGoalName('');
    setTargetAmount('');
    setSelectedIcon('🎯');
    setSelectedColor('#7c3aed');
    setShowAddModal(false);
  };

  const handleSave = () => {
    if (!saveAmount || !selectedGoalId) return;

    const amount = parseInt(saveAmount.replace(/,/g, ''), 10);
    addSavings(selectedGoalId, amount);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaveAmount('');
    setSelectedGoalId(null);
    setShowSaveModal(false);
  };

  const handleDeleteGoal = (id: string, name: string) => {
    Alert.alert(
      '목표 삭제',
      `"${name}" 목표를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteGoal(id);
          },
        },
      ]
    );
  };

  const totalSaved = getTotalSaved();
  const totalTarget = getTotalTarget();
  const overallProgress = getOverallProgress();

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.screenHeader}
        >
          <Text style={styles.screenTitle}>Savings Goals</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.addBtnGradient}
            >
              <Ionicons name="add" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Overall Progress */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard gradient={Gradients.cardGold} borderColor={Colors.borderGold}>
            <View style={styles.overallHeader}>
              <Text style={styles.overallTitle}>전체 저축 현황</Text>
              <Text style={styles.overallPercent}>{overallProgress}%</Text>
            </View>
            <ProgressBar progress={overallProgress} />
            <View style={styles.overallStats}>
              <View style={styles.overallStat}>
                <Text style={styles.overallStatLabel}>모은 금액</Text>
                <Text style={styles.overallStatValue}>
                  ₩{totalSaved.toLocaleString()}
                </Text>
              </View>
              <View style={styles.overallDivider} />
              <View style={styles.overallStat}>
                <Text style={styles.overallStatLabel}>목표 금액</Text>
                <Text style={styles.overallStatValue}>
                  ₩{totalTarget.toLocaleString()}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Goals List */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={styles.sectionTitle}>🎯 나의 목표</Text>

          {goals.length > 0 ? (
            <View style={styles.goalsList}>
              {goals.map((goal, index) => {
                const progress = Math.min(
                  Math.round((goal.currentAmount / goal.targetAmount) * 100),
                  100
                );
                const remaining = goal.targetAmount - goal.currentAmount;

                return (
                  <GlassCard key={goal.id}>
                    <TouchableOpacity
                      style={styles.goalItem}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedGoalId(goal.id);
                        setShowSaveModal(true);
                      }}
                      onLongPress={() => handleDeleteGoal(goal.id, goal.name)}
                    >
                      <View style={styles.goalHeader}>
                        <View style={[styles.goalIcon, { backgroundColor: goal.color + '30' }]}>
                          <Text style={styles.goalIconText}>{goal.icon}</Text>
                        </View>
                        <View style={styles.goalInfo}>
                          <Text style={styles.goalName}>{goal.name}</Text>
                          <Text style={styles.goalRemaining}>
                            {goal.isCompleted
                              ? '🎉 목표 달성!'
                              : `₩${remaining.toLocaleString()} 남음`}
                          </Text>
                        </View>
                        <Text style={[styles.goalPercent, { color: goal.color }]}>
                          {progress}%
                        </Text>
                      </View>

                      <View style={styles.goalProgress}>
                        <View style={styles.goalProgressBg}>
                          <View
                            style={[
                              styles.goalProgressFill,
                              {
                                width: `${progress}%`,
                                backgroundColor: goal.color,
                              },
                            ]}
                          />
                        </View>
                      </View>

                      <View style={styles.goalAmounts}>
                        <Text style={styles.goalCurrent}>
                          ₩{goal.currentAmount.toLocaleString()}
                        </Text>
                        <Text style={styles.goalTarget}>
                          / ₩{goal.targetAmount.toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </GlassCard>
                );
              })}
            </View>
          ) : (
            <GlassCard>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyText}>저축 목표가 없어요</Text>
                <Text style={styles.emptySubtext}>
                  + 버튼을 눌러 새로운 목표를 만들어보세요
                </Text>
              </View>
            </GlassCard>
          )}
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              목표를 탭하면 저축할 수 있어요.{'\n'}
              길게 누르면 삭제할 수 있어요.
            </Text>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} transparent animationType="none" onRequestClose={() => setShowAddModal(false)}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowAddModal(false)} activeOpacity={1} />

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
                <Text style={styles.modalTitle}>새 저축 목표</Text>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Name */}
                <Text style={styles.inputLabel}>목표 이름</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={goalName}
                    onChangeText={setGoalName}
                    placeholder="예: 여행 자금, 비상금..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    maxLength={20}
                  />
                </View>

                {/* Target Amount */}
                <Text style={styles.inputLabel}>목표 금액</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={targetAmount}
                    onChangeText={(text) => setTargetAmount(formatAmount(text))}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={15}
                  />
                </View>

                {/* Icon */}
                <Text style={styles.inputLabel}>아이콘</Text>
                <View style={styles.iconGrid}>
                  {GOAL_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconItem,
                        selectedIcon === icon && styles.iconItemSelected,
                      ]}
                      onPress={() => setSelectedIcon(icon)}
                    >
                      <Text style={styles.iconItemText}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Color */}
                <Text style={styles.inputLabel}>색상</Text>
                <View style={styles.colorGrid}>
                  {GOAL_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorItem,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorItemSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, (!goalName.trim() || !targetAmount) && styles.saveButtonDisabled]}
                    onPress={handleAddGoal}
                    disabled={!goalName.trim() || !targetAmount}
                  >
                    <LinearGradient
                      colors={goalName.trim() && targetAmount ? Gradients.primary : ['#333', '#333']}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>만들기</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Add Savings Modal */}
      <Modal visible={showSaveModal} transparent animationType="none" onRequestClose={() => setShowSaveModal(false)}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowSaveModal(false)} activeOpacity={1} />

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
                <Text style={styles.modalTitle}>저축하기</Text>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.inputLabel}>저축 금액</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={saveAmount}
                    onChangeText={(text) => setSaveAmount(formatAmount(text))}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={15}
                    autoFocus
                  />
                </View>

                {/* Quick amounts */}
                <View style={styles.quickAmounts}>
                  {[10000, 50000, 100000, 500000].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.quickAmountBtn}
                      onPress={() => setSaveAmount(amount.toLocaleString())}
                    >
                      <Text style={styles.quickAmountText}>+{(amount / 10000).toFixed(0)}만</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSaveModal(false)}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, !saveAmount && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={!saveAmount}
                  >
                    <LinearGradient
                      colors={saveAmount ? Gradients.gold : ['#333', '#333']}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>저축하기</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  screenTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  addBtnGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  overallTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  overallPercent: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.goldPrimary,
  },
  overallStats: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
  overallStat: {
    flex: 1,
    alignItems: 'center',
  },
  overallStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  overallStatValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  overallDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  goalsList: {
    gap: Spacing.md,
  },
  goalItem: {},
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  goalIconText: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  goalRemaining: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  goalPercent: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  goalProgress: {
    marginBottom: Spacing.sm,
  },
  goalProgressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  goalCurrent: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  goalTarget: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.purplePrimary,
    marginTop: Spacing.lg,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    maxHeight: '85%',
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
  amountContainer: {
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
  amountInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    borderColor: Colors.purplePrimary,
    borderWidth: 2,
  },
  iconItemText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: 'white',
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
  saveButtonDisabled: {
    opacity: 0.5,
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
