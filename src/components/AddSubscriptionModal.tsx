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
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { SUBSCRIPTION_PRESETS } from '../context/SubscriptionContext';

const { width } = Dimensions.get('window');

const SUBSCRIPTION_CATEGORIES = [
  { id: 'streaming', label: '스트리밍', icon: '📺' },
  { id: 'music', label: '음악', icon: '🎵' },
  { id: 'cloud', label: '클라우드', icon: '☁️' },
  { id: 'shopping', label: '쇼핑', icon: '🛒' },
  { id: 'productivity', label: '생산성', icon: '💼' },
  { id: 'gaming', label: '게임', icon: '🎮' },
  { id: 'fitness', label: '피트니스', icon: '💪' },
  { id: 'news', label: '뉴스', icon: '📰' },
  { id: 'other', label: '기타', icon: '📦' },
];

const BILLING_CYCLES = [
  { id: 'weekly', label: '주간' },
  { id: 'monthly', label: '월간' },
  { id: 'yearly', label: '연간' },
];

interface AddSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (subscription: {
    name: string;
    amount: number;
    billingCycle: 'weekly' | 'monthly' | 'yearly';
    category: string;
    categoryIcon: string;
    nextBillingDate: Date;
    isActive: boolean;
    notes?: string;
    color?: string;
  }) => void;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [billingDay, setBillingDay] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (preset: typeof SUBSCRIPTION_PRESETS[0]) => {
    setSelectedPreset(preset.name);
    setName(preset.name);
  };

  const handleAdd = () => {
    if (!name.trim() || !amount || !selectedCategory || !billingDay) return;

    const category = SUBSCRIPTION_CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return;

    const parsedAmount = parseInt(amount.replace(/,/g, ''), 10);
    const parsedDay = parseInt(billingDay, 10);

    if (isNaN(parsedAmount) || isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) return;

    // Calculate next billing date
    const today = new Date();
    const nextBillingDate = new Date(today.getFullYear(), today.getMonth(), parsedDay);
    if (nextBillingDate <= today) {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    const preset = SUBSCRIPTION_PRESETS.find((p) => p.name === name);

    onAdd({
      name: name.trim(),
      amount: parsedAmount,
      billingCycle,
      category: category.id,
      categoryIcon: category.icon,
      nextBillingDate,
      isActive: true,
      notes: notes.trim() || undefined,
      color: preset?.color,
    });

    // Reset form
    setName('');
    setAmount('');
    setBillingCycle('monthly');
    setSelectedCategory(null);
    setBillingDay('');
    setNotes('');
    setSelectedPreset(null);
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
                <Text style={styles.title}>구독 추가</Text>
                <Text style={styles.subtitle}>Add Subscription</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {/* Quick Presets */}
                <Text style={styles.sectionTitle}>인기 서비스</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                  {SUBSCRIPTION_PRESETS.slice(0, 8).map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      style={[
                        styles.presetItem,
                        selectedPreset === preset.name && styles.presetItemSelected,
                        { borderColor: preset.color },
                      ]}
                      onPress={() => handlePresetSelect(preset)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetIcon}>{preset.icon}</Text>
                      <Text style={styles.presetName} numberOfLines={1}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Name Input */}
                <Text style={styles.sectionTitle}>서비스 이름</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="예: Netflix, Spotify..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    maxLength={30}
                  />
                </View>

                {/* Amount Input */}
                <Text style={styles.sectionTitle}>결제 금액</Text>
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

                {/* Billing Cycle */}
                <Text style={styles.sectionTitle}>결제 주기</Text>
                <View style={styles.cycleContainer}>
                  {BILLING_CYCLES.map((cycle) => (
                    <TouchableOpacity
                      key={cycle.id}
                      style={[
                        styles.cycleItem,
                        billingCycle === cycle.id && styles.cycleItemSelected,
                      ]}
                      onPress={() => setBillingCycle(cycle.id as 'weekly' | 'monthly' | 'yearly')}
                    >
                      <Text style={[
                        styles.cycleLabel,
                        billingCycle === cycle.id && styles.cycleLabelSelected,
                      ]}>
                        {cycle.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Billing Day */}
                <Text style={styles.sectionTitle}>결제일</Text>
                <View style={styles.dayContainer}>
                  <TextInput
                    style={styles.dayInput}
                    value={billingDay}
                    onChangeText={(text) => setBillingDay(text.replace(/[^0-9]/g, ''))}
                    placeholder="25"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.dayLabel}>일</Text>
                </View>

                {/* Category Selection */}
                <Text style={styles.sectionTitle}>카테고리</Text>
                <View style={styles.categoriesGrid}>
                  {SUBSCRIPTION_CATEGORIES.map((category) => (
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

                {/* Notes Input */}
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

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      (!name.trim() || !amount || !selectedCategory || !billingDay) && styles.addButtonDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={!name.trim() || !amount || !selectedCategory || !billingDay}
                  >
                    <LinearGradient
                      colors={name.trim() && amount && selectedCategory && billingDay
                        ? ['#7c3aed', '#6d28d9']
                        : ['#333', '#333']}
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
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  presetsScroll: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  presetItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.md,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  presetItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 2,
  },
  presetIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  presetName: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
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
    color: Colors.text,
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
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  cycleContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cycleItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cycleItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: Colors.purpleLight,
  },
  cycleLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  cycleLabelSelected: {
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  dayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dayInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.md,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    width: 80,
    textAlign: 'center',
  },
  dayLabel: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    width: (width - Spacing.lg * 2 - Spacing.xs * 6) / 3,
    aspectRatio: 1.2,
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
    borderColor: Colors.purpleLight,
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
  notesContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.xl,
  },
  notesInput: {
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
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
    color: Colors.text,
  },
});
