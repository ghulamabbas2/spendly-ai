import React from 'react';
import { StyleSheet, View } from 'react-native';

import Skeleton from './Skeleton';

function TransactionRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={42} height={42} borderRadius={12} />
      <View style={styles.details}>
        <Skeleton width="60%" height={14} style={styles.mb6} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={50} height={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  mb6: {
    marginBottom: 6,
  },
});

export default TransactionRowSkeleton;
