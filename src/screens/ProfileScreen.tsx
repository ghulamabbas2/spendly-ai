import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../hooks/use-auth';
import { useCategories } from '../hooks/use-categories';
import { getInitials } from '../lib/initials';
import type { AppStackParamList, TabParamList } from '../navigation/types';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  NativeStackNavigationProp<AppStackParamList>
>;

type SettingRow = {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
};

function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { categories } = useCategories();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settings: SettingRow[] = [
    {
      icon: 'category',
      label: 'Manage categories',
      value: `${categories.length}`,
      onPress: () => navigation.navigate('Categories'),
    },
    { icon: 'account-balance-wallet', label: 'Currency', value: 'USD $' },
    { icon: 'notifications', label: 'Notifications', value: 'On' },
    { icon: 'dark-mode', label: 'Appearance', value: 'Light' },
    {
      icon: 'privacy-tip',
      label: 'Privacy policy',
      onPress: () => {
        Linking.openURL('https://www.termsfeed.com/live/8201db90-4047-4d37-8f75-3bafdccc0bbb');
      },
    },
    { icon: 'help', label: 'Help & support' },
  ];

  async function handleSignOut() {
    try {
      setSubmitting(true);
      setError(null);
      await signOut();
    } catch (e) {
      console.error(e);
      setError('Couldn’t sign out. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      {user ? (
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{getInitials(user.fullName, user.email)}</Text>
          </View>
          <View style={styles.identityText}>
            {user.fullName ? <Text style={styles.name}>{user.fullName}</Text> : null}
            <Text style={styles.email}>{user.email}</Text>
          </View>
          <MaterialIcons name="edit" size={22} color="#c2c7d0" />
        </View>
      ) : null}

      <View style={styles.settingsCard}>
        {settings.map((setting, index) => (
          <Pressable
            key={setting.label}
            style={[styles.settingRow, index > 0 && styles.settingRowDivider]}
            onPress={setting.onPress}
            disabled={!setting.onPress}
            accessibilityRole="button"
            accessibilityLabel={setting.label}>
            <View style={styles.settingIconChip}>
              <MaterialIcons name={setting.icon} size={21} color="#7c3aed" />
            </View>
            <Text style={styles.settingLabel}>{setting.label}</Text>
            {setting.value ? <Text style={styles.settingValue}>{setting.value}</Text> : null}
            <MaterialIcons name="chevron-right" size={20} color="#c2c7d0" />
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.signOutButton, submitting && styles.signOutButtonDisabled]}
        onPress={handleSignOut}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Sign out">
        <MaterialIcons name="logout" size={21} color="#dc2626" />
        <Text style={styles.signOutLabel}>{submitting ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16181c',
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  identityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    shadowColor: 'rgba(20,22,40,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(124,58,237,0.35)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  avatarLabel: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 22,
  },
  identityText: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16181c',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a90a0',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 6,
    marginBottom: 18,
    shadowColor: 'rgba(20,22,40,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  settingRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f0f1f4',
  },
  settingIconChip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#f3ebfd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#16181c',
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a2a8b4',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: 'rgba(20,22,40,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutLabel: {
    color: '#dc2626',
    fontWeight: '800',
    fontSize: 15,
  },
});

export default ProfileScreen;
