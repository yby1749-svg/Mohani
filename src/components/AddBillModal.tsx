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
  Switch,
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

const { width } = Dimensions.get('window');

const BILL_CATEGORIES = [
  { id: 'rent', label: '월세', icon: '🏠' },
  { id: 'utilities', label: '공과금', icon: '💡' },
  { id: 'phone', label: '통신비', icon: '📱' },
  { id: 'insurance', label: '보험', icon: '🛡️' },
  { id: 'subscription', label: '구독', icon: '📺' },
  { id: 'loan', label: '대출', icon: '🏦' },
  { id: 'card', label: '카드', icon: '💳' },
  { id: 'other', label: '기타', icon: '📄' },
];

interface AddBillModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (bill: {
    name: string;
    amount: number;
    dueDay: number;
    category: string;
    categoryIcon: string;
    isAutoPay: boolean;
    notes?: string;
  }) => void;
}

export const AddBillModal: React.FC<AddBillModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAutoPay, setIsAutoPay] = useState(false);
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !amount || !dueDay || !selectedCategory) return;

    const category = BILL_CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return;

    const parsedAmount = parseInt(amount.replace(/,/g, ''), 10);
    const parsedDueDay = parseInt(dueDay, 10);

    if (isNaN(parsedAmount) || isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) return;

    onAdd({
      name: name.trim(),
      amount: parsedAmount,
      dueDay: parsedDueDay,
      category: category.id,
      categoryIcon: category.icon,
      isAutoPay,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setName('');
    setAmount('');
    setDueDay('');
    setSelectedCategory(null);
    setIsAutoPay(false);
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
              colors={['rgba(239, 68, 68, 0.15)', 'rgba(10, 10, 15, 0.98)']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <Text style={styles.title}>청구서 추가</Text>
                <Text style={styles.subtitle}>Add Bill Reminder</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {/* Name Input */}
                <Text style={styles.sectionTitle}>청구서 이름</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="예: 월세, 전기요금, 넷플릭스..."
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

                {/* Due Day Input */}
                <Text style={styles.sectionTitle}>납부일 (매월)</Text>
                <View style={styles.dueDayContainer}>
                  <TextInput
                    style={styles.dueDayInput}
                    value={dueDay}
                    onChangeText={(text) => setDueDay(text.replace(/[^0-9]/g, ''))}
                    placeholder="25"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.dueDayLabel}>일</Text>
                </View>

                {/* Category Selection */}
                <Text style={styles.sectionTitle}>카테고리</Text>
                <View style={styles.categoriesGrid}>
                  {BILL_CATEGORIES.map((category) => (
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

                {/* Auto Pay Toggle */}
                <View style={styles.toggleContainer}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>자동 결제</Text>
                    <Text style={styles.toggleHint}>자동 결제가 설정된 청구서</Text>
                  </View>
                  <Switch
                    value={isAutoPay}
                    onValueChange={setIsAutoPay}
                    trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(239, 68, 68, 0.5)' }}
                    thumbColor={isAutoPay ? '#EF4444' : '#f4f3f4'}
                  />
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

                <View style={styles.scrollBottomSpacer} />
              </ScrollView>

              {/* Buttons - Fixed at bottom */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    (!name.trim() || !amount || !dueDay || !selectedCategory) && styles.addButtonDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={!name.trim() || !amount || !dueDay || !selectedCategory}
                >
                  <LinearGradient
                    colors={name.trim() && amount && dueDay && selectedCategory ? ['#EF4444', '#DC2626'] : ['#333', '#333']}
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
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    color: '#EF4444',
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  dueDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dueDayInput: {
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
  dueDayLabel: {
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
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#EF4444',
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
    color: '#EF4444',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  toggleHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
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
    color: Colors.text,
  },
});
