import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Header, GlassCard, AnimatedBackground } from '../components';
import { useAchievements, Achievement } from '../context/AchievementContext';
import { useChallenges, Challenge } from '../context/ChallengeContext';
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Gradients,
} from '../constants/theme';

const TIER_COLORS = {
  bronze: { bg: '#CD7F32', text: '#FFFFFF' },
  silver: { bg: '#C0C0C0', text: '#1a1a1a' },
  gold: { bg: '#FFD700', text: '#1a1a1a' },
  platinum: { bg: '#E5E4E2', text: '#1a1a1a' },
};

const CATEGORY_INFO = {
  savings: { label: '저축', icon: '💰' },
  spending: { label: '지출', icon: '💸' },
  streak: { label: '연속', icon: '🔥' },
  milestone: { label: '마일스톤', icon: '🎯' },
  special: { label: '스페셜', icon: '⭐' },
};

const CHALLENGE_COLORS = {
  daily: Colors.success,
  weekly: Colors.purplePrimary,
  monthly: Colors.goldPrimary,
};

export default function AchievementsScreen() {
  const {
    achievements,
    unlockedCount,
    totalCount,
    getAchievementsByCategory,
  } = useAchievements();
  const {
    activeChallenges,
    completedChallenges,
    totalPoints,
    claimReward,
    getLevel,
  } = useChallenges();

  const [selectedCategory, setSelectedCategory] = useState<Achievement['category']>('savings');
  const levelInfo = getLevel();

  const filteredAchievements = useMemo(() => {
    return getAchievementsByCategory(selectedCategory);
  }, [selectedCategory, achievements]);

  const handleClaimReward = (challenge: Challenge) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    claimReward(challenge.id);
  };

  const formatTimeRemaining = (endDate: Date): string => {
    const now = new Date();
    const diff = new Date(endDate).getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 남음`;
    if (hours > 0) return `${hours}시간 남음`;
    return '곧 종료';
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Header showMenu={false} showNotification={false} />

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
          <Text style={styles.screenTitle}>Achievements</Text>
          <Text style={styles.screenSubtitle}>
            {unlockedCount}/{totalCount} 업적 달성
          </Text>
        </Animated.View>

        {/* Level Card */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <GlassCard gradient={Gradients.cardPurple} borderColor={Colors.borderPurple}>
            <View style={styles.levelCard}>
              <View style={styles.levelLeft}>
                <LinearGradient
                  colors={Gradients.gold as [string, string]}
                  style={styles.levelBadge}
                >
                  <Text style={styles.levelNumber}>{levelInfo.level}</Text>
                </LinearGradient>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelTitle}>{levelInfo.title}</Text>
                  <Text style={styles.levelPoints}>{totalPoints.toLocaleString()} 포인트</Text>
                </View>
              </View>
              <View style={styles.levelProgress}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${levelInfo.progress}%` }]}
                  />
                </View>
                {levelInfo.pointsToNext > 0 && (
                  <Text style={styles.pointsToNext}>
                    다음 레벨까지 {levelInfo.pointsToNext}P
                  </Text>
                )}
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Active Challenges */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.sectionTitle}>🎯 진행 중인 챌린지</Text>
          {activeChallenges.length > 0 ? (
            <View style={styles.challengeList}>
              {activeChallenges.map((challenge, index) => {
                const progress = (challenge.progress / challenge.target) * 100;
                const color = CHALLENGE_COLORS[challenge.type];

                return (
                  <Animated.View
                    key={challenge.id}
                    entering={FadeInDown.delay(250 + index * 50).duration(300)}
                  >
                    <GlassCard style={styles.challengeCard}>
                      <View style={styles.challengeHeader}>
                        <View style={styles.challengeLeft}>
                          <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                          <View>
                            <Text style={styles.challengeTitle}>{challenge.titleKo}</Text>
                            <Text style={styles.challengeDesc}>{challenge.description}</Text>
                          </View>
                        </View>
                        <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
                          <Text style={[styles.typeBadgeText, { color }]}>
                            {challenge.type === 'daily' ? '일일' : challenge.type === 'weekly' ? '주간' : '월간'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.challengeProgress}>
                        <View style={styles.challengeProgressBar}>
                          <View
                            style={[
                              styles.challengeProgressFill,
                              { width: `${progress}%`, backgroundColor: color },
                            ]}
                          />
                        </View>
                        <View style={styles.challengeProgressInfo}>
                          <Text style={styles.challengeProgressText}>
                            {challenge.progress}/{challenge.target}
                          </Text>
                          <Text style={styles.challengeTime}>
                            {formatTimeRemaining(challenge.endDate)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.challengeReward}>
                        <Text style={styles.rewardText}>🏆 {challenge.reward}P</Text>
                      </View>
                    </GlassCard>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <GlassCard>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>모든 챌린지를 완료했습니다!</Text>
              </View>
            </GlassCard>
          )}
        </Animated.View>

        {/* Completed Challenges to Claim */}
        {completedChallenges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={styles.sectionTitle}>✅ 완료된 챌린지</Text>
            <View style={styles.completedList}>
              {completedChallenges.slice(0, 3).map((challenge, index) => (
                <TouchableOpacity
                  key={challenge.id}
                  style={styles.completedItem}
                  onPress={() => handleClaimReward(challenge)}
                >
                  <Text style={styles.completedIcon}>{challenge.icon}</Text>
                  <View style={styles.completedInfo}>
                    <Text style={styles.completedTitle}>{challenge.titleKo}</Text>
                    <Text style={styles.completedReward}>+{challenge.reward}P 획득</Text>
                  </View>
                  <View style={styles.claimButton}>
                    <Text style={styles.claimButtonText}>받기</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Achievement Categories */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <Text style={styles.sectionTitle}>🏅 업적</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {(Object.keys(CATEGORY_INFO) as Array<keyof typeof CATEGORY_INFO>).map((cat) => {
              const info = CATEGORY_INFO[cat];
              const isSelected = selectedCategory === cat;
              const categoryAchievements = getAchievementsByCategory(cat);
              const unlocked = categoryAchievements.filter((a) => a.isUnlocked).length;

              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryTab, isSelected && styles.categoryTabSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(cat);
                  }}
                >
                  <Text style={styles.categoryIcon}>{info.icon}</Text>
                  <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                    {info.label}
                  </Text>
                  <Text style={styles.categoryCount}>{unlocked}/{categoryAchievements.length}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Achievements Grid */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <View style={styles.achievementsGrid}>
            {filteredAchievements.map((achievement, index) => {
              const tierColor = TIER_COLORS[achievement.tier];
              const progress = Math.min((achievement.progress / achievement.requirement) * 100, 100);

              return (
                <Animated.View
                  key={achievement.id}
                  entering={FadeIn.delay(index * 50).duration(200)}
                  style={styles.achievementCard}
                >
                  <View
                    style={[
                      styles.achievementInner,
                      achievement.isUnlocked && styles.achievementUnlocked,
                    ]}
                  >
                    <View
                      style={[
                        styles.tierBadge,
                        { backgroundColor: tierColor.bg },
                      ]}
                    >
                      <Text style={[styles.tierText, { color: tierColor.text }]}>
                        {achievement.tier.toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.achievementIcon,
                        !achievement.isUnlocked && styles.achievementIconLocked,
                      ]}
                    >
                      {achievement.isUnlocked ? achievement.icon : '🔒'}
                    </Text>
                    <Text style={styles.achievementTitle}>{achievement.titleKo}</Text>
                    <Text style={styles.achievementDesc} numberOfLines={2}>
                      {achievement.description}
                    </Text>
                    {!achievement.isUnlocked && (
                      <View style={styles.achievementProgress}>
                        <View style={styles.achievementProgressBar}>
                          <View
                            style={[
                              styles.achievementProgressFill,
                              { width: `${progress}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.achievementProgressText}>
                          {achievement.progress}/{achievement.requirement}
                        </Text>
                      </View>
                    )}
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <Text style={styles.unlockedDate}>
                        {new Date(achievement.unlockedAt).toLocaleDateString('ko-KR')} 달성
                      </Text>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  levelCard: {
    gap: Spacing.md,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  levelInfo: {},
  levelTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  levelPoints: {
    fontSize: FontSizes.sm,
    color: Colors.goldPrimary,
    marginTop: 2,
  },
  levelProgress: {
    gap: Spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.goldPrimary,
    borderRadius: 4,
  },
  pointsToNext: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  challengeList: {
    gap: Spacing.md,
  },
  challengeCard: {
    padding: Spacing.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  challengeIcon: {
    fontSize: 32,
  },
  challengeTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  challengeDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  challengeProgress: {
    marginBottom: Spacing.sm,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  challengeProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeProgressText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  challengeTime: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  challengeReward: {
    alignItems: 'flex-end',
  },
  rewardText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.goldPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  completedList: {
    gap: Spacing.sm,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  completedIcon: {
    fontSize: 24,
  },
  completedInfo: {
    flex: 1,
  },
  completedTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  completedReward: {
    fontSize: FontSizes.sm,
    color: Colors.success,
  },
  claimButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  claimButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  categoryScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  categoryTab: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryTabSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: Colors.purplePrimary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  categoryLabelSelected: {
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  achievementCard: {
    width: '47%',
  },
  achievementInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 160,
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  tierBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 8,
    fontWeight: '700',
  },
  achievementIcon: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  achievementTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  achievementProgress: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  achievementProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: Colors.purplePrimary,
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  unlockedDate: {
    fontSize: 10,
    color: Colors.success,
    marginTop: Spacing.sm,
  },
  bottomSpacing: {
    height: 100,
  },
});
