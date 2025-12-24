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
import { Colors, Gradients, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { INCOME_TYPES, IncomeType } from '../context/IncomeContext';

const { width } = Dimensions.get('window');

interface AddIncomeModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (income: {
    amount: number;
    source: string;
    sourceIcon: string;
    type: IncomeType;
    date: Date;
    note?: string;
    isRecurring: boolean;
    recurringDay?: number;
  }) => void;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [amount, setAmount] = useState('');
  const [selectedType, setSelectedType] = useState<IncomeType | null>(null);
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleAdd = () => {
    if (!amount || !selectedType) return;

    const incomeType = INCOME_TYPES.find((t) => t.id === selectedType);
    if (!incomeType) return;

    const parsedAmount = parseInt(amount.replace(/,/g, ''), 10);

    onAdd({
      amount: parsedAmount,
      source: incomeType.label,
      sourceIcon: incomeType.icon,
      type: incomeType.id,
      date: new Date(),
      note: note.trim() || undefined,
      isRecurring,
      recurringDay: isRecurring ? new Date().getDate() : undefined,
    });

    // Reset form
    setAmount('');
    setSelectedType(null);
    setNote('');
    setIsRecurring(false);
    onClose();
  };

  const formatAmount = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers) {
      return parseInt(numbers, 10).toLocaleString();
    }
    return '';
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatAmount(text));
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
              colors={['rgba(34, 197, 94, 0.15)', 'rgba(10, 10, 15, 0.98)']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <Text style={styles.title}>수입 추가</Text>
                <Text style={styles.subtitle}>Add Income</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {/* Amount Input */}
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={12}
                  />
                </View>

                {/* Income Type Selection */}
                <Text style={styles.sectionTitle}>수입 유형</Text>
                <View style={styles.typesGrid}>
                  {INCOME_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeItem,
                        selectedType === type.id && styles.typeItemSelected,
                      ]}
                      onPress={() => setSelectedType(type.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.typeIcon}>{type.icon}</Text>
                      <Text style={[
                        styles.typeLabel,
                        selectedType === type.id && styles.typeLabelSelected,
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Note Input */}
                <Text style={styles.sectionTitle}>메모 (선택)</Text>
                <View style={styles.noteContainer}>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="예: 12월 급여, 프로젝트 보너스..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    multiline
                    maxLength={100}
                  />
                </View>

                {/* Recurring Option */}
                <View style={styles.recurringOption}>
                  <View style={styles.recurringInfo}>
                    <Text style={styles.recurringLabel}>매월 반복 수입</Text>
                    <Text style={styles.recurringHint}>급여처럼 매월 들어오는 수입</Text>
                  </View>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(34, 197, 94, 0.5)' }}
                    thumbColor={isRecurring ? '#22C55E' : '#f4f3f4'}
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
                      (!amount || !selectedType) && styles.addButtonDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={!amount || !selectedType}
                  >
                    <LinearGradient
                      colors={amount && selectedType ? ['#22C55E', '#16A34A'] : ['#333', '#333']}
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
    borderColor: 'rgba(34, 197, 94, 0.3)',
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.lg,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '300',
    color: '#22C55E',
    marginRight: Spacing.sm,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 100,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.lg,
  },
  typeItem: {
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
  typeItemSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  typeLabelSelected: {
    color: '#22C55E',
    fontWeight: '600',
  },
  noteContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.lg,
  },
  noteInput: {
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  recurringOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  recurringInfo: {
    flex: 1,
  },
  recurringLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  recurringHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
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
