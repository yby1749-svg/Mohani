import React, { useState, useMemo } from 'react';
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
  ActivityIndicator,
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
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useExpenses, Expense, ExpenseSplit, ExpenseLocation } from '../context/ExpenseContext';
import { SplitExpenseModal } from './SplitExpenseModal';
import { getCategorySuggestions, CategorySuggestion } from '../utils/categorySuggestion';

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
    split?: ExpenseSplit;
    location?: ExpenseLocation;
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
  const [duplicateWarningDismissed, setDuplicateWarningDismissed] = useState(false);
  const [splitData, setSplitData] = useState<ExpenseSplit | null>(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationData, setLocationData] = useState<ExpenseLocation | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { expenses } = useExpenses();

  // Duplicate detection
  interface PotentialDuplicate {
    expense: Expense;
    reason: string;
    confidence: 'high' | 'medium';
  }

  const potentialDuplicate = useMemo((): PotentialDuplicate | null => {
    if (duplicateWarningDismissed) return null;
    if (!amount) return null;

    const parsedAmount = parseInt(amount.replace(/,/g, ''), 10);
    if (isNaN(parsedAmount) || parsedAmount === 0) return null;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check for exact matches (same amount within 1 hour) - High confidence
    const exactMatch = expenses.find((e) => {
      const expenseDate = new Date(e.date);
      return (
        e.amount === parsedAmount &&
        expenseDate >= oneHourAgo &&
        expenseDate <= now
      );
    });

    if (exactMatch) {
      return {
        expense: exactMatch,
        reason: '1시간 내 동일 금액',
        confidence: 'high',
      };
    }

    // Check for same category + similar amount today - Medium confidence
    if (selectedCategory) {
      const similarMatch = expenses.find((e) => {
        const expenseDate = new Date(e.date);
        const amountDiff = Math.abs(e.amount - parsedAmount);
        const amountSimilar = amountDiff <= parsedAmount * 0.1; // Within 10%
        return (
          e.category === selectedCategory &&
          amountSimilar &&
          expenseDate >= todayStart &&
          expenseDate <= now
        );
      });

      if (similarMatch) {
        return {
          expense: similarMatch,
          reason: '오늘 비슷한 지출',
          confidence: 'medium',
        };
      }
    }

    // Check for same note today - Medium confidence
    if (note.trim().length >= 3) {
      const noteMatch = expenses.find((e) => {
        const expenseDate = new Date(e.date);
        const noteLower = note.toLowerCase().trim();
        const expenseNoteLower = (e.note || '').toLowerCase().trim();
        return (
          expenseNoteLower.includes(noteLower) &&
          expenseDate >= todayStart &&
          expenseDate <= now
        );
      });

      if (noteMatch) {
        return {
          expense: noteMatch,
          reason: '오늘 유사한 메모',
          confidence: 'medium',
        };
      }
    }

    return null;
  }, [amount, selectedCategory, note, expenses, duplicateWarningDismissed]);

  const formatDuplicateTime = (date: Date): string => {
    const d = new Date(date);
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  };

  // Smart category suggestions
  const categorySuggestions = useMemo((): CategorySuggestion[] => {
    if (selectedCategory) return []; // Don't suggest if already selected
    const parsedAmount = parseInt(amount.replace(/,/g, '') || '0', 10);
    return getCategorySuggestions(note, parsedAmount, expenses, CATEGORIES);
  }, [note, amount, expenses, selectedCategory]);

  const handleSuggestionPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(categoryId);
  };

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 권한이 필요합니다.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Try to get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      let placeName = '';
      if (address) {
        const parts = [address.name, address.street, address.district].filter(Boolean);
        placeName = parts.join(' ') || `${address.city || ''} ${address.region || ''}`.trim();
      }

      setLocationName(placeName || '현재 위치');
      setLocationData({
        name: placeName || '현재 위치',
        address: address ? `${address.city || ''} ${address.district || ''} ${address.street || ''}`.trim() : undefined,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('오류', '위치를 가져올 수 없습니다.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const clearLocation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocationName('');
    setLocationData(null);
  };

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

    // Build location from either locationData (from GPS) or manual locationName
    const finalLocation: ExpenseLocation | undefined = locationData
      ? locationData
      : locationName.trim()
        ? { name: locationName.trim() }
        : undefined;

    onAdd({
      amount: parsedAmount,
      category: category.id,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      note,
      date: new Date(),
      receiptImage: receiptImage || undefined,
      split: splitData || undefined,
      location: finalLocation,
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
    setDuplicateWarningDismissed(false);
    setSplitData(null);
    setLocationName('');
    setLocationData(null);
    onClose();
  };

  const parsedAmountForSplit = parseInt(amount.replace(/,/g, '') || '0', 10);

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

                {/* Smart Category Suggestions */}
                {categorySuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <View style={styles.suggestionsHeader}>
                      <Ionicons name="sparkles" size={14} color={Colors.purpleLight} />
                      <Text style={styles.suggestionsLabel}>추천</Text>
                    </View>
                    <View style={styles.suggestionsRow}>
                      {categorySuggestions.map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion.category.id}
                          style={[
                            styles.suggestionChip,
                            { borderColor: suggestion.category.color }
                          ]}
                          onPress={() => handleSuggestionPress(suggestion.category.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.suggestionIcon}>{suggestion.category.icon}</Text>
                          <Text style={[styles.suggestionLabel, { color: suggestion.category.color }]}>
                            {suggestion.category.label}
                          </Text>
                          {suggestion.confidence >= 70 && (
                            <View style={[styles.confidenceBadge, { backgroundColor: suggestion.category.color }]}>
                              <Text style={styles.confidenceText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

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

                {/* Duplicate Warning */}
                {potentialDuplicate && (
                  <View style={[
                    styles.duplicateWarning,
                    potentialDuplicate.confidence === 'high' && styles.duplicateWarningHigh
                  ]}>
                    <View style={styles.duplicateHeader}>
                      <Ionicons
                        name="warning"
                        size={20}
                        color={potentialDuplicate.confidence === 'high' ? Colors.error : '#f59e0b'}
                      />
                      <Text style={[
                        styles.duplicateTitle,
                        potentialDuplicate.confidence === 'high' && styles.duplicateTitleHigh
                      ]}>
                        중복 의심
                      </Text>
                      <TouchableOpacity
                        style={styles.duplicateDismiss}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setDuplicateWarningDismissed(true);
                        }}
                      >
                        <Ionicons name="close" size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.duplicateContent}>
                      <Text style={styles.duplicateReason}>{potentialDuplicate.reason}</Text>
                      <View style={styles.duplicateExpense}>
                        <Text style={styles.duplicateIcon}>{potentialDuplicate.expense.categoryIcon}</Text>
                        <View style={styles.duplicateInfo}>
                          <Text style={styles.duplicateNote}>
                            {potentialDuplicate.expense.note || potentialDuplicate.expense.categoryLabel}
                          </Text>
                          <Text style={styles.duplicateTime}>
                            {formatDuplicateTime(potentialDuplicate.expense.date)}에 추가됨
                          </Text>
                        </View>
                        <Text style={styles.duplicateAmount}>
                          ₩{potentialDuplicate.expense.amount.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

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

                {/* Location Input */}
                <Text style={styles.sectionTitle}>위치 (선택)</Text>
                <View style={styles.locationContainer}>
                  <View style={styles.locationInputRow}>
                    <Ionicons name="location-outline" size={20} color={Colors.textMuted} />
                    <TextInput
                      style={styles.locationInput}
                      value={locationName}
                      onChangeText={(text) => {
                        setLocationName(text);
                        if (locationData) setLocationData(null);
                      }}
                      placeholder="예: 스타벅스 강남점"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      maxLength={50}
                    />
                    {(locationName || locationData) && (
                      <TouchableOpacity onPress={clearLocation} style={styles.locationClearBtn}>
                        <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.currentLocationBtn}
                    onPress={getCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <ActivityIndicator size="small" color={Colors.purpleLight} />
                    ) : (
                      <>
                        <Ionicons name="navigate" size={16} color={Colors.purpleLight} />
                        <Text style={styles.currentLocationText}>현재 위치</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {locationData?.address && (
                    <Text style={styles.locationAddress}>{locationData.address}</Text>
                  )}
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

                {/* Split Expense */}
                {amount && parsedAmountForSplit > 0 && (
                  <View style={styles.splitSection}>
                    <Text style={styles.sectionTitle}>나누기 (선택)</Text>
                    {splitData ? (
                      <View style={styles.splitSummary}>
                        <View style={styles.splitInfo}>
                          <Ionicons name="people" size={20} color={Colors.success} />
                          <Text style={styles.splitText}>
                            {splitData.participants.length}명과 나눔
                          </Text>
                          <Text style={styles.splitMyShare}>
                            내 몫: ₩{splitData.myShare.toLocaleString()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.splitEditBtn}
                          onPress={() => setShowSplitModal(true)}
                        >
                          <Text style={styles.splitEditText}>수정</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.splitRemoveBtn}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSplitData(null);
                          }}
                        >
                          <Ionicons name="close" size={18} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.splitBtn}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setShowSplitModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="people-outline" size={24} color={Colors.textMuted} />
                        <Text style={styles.splitBtnText}>친구와 나누기</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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

      {/* Split Modal */}
      <SplitExpenseModal
        visible={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        onSplit={(split) => {
          setSplitData(split);
          setShowSplitModal(false);
        }}
        totalAmount={parsedAmountForSplit}
      />
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
  duplicateWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  duplicateWarningHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  duplicateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  duplicateTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: Spacing.xs,
    flex: 1,
  },
  duplicateTitleHigh: {
    color: Colors.error,
  },
  duplicateDismiss: {
    padding: 4,
  },
  duplicateContent: {
    marginLeft: Spacing.sm + 20,
  },
  duplicateReason: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  duplicateExpense: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  duplicateIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  duplicateInfo: {
    flex: 1,
  },
  duplicateNote: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  duplicateTime: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  duplicateAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  splitSection: {
    marginBottom: Spacing.lg,
  },
  splitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    padding: Spacing.lg,
  },
  splitBtnText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  splitSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: Spacing.md,
  },
  splitInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  splitText: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    fontWeight: '500',
  },
  splitMyShare: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  splitEditBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  splitEditText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  splitRemoveBtn: {
    padding: 4,
  },
  suggestionsContainer: {
    marginBottom: Spacing.md,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  suggestionsLabel: {
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
    fontWeight: '500',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  suggestionIcon: {
    fontSize: 16,
  },
  suggestionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  confidenceBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  confidenceText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '700',
  },
  locationContainer: {
    marginBottom: Spacing.lg,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  locationInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  locationClearBtn: {
    padding: 4,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: BorderRadius.sm,
  },
  currentLocationText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
