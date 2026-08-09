import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../hooks/use-auth';

function SignInScreen() {
  const { signIn } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Pressable style={styles.button} onPress={signIn}>
        <Text style={styles.buttonLabel}>Sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default SignInScreen;
