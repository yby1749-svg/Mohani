import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useWallets, Wallet } from '../context/WalletContext';
import { useNetWorth, Asset, ASSET_TYPES } from '../context/NetWorthContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  Gradients,
} from '../constants/theme';

interface InvestmentHolding {
  id: string;
  name: string;
  type: 'stock' | 'crypto' | 'fund' | 'bond' | 'real_estate' | 'other';
  icon: string;
  color: string;
  value: number;
  costBasis?: number;
  source: 'wallet' | 'asset';
}

const INVESTMENT_TYPES = {
  stock: { icon: '📊', color: '#3B82F6', label: '주식' },
  crypto: { icon: '₿', color: '#F59E0B', label: '암호화폐' },
  fund: { icon: '📈', color: '#8B5CF6', label: '펀드' },
  bond: { icon: '📜', color: '#10B981', label: '채권' },
  real_estate: { icon: '🏢', color: '#EC4899', label: '부동산' },
  other: { icon: '💎', color: '#6B7280', label: '기타' },
};

export const InvestmentDashboard: React.FC = () => {
  const { wallets } = useWallets();
  const { assets, addAsset, updateAsset, deleteAsset, getTotalAssets } = useNetWorth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    type: 'stock' as keyof typeof INVESTMENT_TYPES,
    value: '',
    costBasis: '',
  });

  // Get investment wallets
  const investmentWallets = useMemo(() => {
    return wallets.filter((w) => w.type === 'investment' && !w.isHidden);
  }, [wallets]);

  // Get investment assets
  const investmentAssets = useMemo(() => {
    return assets.filter((a) => a.type === 'investment');
  }, [assets]);

  // Combine into holdings
  const holdings: InvestmentHolding[] = useMemo(() => {
    const items: InvestmentHolding[] = [];

    investmentWallets.forEach((wallet) => {
      items.push({
        id: wallet.id,
        name: wallet.name,
        type: 'other',
        icon: wallet.icon,
        color: wallet.color,
        value: wallet.balance,
        source: 'wallet',
      });
    });

    investmentAssets.forEach((asset) => {
      items.push({
        id: asset.id,
        name: asset.name,
        type: 'other',
        icon: asset.icon,
        color: asset.color,
        value: asset.value,
        source: 'asset',
      });
    });

    return items.sort((a, b) => b.value - a.value);
  }, [investmentWallets, investmentAssets]);

  // Calculate totals
  const totalValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.value, 0);
  }, [holdings]);

  const handleAddInvestment = async () => {
    const value = parseFloat(newInvestment.value.replace(/,/g, ''));
    if (!newInvestment.name.trim() || isNaN(value) || value <= 0) return;

    const typeInfo = INVESTMENT_TYPES[newInvestment.type];
    await addAsset({
      name: newInvestment.name.trim(),
      type: 'investment',
      value: value,
      icon: typeInfo.icon,
      color: typeInfo.color,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    setNewInvestment({ name: '', type: 'stock', value: '', costBasis: '' });
  };

  const handleDeleteHolding = async (holding: InvestmentHolding) => {
    if (holding.source === 'asset') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteAsset(holding.id);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    }
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만원`;
    }
    return `₩${amount.toLocaleString()}`;
  };

  const formatValue = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers) {
      return parseInt(numbers, 10).toLocaleString();
    }
    return '';
  };

  return (
    <View style={styles.container}>
      {/* Portfolio Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>총 투자 자산</Text>
        <Text style={styles.summaryValue}>₩{totalValue.toLocaleString()}</Text>
        <View style={styles.summaryMeta}>
          <Text style={styles.summaryMetaText}>
            {holdings.length}개 투자 항목
          </Text>
        </View>
      </View>

      {/* Holdings List */}
      {holdings.length > 0 ? (
        <View style={styles.holdingsList}>
          <Text style={styles.sectionTitle}>보유 자산</Text>
          {holdings.map((holding, index) => {
            const percent = totalValue > 0 ? (holding.value / totalValue) * 100 : 0;

            return (
              <Animated.View
                key={holding.id}
                entering={FadeInDown.delay(index * 50).duration(200)}
              >
                <TouchableOpacity
                  style={styles.holdingItem}
                  onLongPress={() => handleDeleteHolding(holding)}
                  activeOpacity={0.7}
                >
                  <View style={styles.holdingLeft}>
                    <View style={[styles.holdingIcon, { backgroundColor: holding.color + '20' }]}>
                      <Text style={styles.holdingIconText}>{holding.icon}</Text>
                    </View>
                    <View style={styles.holdingInfo}>
                      <Text style={styles.holdingName}>{holding.name}</Text>
                      <View style={styles.holdingBar}>
                        <View
                          style={[
                            styles.holdingBarFill,
                            { width: `${percent}%`, backgroundColor: holding.color },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={styles.holdingValue}>{formatCurrency(holding.value)}</Text>
                    <Text style={styles.holdingPercent}>{percent.toFixed(1)}%</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>투자 자산이 없습니다</Text>
          <Text style={styles.emptyText}>
            투자 항목을 추가하여 포트폴리오를 관리하세요
          </Text>
        </View>
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAddModal(true);
        }}
      >
        <LinearGradient
          colors={Gradients.purple as [string, string]}
          style={styles.addButtonGradient}
        >
          <Text style={styles.addButtonText}>+ 투자 추가</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Investment Tips */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          투자 자산을 꾸준히 기록하면 포트폴리오 성장을 추적할 수 있어요. 길게 눌러 삭제하세요.
        </Text>
      </View>

      {/* Add Investment Modal */}
      <Modal visible={showAddModal} transparent animationType="none" onRequestClose={() => setShowAddModal(false)}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowAddModal(false)} activeOpacity={1} />

          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown.duration(200)}
            style={styles.modalContainer}
          >
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.15)', 'rgba(10, 10, 15, 0.98)']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>투자 추가</Text>
              </View>

              <View style={styles.modalContent}>
                {/* Investment Type */}
                <Text style={styles.inputLabel}>투자 유형</Text>
                <View style={styles.typeGrid}>
                  {(Object.keys(INVESTMENT_TYPES) as Array<keyof typeof INVESTMENT_TYPES>).map((type) => {
                    const info = INVESTMENT_TYPES[type];
                    const isSelected = newInvestment.type === type;

                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeItem,
                          isSelected && styles.typeItemSelected,
                          isSelected && { borderColor: info.color },
                        ]}
                        onPress={() => setNewInvestment((prev) => ({ ...prev, type }))}
                      >
                        <Text style={styles.typeIcon}>{info.icon}</Text>
                        <Text style={[
                          styles.typeLabel,
                          isSelected && { color: info.color },
                        ]}>
                          {info.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Name Input */}
                <Text style={styles.inputLabel}>투자명</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={newInvestment.name}
                    onChangeText={(text) => setNewInvestment((prev) => ({ ...prev, name: text }))}
                    placeholder="예: 삼성전자, 비트코인"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    maxLength={30}
                  />
                </View>

                {/* Value Input */}
                <Text style={styles.inputLabel}>현재 가치</Text>
                <View style={styles.valueInputContainer}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.valueInput}
                    value={newInvestment.value}
                    onChangeText={(text) => setNewInvestment((prev) => ({ ...prev, value: formatValue(text) }))}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={15}
                  />
                </View>

                {/* Quick Amounts */}
                <View style={styles.quickAmounts}>
                  {[1000000, 5000000, 10000000, 50000000].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.quickAmountBtn}
                      onPress={() => setNewInvestment((prev) => ({ ...prev, value: amount.toLocaleString() }))}
                    >
                      <Text style={styles.quickAmountText}>
                        {amount >= 10000000 ? `${amount / 100000000}억` : `${amount / 10000}만`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleAddInvestment}>
                    <LinearGradient colors={Gradients.primary as [string, string]} style={styles.saveButtonGradient}>
                      <Text style={styles.saveButtonText}>추가</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  summaryCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryMeta: {
    marginTop: Spacing.sm,
  },
  summaryMetaText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  holdingsList: {
    marginBottom: Spacing.lg,
  },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  holdingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  holdingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdingIconText: {
    fontSize: 20,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  holdingBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  holdingBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  holdingRight: {
    alignItems: 'flex-end',
  },
  holdingValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  holdingPercent: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  addButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  addButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tipIcon: {
    fontSize: 14,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '80%',
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
  modalHeader: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeItem: {
    width: '31%',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typeItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 2,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.lg,
  },
  textInput: {
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontSize: FontSizes.xl,
    color: Colors.purplePrimary,
    marginRight: Spacing.sm,
  },
  valueInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
  saveButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default InvestmentDashboard;
