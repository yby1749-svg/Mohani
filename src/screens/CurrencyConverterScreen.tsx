import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { AnimatedBackground, GlassCard } from '../components';
import {
  CURRENCIES,
  Currency,
  getExchangeRates,
  convertCurrency,
  formatCurrency,
  getExchangeRate,
  formatLastUpdated,
  POPULAR_PAIRS,
  ExchangeRates,
} from '../utils/currency';

const CurrencyConverterScreen: React.FC = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('KRW');
  const [toCurrency, setToCurrency] = useState('USD');
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setIsLoading(true);
    const exchangeRates = await getExchangeRates();
    setRates(exchangeRates);
    setIsLoading(false);
  };

  const convertedAmount = useMemo(() => {
    if (!amount || !rates) return 0;
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount)) return 0;
    return convertCurrency(numAmount, fromCurrency, toCurrency, rates.rates);
  }, [amount, fromCurrency, toCurrency, rates]);

  const exchangeRate = useMemo(() => {
    if (!rates) return 0;
    return getExchangeRate(fromCurrency, toCurrency, rates.rates);
  }, [fromCurrency, toCurrency, rates]);

  const handleSwapCurrencies = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleQuickPair = (from: string, to: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromCurrency(from);
    setToCurrency(to);
  };

  const fromCurrencyData = CURRENCIES.find(c => c.code === fromCurrency);
  const toCurrencyData = CURRENCIES.find(c => c.code === toCurrency);

  const CurrencyPicker = ({
    visible,
    onClose,
    onSelect,
    selectedCode,
  }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
    selectedCode: string;
  }) => {
    if (!visible) return null;

    return (
      <Animated.View entering={FadeInDown} style={styles.pickerOverlay}>
        <GlassCard style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>통화 선택</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.pickerItem,
                  selectedCode === currency.code && styles.pickerItemActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(currency.code);
                  onClose();
                }}
              >
                <Text style={styles.pickerFlag}>{currency.flag}</Text>
                <View style={styles.pickerItemInfo}>
                  <Text style={styles.pickerItemCode}>{currency.code}</Text>
                  <Text style={styles.pickerItemName}>{currency.nameKo}</Text>
                </View>
                {selectedCode === currency.code && (
                  <Ionicons name="checkmark" size={20} color={Colors.purpleLight} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>환율 계산기</Text>
            <Text style={styles.headerSubtitle}>Currency Converter</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadRates}>
            <Ionicons name="refresh" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.purplePrimary} />
              <Text style={styles.loadingText}>환율 정보 불러오는 중...</Text>
            </View>
          ) : (
            <>
              {/* Main Converter Card */}
              <Animated.View entering={FadeInDown.delay(100)}>
                <GlassCard style={styles.converterCard}>
                  {/* From Currency */}
                  <TouchableOpacity
                    style={styles.currencyRow}
                    onPress={() => setShowFromPicker(true)}
                  >
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyFlag}>{fromCurrencyData?.flag}</Text>
                      <View>
                        <Text style={styles.currencyCode}>{fromCurrency}</Text>
                        <Text style={styles.currencyName}>{fromCurrencyData?.nameKo}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>

                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>{fromCurrencyData?.symbol}</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={(text) => {
                        const numOnly = text.replace(/[^0-9.]/g, '');
                        setAmount(numOnly);
                      }}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  {/* Swap Button */}
                  <TouchableOpacity style={styles.swapButton} onPress={handleSwapCurrencies}>
                    <Ionicons name="swap-vertical" size={24} color={Colors.purpleLight} />
                  </TouchableOpacity>

                  {/* To Currency */}
                  <TouchableOpacity
                    style={styles.currencyRow}
                    onPress={() => setShowToPicker(true)}
                  >
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyFlag}>{toCurrencyData?.flag}</Text>
                      <View>
                        <Text style={styles.currencyCode}>{toCurrency}</Text>
                        <Text style={styles.currencyName}>{toCurrencyData?.nameKo}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>

                  <View style={styles.resultContainer}>
                    <Text style={styles.resultSymbol}>{toCurrencyData?.symbol}</Text>
                    <Text style={styles.resultAmount}>
                      {convertedAmount.toLocaleString(undefined, {
                        minimumFractionDigits: toCurrency === 'KRW' || toCurrency === 'JPY' ? 0 : 2,
                        maximumFractionDigits: toCurrency === 'KRW' || toCurrency === 'JPY' ? 0 : 2,
                      })}
                    </Text>
                  </View>

                  {/* Exchange Rate */}
                  <View style={styles.rateContainer}>
                    <Text style={styles.rateText}>
                      1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
                    </Text>
                    {rates && (
                      <Text style={styles.rateUpdated}>
                        업데이트: {formatLastUpdated(rates.date)}
                      </Text>
                    )}
                  </View>
                </GlassCard>
              </Animated.View>

              {/* Quick Pairs */}
              <Animated.View entering={FadeInDown.delay(200)}>
                <Text style={styles.sectionTitle}>⚡ 빠른 선택</Text>
                <View style={styles.quickPairs}>
                  {POPULAR_PAIRS.map((pair, index) => {
                    const fromData = CURRENCIES.find(c => c.code === pair.from);
                    const toData = CURRENCIES.find(c => c.code === pair.to);
                    const isActive = fromCurrency === pair.from && toCurrency === pair.to;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.quickPair, isActive && styles.quickPairActive]}
                        onPress={() => handleQuickPair(pair.from, pair.to)}
                      >
                        <Text style={styles.quickPairText}>
                          {fromData?.flag} → {toData?.flag}
                        </Text>
                        <Text style={[
                          styles.quickPairLabel,
                          isActive && styles.quickPairLabelActive,
                        ]}>
                          {pair.from}/{pair.to}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>

              {/* Common Amounts */}
              <Animated.View entering={FadeInDown.delay(300)}>
                <Text style={styles.sectionTitle}>💵 자주 쓰는 금액</Text>
                <GlassCard style={styles.amountsCard}>
                  {[10000, 50000, 100000, 500000, 1000000].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={styles.amountChip}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAmount(amt.toString());
                        setFromCurrency('KRW');
                      }}
                    >
                      <Text style={styles.amountChipText}>
                        ₩{amt >= 10000 ? `${amt / 10000}만` : amt.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </GlassCard>
              </Animated.View>

              {/* Conversion Table */}
              <Animated.View entering={FadeInDown.delay(400)}>
                <Text style={styles.sectionTitle}>📊 환율표 (KRW 기준)</Text>
                <GlassCard style={styles.tableCard}>
                  {CURRENCIES.filter(c => c.code !== 'KRW').slice(0, 8).map((currency) => {
                    const rate = rates ? getExchangeRate('KRW', currency.code, rates.rates) : 0;
                    const inverseRate = rate > 0 ? 1 / rate : 0;

                    return (
                      <View key={currency.code} style={styles.tableRow}>
                        <View style={styles.tableLeft}>
                          <Text style={styles.tableFlag}>{currency.flag}</Text>
                          <Text style={styles.tableCode}>{currency.code}</Text>
                        </View>
                        <View style={styles.tableRight}>
                          <Text style={styles.tableRate}>
                            ₩{Math.round(inverseRate).toLocaleString()}
                          </Text>
                          <Text style={styles.tableUnit}>/ 1 {currency.code}</Text>
                        </View>
                      </View>
                    );
                  })}
                </GlassCard>
              </Animated.View>

              <View style={styles.bottomSpacer} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Currency Pickers */}
      <CurrencyPicker
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSelect={setFromCurrency}
        selectedCode={fromCurrency}
      />
      <CurrencyPicker
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        onSelect={setToCurrency}
        selectedCode={toCurrency}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  converterCard: {
    marginBottom: Spacing.lg,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  currencyFlag: {
    fontSize: 32,
  },
  currencyCode: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  currencyName: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  currencySymbol: {
    fontSize: FontSizes.xl,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  swapButton: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  resultSymbol: {
    fontSize: FontSizes.xl,
    color: Colors.purpleLight,
    marginRight: Spacing.sm,
  },
  resultAmount: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.purpleLight,
  },
  rateContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  rateText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  rateUpdated: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickPairs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickPair: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  quickPairActive: {
    backgroundColor: Colors.purplePrimary,
  },
  quickPairText: {
    fontSize: 16,
  },
  quickPairLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  quickPairLabelActive: {
    color: Colors.text,
  },
  amountsCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amountChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
  },
  amountChipText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  tableCard: {
    marginBottom: Spacing.lg,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tableFlag: {
    fontSize: 20,
  },
  tableCode: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  tableRight: {
    alignItems: 'flex-end',
  },
  tableRate: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.purpleLight,
  },
  tableUnit: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  pickerCard: {
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pickerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  pickerFlag: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemCode: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  pickerItemName: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default CurrencyConverterScreen;
