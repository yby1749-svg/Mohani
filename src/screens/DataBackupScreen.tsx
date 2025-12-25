import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { AnimatedBackground, GlassCard } from '../components';
import {
  createBackup,
  restoreFromBackup,
  getLastBackupTime,
  getDataStats,
  clearAllData,
} from '../utils/dataBackup';

const DataBackupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'backup' | 'restore' | 'clear' | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [stats, setStats] = useState({
    expenseCount: 0,
    friendCount: 0,
    goalCount: 0,
    totalAmount: 0,
  });

  const loadData = async () => {
    const [backupTime, dataStats] = await Promise.all([
      getLastBackupTime(),
      getDataStats(),
    ]);
    setLastBackup(backupTime);
    setStats(dataStats);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return amount.toLocaleString();
  };

  const handleBackup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setLoadingAction('backup');

    const result = await createBackup();

    setIsLoading(false);
    setLoadingAction(null);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadData();
      Alert.alert('백업 완료', result.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('백업 실패', result.message);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      '데이터 복원',
      '현재 데이터가 백업 파일의 데이터로 대체됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            setLoadingAction('restore');

            const result = await restoreFromBackup();

            setIsLoading(false);
            setLoadingAction(null);

            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await loadData();
              Alert.alert(
                '복원 완료',
                `${result.stats?.expensesRestored || 0}개의 지출, ${result.stats?.friendsRestored || 0}명의 친구, ${result.stats?.goalsRestored || 0}개의 목표가 복원되었습니다.\n\n앱을 다시 시작해주세요.`
              );
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('복원 실패', result.message);
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert(
      '모든 데이터 삭제',
      '이 작업은 되돌릴 수 없습니다. 모든 지출 내역, 친구, 목표가 삭제됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '정말 삭제하시겠습니까?',
              '마지막 확인입니다. 모든 데이터가 영구적으로 삭제됩니다.',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '삭제 확인',
                  style: 'destructive',
                  onPress: async () => {
                    setIsLoading(true);
                    setLoadingAction('clear');

                    const success = await clearAllData();

                    setIsLoading(false);
                    setLoadingAction(null);

                    if (success) {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      await loadData();
                      Alert.alert('삭제 완료', '모든 데이터가 삭제되었습니다. 앱을 다시 시작해주세요.');
                    } else {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                      Alert.alert('오류', '데이터 삭제 중 오류가 발생했습니다.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
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
            <Text style={styles.headerTitle}>데이터 백업</Text>
            <Text style={styles.headerSubtitle}>Backup & Restore</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Current Data Stats */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <GlassCard style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <Ionicons name="server" size={24} color={Colors.purpleLight} />
                <Text style={styles.statsTitle}>현재 데이터</Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.expenseCount}</Text>
                  <Text style={styles.statLabel}>지출 내역</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.friendCount}</Text>
                  <Text style={styles.statLabel}>친구</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.goalCount}</Text>
                  <Text style={styles.statLabel}>목표</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₩{formatAmount(stats.totalAmount)}</Text>
                  <Text style={styles.statLabel}>총 지출</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Last Backup Info */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <GlassCard style={styles.lastBackupCard}>
              <View style={styles.lastBackupRow}>
                <Ionicons name="time" size={20} color={Colors.textMuted} />
                <Text style={styles.lastBackupLabel}>마지막 백업</Text>
              </View>
              <Text style={styles.lastBackupValue}>
                {lastBackup ? formatDate(lastBackup) : '백업 기록 없음'}
              </Text>
            </GlassCard>
          </Animated.View>

          {/* Backup Button */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <TouchableOpacity
              style={[styles.actionButton, styles.backupButton]}
              onPress={handleBackup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {loadingAction === 'backup' ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={28} color={Colors.text} />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>백업 생성</Text>
                    <Text style={styles.actionSubtitle}>
                      모든 데이터를 JSON 파일로 저장합니다
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Restore Button */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <TouchableOpacity
              style={[styles.actionButton, styles.restoreButton]}
              onPress={handleRestore}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {loadingAction === 'restore' ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <>
                  <Ionicons name="cloud-download" size={28} color={Colors.text} />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>백업 복원</Text>
                    <Text style={styles.actionSubtitle}>
                      JSON 파일에서 데이터를 복원합니다
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Info Card */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <GlassCard style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={Colors.purpleLight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>백업 안내</Text>
                <Text style={styles.infoText}>
                  • 백업 파일은 JSON 형식으로 저장됩니다{'\n'}
                  • 클라우드 저장소에 보관하면 안전합니다{'\n'}
                  • 복원 시 현재 데이터가 대체됩니다{'\n'}
                  • 복원 후 앱 재시작이 필요합니다
                </Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Danger Zone */}
          <Animated.View entering={FadeInDown.delay(600)}>
            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>위험 구역</Text>
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleClearData}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {loadingAction === 'clear' ? (
                  <ActivityIndicator color={Colors.error} />
                ) : (
                  <>
                    <Ionicons name="trash" size={28} color={Colors.error} />
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionTitle, styles.dangerText]}>
                        모든 데이터 삭제
                      </Text>
                      <Text style={styles.actionSubtitle}>
                        이 작업은 되돌릴 수 없습니다
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  statsCard: {
    marginBottom: Spacing.md,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  lastBackupCard: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  lastBackupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  lastBackupLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  lastBackupValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  backupButton: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  restoreButton: {
    backgroundColor: 'rgba(46, 213, 115, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.25)',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  actionSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  dangerZone: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 107, 0.2)',
  },
  dangerTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  dangerText: {
    color: Colors.error,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default DataBackupScreen;
