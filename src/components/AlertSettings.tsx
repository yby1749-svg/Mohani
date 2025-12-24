import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { SpendingAlert } from '../context/AlertsContext';

interface AlertSettingsProps {
  alerts: SpendingAlert[];
  onToggle: (id: string) => void;
  onUpdateThreshold: (id: string, threshold: number) => void;
}

const ALERT_INFO: Record<string, { icon: string; title: string; description: string }> = {
  budget_50: {
    icon: '🔔',
    title: '예산 50% 도달',
    description: '월 예산의 절반을 사용하면 알림',
  },
  budget_80: {
    icon: '⚠️',
    title: '예산 80% 도달',
    description: '예산이 거의 다 소진되면 경고',
  },
  budget_100: {
    icon: '🚨',
    title: '예산 초과',
    description: '예산을 초과하면 즉시 알림',
  },
  daily_limit: {
    icon: '📅',
    title: '일일 지출 한도',
    description: '하루 지출이 설정 금액을 넘으면 알림',
  },
  large_expense: {
    icon: '💸',
    title: '고액 지출 알림',
    description: '큰 금액을 한번에 지출하면 알림',
  },
};

export const AlertSettings: React.FC<AlertSettingsProps> = ({
  alerts,
  onToggle,
  onUpdateThreshold,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState('');

  const handleEditStart = (alert: SpendingAlert) => {
    setEditingId(alert.id);
    setTempThreshold(alert.threshold.toString());
  };

  const handleEditEnd = (id: string) => {
    const value = parseFloat(tempThreshold);
    if (!isNaN(value) && value > 0) {
      onUpdateThreshold(id, value);
    }
    setEditingId(null);
    setTempThreshold('');
  };

  const formatThreshold = (alert: SpendingAlert) => {
    if (alert.type === 'budget_percent') {
      return `${alert.threshold}%`;
    }
    return `₩${alert.threshold.toLocaleString()}`;
  };

  const budgetAlerts = alerts.filter((a) => a.type === 'budget_percent');
  const otherAlerts = alerts.filter((a) => a.type !== 'budget_percent');

  return (
    <View style={styles.container}>
      {/* Budget Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>예산 알림</Text>
        {budgetAlerts.map((alert, index) => {
          const info = ALERT_INFO[alert.id];
          return (
            <Animated.View
              key={alert.id}
              entering={FadeInDown.delay(index * 80).duration(250)}
              style={styles.alertItem}
            >
              <View style={styles.alertLeft}>
                <Text style={styles.alertIcon}>{info?.icon || '🔔'}</Text>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{info?.title || alert.id}</Text>
                  <Text style={styles.alertDesc}>{info?.description}</Text>
                </View>
              </View>
              <Switch
                value={alert.isEnabled}
                onValueChange={() => onToggle(alert.id)}
                trackColor={{ false: Colors.border, true: Colors.purpleLight }}
                thumbColor={alert.isEnabled ? Colors.textPrimary : Colors.textMuted}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Customizable Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>지출 한도 알림</Text>
        {otherAlerts.map((alert, index) => {
          const info = ALERT_INFO[alert.id];
          const isEditing = editingId === alert.id;

          return (
            <Animated.View
              key={alert.id}
              entering={FadeInDown.delay((budgetAlerts.length + index) * 80).duration(250)}
              style={styles.alertItem}
            >
              <View style={styles.alertLeft}>
                <Text style={styles.alertIcon}>{info?.icon || '🔔'}</Text>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{info?.title || alert.id}</Text>
                  <Text style={styles.alertDesc}>{info?.description}</Text>
                </View>
              </View>
              <View style={styles.alertRight}>
                {isEditing ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.thresholdInput}
                      value={tempThreshold}
                      onChangeText={setTempThreshold}
                      keyboardType="numeric"
                      autoFocus
                      onBlur={() => handleEditEnd(alert.id)}
                      onSubmitEditing={() => handleEditEnd(alert.id)}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.thresholdBtn}
                    onPress={() => handleEditStart(alert)}
                    disabled={!alert.isEnabled}
                  >
                    <Text style={[
                      styles.thresholdText,
                      !alert.isEnabled && styles.thresholdDisabled,
                    ]}>
                      {formatThreshold(alert)}
                    </Text>
                  </TouchableOpacity>
                )}
                <Switch
                  value={alert.isEnabled}
                  onValueChange={() => onToggle(alert.id)}
                  trackColor={{ false: Colors.border, true: Colors.purpleLight }}
                  thumbColor={alert.isEnabled ? Colors.textPrimary : Colors.textMuted}
                />
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          알림은 앱 사용 중에만 표시됩니다. 금액을 탭하여 한도를 수정할 수 있어요.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  alertIcon: {
    fontSize: 24,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  alertDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  alertRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  thresholdBtn: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  thresholdText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.purpleLight,
  },
  thresholdDisabled: {
    color: Colors.textMuted,
  },
  editContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
  },
  thresholdInput: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    minWidth: 80,
    padding: Spacing.xs,
    textAlign: 'right',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
