import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, BorderRadius, FontSizes, Gradients } from '../constants/theme';
import { Debt } from '../context/DebtContext';

interface AddDebtModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (debt: Omit<Debt, 'id' | 'payments' | 'createdAt'>) => void;
}

type DebtCategory = 'loan' | 'credit_card' | 'personal' | 'mortgage' | 'car' | 'student' | 'other';

const CATEGORIES: { key: DebtCategory; label: string; icon: string }[] = [
  { key: 'personal', label: '개인 대여', icon: '🤝' },
  { key: 'loan', label: '은행 대출', icon: '🏦' },
  { key: 'credit_card', label: '신용카드', icon: '💳' },
  { key: 'mortgage', label: '주택 담보', icon: '🏠' },
  { key: 'car', label: '자동차 대출', icon: '🚗' },
  { key: 'student', label: '학자금 대출', icon: '🎓' },
  { key: 'other', label: '기타', icon: '📋' },
];

const PRIORITIES: { key: Debt['priority']; label: string; color: string }[] = [
  { key: 'high', label: '높음', color: '#EF4444' },
  { key: 'medium', label: '보통', color: '#F59E0B' },
  { key: 'low', label: '낮음', color: '#22C55E' },
];

export const AddDebtModal: React.FC<AddDebtModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'owe' | 'owed'>('owe');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [personOrInstitution, setPersonOrInstitution] = useState('');
  const [category, setCategory] = useState<DebtCategory>('personal');
  const [priority, setPriority] = useState<Debt['priority']>('medium');
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setType('owe');
    setAmount('');
    setInterestRate('');
    setPersonOrInstitution('');
    setCategory('personal');
    setPriority('medium');
    setHasDueDate(false);
    setDueDate(new Date());
    setNotes('');
  };

  const handleSubmit = () => {
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return;

    const selectedCategory = CATEGORIES.find((c) => c.key === category);

    onAdd({
      name: name.trim(),
      type,
      originalAmount: parseFloat(amount),
      currentBalance: parseFloat(amount),
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      dueDate: hasDueDate ? dueDate : undefined,
      personOrInstitution: personOrInstitution.trim(),
      category,
      categoryIcon: selectedCategory?.icon || '📋',
      isActive: true,
      notes: notes.trim() || undefined,
      priority,
    });

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatDateForDisplay = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.title}>부채/대출 추가</Text>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!name.trim() || !amount}
                style={styles.saveBtn}
              >
                <Text style={[
                  styles.saveBtnText,
                  (!name.trim() || !amount) && styles.saveBtnDisabled
                ]}>
                  저장
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Type Selector */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>유형</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeBtn, type === 'owe' && styles.typeBtnActive]}
                    onPress={() => setType('owe')}
                  >
                    <Text style={styles.typeIcon}>💸</Text>
                    <Text style={[styles.typeText, type === 'owe' && styles.typeTextActive]}>
                      내가 빌린 돈
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, type === 'owed' && styles.typeBtnActive]}
                    onPress={() => setType('owed')}
                  >
                    <Text style={styles.typeIcon}>💰</Text>
                    <Text style={[styles.typeText, type === 'owed' && styles.typeTextActive]}>
                      빌려준 돈
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Name Input */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>이름</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="예: 월세 보증금 대출"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Amount Input */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>금액</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Person/Institution */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {type === 'owe' ? '빌린 곳' : '빌려준 사람'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={personOrInstitution}
                  onChangeText={setPersonOrInstitution}
                  placeholder={type === 'owe' ? '예: 신한은행, 친구 김철수' : '예: 동생, 친구 이영희'}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Category */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>카테고리</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.categoryBtn,
                          category === cat.key && styles.categoryBtnActive,
                        ]}
                        onPress={() => setCategory(cat.key)}
                      >
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text style={[
                          styles.categoryLabel,
                          category === cat.key && styles.categoryLabelActive,
                        ]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Interest Rate */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>이자율 (선택)</Text>
                <View style={styles.interestInputContainer}>
                  <TextInput
                    style={styles.interestInput}
                    value={interestRate}
                    onChangeText={setInterestRate}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>

              {/* Priority */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>우선순위</Text>
                <View style={styles.prioritySelector}>
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity
                      key={p.key}
                      style={[
                        styles.priorityBtn,
                        priority === p.key && { borderColor: p.color, backgroundColor: `${p.color}20` },
                      ]}
                      onPress={() => setPriority(p.key)}
                    >
                      <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                      <Text style={[
                        styles.priorityText,
                        priority === p.key && { color: p.color },
                      ]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Due Date */}
              <View style={styles.section}>
                <View style={styles.dueDateHeader}>
                  <Text style={styles.sectionLabel}>만기일</Text>
                  <TouchableOpacity
                    style={[styles.toggle, hasDueDate && styles.toggleActive]}
                    onPress={() => setHasDueDate(!hasDueDate)}
                  >
                    <View style={[styles.toggleThumb, hasDueDate && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                {hasDueDate && (
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={Colors.purpleLight} />
                    <Text style={styles.dateBtnText}>{formatDateForDisplay(dueDate)}</Text>
                  </TouchableOpacity>
                )}
                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setDueDate(date);
                    }}
                    minimumDate={new Date()}
                    textColor={Colors.textPrimary}
                  />
                )}
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>메모 (선택)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="추가 정보를 입력하세요"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveBtn: {
    padding: Spacing.xs,
  },
  saveBtnText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.purpleLight,
  },
  saveBtnDisabled: {
    color: Colors.textMuted,
  },
  form: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    borderColor: Colors.purpleLight,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  typeIcon: {
    fontSize: 20,
  },
  typeText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  typeTextActive: {
    color: Colors.purpleLight,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: FontSizes.xl,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categoryBtn: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
  },
  categoryBtnActive: {
    borderColor: Colors.purpleLight,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  categoryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  categoryLabelActive: {
    color: Colors.purpleLight,
  },
  interestInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    width: 120,
  },
  interestInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  percentSymbol: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  dueDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: Colors.purpleLight,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textMuted,
  },
  toggleThumbActive: {
    backgroundColor: Colors.textPrimary,
    alignSelf: 'flex-end',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderWidth: 1,
    borderColor: Colors.borderPurple,
  },
  dateBtnText: {
    fontSize: FontSizes.md,
    color: Colors.purpleLight,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});
