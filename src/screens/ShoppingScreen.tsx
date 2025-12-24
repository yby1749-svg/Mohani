import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeOutRight, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground, ProgressBar } from '../components';
import { AddShoppingItemModal } from '../components/AddShoppingItemModal';
import { useShopping } from '../context/ShoppingContext';
import { useExpenses } from '../context/ExpenseContext';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

const CATEGORY_ICONS: Record<string, string> = {
  groceries: '🥬',
  household: '🧴',
  clothing: '👕',
  electronics: '📱',
  beauty: '💄',
  other: '📦',
};

const CATEGORY_NAMES: Record<string, string> = {
  groceries: '식료품',
  household: '생활용품',
  clothing: '의류',
  electronics: '전자기기',
  beauty: '뷰티',
  other: '기타',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#22C55E',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export default function ShoppingScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const {
    items,
    addItem,
    toggleComplete,
    deleteItem,
    clearCompleted,
    getActiveItems,
    getCompletedItems,
    getTotalEstimated,
    getProgress,
  } = useShopping();
  const { addExpense } = useExpenses();

  const activeItems = getActiveItems();
  const completedItems = getCompletedItems();
  const totalEstimated = getTotalEstimated();
  const progress = getProgress();

  const handleToggleItem = (id: string, estimatedPrice: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const item = items.find((i) => i.id === id);
    if (item && !item.isCompleted) {
      // Add to expenses when completing
      addExpense({
        amount: estimatedPrice,
        category: 'shopping',
        categoryLabel: '쇼핑',
        categoryIcon: '🛍️',
        note: item.name,
        date: new Date(),
      });
    }

    toggleComplete(id, estimatedPrice);
  };

  const handleDeleteItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteItem(id);
  };

  const handleClearCompleted = () => {
    if (completedItems.length === 0) return;

    Alert.alert(
      '완료 항목 삭제',
      `${completedItems.length}개의 완료된 항목을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            clearCompleted();
          },
        },
      ]
    );
  };

  const handleAddItem = (item: { name: string; category: string; estimatedPrice: number }) => {
    addItem(item);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.screenHeader}
        >
          <Text style={styles.screenTitle}>Shopping</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.addBtnGradient}
            >
              <Ionicons name="add" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Progress Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard gradient={Gradients.cardPurple} borderColor={Colors.borderPurple}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>쇼핑 진행률</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <ProgressBar progress={progress} />
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{activeItems.length}</Text>
                <Text style={styles.statLabel}>남은 항목</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedItems.length}</Text>
                <Text style={styles.statLabel}>완료</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₩{(totalEstimated / 1000).toFixed(0)}k</Text>
                <Text style={styles.statLabel}>예상 금액</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Active Items */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📝 쇼핑 리스트</Text>
              <Text style={styles.sectionCount}>{activeItems.length}개</Text>
            </View>

            {activeItems.length > 0 ? (
              <View style={styles.itemsList}>
                {activeItems.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInRight.delay(index * 50)}
                    exiting={FadeOutRight}
                    layout={Layout.springify()}
                  >
                    <TouchableOpacity
                      style={[
                        styles.shoppingItem,
                        { borderLeftWidth: 3, borderLeftColor: PRIORITY_COLORS[item.priority || 'medium'] }
                      ]}
                      onPress={() => handleToggleItem(item.id, item.estimatedPrice)}
                      onLongPress={() => handleDeleteItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemCheck}>
                        <View style={[styles.checkCircle, { borderColor: PRIORITY_COLORS[item.priority || 'medium'] }]} />
                      </View>
                      <View style={styles.itemInfo}>
                        <View style={styles.itemNameRow}>
                          <Text style={styles.itemIcon}>
                            {CATEGORY_ICONS[item.category] || '📦'}
                          </Text>
                          <Text style={styles.itemName}>{item.name}</Text>
                          {item.priority === 'high' && (
                            <View style={styles.priorityBadge}>
                              <Text style={styles.priorityBadgeText}>긴급</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.itemCategory}>
                          {CATEGORY_NAMES[item.category] || item.category}
                        </Text>
                      </View>
                      {item.estimatedPrice > 0 && (
                        <Text style={styles.itemPrice}>
                          ₩{item.estimatedPrice.toLocaleString()}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyText}>쇼핑 리스트가 비어있어요</Text>
                <Text style={styles.emptySubtext}>
                  + 버튼을 눌러 아이템을 추가해보세요
                </Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <GlassCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✅ 완료</Text>
                <TouchableOpacity onPress={handleClearCompleted}>
                  <Text style={styles.clearBtn}>모두 삭제</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.itemsList}>
                {completedItems.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInRight.delay(index * 50)}
                    layout={Layout.springify()}
                  >
                    <TouchableOpacity
                      style={[styles.shoppingItem, styles.completedItem]}
                      onPress={() => handleToggleItem(item.id, item.estimatedPrice)}
                      onLongPress={() => handleDeleteItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemCheck}>
                        <LinearGradient
                          colors={Gradients.primary}
                          style={styles.checkCircleFilled}
                        >
                          <Ionicons name="checkmark" size={14} color="white" />
                        </LinearGradient>
                      </View>
                      <View style={styles.itemInfo}>
                        <View style={styles.itemNameRow}>
                          <Text style={styles.itemIcon}>
                            {CATEGORY_ICONS[item.category] || '📦'}
                          </Text>
                          <Text style={[styles.itemName, styles.completedText]}>
                            {item.name}
                          </Text>
                        </View>
                      </View>
                      {item.actualPrice !== undefined && item.actualPrice > 0 && (
                        <Text style={[styles.itemPrice, styles.completedText]}>
                          ₩{item.actualPrice.toLocaleString()}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              아이템을 탭하면 완료 처리되고 지출로 자동 기록돼요!{'\n'}
              길게 누르면 삭제할 수 있어요.
            </Text>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Item Modal */}
      <AddShoppingItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  screenTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  addBtnGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressPercent: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.goldPrimary,
  },
  progressStats: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  clearBtn: {
    fontSize: FontSizes.sm,
    color: Colors.error,
  },
  itemsList: {
    gap: Spacing.sm,
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  completedItem: {
    opacity: 0.6,
  },
  itemCheck: {},
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  checkCircleFilled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemIcon: {
    fontSize: 16,
  },
  itemName: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  itemCategory: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    marginLeft: 24,
  },
  itemPrice: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.goldPrimary,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.purplePrimary,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  priorityBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
  priorityBadgeText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
});
