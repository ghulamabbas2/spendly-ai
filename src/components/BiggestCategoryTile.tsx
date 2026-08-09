import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { toMaterialIconName } from '../lib/icon-name';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  name: string;
  icon: string;
  color: string;
  tint: string;
  amount: string;
};

function BiggestCategoryTile({ name, icon, color, tint, amount }: Props) {
  return (
    <View style={[styles.tile, { backgroundColor: tint }]}>
      <View style={[styles.iconChip, { backgroundColor: color }]}>
        <MaterialIcons
          name={toMaterialIconName(icon) as IconName}
          size={19}
          color="#ffffff"
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.amount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 12,
  },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5a5f6c',
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16181c',
    marginTop: 2,
  },
});

export default BiggestCategoryTile;
