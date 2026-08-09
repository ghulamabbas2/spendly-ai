import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function AddExpenseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Expense</Text>
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
});

export default AddExpenseScreen;
