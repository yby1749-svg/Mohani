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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes } from '../constants/theme';

const CATEGORIES = [
  { id: 'housing', label: '주거', icon: '🏠' },
  { id: 'utilities', label: '공과금', icon: '💡' },
  { id: 'insurance', label: '보험', icon: '🛡️' },
  { id: 'subscription', label: '구독', icon: '📺' },
  { id: 'transport', label: '교통', icon: '🚗' },
  { id: 'phone', label: '통신', icon: '📱' },
  { id: 'gym', label: '헬스', icon: '💪' },
  { id: 'other', label: '기타', icon: '📦' },
];

const FREQUENCIES = [
  { id: 'monthly', label: '매월' },
  { id: 'weekly', label: '매주' },
  { id: 'yearly', label: '매년' },
];

interface AddRecurringModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (expense: {
    name: string;
    amount: number;
    category: string;
    categoryLabel: string;
    categoryIcon: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    dayOfMonth?: number;
    dayOfWeek?: number;
  }) => void;
}

export const AddRecurringModal: React.FC<AddRecurringModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');

  const handleAdd = () => {
    if (!name.trim() || !amount || !selectedCategory) return;

    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return;

    onAdd({
      name: name.trim(),
      amount: parseInt(amount.replace(/,/g, ''), 10),
      category: selectedCategory,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      frequency,
      dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth, 10) : undefined,
    });

    // Reset form
    setName('');
    setAmount('');
    setSelectedCategory(null);
    setFrequency('monthly');
    setDayOfMonth('1');
    onClose();
  };

  const formatAmount = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers) {
      return parseInt(numbers, 10).toLocaleString();
    }
    return '';
  };

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
                <Text style={styles.title}>고정 지출 추가</Text>
                <Text style={styles.subtitle}>Add Fixed Expense</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {/* Name Input */}
                <Text style={styles.sectionTitle}>지출 이름</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="예: 넷플릭스, 월세, 보험료..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    maxLength={30}
                  />
                </View>

                {/* Amount Input */}
                <Text style={styles.sectionTitle}>금액</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={(text) => setAmount(formatAmount(text))}
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

                {/* Frequency Selection */}
                <Text style={styles.sectionTitle}>결제 주기</Text>
                <View style={styles.frequencyRow}>
                  {FREQUENCIES.map((freq) => (
                    <TouchableOpacity
                      key={freq.id}
                      style={[
                        styles.frequencyItem,
                        frequency === freq.id && styles.frequencyItemSelected,
                      ]}
                      onPress={() => setFrequency(freq.id as any)}
                    >
                      <Text style={[
                        styles.frequencyLabel,
                        frequency === freq.id && styles.frequencyLabelSelected,
                      ]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Day of Month (for monthly) */}
                {frequency === 'monthly' && (
                  <>
                    <Text style={styles.sectionTitle}>결제일</Text>
                    <View style={styles.dayRow}>
                      {[1, 5, 10, 15, 20, 25].map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayItem,
                            parseInt(dayOfMonth, 10) === day && styles.dayItemSelected,
                          ]}
                          onPress={() => setDayOfMonth(day.toString())}
                        >
                          <Text style={[
                            styles.dayLabel,
                            parseInt(dayOfMonth, 10) === day && styles.dayLabelSelected,
                          ]}>
                            {day}일
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      (!name.trim() || !amount || !selectedCategory) && styles.addButtonDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={!name.trim() || !amount || !selectedCategory}
                  >
                    <LinearGradient
                      colors={name.trim() && amount && selectedCategory ? Gradients.primary : ['#333', '#333']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.addButtonGradient}
                    >
                      <Text style={styles.addButtonText}>추가하기</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    marginBottom: Spacing.xl,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.xl,
  },
  categoryItem: {
    width: '23%',
    margin: '1%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: Colors.purplePrimary,
    borderWidth: 2,
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
    color: Colors.purplePrimary,
    fontWeight: '600',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  frequencyItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  frequencyItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: Colors.purplePrimary,
    borderWidth: 2,
  },
  frequencyLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  frequencyLabelSelected: {
    color: Colors.purplePrimary,
    fontWeight: '600',
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dayItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: Colors.purplePrimary,
    borderWidth: 2,
  },
  dayLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  dayLabelSelected: {
    color: Colors.purplePrimary,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingBottom: Spacing.xl + 20,
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
