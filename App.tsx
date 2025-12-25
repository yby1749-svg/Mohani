import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';

import TabNavigator from './src/navigation/TabNavigator';
import { Colors } from './src/constants/theme';
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

// Log immediately when module loads
console.log('>>> App.tsx module loaded');

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('>>> App useEffect running');
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      console.log('>>> Setting isReady to true');
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  console.log('>>> App rendering, isReady:', isReady);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.purplePrimary} />
        <Text style={styles.loadingText}>Loading MOHANI...</Text>
      </View>
    );
  }

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
                                        <View style={styles.container}>
                                          <StatusBar style="light" />
                                          <NavigationContainer
                                            theme={{
                                              dark: true,
                                              colors: {
                                                primary: Colors.purplePrimary,
                                                background: Colors.bgPrimary,
                                                card: Colors.bgSecondary,
                                                text: Colors.textPrimary,
                                                border: Colors.border,
                                                notification: Colors.goldPrimary,
                                              },
                                            }}
                                          >
                                            <TabNavigator />
                                          </NavigationContainer>
                                        </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
  },
});
