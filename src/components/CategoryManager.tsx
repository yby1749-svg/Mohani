import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import {
  useCustomCategories,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CustomCategory,
} from '../context/CustomCategoriesContext';

const CategoryManager: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleHidden,
    getVisibleCategories,
  } = useCustomCategories();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);

  const visibleCategories = getVisibleCategories();
  const hiddenCategories = categories.filter((c) => c.isHidden);

  const handleAddCategory = async () => {
    if (!name.trim()) {
      Alert.alert('오류', '카테고리 이름을 입력해주세요');
      return;
    }

    // Create a unique key
    const key = name.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

    await addCategory({
      key,
      label: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      isHidden: false,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !name.trim()) return;

    await updateCategory(editingCategory.id, {
      label: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowEditModal(false);
    setEditingCategory(null);
    resetForm();
  };

  const handleDeleteCategory = (category: CustomCategory) => {
    if (category.isDefault) {
      Alert.alert('알림', '기본 카테고리는 삭제할 수 없습니다. 숨김 처리만 가능합니다.');
      return;
    }

    Alert.alert(
      '카테고리 삭제',
      `"${category.label}" 카테고리를 삭제하시겠습니까?\n\n⚠️ 이 카테고리의 지출 내역은 "기타"로 변경됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteCategory(category.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleToggleHidden = async (category: CustomCategory) => {
    await toggleHidden(category.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openEditModal = (category: CustomCategory) => {
    setEditingCategory(category);
    setName(category.label);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setSelectedIcon(CATEGORY_ICONS[0]);
    setSelectedColor(CATEGORY_COLORS[0]);
  };

  const renderCategoryModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        isEdit ? setShowEditModal(false) : setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <Animated.View entering={SlideInUp} style={styles.modalContent}>
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.05)']}
            style={styles.modalGradient}
          >
            <Text style={styles.modalTitle}>
              {isEdit ? '카테고리 수정' : '새 카테고리 추가'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="카테고리 이름"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>아이콘</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.iconScrollView}
            >
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.selectedIconOption,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>색상</Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.label}>미리보기</Text>
              <View style={[styles.previewChip, { backgroundColor: selectedColor + '30', borderColor: selectedColor }]}>
                <Text style={styles.previewIcon}>{selectedIcon}</Text>
                <Text style={[styles.previewLabel, { color: selectedColor }]}>
                  {name || '카테고리 이름'}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  isEdit ? setShowEditModal(false) : setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={isEdit ? handleEditCategory : handleAddCategory}
              >
                <LinearGradient
                  colors={[Colors.purplePrimary, Colors.purpleSecondary]}
                  style={styles.saveGradient}
                >
                  <Text style={styles.saveText}>{isEdit ? '저장' : '추가'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <Text style={styles.headerTitle}>📁 카테고리 관리</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ 새 카테고리</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Active Categories */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <Text style={styles.sectionTitle}>활성 카테고리 ({visibleCategories.length})</Text>
        <View style={styles.categoriesGrid}>
          {visibleCategories.map((category, index) => (
            <Animated.View key={category.id} entering={FadeIn.delay(index * 30)}>
              <TouchableOpacity
                style={[styles.categoryCard, { borderColor: category.color }]}
                onPress={() => openEditModal(category)}
                onLongPress={() => handleToggleHidden(category)}
              >
                <View style={[styles.categoryIconBg, { backgroundColor: category.color + '20' }]}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
                {category.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>기본</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Hidden Categories */}
      {hiddenCategories.length > 0 && (
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>숨겨진 카테고리 ({hiddenCategories.length})</Text>
          <View style={styles.hiddenGrid}>
            {hiddenCategories.map((category, index) => (
              <Animated.View key={category.id} entering={FadeIn.delay(index * 30)}>
                <TouchableOpacity
                  style={styles.hiddenCategory}
                  onPress={() => handleToggleHidden(category)}
                  onLongPress={() => handleDeleteCategory(category)}
                >
                  <Text style={styles.hiddenIcon}>{category.icon}</Text>
                  <Text style={styles.hiddenLabel}>{category.label}</Text>
                  <Text style={styles.showButton}>표시</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Instructions */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.instructions}>
        <Text style={styles.instructionText}>💡 탭: 수정 | 길게 누르기: 숨김/표시</Text>
      </Animated.View>

      {/* Modals */}
      {renderCategoryModal(false)}
      {renderCategoryModal(true)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addButton: {
    backgroundColor: Colors.purplePrimary + '30',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: Colors.purplePrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    minWidth: 80,
  },
  categoryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  defaultBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 8,
    color: Colors.goldPrimary,
  },
  hiddenGrid: {
    gap: Spacing.sm,
  },
  hiddenCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.md,
    opacity: 0.6,
  },
  hiddenIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  hiddenLabel: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  showButton: {
    fontSize: FontSizes.sm,
    color: Colors.purplePrimary,
    fontWeight: '600',
  },
  instructions: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  instructionText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  iconScrollView: {
    marginBottom: Spacing.lg,
  },
  iconGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconOption: {
    borderWidth: 2,
    borderColor: Colors.purplePrimary,
  },
  iconText: {
    fontSize: 22,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: Colors.textPrimary,
  },
  previewSection: {
    marginBottom: Spacing.lg,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginTop: Spacing.sm,
  },
  previewIcon: {
    fontSize: 20,
  },
  previewLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  saveGradient: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  saveText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});

export default CategoryManager;
