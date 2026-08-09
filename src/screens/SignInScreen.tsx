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
import { AuthServiceError } from '../services/auth-service';
import { signInSchema } from '../lib/validation/auth-schema';
import type { AuthStackParamList } from '../navigation/types';

type FieldErrors = {
  email?: string[];
  password?: string[];
};

function getSignInErrorMessage(e: unknown): string {
  const code = e instanceof AuthServiceError ? e.code : undefined;
  switch (code) {
    case 'email_not_confirmed':
      return 'Confirm your email before signing in — check your inbox for the link.';
    case 'over_request_rate_limit':
      return 'Too many attempts right now. Please wait a bit and try again.';
    default:
      return 'Couldn’t sign in. Check your email and password.';
  }
}

function SignInScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    setFormError(null);

    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors);
      return;
    }
    setFieldErrors({});

    try {
      setSubmitting(true);
      await signIn(result.data.email, result.data.password);
    } catch (e) {
      console.error(e);
      setFormError(getSignInErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <AuthHeader subtitle="Welcome back" />

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
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
            />
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password[0]}</Text>
            ) : null}
          </View>

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={submitting}>
            <Text style={styles.buttonLabel}>{submitting ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.link}>Don&apos;t have an account? Sign up</Text>
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

export default SignInScreen;
