import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddExpenseScreen from '../screens/AddExpenseScreen';
import TabNavigator from './TabNavigator';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

export default AppStack;
