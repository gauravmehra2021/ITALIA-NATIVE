import React, { useState } from 'react';
import { Controller, useForm, type Control, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LockKeyhole } from 'lucide-react-native';
import { ApiError, getErrorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';
import { loginSchema, otpSchema, type LoginInput, type OtpInput } from '../validation/schemas';
import { Button } from '../components/Button';
import { InlineNotice } from '../components/Feedback';

export function LoginScreen() {
  const { beginLogin, verifyOtp } = useAuth();
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const otpForm = useForm<OtpInput>({ resolver: zodResolver(otpSchema), defaultValues: { code: '' } });

  const submitLogin = loginForm.handleSubmit(async values => {
    setChallengeError(null);
    setEmail(values.email);
    try {
      await beginLogin(values.email, values.password);
      loginForm.reset({ email: values.email, password: '' });
      setIsOtpStep(true);
    } catch (cause) {
      const fieldErrors = getServerFieldErrors(cause);
      if (fieldErrors.email) loginForm.setError('email', { type: 'server', message: fieldErrors.email });
      if (fieldErrors.password) loginForm.setError('password', { type: 'server', message: fieldErrors.password });
      setChallengeError(getErrorMessage(cause));
    }
  });

  const submitOtp = otpForm.handleSubmit(async values => {
    setChallengeError(null);
    try {
      await verifyOtp(values.code);
    } catch (cause) {
      const fieldErrors = getServerFieldErrors(cause);
      if (fieldErrors.code) otpForm.setError('code', { type: 'server', message: fieldErrors.code });
      setChallengeError(getErrorMessage(cause));
    }
  });

  const goBackToLogin = () => {
    setIsOtpStep(false);
    setChallengeError(null);
    otpForm.reset();
  };

  return (
    <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.brand}>
        <View style={styles.mark}><Text style={styles.markText}>SS</Text><View style={styles.markGold} /></View>
        <Text style={styles.brandName}>sseuropa</Text><Text style={styles.brandTagline}>LEARN · GROW · SUCCEED</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>{isOtpStep ? 'Verify it’s you' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>{isOtpStep ? `Enter the 6-digit code sent to ${email}.` : 'Sign in to continue your learning journey.'}</Text>
        {challengeError ? <InlineNotice message={challengeError} onDismiss={() => setChallengeError(null)} /> : null}
        {!isOtpStep ? (
          <>
            <FormField<LoginInput> label="EMAIL ADDRESS" name="email" control={loginForm.control} error={loginForm.formState.errors.email?.message} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
            <FormField<LoginInput> label="PASSWORD" name="password" control={loginForm.control} error={loginForm.formState.errors.password?.message} placeholder="Enter your password" secureTextEntry />
            <Button title="Continue securely" onPress={() => { submitLogin(); }} loading={loginForm.formState.isSubmitting} />
          </>
        ) : (
          <>
            <FormField<OtpInput> label="6-DIGIT VERIFICATION CODE" name="code" control={otpForm.control} error={otpForm.formState.errors.code?.message} keyboardType="number-pad" placeholder="••••••" maxLength={6} />
            <View style={styles.secureHint}><LockKeyhole color={colors.green} size={15} /><Text style={styles.secureText}>Your account is protected with secure verification.</Text></View>
            <Button title="Verify & sign in" onPress={() => { submitOtp(); }} loading={otpForm.formState.isSubmitting} />
            <Pressable onPress={goBackToLogin}><Text style={styles.backLink}>Use a different email address</Text></Pressable>
          </>
        )}
      </View>
      <Text style={styles.privacy}>Your learning data stays private and secure.</Text>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField<T extends FieldValues>({
  label,
  name,
  control,
  error,
  ...inputProps
}: {
  label: string;
  name: Path<T>;
  control: Control<T>;
  error?: string;
} & Omit<React.ComponentProps<typeof TextInput>, 'value' | 'onChangeText'>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            {...inputProps}
            value={String(value ?? '')}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            style={[styles.input, error && styles.inputError, String(name) === 'code' && styles.otpInput]}
            accessibilityLabel={label}
          />
        )}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function getServerFieldErrors(cause: unknown): Record<string, string> {
  if (!(cause instanceof ApiError) || !cause.fieldErrors) return {};
  return Object.fromEntries(Object.entries(cause.fieldErrors).map(([field, messages]) => [field, messages[0] ?? '']));
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: colors.canvas },
  safe: { flex: 1, backgroundColor: colors.canvas },
  brand: { alignItems: 'center', marginBottom: 24 },
  mark: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy, borderWidth: 2, borderColor: colors.gold },
  markText: { color: colors.white, fontSize: 22, fontWeight: '900', letterSpacing: -2 },
  markGold: { position: 'absolute', width: 26, height: 2, backgroundColor: colors.gold, bottom: 13 },
  brandName: { color: colors.navy, fontSize: 21, fontWeight: '900', marginTop: 10 },
  brandTagline: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 3 },
  card: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 19 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6, marginBottom: 13 },
  field: { marginTop: 11 },
  label: { color: colors.ink, fontSize: 8, fontWeight: '900', letterSpacing: 0.7, marginBottom: 7 },
  input: { height: 46, borderColor: colors.line, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, color: colors.ink, fontSize: 12, backgroundColor: '#FBFCFE' },
  inputError: { borderColor: colors.red },
  otpInput: { fontSize: 21, letterSpacing: 7, textAlign: 'center' },
  fieldError: { color: colors.red, fontSize: 9, marginTop: 4 },
  secureHint: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  secureText: { color: colors.green, fontSize: 9 },
  backLink: { color: colors.blue, textAlign: 'center', fontSize: 10, fontWeight: '800', marginTop: 15 },
  privacy: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 18 },
});
