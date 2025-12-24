import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, SlideInUp } from 'react-native-reanimated';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { useTags, TAG_COLORS, TAG_ICONS, Tag } from '../context/TagsContext';

interface TagManagerProps {
  selectedTags?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  mode?: 'select' | 'manage';
}

const TagManager: React.FC<TagManagerProps> = ({
  selectedTags = [],
  onTagsChange,
  mode = 'manage',
}) => {
  const { tags, addTag, updateTag, deleteTag, getMostUsedTags } = useTags();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(TAG_ICONS[0]);

  const handleToggleTag = (tagId: string) => {
    if (!onTagsChange) return;

    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('오류', '태그 이름을 입력해주세요');
      return;
    }

    await addTag({
      name: newTagName.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });

    setNewTagName('');
    setSelectedColor(TAG_COLORS[0]);
    setSelectedIcon(TAG_ICONS[0]);
    setShowAddModal(false);
  };

  const handleEditTag = async () => {
    if (!editingTag || !newTagName.trim()) return;

    await updateTag(editingTag.id, {
      name: newTagName.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });

    setEditingTag(null);
    setShowEditModal(false);
  };

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(
      '태그 삭제',
      `"${tag.name}" 태그를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteTag(tag.id),
        },
      ]
    );
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setSelectedColor(tag.color);
    setSelectedIcon(tag.icon);
    setShowEditModal(true);
  };

  const mostUsed = getMostUsedTags(5);

  return (
    <View style={styles.container}>
      {/* Most Used Tags */}
      {mode === 'select' && mostUsed.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.sectionTitle}>자주 사용하는 태그</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickTags}>
            {mostUsed.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.quickTag,
                  { backgroundColor: tag.color + '30' },
                  selectedTags.includes(tag.id) && styles.selectedQuickTag,
                ]}
                onPress={() => handleToggleTag(tag.id)}
              >
                <Text style={styles.quickTagIcon}>{tag.icon}</Text>
                <Text style={[styles.quickTagText, { color: tag.color }]}>{tag.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* All Tags */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>
            {mode === 'select' ? '모든 태그' : '태그 관리'}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ 새 태그</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tagsGrid}>
          {tags.map((tag, index) => (
            <Animated.View
              key={tag.id}
              entering={FadeIn.delay(index * 50)}
            >
              <TouchableOpacity
                style={[
                  styles.tagChip,
                  { backgroundColor: tag.color + '20', borderColor: tag.color },
                  selectedTags.includes(tag.id) && {
                    backgroundColor: tag.color,
                  },
                ]}
                onPress={() => mode === 'select' ? handleToggleTag(tag.id) : openEditModal(tag)}
                onLongPress={() => mode === 'manage' && handleDeleteTag(tag)}
              >
                <Text style={styles.tagIcon}>{tag.icon}</Text>
                <Text
                  style={[
                    styles.tagText,
                    {
                      color: selectedTags.includes(tag.id) ? '#fff' : tag.color,
                    },
                  ]}
                >
                  {tag.name}
                </Text>
                {mode === 'manage' && (
                  <Text style={styles.usageCount}>{tag.usageCount}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Add Tag Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInUp} style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.05)']}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>새 태그 추가</Text>

              <TextInput
                style={styles.input}
                placeholder="태그 이름"
                placeholderTextColor={Colors.textSecondary}
                value={newTagName}
                onChangeText={setNewTagName}
              />

              <Text style={styles.label}>아이콘</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconRow}>
                  {TAG_ICONS.map((icon) => (
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
              <View style={styles.colorRow}>
                {TAG_COLORS.map((color) => (
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

              <View style={styles.previewRow}>
                <Text style={styles.label}>미리보기</Text>
                <View
                  style={[
                    styles.previewChip,
                    { backgroundColor: selectedColor + '20', borderColor: selectedColor },
                  ]}
                >
                  <Text style={styles.previewIcon}>{selectedIcon}</Text>
                  <Text style={[styles.previewText, { color: selectedColor }]}>
                    {newTagName || '태그 이름'}
                  </Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddTag}>
                  <LinearGradient
                    colors={[Colors.purplePrimary, Colors.purpleSecondary]}
                    style={styles.saveGradient}
                  >
                    <Text style={styles.saveText}>추가</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Edit Tag Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInUp} style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.05)']}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>태그 수정</Text>

              <TextInput
                style={styles.input}
                placeholder="태그 이름"
                placeholderTextColor={Colors.textSecondary}
                value={newTagName}
                onChangeText={setNewTagName}
              />

              <Text style={styles.label}>아이콘</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconRow}>
                  {TAG_ICONS.map((icon) => (
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
              <View style={styles.colorRow}>
                {TAG_COLORS.map((color) => (
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

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleEditTag}>
                  <LinearGradient
                    colors={[Colors.purplePrimary, Colors.purpleSecondary]}
                    style={styles.saveGradient}
                  >
                    <Text style={styles.saveText}>저장</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addButton: {
    backgroundColor: Colors.purplePrimary + '30',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: Colors.purplePrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  quickTags: {
    marginBottom: Spacing.lg,
  },
  quickTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
  },
  selectedQuickTag: {
    borderWidth: 2,
    borderColor: Colors.textPrimary,
  },
  quickTagIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  quickTagText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  tagIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  tagText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  usageCount: {
    marginLeft: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
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
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    textAlign: 'center',
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
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
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
    fontSize: 20,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: Colors.textPrimary,
  },
  previewRow: {
    marginBottom: Spacing.lg,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  previewIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  previewText: {
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

export default TagManager;
