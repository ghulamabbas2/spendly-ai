import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppStackParamList } from '../navigation/types';

function ExpenseDetailScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'ExpenseDetail'>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expense Detail</Text>
      <Text style={styles.id}>{route.params.expenseId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  id: {
    marginTop: 8,
    fontSize: 13,
    color: '#8a90a0',
  },
});

export default ExpenseDetailScreen;
