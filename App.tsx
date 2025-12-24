import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';

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

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SettingsProvider>
        <ExpenseProvider>
          <IncomeProvider>
            <AchievementProvider>
              <BillProvider>
                <ExpenseTemplateProvider>
                  <RecurringExpenseProvider>
                    <GoalsProvider>
                      <DiaryProvider>
                        <ShoppingProvider>
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
                        </ShoppingProvider>
                      </DiaryProvider>
                    </GoalsProvider>
                  </RecurringExpenseProvider>
                </ExpenseTemplateProvider>
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
