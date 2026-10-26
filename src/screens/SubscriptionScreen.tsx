import React, { useCallback } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Clock3, CreditCard, XCircle } from 'lucide-react-native';
import { studentService } from '../api/services';
import { useResource } from '../hooks/useResource';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeading } from '../components/PageHeading';
import { Screen } from '../components/Screen';

export function SubscriptionScreen() {
  const load = useCallback(() => studentService.subscription(), []);
  const { data, error, isLoading, refresh } = useResource(load);
  if (isLoading) return <Screen><LoadingState label="Loading subscription..." /></Screen>;
  if (error) return <Screen><ErrorState message={error.message} onRetry={() => { refresh(); }} /></Screen>;
  if (!data || data.status === 'none') return <Screen><PageHeading title="Your subscription" subtitle="Manage your learning plan." /><EmptyState title="No active subscription" description="Your plan details will appear here when you subscribe." /></Screen>;

  const status = {
    active: { label: 'ACTIVE', color: colors.green, background: colors.paleGreen, icon: CheckCircle2 },
    pending: { label: 'PENDING', color: '#A87400', background: colors.paleGold, icon: Clock3 },
    expired: { label: 'EXPIRED', color: colors.red, background: '#FFF0F0', icon: XCircle },
    none: { label: 'INACTIVE', color: colors.muted, background: colors.canvas, icon: XCircle },
  }[data.status];
  const StatusIcon = status.icon;

  const manage = async () => {
    if (!data.managementUrl) {
      Alert.alert('Management link unavailable', 'A secure payment provider link is not available yet.');
      return;
    }
    try {
      await Linking.openURL(data.managementUrl);
    } catch (cause) {
      Alert.alert('Unable to open payment provider', cause instanceof Error ? cause.message : 'Please try again.');
    }
  };

  return (
    <Screen>
      <PageHeading title="Your subscription" subtitle="Manage your learning plan." />
      <View style={styles.card}>
        <View style={styles.topline}><Text style={styles.planLabel}>SSEUROPA PLUS</Text><View style={[styles.status, { backgroundColor: status.background }]}><StatusIcon color={status.color} size={12} /><Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text></View></View>
        <Text style={styles.planName}>{data.planName ?? 'Learner plan'}</Text>
        {data.amount !== undefined ? <Text style={styles.price}>{new Intl.NumberFormat(undefined, { style: 'currency', currency: data.currency ?? 'EUR' }).format(data.amount)}<Text style={styles.period}> / billing cycle</Text></Text> : null}
        <View style={styles.divider} />
        <Text style={styles.detailLabel}>{data.status === 'active' ? 'Next payment' : 'Subscription status'}</Text>
        <Text style={styles.detailValue}>{data.renewsAt ? new Date(data.renewsAt).toLocaleDateString() : status.label}</Text>
        <Text style={styles.detailLabel}>Payment method</Text>
        <View style={styles.paymentMethod}><CreditCard color={colors.navy} size={19} /><Text style={styles.paymentText}>{data.maskedPaymentMethod ?? (data.provider === 'paypal' ? 'PayPal' : 'Payment details unavailable')}</Text></View>
        {data.managementUrl ? <Button title={`Manage ${data.provider === 'paypal' ? 'PayPal' : 'subscription'}`} variant="secondary" onPress={() => { manage(); }} /> : null}
      </View>
      <View style={[styles.note, { backgroundColor: status.background }]}><StatusIcon color={status.color} size={17} /><Text style={styles.noteText}>{data.status === 'active' ? 'Your subscription is active. Billing is handled securely by your payment provider.' : data.status === 'pending' ? 'Your payment is being processed. Your status will update when confirmed.' : 'Your subscription has expired. Renew through your account to continue.'}</Text></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 18, marginTop: 3 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { color: colors.blue, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  status: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, gap: 4 },
  statusLabel: { fontSize: 7, fontWeight: '900' },
  planName: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 15 },
  price: { color: colors.navy, fontSize: 25, fontWeight: '900', marginTop: 5 },
  period: { color: colors.muted, fontSize: 10, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 15 },
  detailLabel: { color: colors.muted, fontSize: 9, marginTop: 8 },
  detailValue: { color: colors.ink, fontSize: 11, fontWeight: '800', marginTop: 4 },
  paymentMethod: { backgroundColor: '#F3F7FC', borderRadius: 12, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  paymentText: { color: colors.navy, fontSize: 11, fontWeight: '800' },
  note: { padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 13 },
  noteText: { color: colors.ink, fontSize: 10, lineHeight: 15, flex: 1 },
});
