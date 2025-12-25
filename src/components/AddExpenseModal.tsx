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
  Image,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes } from '../constants/theme';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'food', label: '식비', icon: '🍜', color: '#f59e0b' },
  { id: 'transport', label: '교통', icon: '🚇', color: '#3b82f6' },
  { id: 'shopping', label: '쇼핑', icon: '🛍️', color: '#ec4899' },
  { id: 'entertainment', label: '여가', icon: '🎮', color: '#8b5cf6' },
  { id: 'cafe', label: '카페', icon: '☕', color: '#6366f1' },
  { id: 'health', label: '건강', icon: '💊', color: '#10b981' },
  { id: 'bills', label: '공과금', icon: '📄', color: '#64748b' },
  { id: 'other', label: '기타', icon: '📦', color: '#78716c' },
];

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (expense: {
    amount: number;
    category: string;
    categoryLabel: string;
    categoryIcon: string;
    note: string;
    date: Date;
    receiptImage?: string;
  }) => void;
  onSaveTemplate?: (template: {
    name: string;
    amount: number;
    category: string;
    categoryLabel: string;
    categoryIcon: string;
  }) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onAdd,
  onSaveTemplate,
}) => {
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const pickImage = async (useCamera: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Request permissions
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        });

    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      '영수증 첨부',
      '영수증을 어떻게 추가할까요?',
      [
        { text: '카메라', onPress: () => pickImage(true) },
        { text: '갤러리', onPress: () => pickImage(false) },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  const removeImage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReceiptImage(null);
  };

  const handleAdd = () => {
    if (!amount || !selectedCategory) return;

    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return;

    const parsedAmount = parseInt(amount.replace(/,/g, ''), 10);

    onAdd({
      amount: parsedAmount,
      category: category.id,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      note,
      date: new Date(),
      receiptImage: receiptImage || undefined,
    });

    // Save as template if checked
    if (saveAsTemplate && onSaveTemplate && note.trim()) {
      onSaveTemplate({
        name: note.trim(),
        amount: parsedAmount,
        category: category.id,
        categoryLabel: category.label,
        categoryIcon: category.icon,
      });
    }

    // Reset form
    setAmount('');
    setSelectedCategory(null);
    setNote('');
    setSaveAsTemplate(false);
    setReceiptImage(null);
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
              colors={['rgba(124, 58, 237, 0.15)', 'rgba(10, 10, 15, 0.98)']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <Text style={styles.title}>지출 추가</Text>
                <Text style={styles.subtitle}>Add Expense</Text>
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

                {/* Category Selection */}
                <Text style={styles.sectionTitle}>카테고리</Text>
                <View style={styles.categoriesGrid}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory === category.id && styles.categoryItemSelected,
                        selectedCategory === category.id && { borderColor: category.color },
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={[
                        styles.categoryLabel,
                        selectedCategory === category.id && { color: category.color },
                      ]}>
                        {category.label}
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
                    placeholder="예: 점심 식사, 친구와 커피..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    multiline
                    maxLength={100}
                  />
                </View>

                {/* Receipt Photo */}
                <Text style={styles.sectionTitle}>영수증 (선택)</Text>
                {receiptImage ? (
                  <View style={styles.receiptPreviewContainer}>
                    <Image source={{ uri: receiptImage }} style={styles.receiptPreview} />
                    <View style={styles.receiptActions}>
                      <TouchableOpacity
                        style={styles.receiptActionBtn}
                        onPress={showImageOptions}
                      >
                        <Ionicons name="camera" size={18} color={Colors.textSecondary} />
                        <Text style={styles.receiptActionText}>변경</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.receiptActionBtn, styles.receiptRemoveBtn]}
                        onPress={removeImage}
                      >
                        <Ionicons name="trash" size={18} color={Colors.error} />
                        <Text style={[styles.receiptActionText, { color: Colors.error }]}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addReceiptBtn}
                    onPress={showImageOptions}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera-outline" size={28} color={Colors.textMuted} />
                    <Text style={styles.addReceiptText}>영수증 사진 첨부</Text>
                    <Text style={styles.addReceiptHint}>카메라 또는 갤러리에서 선택</Text>
                  </TouchableOpacity>
                )}

                {/* Save as Template */}
                {onSaveTemplate && note.trim() && (
                  <TouchableOpacity
                    style={styles.templateOption}
                    onPress={() => setSaveAsTemplate(!saveAsTemplate)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.templateCheckbox,
                      saveAsTemplate && styles.templateCheckboxChecked
                    ]}>
                      {saveAsTemplate && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.templateOptionText}>빠른 지출로 저장</Text>
                  </TouchableOpacity>
                )}

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
                    (!amount || !selectedCategory) && styles.addButtonDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={!amount || !selectedCategory}
                >
                  <LinearGradient
                    colors={amount && selectedCategory ? Gradients.primary : ['#333', '#333']}
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
    color: Colors.primary,
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
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  noteContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.xl,
  },
  noteInput: {
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    minHeight: 80,
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
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  templateCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateCheckboxChecked: {
    backgroundColor: Colors.purplePrimary,
    borderColor: Colors.purplePrimary,
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  templateOptionText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  addReceiptBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  addReceiptText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  addReceiptHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  receiptPreviewContainer: {
    marginBottom: Spacing.lg,
  },
  receiptPreview: {
    width: '100%',
    height: 150,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  receiptActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.sm,
  },
  receiptRemoveBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  receiptActionText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});
