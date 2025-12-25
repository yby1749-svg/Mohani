import React, { useState, useEffect } from 'react';
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
import { useNetWorth, ASSET_TYPES, LIABILITY_TYPES, Asset, Liability } from '../context/NetWorthContext';

const NetWorthTracker: React.FC = () => {
  const {
    assets,
    liabilities,
    addAsset,
    updateAsset,
    deleteAsset,
    addLiability,
    updateLiability,
    deleteLiability,
    getTotalAssets,
    getTotalLiabilities,
    getNetWorth,
    takeSnapshot,
    getNetWorthChange,
  } = useNetWorth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'asset' | 'liability'>('asset');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Take snapshot on mount only, not on every change to avoid loops
  useEffect(() => {
    if (assets.length > 0 || liabilities.length > 0) {
      takeSnapshot();
    }
  }, []);

  const formatCurrency = (amount: number): string => {
    if (Math.abs(amount) >= 100000000) {
      return `₩${(amount / 100000000).toFixed(1)}억`;
    }
    if (Math.abs(amount) >= 10000) {
      return `₩${(amount / 10000).toFixed(0)}만`;
    }
    return `₩${amount.toLocaleString()}`;
  };

  const netWorth = getNetWorth();
  const totalAssets = getTotalAssets();
  const totalLiabilities = getTotalLiabilities();
  const change = getNetWorthChange();

  const handleAddItem = async () => {
    if (!name.trim() || !value || !selectedType) {
      Alert.alert('오류', '모든 필드를 입력해주세요');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      Alert.alert('오류', '올바른 금액을 입력해주세요');
      return;
    }

    if (addType === 'asset') {
      await addAsset({
        name: name.trim(),
        type: selectedType as Asset['type'],
        value: numValue,
        icon: ASSET_TYPES[selectedType as Asset['type']].icon,
        color: ASSET_TYPES[selectedType as Asset['type']].color,
      });
    } else {
      await addLiability({
        name: name.trim(),
        type: selectedType as Liability['type'],
        amount: numValue,
        icon: LIABILITY_TYPES[selectedType as Liability['type']].icon,
        color: LIABILITY_TYPES[selectedType as Liability['type']].color,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    setName('');
    setValue('');
    setSelectedType('');
  };

  const handleDelete = (type: 'asset' | 'liability', id: string, itemName: string) => {
    Alert.alert(
      '삭제 확인',
      `"${itemName}"을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            if (type === 'asset') {
              deleteAsset(id);
            } else {
              deleteLiability(id);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const openAddModal = (type: 'asset' | 'liability') => {
    setAddType(type);
    setShowAddModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Net Worth Header */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <LinearGradient
          colors={
            netWorth >= 0
              ? ['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']
              : ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']
          }
          style={styles.netWorthCard}
        >
          <Text style={styles.netWorthLabel}>순자산</Text>
          <Text style={[styles.netWorthValue, netWorth < 0 && styles.netWorthNegative]}>
            {formatCurrency(netWorth)}
          </Text>
          {change.amount !== 0 && (
            <View style={[styles.changeBadge, change.amount >= 0 ? styles.changeUp : styles.changeDown]}>
              <Text style={[styles.changeText, change.amount >= 0 ? styles.changeTextUp : styles.changeTextDown]}>
                {change.amount >= 0 ? '+' : ''}{formatCurrency(change.amount)} ({change.percent.toFixed(1)}%)
              </Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Summary Row */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.assetsCard]}>
          <Text style={styles.summaryLabel}>자산</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            {formatCurrency(totalAssets)}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.liabilitiesCard]}>
          <Text style={styles.summaryLabel}>부채</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>
            {formatCurrency(totalLiabilities)}
          </Text>
        </View>
      </Animated.View>

      {/* Assets Section */}
      <Animated.View entering={FadeInDown.delay(300)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💰 자산</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => openAddModal('asset')}>
            <Text style={styles.addButtonText}>+ 추가</Text>
          </TouchableOpacity>
        </View>
        {assets.length > 0 ? (
          assets.map((asset, index) => (
            <Animated.View key={asset.id} entering={FadeIn.delay(index * 50)}>
              <TouchableOpacity
                style={styles.itemCard}
                onLongPress={() => handleDelete('asset', asset.id, asset.name)}
              >
                <Text style={styles.itemIcon}>{asset.icon}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{asset.name}</Text>
                  <Text style={styles.itemType}>
                    {asset.type === 'cash' ? '현금' :
                     asset.type === 'bank' ? '은행' :
                     asset.type === 'investment' ? '투자' :
                     asset.type === 'property' ? '부동산' :
                     asset.type === 'vehicle' ? '차량' : '기타'}
                  </Text>
                </View>
                <Text style={[styles.itemValue, { color: Colors.success }]}>
                  {formatCurrency(asset.value)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))
        ) : (
          <Text style={styles.emptyText}>자산을 추가해보세요</Text>
        )}
      </Animated.View>

      {/* Liabilities Section */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💳 부채</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => openAddModal('liability')}>
            <Text style={styles.addButtonText}>+ 추가</Text>
          </TouchableOpacity>
        </View>
        {liabilities.length > 0 ? (
          liabilities.map((liability, index) => (
            <Animated.View key={liability.id} entering={FadeIn.delay(index * 50)}>
              <TouchableOpacity
                style={styles.itemCard}
                onLongPress={() => handleDelete('liability', liability.id, liability.name)}
              >
                <Text style={styles.itemIcon}>{liability.icon}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{liability.name}</Text>
                  <Text style={styles.itemType}>
                    {liability.type === 'mortgage' ? '주택담보' :
                     liability.type === 'car_loan' ? '자동차' :
                     liability.type === 'credit_card' ? '신용카드' :
                     liability.type === 'student_loan' ? '학자금' :
                     liability.type === 'personal_loan' ? '개인' : '기타'}
                  </Text>
                </View>
                <Text style={[styles.itemValue, { color: Colors.error }]}>
                  -{formatCurrency(liability.amount)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))
        ) : (
          <Text style={styles.emptyText}>부채가 없습니다 🎉</Text>
        )}
      </Animated.View>

      {/* Add Modal */}
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
              <Text style={styles.modalTitle}>
                {addType === 'asset' ? '💰 자산 추가' : '💳 부채 추가'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="이름"
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={styles.input}
                placeholder="금액"
                placeholderTextColor={Colors.textSecondary}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
              />

              <Text style={styles.typeLabel}>유형</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  {Object.entries(addType === 'asset' ? ASSET_TYPES : LIABILITY_TYPES).map(([key, info]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.typeOption,
                        selectedType === key && { backgroundColor: info.color + '40', borderColor: info.color },
                      ]}
                      onPress={() => setSelectedType(key)}
                    >
                      <Text style={styles.typeIcon}>{info.icon}</Text>
                      <Text style={[styles.typeText, selectedType === key && { color: info.color }]}>
                        {addType === 'asset'
                          ? (key === 'cash' ? '현금' :
                             key === 'bank' ? '은행' :
                             key === 'investment' ? '투자' :
                             key === 'property' ? '부동산' :
                             key === 'vehicle' ? '차량' : '기타')
                          : (key === 'mortgage' ? '주택담보' :
                             key === 'car_loan' ? '자동차' :
                             key === 'credit_card' ? '신용카드' :
                             key === 'student_loan' ? '학자금' :
                             key === 'personal_loan' ? '개인' : '기타')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddItem}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  netWorthCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  netWorthLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  netWorthValue: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.success,
  },
  netWorthNegative: {
    color: Colors.error,
  },
  changeBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  changeUp: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  changeDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  changeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  changeTextUp: {
    color: Colors.success,
  },
  changeTextDown: {
    color: Colors.error,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgSecondary,
  },
  assetsCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  liabilitiesCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemType: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  itemValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
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
    marginBottom: Spacing.md,
  },
  typeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeOption: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  typeText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
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

export default NetWorthTracker;
