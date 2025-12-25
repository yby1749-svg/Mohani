import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';

interface QuickExpenseNoteProps {
  onAddExpense: (expense: {
    amount: number;
    category: string;
    categoryLabel: string;
    categoryIcon: string;
    note: string;
    date: Date;
  }) => void;
}

interface QuickTemplate {
  id: string;
  text: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  defaultAmount: number;
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  { id: '1', text: '커피', category: 'cafe', categoryLabel: '카페', categoryIcon: '☕', defaultAmount: 5000 },
  { id: '2', text: '점심', category: 'food', categoryLabel: '식비', categoryIcon: '🍚', defaultAmount: 10000 },
  { id: '3', text: '저녁', category: 'food', categoryLabel: '식비', categoryIcon: '🍚', defaultAmount: 15000 },
  { id: '4', text: '택시', category: 'transport', categoryLabel: '교통', categoryIcon: '🚌', defaultAmount: 8000 },
  { id: '5', text: '버스', category: 'transport', categoryLabel: '교통', categoryIcon: '🚌', defaultAmount: 1500 },
  { id: '6', text: '편의점', category: 'shopping', categoryLabel: '쇼핑', categoryIcon: '🛍️', defaultAmount: 5000 },
  { id: '7', text: '마트', category: 'shopping', categoryLabel: '쇼핑', categoryIcon: '🛍️', defaultAmount: 30000 },
  { id: '8', text: '배달', category: 'food', categoryLabel: '식비', categoryIcon: '🍚', defaultAmount: 20000 },
];

const QUICK_AMOUNTS = [3000, 5000, 10000, 15000, 20000, 30000];

const QuickExpenseNote: React.FC<QuickExpenseNoteProps> = ({ onAddExpense }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null);
  const [amount, setAmount] = useState('');
  const [customNote, setCustomNote] = useState('');

  const handleTemplateSelect = (template: QuickTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTemplate(template);
    setAmount(template.defaultAmount.toString());
    setCustomNote(template.text);
  };

  const handleQuickAmount = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(value.toString());
  };

  const handleSubmit = () => {
    if (!selectedTemplate || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onAddExpense({
      amount: numAmount,
      category: selectedTemplate.category,
      categoryLabel: selectedTemplate.categoryLabel,
      categoryIcon: selectedTemplate.categoryIcon,
      note: customNote || selectedTemplate.text,
      date: new Date(),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Reset
    setSelectedTemplate(null);
    setAmount('');
    setCustomNote('');
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTemplate(null);
    setAmount('');
    setCustomNote('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚡</Text>
        <Text style={styles.headerTitle}>빠른 기록</Text>
        {selectedTemplate && (
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>초기화</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Templates */}
      <View style={styles.templatesGrid}>
        {QUICK_TEMPLATES.map((template, index) => (
          <Animated.View key={template.id} entering={FadeIn.delay(index * 30)}>
            <TouchableOpacity
              style={[
                styles.templateButton,
                selectedTemplate?.id === template.id && styles.templateButtonActive,
              ]}
              onPress={() => handleTemplateSelect(template)}
            >
              <Text style={styles.templateIcon}>{template.categoryIcon}</Text>
              <Text style={[
                styles.templateText,
                selectedTemplate?.id === template.id && styles.templateTextActive,
              ]}>
                {template.text}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Amount Section - Show when template selected */}
      {selectedTemplate && (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.amountSection}>
          <Text style={styles.sectionLabel}>금액</Text>

          <View style={styles.amountInputRow}>
            <Text style={styles.currencySymbol}>₩</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.quickAmountButton,
                  parseFloat(amount) === amt && styles.quickAmountActive,
                ]}
                onPress={() => handleQuickAmount(amt)}
              >
                <Text style={[
                  styles.quickAmountText,
                  parseFloat(amount) === amt && styles.quickAmountTextActive,
                ]}>
                  {amt >= 10000 ? `${amt / 10000}만` : `${amt / 1000}천`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note Input */}
          <TextInput
            style={styles.noteInput}
            value={customNote}
            onChangeText={setCustomNote}
            placeholder="메모 (선택)"
            placeholderTextColor={Colors.textMuted}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!amount || parseFloat(amount) <= 0) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            <LinearGradient
              colors={[Colors.purplePrimary, Colors.purpleSecondary]}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                {selectedTemplate.categoryIcon} ₩{parseFloat(amount || '0').toLocaleString()} 추가
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {!selectedTemplate && (
        <Text style={styles.hint}>템플릿을 탭해서 빠르게 지출을 기록하세요</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
  },
  resetText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  templateButtonActive: {
    backgroundColor: Colors.purplePrimary + '30',
    borderColor: Colors.purplePrimary,
  },
  templateIcon: {
    fontSize: 16,
  },
  templateText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  templateTextActive: {
    color: Colors.textPrimary,
  },
  amountSection: {
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xl,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    paddingVertical: Spacing.md,
    textAlign: 'right',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickAmountButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickAmountActive: {
    backgroundColor: Colors.goldPrimary + '30',
    borderColor: Colors.goldPrimary,
  },
  quickAmountText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  quickAmountTextActive: {
    color: Colors.goldPrimary,
  },
  noteInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
  },
  submitButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  hint: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});

export default QuickExpenseNote;
