import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Megaphone, ShieldCheck, Target } from 'lucide-react-native';
import { studentService } from '../api/services';
import type { StudentNotification } from '../api/types';
import { useResource } from '../hooks/useResource';
import { colors } from '../theme/colors';
import { InlineNotice, EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeading } from '../components/PageHeading';
import { Screen } from '../components/Screen';

type Filter = 'all' | StudentNotification['category'];
const filters: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'class', label: 'Classes' },
  { id: 'test', label: 'Tests' },
  { id: 'announcement', label: 'News' },
  { id: 'security', label: 'Security' },
];

export function NotificationsScreen() {
  const load = useCallback(() => studentService.notifications(), []);
  const { data, error, isLoading, refresh } = useResource(load);
  const [filter, setFilter] = useState<Filter>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const filtered = useMemo(() => data?.filter(item => filter === 'all' || item.category === filter) ?? [], [data, filter]);

  const markRead = async (notification: StudentNotification) => {
    if (notification.read) return;
    try {
      await studentService.markNotificationRead(notification.id);
      await refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to update this notification.');
    }
  };

  return (
    <Screen>
      <PageHeading title="Notifications" subtitle="Stay up to date with your learning." />
      {actionError ? <InlineNotice message={actionError} onDismiss={() => setActionError(null)} /> : null}
      <View style={styles.filters}>
        {filters.map(item => <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.filter, filter === item.id && styles.filterActive]}><Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text></Pressable>)}
      </View>
      {isLoading ? <LoadingState label="Loading notifications..." /> : error ? <ErrorState message={error.message} onRetry={() => { refresh(); }} /> : !filtered.length ? (
        <EmptyState title="You’re all caught up" description="New classes, tests, announcements and security updates will appear here." />
      ) : filtered.map(item => <NotificationCard key={item.id} item={item} onPress={() => { markRead(item); }} />)}
    </Screen>
  );
}

function NotificationCard({ item, onPress }: { item: StudentNotification; onPress: () => void }) {
  const icons = {
    class: { Icon: CalendarDays, tint: colors.blue, background: colors.paleBlue },
    test: { Icon: Target, tint: colors.green, background: colors.paleGreen },
    announcement: { Icon: Megaphone, tint: '#A87400', background: colors.paleGold },
    security: { Icon: ShieldCheck, tint: colors.red, background: '#FFF0F0' },
  };
  const { Icon, tint, background } = icons[item.category];
  return (
    <Pressable onPress={onPress} style={[styles.card, !item.read && styles.unread]} accessibilityRole="button" accessibilityLabel={`${item.read ? '' : 'Unread: '}${item.title}`}>
      <View style={[styles.icon, { backgroundColor: background }]}><Icon color={tint} size={17} /></View>
      <View style={styles.copy}>
        <View style={styles.titleRow}><Text style={styles.title}>{item.title}</Text>{!item.read ? <View style={styles.unreadDot} /> : null}</View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.meta}>{item.category.toUpperCase()} · {new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', backgroundColor: '#E9EEF6', padding: 4, borderRadius: 13, marginBottom: 13 },
  filter: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  filterActive: { backgroundColor: colors.white },
  filterText: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  filterTextActive: { color: colors.navy, fontWeight: '900' },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 12, flexDirection: 'row', marginBottom: 9 },
  unread: { borderColor: '#C6D9F5' },
  icon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  copy: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 11, fontWeight: '800', flex: 1 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.blue },
  message: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  meta: { color: colors.blue, fontSize: 7, fontWeight: '900', letterSpacing: 0.5, marginTop: 7 },
});
