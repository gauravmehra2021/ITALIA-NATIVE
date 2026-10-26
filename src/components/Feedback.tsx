import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { RefreshCw, WifiOff } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { Button } from './Button';

export function LoadingState({ label = 'Loading your learning...' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.blue} size="large" />
      <Text style={styles.description}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}><WifiOff color={colors.red} size={22} /></View>
      <Text style={styles.title}>We couldn’t load this</Text>
      <Text style={styles.description}>{message}</Text>
      <Button title="Try again" onPress={onRetry} variant="secondary" />
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}><RefreshCw color={colors.blue} size={22} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action ? <Button title={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

export function InlineNotice({
  message,
  onDismiss,
  tone = 'error',
}: {
  message: string;
  onDismiss?: () => void;
  tone?: 'error' | 'success' | 'info';
}) {
  return (
    <View style={[styles.notice, styles[tone]]} accessibilityRole="alert">
      <Text style={styles.noticeText}>{message}</Text>
      {onDismiss ? <Pressable onPress={onDismiss} accessibilityLabel="Dismiss message"><Text style={styles.dismiss}>×</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, minHeight: 220, justifyContent: 'center', alignItems: 'center', padding: 22 },
  iconCircle: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  description: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 7, maxWidth: 290 },
  notice: { padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  error: { backgroundColor: '#FFF0F0' },
  success: { backgroundColor: colors.paleGreen },
  info: { backgroundColor: colors.paleBlue },
  noticeText: { color: colors.ink, fontSize: 11, lineHeight: 16, flex: 1 },
  dismiss: { color: colors.ink, fontSize: 20, marginLeft: 8 },
});
