import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { hexToRgba } from '../lib/color';
import { toMaterialIconName } from '../lib/icon-name';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  name: string;
  icon: string;
  color: string;
  amount: string;
  barWidthPercent: number;
};

function CategoryProgressRow({ name, icon, color, amount, barWidthPercent }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconChip, { backgroundColor: hexToRgba(color, 0.13) }]}>
        <MaterialIcons name={toMaterialIconName(icon) as IconName} size={21} color={color} />
      </View>
      <View style={styles.details}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.amount}>{amount}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.bar, { width: `${barWidthPercent}%`, backgroundColor: color }]} />
        </View>
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
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16181c',
  },
  amount: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#16181c',
  },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#eef0f4',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});

export default CategoryProgressRow;
