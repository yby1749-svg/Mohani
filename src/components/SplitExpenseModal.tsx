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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useExpenses, Friend, ExpenseSplit, SplitParticipant } from '../context/ExpenseContext';

const EMOJI_OPTIONS = ['😊', '😎', '🤓', '😄', '🙂', '👤', '👩', '👨', '🧑', '👧', '👦', '🐱'];

interface SplitExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSplit: (split: ExpenseSplit) => void;
  totalAmount: number;
}

export const SplitExpenseModal: React.FC<SplitExpenseModalProps> = ({
  visible,
  onClose,
  onSplit,
  totalAmount,
}) => {
  const { friends, addFriend, removeFriend } = useExpenses();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [paidByMe, setPaidByMe] = useState(true);

  const participantCount = selectedFriends.length + 1; // +1 for myself

  const splitAmounts = useMemo(() => {
    if (splitType === 'equal') {
      const perPerson = Math.floor(totalAmount / participantCount);
      const amounts: Record<string, number> = {};
      selectedFriends.forEach((id) => {
        amounts[id] = perPerson;
      });
      return amounts;
    } else {
      const amounts: Record<string, number> = {};
      selectedFriends.forEach((id) => {
        amounts[id] = parseInt(customAmounts[id]?.replace(/,/g, '') || '0', 10);
      });
      return amounts;
    }
  }, [splitType, selectedFriends, totalAmount, participantCount, customAmounts]);

  const myShare = useMemo(() => {
    const othersTotal = Object.values(splitAmounts).reduce((sum, amt) => sum + amt, 0);
    return totalAmount - othersTotal;
  }, [totalAmount, splitAmounts]);

  const handleAddFriend = () => {
    if (newFriendName.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addFriend(newFriendName.trim(), selectedEmoji);
      setNewFriendName('');
      setSelectedEmoji(EMOJI_OPTIONS[0]);
      setShowAddFriend(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSplit = () => {
    if (selectedFriends.length === 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const participants: SplitParticipant[] = selectedFriends.map((friendId) => {
      const friend = friends.find((f) => f.id === friendId);
      return {
        id: friendId,
        name: friend?.name || '',
        amount: splitAmounts[friendId],
        isPaid: false,
      };
    });

    onSplit({
      totalAmount,
      participants,
      myShare,
      paidByMe,
    });

    // Reset state
    setSelectedFriends([]);
    setSplitType('equal');
    setCustomAmounts({});
    setPaidByMe(true);
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
              colors={['rgba(16, 185, 129, 0.15)', 'rgba(10, 10, 15, 0.98)']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <Text style={styles.title}>비용 나누기</Text>
                <Text style={styles.subtitle}>₩{totalAmount.toLocaleString()}</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {/* Who Paid */}
                <Text style={styles.sectionTitle}>누가 결제했나요?</Text>
                <View style={styles.paidByContainer}>
                  <TouchableOpacity
                    style={[styles.paidByOption, paidByMe && styles.paidByOptionActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPaidByMe(true);
                    }}
                  >
                    <Text style={styles.paidByEmoji}>🙋</Text>
                    <Text style={[styles.paidByText, paidByMe && styles.paidByTextActive]}>
                      내가 결제
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.paidByOption, !paidByMe && styles.paidByOptionActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPaidByMe(false);
                    }}
                  >
                    <Text style={styles.paidByEmoji}>👥</Text>
                    <Text style={[styles.paidByText, !paidByMe && styles.paidByTextActive]}>
                      친구가 결제
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Select Friends */}
                <Text style={styles.sectionTitle}>함께 한 친구</Text>
                <View style={styles.friendsContainer}>
                  {friends.map((friend) => (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.friendChip,
                        selectedFriends.includes(friend.id) && styles.friendChipSelected,
                      ]}
                      onPress={() => toggleFriend(friend.id)}
                      onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        removeFriend(friend.id);
                      }}
                    >
                      <Text style={styles.friendEmoji}>{friend.emoji}</Text>
                      <Text
                        style={[
                          styles.friendName,
                          selectedFriends.includes(friend.id) && styles.friendNameSelected,
                        ]}
                      >
                        {friend.name}
                      </Text>
                      {selectedFriends.includes(friend.id) && (
                        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.addFriendChip}
                    onPress={() => setShowAddFriend(true)}
                  >
                    <Ionicons name="add" size={20} color={Colors.textSecondary} />
                    <Text style={styles.addFriendText}>추가</Text>
                  </TouchableOpacity>
                </View>

                {/* Add Friend Form */}
                {showAddFriend && (
                  <View style={styles.addFriendForm}>
                    <View style={styles.emojiSelector}>
                      {EMOJI_OPTIONS.map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          style={[
                            styles.emojiOption,
                            selectedEmoji === emoji && styles.emojiOptionSelected,
                          ]}
                          onPress={() => setSelectedEmoji(emoji)}
                        >
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.addFriendInputRow}>
                      <TextInput
                        style={styles.addFriendInput}
                        value={newFriendName}
                        onChangeText={setNewFriendName}
                        placeholder="친구 이름"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        maxLength={10}
                      />
                      <TouchableOpacity
                        style={[styles.addFriendBtn, !newFriendName.trim() && styles.addFriendBtnDisabled]}
                        onPress={handleAddFriend}
                        disabled={!newFriendName.trim()}
                      >
                        <Text style={styles.addFriendBtnText}>추가</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Split Type */}
                {selectedFriends.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>나누기 방식</Text>
                    <View style={styles.splitTypeContainer}>
                      <TouchableOpacity
                        style={[styles.splitTypeOption, splitType === 'equal' && styles.splitTypeActive]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSplitType('equal');
                        }}
                      >
                        <Ionicons
                          name="git-compare"
                          size={20}
                          color={splitType === 'equal' ? Colors.success : Colors.textMuted}
                        />
                        <Text style={[styles.splitTypeText, splitType === 'equal' && styles.splitTypeTextActive]}>
                          균등 분할
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.splitTypeOption, splitType === 'custom' && styles.splitTypeActive]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSplitType('custom');
                        }}
                      >
                        <Ionicons
                          name="options"
                          size={20}
                          color={splitType === 'custom' ? Colors.success : Colors.textMuted}
                        />
                        <Text style={[styles.splitTypeText, splitType === 'custom' && styles.splitTypeTextActive]}>
                          직접 입력
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Split Details */}
                    <View style={styles.splitDetails}>
                      {/* My share */}
                      <View style={styles.splitRow}>
                        <View style={styles.splitPerson}>
                          <Text style={styles.splitEmoji}>🙋</Text>
                          <Text style={styles.splitName}>나</Text>
                        </View>
                        <Text style={styles.splitAmount}>₩{myShare.toLocaleString()}</Text>
                      </View>

                      {/* Friends' shares */}
                      {selectedFriends.map((friendId) => {
                        const friend = friends.find((f) => f.id === friendId);
                        if (!friend) return null;
                        return (
                          <View key={friendId} style={styles.splitRow}>
                            <View style={styles.splitPerson}>
                              <Text style={styles.splitEmoji}>{friend.emoji}</Text>
                              <Text style={styles.splitName}>{friend.name}</Text>
                            </View>
                            {splitType === 'equal' ? (
                              <Text style={styles.splitAmount}>
                                ₩{splitAmounts[friendId]?.toLocaleString()}
                              </Text>
                            ) : (
                              <TextInput
                                style={styles.customAmountInput}
                                value={customAmounts[friendId] || ''}
                                onChangeText={(text) =>
                                  setCustomAmounts((prev) => ({ ...prev, [friendId]: formatAmount(text) }))
                                }
                                placeholder="0"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                keyboardType="numeric"
                              />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                <View style={styles.scrollBottomSpacer} />
              </ScrollView>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.splitButton, selectedFriends.length === 0 && styles.splitButtonDisabled]}
                  onPress={handleSplit}
                  disabled={selectedFriends.length === 0}
                >
                  <LinearGradient
                    colors={selectedFriends.length > 0 ? ['#10b981', '#059669'] : ['#333', '#333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.splitButtonGradient}
                  >
                    <Text style={styles.splitButtonText}>나누기</Text>
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
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
    fontSize: FontSizes.lg,
    color: Colors.success,
    fontWeight: '600',
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
    marginTop: Spacing.md,
  },
  paidByContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  paidByOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  paidByOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.success,
  },
  paidByEmoji: {
    fontSize: 20,
  },
  paidByText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  paidByTextActive: {
    color: Colors.success,
  },
  friendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  friendChipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.success,
  },
  friendEmoji: {
    fontSize: 18,
  },
  friendName: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  friendNameSelected: {
    color: Colors.text,
    fontWeight: '500',
  },
  addFriendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  addFriendText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  addFriendForm: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  emojiSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emojiOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  emojiText: {
    fontSize: 18,
  },
  addFriendInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addFriendInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  addFriendBtn: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
  },
  addFriendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  addFriendBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  splitTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  splitTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  splitTypeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.success,
  },
  splitTypeText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  splitTypeTextActive: {
    color: Colors.success,
    fontWeight: '500',
  },
  splitDetails: {
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  splitPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  splitEmoji: {
    fontSize: 20,
  },
  splitName: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  splitAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.success,
  },
  customAmountInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    fontSize: FontSizes.md,
    color: Colors.success,
    fontWeight: '600',
    minWidth: 100,
    textAlign: 'right',
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
  splitButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  splitButtonDisabled: {
    opacity: 0.5,
  },
  splitButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  splitButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
});

export default SplitExpenseModal;
