import React from 'react';
import { StyleSheet, View } from 'react-native';

import Skeleton from './Skeleton';

function CategoryProgressRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={38} height={38} borderRadius={11} />
      <View style={styles.details}>
        <Skeleton width="100%" height={13} style={styles.mb6} />
        <Skeleton width="100%" height={7} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  mb6: {
    marginBottom: 6,
  },
});

export default CategoryProgressRowSkeleton;
