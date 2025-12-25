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
import { Colors, Gradients, Spacing, BorderRadius, FontSizes } from '../constants/theme';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'groceries', label: '식료품', icon: '🥬' },
  { id: 'household', label: '생활용품', icon: '🧴' },
  { id: 'clothing', label: '의류', icon: '👕' },
  { id: 'electronics', label: '전자기기', icon: '📱' },
  { id: 'beauty', label: '뷰티', icon: '💄' },
  { id: 'other', label: '기타', icon: '📦' },
];

const PRIORITIES = [
  { id: 'high', label: '높음', icon: '🔴', color: '#EF4444' },
  { id: 'medium', label: '보통', icon: '🟡', color: '#F59E0B' },
  { id: 'low', label: '낮음', icon: '🟢', color: '#22C55E' },
] as const;

type Priority = 'high' | 'medium' | 'low';

interface AddShoppingItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: {
    name: string;
    category: string;
    estimatedPrice: number;
    priority: Priority;
  }) => void;
}

export const AddShoppingItemModal: React.FC<AddShoppingItemModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');

  const handleAdd = () => {
    if (!name.trim() || !selectedCategory) return;

    onAdd({
      name: name.trim(),
      category: selectedCategory,
      estimatedPrice: parseInt(price.replace(/,/g, ''), 10) || 0,
      priority: selectedPriority,
    });

    // Reset form
    setName('');
    setSelectedCategory(null);
    setPrice('');
    setSelectedPriority('medium');
    onClose();
  };

  const formatPrice = (text: string) => {
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
                <Text style={styles.title}>쇼핑 아이템 추가</Text>
                <Text style={styles.subtitle}>Add Shopping Item</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {/* Name Input */}
                <Text style={styles.sectionTitle}>아이템 이름</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="예: 우유, 샴푸, 티셔츠..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    maxLength={50}
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

                {/* Priority Selection */}
                <Text style={styles.sectionTitle}>우선순위</Text>
                <View style={styles.priorityContainer}>
                  {PRIORITIES.map((priority) => (
                    <TouchableOpacity
                      key={priority.id}
                      style={[
                        styles.priorityItem,
                        selectedPriority === priority.id && styles.priorityItemSelected,
                        selectedPriority === priority.id && { borderColor: priority.color },
                      ]}
                      onPress={() => setSelectedPriority(priority.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.priorityIcon}>{priority.icon}</Text>
                      <Text style={[
                        styles.priorityLabel,
                        selectedPriority === priority.id && { color: priority.color },
                      ]}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Price Input */}
                <Text style={styles.sectionTitle}>예상 가격 (선택)</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={price}
                    onChangeText={(text) => setPrice(formatPrice(text))}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={12}
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
                    (!name.trim() || !selectedCategory) && styles.addButtonDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={!name.trim() || !selectedCategory}
                >
                  <LinearGradient
                    colors={name.trim() && selectedCategory ? Gradients.primary : ['#333', '#333']}
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
    color: Colors.text,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.xl,
  },
  categoryItem: {
    width: (width - Spacing.lg * 2 - Spacing.xs * 6) / 3,
    margin: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  categoryLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: FontSizes.xl,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.xl,
    color: Colors.text,
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
  priorityContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  priorityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priorityItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
  },
  priorityIcon: {
    fontSize: 14,
  },
  priorityLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
