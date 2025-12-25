import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import TabNavigator from './src/navigation/TabNavigator';
import { Colors, DarkColors, LightColors } from './src/constants/theme';
import { useSettings } from './src/context/SettingsContext';
import { ExpenseProvider } from './src/context/ExpenseContext';
import { DiaryProvider } from './src/context/DiaryContext';
import { ShoppingProvider } from './src/context/ShoppingContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { RecurringExpenseProvider } from './src/context/RecurringExpenseContext';
import { GoalsProvider } from './src/context/GoalsContext';
import { ExpenseTemplateProvider } from './src/context/ExpenseTemplateContext';
import { IncomeProvider } from './src/context/IncomeContext';
import { AchievementProvider } from './src/context/AchievementContext';
import { BillProvider } from './src/context/BillContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { ChallengeProvider } from './src/context/ChallengeContext';
import { DebtProvider } from './src/context/DebtContext';
import { StreaksProvider } from './src/context/StreaksContext';
import { NetWorthProvider } from './src/context/NetWorthContext';
import { CustomCategoriesProvider } from './src/context/CustomCategoriesContext';
import { WalletProvider } from './src/context/WalletContext';
import { SplitExpenseProvider } from './src/context/SplitExpenseContext';
import { AlertsProvider } from './src/context/AlertsContext';
import { BudgetAlertProvider } from './src/context/BudgetAlertContext';
import { SpendingStreaksProvider } from './src/context/SpendingStreaksContext';
import { CategoryBudgetProvider } from './src/context/CategoryBudgetContext';
import { TagsProvider } from './src/context/TagsContext';

// Force hide splash screen immediately
SplashScreen.hideAsync().catch(() => {});

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: string}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: 'red', fontSize: 18, marginBottom: 10 }}>Error:</Text>
          <Text style={{ color: 'white', fontSize: 14 }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Inner component that can use settings for theming
function AppContent() {
  const { settings } = useSettings();
  const colors = settings.darkMode ? DarkColors : LightColors;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style={settings.darkMode ? 'light' : 'dark'} />
      <NavigationContainer
        theme={{
          dark: settings.darkMode,
          colors: {
            primary: colors.purplePrimary,
            background: colors.bgPrimary,
            card: colors.bgSecondary,
            text: colors.textPrimary,
            border: colors.border,
            notification: colors.goldPrimary,
          },
        }}
      >
        <TabNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SettingsProvider>
        <ExpenseProvider>
          <IncomeProvider>
            <AchievementProvider>
              <BillProvider>
                <SubscriptionProvider>
                  <ChallengeProvider>
                    <DebtProvider>
                      <ExpenseTemplateProvider>
                        <RecurringExpenseProvider>
                          <GoalsProvider>
                            <DiaryProvider>
                              <ShoppingProvider>
                                <StreaksProvider>
                                  <NetWorthProvider>
                                    <CustomCategoriesProvider>
                                      <WalletProvider>
                                        <SplitExpenseProvider>
                                          <AlertsProvider>
                                            <BudgetAlertProvider>
                                              <CategoryBudgetProvider>
                                                <TagsProvider>
                                                  <SpendingStreaksProvider>
                                                    <AppContent />
                                                  </SpendingStreaksProvider>
                                                </TagsProvider>
                                              </CategoryBudgetProvider>
                                            </BudgetAlertProvider>
                                          </AlertsProvider>
                                        </SplitExpenseProvider>
                                      </WalletProvider>
                                    </CustomCategoriesProvider>
                                  </NetWorthProvider>
                                </StreaksProvider>
                              </ShoppingProvider>
                            </DiaryProvider>
                          </GoalsProvider>
                        </RecurringExpenseProvider>
                      </ExpenseTemplateProvider>
                    </DebtProvider>
                  </ChallengeProvider>
                </SubscriptionProvider>
              </BillProvider>
            </AchievementProvider>
          </IncomeProvider>
        </ExpenseProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
});
