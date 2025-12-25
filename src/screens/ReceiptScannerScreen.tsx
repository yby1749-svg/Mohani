import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { Header, GlassCard, AnimatedBackground } from '../components';
import { useExpenses } from '../context/ExpenseContext';
import {
  processReceiptImage,
  ExtractedReceiptData,
  formatExtractedData,
} from '../utils/receiptOCR';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

type ScanState = 'camera' | 'processing' | 'review' | 'manual';

const CATEGORIES = [
  { id: 'food', label: '식비', icon: '🍽️' },
  { id: 'cafe', label: '카페', icon: '☕' },
  { id: 'transport', label: '교통', icon: '🚌' },
  { id: 'shopping', label: '쇼핑', icon: '🛍️' },
  { id: 'entertainment', label: '여가', icon: '🎬' },
  { id: 'health', label: '건강', icon: '💊' },
  { id: 'bills', label: '공과금', icon: '📄' },
  { id: 'other', label: '기타', icon: '📌' },
];

export default function ReceiptScannerScreen() {
  const navigation = useNavigation();
  const { addExpense } = useExpenses();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('camera');
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (extractedData) {
      if (extractedData.amount) {
        setAmount(extractedData.amount.toString());
      }
      if (extractedData.merchantName) {
        setNote(extractedData.merchantName);
      }
      if (extractedData.category) {
        setSelectedCategory(extractedData.category);
      }
      if (extractedData.date) {
        setSelectedDate(extractedData.date);
      }
    }
  }, [extractedData]);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setScanState('processing');
      setError(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        await processImage(photo.uri);
      } else {
        throw new Error('Failed to capture photo');
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('사진 촬영에 실패했습니다.');
      setScanState('camera');
    }
  };

  const handlePickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setScanState('processing');
        setError(null);
        await processImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      setError('이미지 선택에 실패했습니다.');
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      const result = await processReceiptImage(imageUri);

      if (result.success && result.data) {
        setExtractedData(result.data);
        setScanState('review');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(result.error || '영수증 인식에 실패했습니다.');
        setScanState('manual');
      }
    } catch (err) {
      console.error('Process error:', err);
      setError('영수증 처리 중 오류가 발생했습니다.');
      setScanState('manual');
    }
  };

  const handleSaveExpense = () => {
    const amountNum = parseInt(amount.replace(/,/g, ''), 10);

    if (!amountNum || amountNum <= 0) {
      Alert.alert('오류', '유효한 금액을 입력해주세요.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('오류', '카테고리를 선택해주세요.');
      return;
    }

    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addExpense({
      amount: amountNum,
      category: category.id,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      note: note || '영수증 스캔',
      date: selectedDate,
    });

    Alert.alert('저장 완료', '지출이 저장되었습니다.', [
      { text: '확인', onPress: () => navigation.goBack() },
    ]);
  };

  const handleRetry = () => {
    setScanState('camera');
    setExtractedData(null);
    setError(null);
    setAmount('');
    setNote('');
    setSelectedCategory(null);
    setSelectedDate(new Date());
  };

  const handleManualEntry = () => {
    setScanState('manual');
  };

  const formatAmount = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <Header showMenu={false} showNotification={false} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.purplePrimary} />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <Header showMenu={false} showNotification={false} />
        <View style={styles.centerContent}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>카메라 권한 필요</Text>
          <Text style={styles.permissionText}>
            영수증을 스캔하려면 카메라 권한이 필요합니다.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>권한 허용</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
            <Text style={styles.galleryButtonText}>갤러리에서 선택</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera view
  if (scanState === 'camera') {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.cameraOverlay}>
            {/* Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>영수증 스캔</Text>
              <View style={styles.closeButton} />
            </View>

            {/* Scan guide */}
            <View style={styles.scanGuide}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanGuideText}>
                영수증을 프레임 안에 맞춰주세요
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage}>
                <Text style={styles.galleryBtnIcon}>🖼️</Text>
                <Text style={styles.galleryBtnText}>갤러리</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.manualBtn} onPress={handleManualEntry}>
                <Text style={styles.manualBtnIcon}>✏️</Text>
                <Text style={styles.manualBtnText}>직접 입력</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  // Processing state
  if (scanState === 'processing') {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <Header showMenu={false} showNotification={false} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.purplePrimary} />
          <Text style={styles.processingText}>영수증 분석 중...</Text>
          <Text style={styles.processingSubtext}>잠시만 기다려주세요</Text>
        </View>
      </View>
    );
  }

  // Review / Manual entry state
  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header showMenu={false} showNotification={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={styles.screenHeader}
          >
            <Text style={styles.screenTitle}>
              {scanState === 'review' ? '스캔 결과' : '직접 입력'}
            </Text>
            <Text style={styles.screenSubtitle}>
              {scanState === 'review'
                ? '인식된 정보를 확인하고 수정하세요'
                : '지출 정보를 직접 입력하세요'}
            </Text>
          </Animated.View>

          {/* Error message */}
          {error && (
            <Animated.View entering={FadeIn.duration(300)}>
              <GlassCard style={styles.errorCard}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </GlassCard>
            </Animated.View>
          )}

          {/* Confidence indicator */}
          {extractedData && scanState === 'review' && (
            <Animated.View entering={FadeInDown.delay(150).duration(500)}>
              <GlassCard style={styles.confidenceCard}>
                <View style={styles.confidenceHeader}>
                  <Text style={styles.confidenceLabel}>인식 정확도</Text>
                  <Text
                    style={[
                      styles.confidenceValue,
                      extractedData.confidence >= 60
                        ? styles.confidenceHigh
                        : styles.confidenceLow,
                    ]}
                  >
                    {extractedData.confidence}%
                  </Text>
                </View>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${extractedData.confidence}%` },
                      extractedData.confidence >= 60
                        ? styles.confidenceFillHigh
                        : styles.confidenceFillLow,
                    ]}
                  />
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Amount input */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={styles.inputLabel}>금액 *</Text>
            <GlassCard style={styles.inputCard}>
              <Text style={styles.currencySymbol}>₩</Text>
              <TextInput
                style={styles.amountInput}
                value={formatAmount(amount)}
                onChangeText={(text) => setAmount(text.replace(/,/g, ''))}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </GlassCard>
          </Animated.View>

          {/* Note input */}
          <Animated.View entering={FadeInDown.delay(250).duration(500)}>
            <Text style={styles.inputLabel}>메모</Text>
            <GlassCard style={styles.inputCard}>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="가게 이름 또는 메모"
                placeholderTextColor={Colors.textMuted}
              />
            </GlassCard>
          </Animated.View>

          {/* Category selection */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={styles.inputLabel}>카테고리 *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === cat.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(cat.id);
                  }}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategory === cat.id && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Detected items */}
          {extractedData?.items && extractedData.items.length > 0 && (
            <Animated.View entering={FadeInDown.delay(350).duration(500)}>
              <Text style={styles.inputLabel}>인식된 항목</Text>
              <GlassCard>
                {extractedData.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemBullet}>•</Text>
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          {/* Action buttons */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            style={styles.actionButtons}
          >
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>다시 스캔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!amount || !selectedCategory) && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveExpense}
              disabled={!amount || !selectedCategory}
            >
              <LinearGradient
                colors={Gradients.purple as [string, string]}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>저장하기</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.textPrimary,
  },
  cameraTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scanGuide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 380,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.purplePrimary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  scanGuideText: {
    marginTop: Spacing.xl,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: Spacing.xl,
  },
  galleryBtn: {
    alignItems: 'center',
  },
  galleryBtnIcon: {
    fontSize: 28,
  },
  galleryBtnText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.textPrimary,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.textPrimary,
  },
  manualBtn: {
    alignItems: 'center',
  },
  manualBtnIcon: {
    fontSize: 28,
  },
  manualBtnText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  permissionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    backgroundColor: Colors.purplePrimary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  permissionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  galleryButton: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  galleryButtonText: {
    fontSize: FontSizes.md,
    color: Colors.purpleLight,
  },
  processingText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
  },
  processingSubtext: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  screenHeader: {
    marginBottom: Spacing.xl,
  },
  screenTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorIcon: {
    fontSize: 24,
  },
  errorText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.error,
  },
  confidenceCard: {
    marginBottom: Spacing.lg,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  confidenceLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  confidenceValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  confidenceHigh: {
    color: Colors.success,
  },
  confidenceLow: {
    color: Colors.warning,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceFillHigh: {
    backgroundColor: Colors.success,
  },
  confidenceFillLow: {
    backgroundColor: Colors.warning,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  currencySymbol: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  noteInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryItem: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: Colors.purplePrimary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  categoryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  categoryLabelSelected: {
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  itemBullet: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  itemText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  retryButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  bottomSpacing: {
    height: 100,
  },
});
