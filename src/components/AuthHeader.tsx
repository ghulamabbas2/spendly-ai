import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type Props = {
  subtitle: string;
};

const LOGO_SIZE = 72;

function AuthHeader({ subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Svg width={LOGO_SIZE} height={LOGO_SIZE}>
          <Defs>
            <LinearGradient id="authLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#7c3aed" />
              <Stop offset="100%" stopColor="#a855f7" />
            </LinearGradient>
          </Defs>
          <Rect width={LOGO_SIZE} height={LOGO_SIZE} rx={20} fill="url(#authLogoGradient)" />
        </Svg>
        <View style={styles.logoIcon}>
          <MaterialIcons name="auto-awesome" size={34} color="#ffffff" />
        </View>
      </View>

      <Text style={styles.wordmark}>Spendly AI</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    shadowColor: 'rgba(124,58,237,0.45)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  logoIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '800',
    color: '#16181c',
    letterSpacing: -0.4,
    marginTop: 14,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a5f6c',
    marginTop: 6,
  },
});

export default AuthHeader;
