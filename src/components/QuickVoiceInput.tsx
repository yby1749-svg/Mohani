import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Keyboard,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  Gradients,
} from '../constants/theme';

interface ParsedExpense {
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  note: string;
}

interface QuickVoiceInputProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (expense: {
    amount: number;
    category: string;
    categoryLabel: string;
    categoryIcon: string;
    note: string;
    date: Date;
  }) => void;
}

const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; label: string; icon: string }> = {
  food: {
    keywords: ['밥', '식사', '점심', '저녁', '아침', '식비', '음식', '배달', '치킨', '피자', '햄버거', '국밥', '라면', '삼겹살', '고기', '회', '초밥', '떡볶이'],
    label: '식비',
    icon: '🍜',
  },
  cafe: {
    keywords: ['커피', '카페', '스타벅스', '아메리카노', '라떼', '음료', '카공', '디저트', '케이크', '빵', '베이커리'],
    label: '카페',
    icon: '☕',
  },
  transport: {
    keywords: ['택시', '버스', '지하철', '교통', '기차', 'ktx', '주유', '기름', '톨', '하이패스', '주차', '대리', '카카오택시', '우버'],
    label: '교통',
    icon: '🚇',
  },
  shopping: {
    keywords: ['쇼핑', '옷', '신발', '가방', '액세서리', '화장품', '마트', '장보기', '이마트', '홈플러스', '쿠팡', '온라인', '택배'],
    label: '쇼핑',
    icon: '🛍️',
  },
  entertainment: {
    keywords: ['영화', '게임', '여가', '술', '맥주', '소주', '노래방', '볼링', '당구', '피시방', 'pc방', '넷플릭스', '유튜브', '콘서트', '공연'],
    label: '여가',
    icon: '🎮',
  },
  health: {
    keywords: ['병원', '약', '약국', '건강', '헬스', '운동', '필라테스', '요가', '치과', '안과', '피부과', '영양제', '비타민'],
    label: '건강',
    icon: '💊',
  },
  bills: {
    keywords: ['공과금', '전기', '가스', '수도', '인터넷', '휴대폰', '통신', '관리비', '월세', '보험'],
    label: '공과금',
    icon: '📄',
  },
  other: {
    keywords: [],
    label: '기타',
    icon: '📦',
  },
};

const parseExpenseInput = (input: string): ParsedExpense | null => {
  if (!input.trim()) return null;

  // Extract amount - look for numbers with optional 원/만원
  const amountPatterns = [
    /(\d{1,3}(?:,\d{3})*)\s*원/,  // 12,000원 or 12000원
    /(\d+(?:\.\d+)?)\s*만\s*원?/,  // 1.5만원 or 1만원
    /(\d{1,3}(?:,\d{3})*)/,        // Just numbers like 12000
    /(\d+)/,                        // Any number
  ];

  let amount = 0;
  let amountMatch = null;

  for (const pattern of amountPatterns) {
    amountMatch = input.match(pattern);
    if (amountMatch) {
      const numStr = amountMatch[1].replace(/,/g, '');
      if (input.includes('만')) {
        amount = parseFloat(numStr) * 10000;
      } else {
        amount = parseInt(numStr, 10);
      }
      break;
    }
  }

  if (amount === 0) return null;

  // Find category based on keywords
  let matchedCategory = 'other';
  let matchedLabel = '기타';
  let matchedIcon = '📦';
  const lowerInput = input.toLowerCase();

  for (const [categoryId, categoryData] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of categoryData.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        matchedCategory = categoryId;
        matchedLabel = categoryData.label;
        matchedIcon = categoryData.icon;
        break;
      }
    }
    if (matchedCategory !== 'other') break;
  }

  // Create note from input (remove amount)
  let note = input
    .replace(/\d{1,3}(?:,\d{3})*\s*원?/g, '')
    .replace(/\d+(?:\.\d+)?\s*만\s*원?/g, '')
    .replace(/\d+/g, '')
    .trim();

  // If note is empty, use category label
  if (!note) {
    note = matchedLabel;
  }

  return {
    amount,
    category: matchedCategory,
    categoryLabel: matchedLabel,
    categoryIcon: matchedIcon,
    note,
  };
};

export const QuickVoiceInput: React.FC<QuickVoiceInputProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [input, setInput] = useState('');
  const [parsedExpense, setParsedExpense] = useState<ParsedExpense | null>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      setInput('');
      setParsedExpense(null);
      pulseAnim.stopAnimation();
    }
  }, [visible]);

  useEffect(() => {
    const parsed = parseExpenseInput(input);
    setParsedExpense(parsed);
  }, [input]);

  const handleConfirm = () => {
    if (!parsedExpense) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      ...parsedExpense,
      date: new Date(),
    });
    setInput('');
    setParsedExpense(null);
    onClose();
  };

  const handleQuickAmount = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentInput = input.replace(/\d{1,3}(?:,\d{3})*\s*원?/g, '').replace(/\d+/g, '').trim();
    setInput(`${currentInput} ${amount.toLocaleString()}원`.trim());
  };

  const examples = [
    '점심 12000원',
    '커피 5500',
    '택시 8000원',
    '쇼핑 3만원',
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Animated.View style={[styles.micIcon, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                  colors={Gradients.purple as [string, string]}
                  style={styles.micIconGradient}
                >
                  <Ionicons name="mic" size={28} color={Colors.textPrimary} />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.title}>빠른 지출 입력</Text>
              <Text style={styles.subtitle}>자연어로 입력하세요</Text>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="예: 점심 12000원"
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline={false}
                autoFocus
              />
              {input.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setInput('')}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmounts}>
              {[5000, 10000, 15000, 30000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountBtn}
                  onPress={() => handleQuickAmount(amount)}
                >
                  <Text style={styles.quickAmountText}>
                    {amount >= 10000 ? `${amount / 10000}만` : `${amount / 1000}천`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Examples */}
            {!input && (
              <View style={styles.examples}>
                <Text style={styles.examplesTitle}>예시:</Text>
                <View style={styles.exampleTags}>
                  {examples.map((example, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.exampleTag}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setInput(example);
                      }}
                    >
                      <Text style={styles.exampleText}>{example}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Parsed Preview */}
            {parsedExpense && (
              <View style={styles.preview}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewIcon}>{parsedExpense.categoryIcon}</Text>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewNote}>{parsedExpense.note}</Text>
                    <Text style={styles.previewCategory}>{parsedExpense.categoryLabel}</Text>
                  </View>
                  <Text style={styles.previewAmount}>
                    ₩{parsedExpense.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !parsedExpense && styles.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={!parsedExpense}
              >
                <LinearGradient
                  colors={parsedExpense ? Gradients.primary as [string, string] : ['#333', '#333']}
                  style={styles.confirmGradient}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.textPrimary} />
                  <Text style={styles.confirmText}>추가</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    backgroundColor: 'rgba(20, 20, 25, 0.95)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  micIcon: {
    marginBottom: Spacing.md,
  },
  micIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickAmountBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: BorderRadius.full,
  },
  quickAmountText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  examples: {
    marginBottom: Spacing.lg,
  },
  examplesTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  exampleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  exampleTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exampleText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  preview: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  previewIcon: {
    fontSize: 32,
  },
  previewInfo: {
    flex: 1,
  },
  previewNote: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  previewCategory: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  previewAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.success,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  confirmText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default QuickVoiceInput;
