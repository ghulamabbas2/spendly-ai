import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AuthHeader from '../components/AuthHeader';
import { useAuth } from '../hooks/use-auth';
import { signUpSchema } from '../lib/validation/auth-schema';
import type { AuthStackParamList } from '../navigation/types';

type FieldErrors = {
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
};

function SignUpScreen() {
  const { signUp } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  async function handleSignUp() {
    setFormError(null);

    const result = signUpSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors);
      return;
    }
    setFieldErrors({});

    try {
      setSubmitting(true);
      const { needsEmailConfirmation: needsConfirmation } = await signUp(
        result.data.email,
        result.data.password,
      );
      setNeedsEmailConfirmation(needsConfirmation);
    } catch (e) {
      console.error(e);
      setFormError('Couldn’t create your account. That email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  }

  if (needsEmailConfirmation) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <AuthHeader subtitle="Check your email" />
          <View style={styles.card}>
            <Text style={styles.info}>
              We sent a confirmation link to {email}. Confirm your account, then sign in.
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.link}>Back to sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <AuthHeader subtitle="Create your account" />

        <View style={styles.card}>
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <View style={styles.field}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#a2a8b4"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {fieldErrors.email ? (
              <Text style={styles.fieldError}>{fieldErrors.email[0]}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#a2a8b4"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
            />
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password[0]}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#a2a8b4"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {fieldErrors.confirmPassword ? (
              <Text style={styles.fieldError}>{fieldErrors.confirmPassword[0]}</Text>
            ) : null}
          </View>

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={submitting}>
            <Text style={styles.buttonLabel}>{submitting ? 'Creating account…' : 'Sign up'}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    gap: 16,
    shadowColor: 'rgba(20,22,40,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  info: {
    fontSize: 14,
    color: '#5a5f6c',
    textAlign: 'center',
    lineHeight: 20,
  },
  field: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e5ea',
    backgroundColor: '#fafbfc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#16181c',
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
  },
  formError: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  link: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SignUpScreen;
