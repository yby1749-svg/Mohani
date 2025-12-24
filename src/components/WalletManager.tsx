import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { Wallet } from '../context/WalletContext';

interface WalletManagerProps {
  wallets: Wallet[];
  totalBalance: number;
  onAddWallet: (wallet: Omit<Wallet, 'id' | 'createdAt' | 'isDefault'>) => void;
  onUpdateWallet: (id: string, updates: Partial<Wallet>) => void;
  onDeleteWallet: (id: string) => void;
  onSetDefault: (id: string) => void;
  onTransfer: (fromId: string, toId: string, amount: number) => void;
}

type WalletType = 'cash' | 'bank' | 'card' | 'savings' | 'investment' | 'other';

const WALLET_TYPES: { type: WalletType; label: string; icon: string; color: string }[] = [
  { type: 'cash', label: '현금', icon: '💵', color: '#22C55E' },
  { type: 'bank', label: '은행', icon: '🏦', color: '#3B82F6' },
  { type: 'card', label: '카드', icon: '💳', color: '#8B5CF6' },
  { type: 'savings', label: '저축', icon: '🐷', color: '#EC4899' },
  { type: 'investment', label: '투자', icon: '📈', color: '#F59E0B' },
  { type: 'other', label: '기타', icon: '💰', color: '#6B7280' },
];

export const WalletManager: React.FC<WalletManagerProps> = ({
  wallets,
  totalBalance,
  onAddWallet,
  onUpdateWallet,
  onDeleteWallet,
  onSetDefault,
  onTransfer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<WalletType>('bank');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [transferFrom, setTransferFrom] = useState<string | null>(null);
  const [transferTo, setTransferTo] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState('');

  const handleAddWallet = () => {
    if (!newWalletName.trim()) return;

    const typeInfo = WALLET_TYPES.find((t) => t.type === newWalletType);
    onAddWallet({
      name: newWalletName.trim(),
      type: newWalletType,
      icon: typeInfo?.icon || '💰',
      color: typeInfo?.color || '#6B7280',
      balance: parseFloat(newWalletBalance) || 0,
      isHidden: false,
    });

    setNewWalletName('');
    setNewWalletType('bank');
    setNewWalletBalance('');
    setShowAddModal(false);
  };

  const handleTransfer = () => {
    if (!transferFrom || !transferTo || !transferAmount) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) return;

    onTransfer(transferFrom, transferTo, amount);
    setTransferFrom(null);
    setTransferTo(null);
    setTransferAmount('');
    setShowTransferModal(false);
  };

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    } else if (Math.abs(amount) >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return amount.toLocaleString();
  };

  const visibleWallets = wallets.filter((w) => !w.isHidden);

  return (
    <View style={styles.container}>
      {/* Total Balance */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>총 자산</Text>
        <Text style={styles.totalBalance}>₩{formatCurrency(totalBalance)}</Text>
      </View>

      {/* Wallet List */}
      <View style={styles.walletList}>
        {visibleWallets.map((wallet, index) => (
          <Animated.View
            key={wallet.id}
            entering={FadeInDown.delay(index * 80).duration(250)}
          >
            <TouchableOpacity
              style={[styles.walletCard, { borderLeftColor: wallet.color }]}
              onLongPress={() => onSetDefault(wallet.id)}
              activeOpacity={0.8}
            >
              <View style={styles.walletLeft}>
                <Text style={styles.walletIcon}>{wallet.icon}</Text>
                <View>
                  <View style={styles.walletNameRow}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    {wallet.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>기본</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.walletType}>
                    {WALLET_TYPES.find((t) => t.type === wallet.type)?.label}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.walletBalance,
                { color: wallet.balance >= 0 ? Colors.textPrimary : '#EF4444' }
              ]}>
                ₩{formatCurrency(wallet.balance)}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setShowAddModal(true)}
        >
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.1)']}
            style={styles.actionBtnGradient}
          >
            <Text style={styles.actionBtnIcon}>+</Text>
            <Text style={styles.actionBtnText}>지갑 추가</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setShowTransferModal(true)}
        >
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.1)']}
            style={styles.actionBtnGradient}
          >
            <Text style={styles.actionBtnIcon}>↔</Text>
            <Text style={styles.actionBtnText}>이체</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tip */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          💡 길게 눌러서 기본 지갑으로 설정할 수 있어요
        </Text>
      </View>

      {/* Add Wallet Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <BlurView intensity={20} tint="dark" style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>새 지갑 추가</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>지갑 이름</Text>
            <TextInput
              style={styles.input}
              value={newWalletName}
              onChangeText={setNewWalletName}
              placeholder="예: 신한은행"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>유형</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeGrid}>
                {WALLET_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.type}
                    style={[
                      styles.typeBtn,
                      newWalletType === type.type && styles.typeBtnActive,
                    ]}
                    onPress={() => setNewWalletType(type.type)}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.typeLabel,
                      newWalletType === type.type && styles.typeLabelActive,
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>초기 잔액</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₩</Text>
              <TextInput
                style={styles.amountInput}
                value={newWalletBalance}
                onChangeText={setNewWalletBalance}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, !newWalletName.trim() && styles.saveBtnDisabled]}
              onPress={handleAddWallet}
              disabled={!newWalletName.trim()}
            >
              <Text style={styles.saveBtnText}>추가</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        visible={showTransferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <BlurView intensity={20} tint="dark" style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>지갑 간 이체</Text>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>보내는 지갑</Text>
            <View style={styles.walletSelectGrid}>
              {visibleWallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[
                    styles.walletSelectBtn,
                    transferFrom === wallet.id && styles.walletSelectBtnActive,
                  ]}
                  onPress={() => setTransferFrom(wallet.id)}
                >
                  <Text style={styles.walletSelectIcon}>{wallet.icon}</Text>
                  <Text style={styles.walletSelectName}>{wallet.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>받는 지갑</Text>
            <View style={styles.walletSelectGrid}>
              {visibleWallets
                .filter((w) => w.id !== transferFrom)
                .map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    style={[
                      styles.walletSelectBtn,
                      transferTo === wallet.id && styles.walletSelectBtnActive,
                    ]}
                    onPress={() => setTransferTo(wallet.id)}
                  >
                    <Text style={styles.walletSelectIcon}>{wallet.icon}</Text>
                    <Text style={styles.walletSelectName}>{wallet.name}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.inputLabel}>이체 금액</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₩</Text>
              <TextInput
                style={styles.amountInput}
                value={transferAmount}
                onChangeText={setTransferAmount}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!transferFrom || !transferTo || !transferAmount) && styles.saveBtnDisabled,
              ]}
              onPress={handleTransfer}
              disabled={!transferFrom || !transferTo || !transferAmount}
            >
              <Text style={styles.saveBtnText}>이체</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  totalSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  totalBalance: {
    fontSize: FontSizes.hero,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  walletList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  walletIcon: {
    fontSize: 28,
  },
  walletNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  walletName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  defaultBadge: {
    backgroundColor: Colors.purpleLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  walletType: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  walletBalance: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionBtnIcon: {
    fontSize: FontSizes.lg,
    color: Colors.purpleLight,
  },
  actionBtnText: {
    fontSize: FontSizes.sm,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  tipContainer: {
    alignItems: 'center',
  },
  tipText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeBtn: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 70,
  },
  typeBtnActive: {
    borderColor: Colors.purpleLight,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  typeLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  typeLabelActive: {
    color: Colors.purpleLight,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: FontSizes.xl,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  walletSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  walletSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  walletSelectBtnActive: {
    borderColor: Colors.purpleLight,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  walletSelectIcon: {
    fontSize: 18,
  },
  walletSelectName: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: Colors.purpleLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
