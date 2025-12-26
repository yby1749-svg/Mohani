import React, { useState, useEffect } from 'react';
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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Gradients, LightGradients, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

const MOODS = [
  { id: 'great', emoji: '😊', label: '최고', color: '#10b981' },
  { id: 'good', emoji: '🙂', label: '좋음', color: '#3b82f6' },
  { id: 'okay', emoji: '😐', label: '보통', color: '#f59e0b' },
  { id: 'bad', emoji: '😔', label: '별로', color: '#f97316' },
  { id: 'awful', emoji: '😢', label: '최악', color: '#ef4444' },
];

const TAGS = [
  { id: 'work', label: '일', icon: '💼' },
  { id: 'exercise', label: '운동', icon: '🏃' },
  { id: 'food', label: '맛집', icon: '🍽️' },
  { id: 'friends', label: '친구', icon: '👥' },
  { id: 'family', label: '가족', icon: '👨‍👩‍👧' },
  { id: 'hobby', label: '취미', icon: '🎨' },
  { id: 'travel', label: '여행', icon: '✈️' },
  { id: 'shopping', label: '쇼핑', icon: '🛍️' },
  { id: 'health', label: '건강', icon: '💊' },
  { id: 'study', label: '공부', icon: '📚' },
];

interface AddDiaryModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: {
    mood: string;
    moodLabel: string;
    content: string;
    tags: string[];
    date: Date;
  }) => void;
  existingEntry?: {
    mood: string;
    content: string;
    tags: string[];
  };
  selectedDate?: Date;
}

export const AddDiaryModal: React.FC<AddDiaryModalProps> = ({
  visible,
  onClose,
  onAdd,
  existingEntry,
  selectedDate,
}) => {
  const { colors, isDark } = useTheme();
  const gradients = isDark ? Gradients : LightGradients;
  const [selectedMood, setSelectedMood] = useState<string | null>(existingEntry?.mood || null);
  const [content, setContent] = useState(existingEntry?.content || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(existingEntry?.tags || []);

  useEffect(() => {
    if (existingEntry) {
      setSelectedMood(existingEntry.mood);
      setContent(existingEntry.content);
      setSelectedTags(existingEntry.tags);
    } else {
      setSelectedMood(null);
      setContent('');
      setSelectedTags([]);
    }
  }, [existingEntry, visible]);

  const handleAdd = () => {
    if (!selectedMood || !content.trim()) return;

    const mood = MOODS.find((m) => m.id === selectedMood);
    if (!mood) return;

    onAdd({
      mood: mood.id,
      moodLabel: mood.label,
      content: content.trim(),
      tags: selectedTags,
      date: selectedDate || new Date(),
    });

    // Reset form
    setSelectedMood(null);
    setContent('');
    setSelectedTags([]);
    onClose();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const formatDate = (date: Date) => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getFullYear()}년 ${months[date.getMonth()]} ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.overlay}>
        <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
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
              colors={isDark ? ['rgba(124, 58, 237, 0.15)', 'rgba(10, 10, 15, 0.98)'] : ['rgba(124, 58, 237, 0.08)', 'rgba(255, 255, 255, 0.98)']}
              style={[styles.modalGradient, { borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.2)' }]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]} />
                <Text style={[styles.title, { color: colors.text }]}>오늘의 일기</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{formatDate(selectedDate || new Date())}</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {/* Mood Selection */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>오늘 기분은 어때요?</Text>
                <View style={styles.moodsContainer}>
                  {MOODS.map((mood) => (
                    <TouchableOpacity
                      key={mood.id}
                      style={[
                        styles.moodItem,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        },
                        selectedMood === mood.id && styles.moodItemSelected,
                        selectedMood === mood.id && { borderColor: mood.color, backgroundColor: `${mood.color}${isDark ? '20' : '15'}` },
                      ]}
                      onPress={() => setSelectedMood(mood.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      <Text style={[
                        styles.moodLabel,
                        { color: colors.textSecondary },
                        selectedMood === mood.id && { color: mood.color },
                      ]}>
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Content Input */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>오늘 하루는 어땠나요?</Text>
                <View style={[
                  styles.contentContainer,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  }
                ]}>
                  <TextInput
                    style={[styles.contentInput, { color: colors.text }]}
                    value={content}
                    onChangeText={setContent}
                    placeholder="오늘 있었던 일, 느낀 점, 감사한 일 등을 자유롭게 적어보세요..."
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.charCount, { color: colors.textMuted }]}>{content.length}/500</Text>
                </View>

                {/* Tags */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>태그 (선택)</Text>
                <View style={styles.tagsContainer}>
                  {TAGS.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagItem,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        },
                        selectedTags.includes(tag.id) && {
                          backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.12)',
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => toggleTag(tag.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tagIcon}>{tag.icon}</Text>
                      <Text style={[
                        styles.tagLabel,
                        { color: colors.textSecondary },
                        selectedTags.includes(tag.id) && { color: colors.primary },
                      ]}>
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.scrollBottomSpacer} />
              </ScrollView>

              {/* Buttons - Fixed at bottom */}
              <View style={[
                styles.buttonContainer,
                {
                  backgroundColor: isDark ? 'rgba(10, 10, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                }
              ]}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }
                  ]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    (!selectedMood || !content.trim()) && styles.addButtonDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={!selectedMood || !content.trim()}
                >
                  <LinearGradient
                    colors={selectedMood && content.trim() ? gradients.primary : (isDark ? ['#333', '#333'] : ['#ccc', '#ccc'])}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addButtonGradient}
                  >
                    <Text style={[styles.addButtonText, { color: selectedMood && content.trim() ? '#FFFFFF' : colors.textSecondary }]}>
                      {existingEntry ? '수정하기' : '저장하기'}
                    </Text>
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
    maxHeight: '92%',
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
  moodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  moodItem: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: (width - Spacing.lg * 2 - Spacing.sm * 4) / 5,
  },
  moodItemSelected: {
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  contentContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.xl,
  },
  contentInput: {
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    minHeight: 150,
    lineHeight: 24,
  },
  charCount: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.md,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: Colors.primary,
  },
  tagIcon: {
    fontSize: 14,
  },
  tagLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  tagLabelSelected: {
    color: Colors.primary,
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
