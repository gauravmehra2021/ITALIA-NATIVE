import React, { useState } from 'react';
import { Controller, useForm, type Control, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LockKeyhole } from 'lucide-react-native';
import { ApiError, getErrorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { authService } from '../api/services';
import { colors } from '../theme/colors';
import {
  loginSchema,
  otpSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type OtpInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '../validation/schemas';
import { BrandMark } from '../components/BrandMark';
import { Button } from '../components/Button';
import { InlineNotice } from '../components/Feedback';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset_password' | 'otp';

export function LoginScreen() {
  const { beginLogin, beginRegister, verifyOtp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<'error' | 'success'>('error');
  const [email, setEmail] = useState('');
  const [resetChallengeId, setResetChallengeId] = useState<string | null>(null);

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const registerForm = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), defaultValues: { firstName: '', lastName: '', email: '', password: '' } });
  const forgotForm = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });
  const resetForm = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { code: '', newPassword: '' } });
  const otpForm = useForm<OtpInput>({ resolver: zodResolver(otpSchema), defaultValues: { code: '' } });

  const clearMessages = () => setNotice(null);

  const submitLogin = loginForm.handleSubmit(async values => {
    clearMessages();
    setEmail(values.email);
    try {
      await beginLogin(values.email, values.password);
      loginForm.reset({ email: values.email, password: '' });
      setMode('otp');
    } catch (cause) {
      const fieldErrors = getServerFieldErrors(cause);
      if (fieldErrors.email) loginForm.setError('email', { type: 'server', message: fieldErrors.email });
      if (fieldErrors.password) loginForm.setError('password', { type: 'server', message: fieldErrors.password });
      setNoticeType('error');
      setNotice(getErrorMessage(cause));
    }
  });

  const submitRegister = registerForm.handleSubmit(async values => {
    clearMessages();
    setEmail(values.email);
    try {
      await beginRegister(values.firstName, values.lastName, values.email, values.password);
      registerForm.reset();
      setMode('otp');
    } catch (cause) {
      const fieldErrors = getServerFieldErrors(cause);
      if (fieldErrors.email) registerForm.setError('email', { type: 'server', message: fieldErrors.email });
      setNoticeType('error');
      setNotice(getErrorMessage(cause));
    }
  });

  const submitForgot = forgotForm.handleSubmit(async values => {
    clearMessages();
    setEmail(values.email);
    try {
      const challenge = await authService.forgotPassword(values.email);
      setResetChallengeId(challenge.challengeId);
      forgotForm.reset();
      setNoticeType('success');
      setNotice('Verification code sent. Use code: 123456 for demo accounts.');
      setMode('reset_password');
    } catch (cause) {
      setNoticeType('error');
      setNotice(getErrorMessage(cause));
    }
  });

  const submitResetPassword = resetForm.handleSubmit(async values => {
    if (!resetChallengeId) return;
    clearMessages();
    try {
      await authService.resetPassword(resetChallengeId, values.code, values.newPassword);
      resetForm.reset();
      setNoticeType('success');
      setNotice('Password reset successfully! You can now sign in with your new password.');
      setMode('login');
      loginForm.setValue('email', email);
      loginForm.setValue('password', values.newPassword);
    } catch (cause) {
      setNoticeType('error');
      setNotice(getErrorMessage(cause));
    }
  });

  const submitOtp = otpForm.handleSubmit(async values => {
    clearMessages();
    try {
      await verifyOtp(values.code);
    } catch (cause) {
      const fieldErrors = getServerFieldErrors(cause);
      if (fieldErrors.code) otpForm.setError('code', { type: 'server', message: fieldErrors.code });
      setNoticeType('error');
      setNotice(getErrorMessage(cause));
    }
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'right', 'bottom', 'left']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <BrandMark size={92} medallion goldRim />
            <Text style={styles.brandName}>sseuropa</Text>
            <Text style={styles.brandTagline}>LEARN · GROW · SUCCEED</Text>
          </View>

          <View style={styles.card}>
            {mode === 'login' && (
              <>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Sign in to continue your learning journey.</Text>
                {notice ? <InlineNotice message={notice} tone={noticeType} onDismiss={clearMessages} /> : null}
                <FormField<LoginInput> label="EMAIL ADDRESS" name="email" control={loginForm.control} error={loginForm.formState.errors.email?.message} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
                <FormField<LoginInput> label="PASSWORD" name="password" control={loginForm.control} error={loginForm.formState.errors.password?.message} placeholder="Enter your password" secureTextEntry />
                <Pressable onPress={() => { setMode('forgot'); clearMessages(); }} style={styles.forgotLinkContainer}>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </Pressable>
                <Button title="Continue securely" onPress={() => { submitLogin(); }} loading={loginForm.formState.isSubmitting} />
                <Pressable
                  onPress={() => {
                    loginForm.setValue('email', 'student@sseuropa.demo');
                    loginForm.setValue('password', 'Demo@12345');
                  }}
                  style={styles.demoLinkContainer}
                >
                  <Text style={styles.demoLink}>Fill Demo Student Credentials (student@sseuropa.demo)</Text>
                </Pressable>
                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>Don't have an account?</Text>
                  <Pressable onPress={() => { setMode('register'); clearMessages(); }}>
                    <Text style={styles.switchLink}>Sign up</Text>
                  </Pressable>
                </View>
              </>
            )}

            {mode === 'register' && (
              <>
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>Join SS Europa and start learning today.</Text>
                {notice ? <InlineNotice message={notice} tone={noticeType} onDismiss={clearMessages} /> : null}
                <FormField<RegisterInput> label="FIRST NAME" name="firstName" control={registerForm.control} error={registerForm.formState.errors.firstName?.message} placeholder="e.g. Maria" />
                <FormField<RegisterInput> label="LAST NAME" name="lastName" control={registerForm.control} error={registerForm.formState.errors.lastName?.message} placeholder="e.g. Rossi" />
                <FormField<RegisterInput> label="EMAIL ADDRESS" name="email" control={registerForm.control} error={registerForm.formState.errors.email?.message} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
                <FormField<RegisterInput> label="PASSWORD" name="password" control={registerForm.control} error={registerForm.formState.errors.password?.message} placeholder="Choose a password (min 6 chars)" secureTextEntry />
                <Button title="Create account" onPress={() => { submitRegister(); }} loading={registerForm.formState.isSubmitting} />
                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>Already have an account?</Text>
                  <Pressable onPress={() => { setMode('login'); clearMessages(); }}>
                    <Text style={styles.switchLink}>Sign in</Text>
                  </Pressable>
                </View>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <Text style={styles.title}>Forgot password</Text>
                <Text style={styles.subtitle}>Enter your email to receive a password reset code.</Text>
                {notice ? <InlineNotice message={notice} tone={noticeType} onDismiss={clearMessages} /> : null}
                <FormField<ForgotPasswordInput> label="ACCOUNT EMAIL" name="email" control={forgotForm.control} error={forgotForm.formState.errors.email?.message} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
                <Button title="Send verification code" onPress={() => { submitForgot(); }} loading={forgotForm.formState.isSubmitting} />
                <Pressable onPress={() => { setMode('login'); clearMessages(); }}>
                  <Text style={styles.backLink}>Back to sign in</Text>
                </Pressable>
              </>
            )}

            {mode === 'reset_password' && (
              <>
                <Text style={styles.title}>Set new password</Text>
                <Text style={styles.subtitle}>Enter the 6-digit code sent to {email} and your new password.</Text>
                {notice ? <InlineNotice message={notice} tone={noticeType} onDismiss={clearMessages} /> : null}
                <FormField<ResetPasswordInput> label="6-DIGIT VERIFICATION CODE" name="code" control={resetForm.control} error={resetForm.formState.errors.code?.message} keyboardType="number-pad" placeholder="••••••" maxLength={6} />
                <FormField<ResetPasswordInput> label="NEW PASSWORD" name="newPassword" control={resetForm.control} error={resetForm.formState.errors.newPassword?.message} placeholder="Enter new password (min 6 chars)" secureTextEntry />
                <Button title="Save new password" onPress={() => { submitResetPassword(); }} loading={resetForm.formState.isSubmitting} />
                <Pressable onPress={() => resetForm.setValue('code', '123456')} style={styles.demoLinkContainer}>
                  <Text style={styles.demoLink}>Quick Fill Demo Code (123456)</Text>
                </Pressable>
                <Pressable onPress={() => { setMode('login'); clearMessages(); }}>
                  <Text style={styles.backLink}>Back to sign in</Text>
                </Pressable>
              </>
            )}

            {mode === 'otp' && (
              <>
                <Text style={styles.title}>Verify it’s you</Text>
                <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}.</Text>
                {notice ? <InlineNotice message={notice} tone={noticeType} onDismiss={clearMessages} /> : null}
                <FormField<OtpInput> label="6-DIGIT VERIFICATION CODE" name="code" control={otpForm.control} error={otpForm.formState.errors.code?.message} keyboardType="number-pad" placeholder="••••••" maxLength={6} />
                <View style={styles.secureHint}>
                  <LockKeyhole color={colors.green} size={15} />
                  <Text style={styles.secureText}>Your account is protected with secure verification.</Text>
                </View>
                <Button title="Verify & sign in" onPress={() => { submitOtp(); }} loading={otpForm.formState.isSubmitting} />
                <Pressable onPress={() => otpForm.setValue('code', '123456')} style={styles.demoLinkContainer}>
                  <Text style={styles.demoLink}>Quick Fill Demo Code (123456)</Text>
                </Pressable>
                <Pressable onPress={() => { setMode('login'); clearMessages(); }}>
                  <Text style={styles.backLink}>Use a different email address</Text>
                </Pressable>
              </>
            )}
          </View>

          <Text style={styles.privacy}>Your learning data stays private and secure.</Text>
        </ScrollView>
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
            style={[styles.input, error && styles.inputError, (String(name) === 'code') && styles.otpInput]}
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
  keyboard: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: colors.canvas },
  safe: { flex: 1, backgroundColor: colors.canvas },
  brand: { alignItems: 'center', marginBottom: 24 },
  brandName: { color: colors.navy, fontSize: 22, fontWeight: '900', marginTop: 12 },
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
  forgotLinkContainer: { alignSelf: 'flex-end', marginTop: 6, marginBottom: 10 },
  forgotLink: { color: colors.blue, fontSize: 10, fontWeight: '700' },
  secureHint: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  secureText: { color: colors.green, fontSize: 9 },
  demoLinkContainer: { marginTop: 12, alignItems: 'center' },
  demoLink: { color: colors.blue, textAlign: 'center', fontSize: 10, fontWeight: '700' },
  backLink: { color: colors.blue, textAlign: 'center', fontSize: 10, fontWeight: '800', marginTop: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 },
  switchText: { color: colors.muted, fontSize: 10 },
  switchLink: { color: colors.blue, fontSize: 10, fontWeight: '800' },
  privacy: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 18 },
});
