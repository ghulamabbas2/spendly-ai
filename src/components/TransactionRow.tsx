import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { hexToRgba } from '../lib/color';
import { toMaterialIconName } from '../lib/icon-name';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  amount: string;
  onPress: () => void;
};

function TransactionRow({ title, subtitle, icon, color, amount, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}>
      <View style={[styles.iconChip, { backgroundColor: hexToRgba(color, 0.13) }]}>
        <MaterialIcons name={toMaterialIconName(icon) as IconName} size={22} color={color} />
      </View>
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.amount}>{amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  rowPressed: {
    backgroundColor: '#f6f7f9',
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16181c',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a90a0',
    marginTop: 2,
  },
  amount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#16181c',
  },
});

export default TransactionRow;
