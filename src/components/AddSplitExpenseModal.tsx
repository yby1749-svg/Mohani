import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSizes, Gradients } from '../constants/theme';
import { SplitExpense, SplitParticipant } from '../context/SplitExpenseContext';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'food', label: '식사', icon: '🍽️' },
  { id: 'drinks', label: '술/음료', icon: '🍺' },
  { id: 'travel', label: '여행', icon: '✈️' },
  { id: 'entertainment', label: '놀이', icon: '🎮' },
  { id: 'shopping', label: '쇼핑', icon: '🛒' },
  { id: 'transport', label: '교통', icon: '🚗' },
  { id: 'accommodation', label: '숙박', icon: '🏨' },
  { id: 'other', label: '기타', icon: '📋' },
];

type SplitMethod = 'equal' | 'custom';

interface AddSplitExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (split: Omit<SplitExpense, 'id' | 'isSettled'>) => void;
}

export const AddSplitExpenseModal: React.FC<AddSplitExpenseModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidBy, setPaidBy] = useState('나');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [participants, setParticipants] = useState<{ name: string; share: string }[]>([
    { name: '나', share: '' },
  ]);
  const [newParticipant, setNewParticipant] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddParticipant = () => {
    if (!newParticipant.trim()) return;
    if (participants.some((p) => p.name === newParticipant.trim())) {
      return; // Already exists
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setParticipants([...participants, { name: newParticipant.trim(), share: '' }]);
    setNewParticipant('');
  };

  const handleRemoveParticipant = (name: string) => {
    if (name === '나') return; // Can't remove self
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setParticipants(participants.filter((p) => p.name !== name));
    if (paidBy === name) {
      setPaidBy('나');
    }
  };

  const handleShareChange = (name: string, share: string) => {
    setParticipants(
      participants.map((p) => (p.name === name ? { ...p, share } : p))
    );
  };

  const calculateEqualShare = () => {
    const amount = parseFloat(totalAmount.replace(/,/g, '')) || 0;
    const share = Math.ceil(amount / participants.length);
    return share;
  };

  const handleAdd = () => {
    if (!title.trim() || !totalAmount || !selectedCategory || participants.length < 2) {
      return;
    }

    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return;

    const amount = parseFloat(totalAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) return;

    let finalParticipants: SplitParticipant[];

    if (splitMethod === 'equal') {
      const share = calculateEqualShare();
      finalParticipants = participants.map((p) => ({
        id: Date.now().toString() + p.name,
        name: p.name,
        share: share,
        isPaid: p.name === paidBy,
      }));
    } else {
      finalParticipants = participants.map((p) => ({
        id: Date.now().toString() + p.name,
        name: p.name,
        share: parseFloat(p.share.replace(/,/g, '')) || 0,
        isPaid: p.name === paidBy,
      }));
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    onAdd({
      title: title.trim(),
      totalAmount: amount,
      paidBy,
      participants: finalParticipants,
      category: category.id,
      categoryIcon: category.icon,
      date: new Date(),
      notes: notes.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setTotalAmount('');
    setPaidBy('나');
    setSelectedCategory(null);
    setSplitMethod('equal');
    setParticipants([{ name: '나', share: '' }]);
    setNewParticipant('');
    setNotes('');
    onClose();
  };

  const formatAmount = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers) {
      return parseInt(numbers, 10).toLocaleString();
    }
    return '';
  };

  const isValid =
    title.trim() &&
    totalAmount &&
    selectedCategory &&
    participants.length >= 2;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown.duration(200)}
            style={styles.modalContainer}
          >
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.15)', 'rgba(10, 10, 15, 0.98)']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <Text style={styles.title}>더치페이 추가</Text>
                <Text style={styles.subtitle}>Add Split Expense</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {/* Title Input */}
                <Text style={styles.sectionTitle}>제목</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="예: 점심 식사, 여행 경비..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    maxLength={30}
                  />
                </View>

                {/* Amount Input */}
                <Text style={styles.sectionTitle}>총 금액</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={totalAmount}
                    onChangeText={(text) => setTotalAmount(formatAmount(text))}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={12}
                  />
                </View>

                {/* Category Selection */}
                <Text style={styles.sectionTitle}>카테고리</Text>
                <View style={styles.categoriesGrid}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory === category.id && styles.categoryItemSelected,
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={[
                        styles.categoryLabel,
                        selectedCategory === category.id && styles.categoryLabelSelected,
                      ]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Participants */}
                <Text style={styles.sectionTitle}>참여자</Text>
                <View style={styles.participantsContainer}>
                  {participants.map((p) => (
                    <View key={p.name} style={styles.participantChip}>
                      <Text style={styles.participantChipText}>{p.name}</Text>
                      {p.name !== '나' && (
                        <TouchableOpacity
                          onPress={() => handleRemoveParticipant(p.name)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.addParticipantRow}>
                  <TextInput
                    style={styles.addParticipantInput}
                    value={newParticipant}
                    onChangeText={setNewParticipant}
                    placeholder="친구 이름 추가..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    onSubmitEditing={handleAddParticipant}
                    maxLength={10}
                  />
                  <TouchableOpacity
                    style={styles.addParticipantBtn}
                    onPress={handleAddParticipant}
                  >
                    <Ionicons name="add" size={20} color={Colors.purpleLight} />
                  </TouchableOpacity>
                </View>

                {/* Paid By */}
                <Text style={styles.sectionTitle}>결제자</Text>
                <View style={styles.paidByContainer}>
                  {participants.map((p) => (
                    <TouchableOpacity
                      key={p.name}
                      style={[
                        styles.paidByChip,
                        paidBy === p.name && styles.paidByChipSelected,
                      ]}
                      onPress={() => setPaidBy(p.name)}
                    >
                      <Text style={[
                        styles.paidByChipText,
                        paidBy === p.name && styles.paidByChipTextSelected,
                      ]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Split Method */}
                <Text style={styles.sectionTitle}>분할 방식</Text>
                <View style={styles.splitMethodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.splitMethodBtn,
                      splitMethod === 'equal' && styles.splitMethodBtnActive,
                    ]}
                    onPress={() => setSplitMethod('equal')}
                  >
                    <Text style={[
                      styles.splitMethodText,
                      splitMethod === 'equal' && styles.splitMethodTextActive,
                    ]}>
                      균등 분할
                    </Text>
                    {splitMethod === 'equal' && totalAmount && participants.length > 0 && (
                      <Text style={styles.splitMethodHint}>
                        (1인당 ₩{calculateEqualShare().toLocaleString()})
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.splitMethodBtn,
                      splitMethod === 'custom' && styles.splitMethodBtnActive,
                    ]}
                    onPress={() => setSplitMethod('custom')}
                  >
                    <Text style={[
                      styles.splitMethodText,
                      splitMethod === 'custom' && styles.splitMethodTextActive,
                    ]}>
                      직접 입력
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Shares */}
                {splitMethod === 'custom' && (
                  <View style={styles.customSharesContainer}>
                    {participants.map((p) => (
                      <View key={p.name} style={styles.customShareRow}>
                        <Text style={styles.customShareName}>{p.name}</Text>
                        <View style={styles.customShareInput}>
                          <Text style={styles.customShareCurrency}>₩</Text>
                          <TextInput
                            style={styles.customShareValue}
                            value={p.share}
                            onChangeText={(text) => handleShareChange(p.name, formatAmount(text))}
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="numeric"
                            maxLength={10}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Notes */}
                <Text style={styles.sectionTitle}>메모 (선택)</Text>
                <View style={styles.notesContainer}>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="추가 정보..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    multiline
                    maxLength={100}
                  />
                </View>

                <View style={styles.scrollBottomSpacer} />
              </ScrollView>

              {/* Buttons - Fixed at bottom */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addButton, !isValid && styles.addButtonDisabled]}
                  onPress={handleAdd}
                  disabled={!isValid}
                >
                  <LinearGradient
                    colors={isValid ? (Gradients.primary as [string, string]) : ['#333', '#333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addButtonGradient}
                  >
                    <Text style={styles.addButtonText}>추가하기</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
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
  header: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.lg,
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
    fontSize: 24,
    fontWeight: '300',
    color: Colors.purpleLight,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    width: (width - Spacing.lg * 2 - Spacing.xs * 8) / 4,
    aspectRatio: 1,
    margin: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purplePrimary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  categoryLabelSelected: {
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  participantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  participantChipText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
    fontWeight: '500',
  },
  addParticipantRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addParticipantInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  addParticipantBtn: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: BorderRadius.md,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidByContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  paidByChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  paidByChipSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: Colors.goldPrimary,
  },
  paidByChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  paidByChipTextSelected: {
    color: Colors.goldPrimary,
    fontWeight: '600',
  },
  splitMethodContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  splitMethodBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  splitMethodBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: Colors.purplePrimary,
  },
  splitMethodText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  splitMethodTextActive: {
    color: Colors.purpleLight,
  },
  splitMethodHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  customSharesContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  customShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customShareName: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  customShareInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    width: 120,
  },
  customShareCurrency: {
    fontSize: FontSizes.md,
    color: Colors.purpleLight,
  },
  customShareValue: {
    flex: 1,
    padding: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  notesContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.lg,
  },
  notesInput: {
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  scrollBottomSpacer: {
    height: Spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 20,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
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
  addButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
