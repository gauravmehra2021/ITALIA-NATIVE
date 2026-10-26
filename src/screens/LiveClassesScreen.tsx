import React, { useCallback } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Video } from 'lucide-react-native';
import { studentService } from '../api/services';
import type { LiveClass } from '../api/types';
import { useResource } from '../hooks/useResource';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeading } from '../components/PageHeading';
import { Screen } from '../components/Screen';

export function LiveClassesScreen() {
  const load = useCallback(() => studentService.liveClasses(), []);
  const { data, error, isLoading, refresh } = useResource(load);
  return (
    <Screen>
      <PageHeading title="Live classes" subtitle="Learn together, wherever you are." />
      {isLoading ? <LoadingState label="Loading your schedule..." /> : error ? <ErrorState message={error.message} onRetry={() => { refresh(); }} /> : !data?.length ? (
        <EmptyState title="No classes scheduled" description="Your upcoming live classes will appear here." />
      ) : data.map(item => <LiveClassCard key={item.id} item={item} />)}
    </Screen>
  );
}

function LiveClassCard({ item }: { item: LiveClass }) {
  const starts = new Date(item.startsAt);
  const validDate = !Number.isNaN(starts.getTime());

  const join = async () => {
    if (!item.meetUrl) {
      Alert.alert('Class link unavailable', 'Your class does not have a meeting link yet. Please check again closer to the start time.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(item.meetUrl);
      if (!supported) {
        Alert.alert('Unable to open meeting', 'This device cannot open the class link.');
        return;
      }
      await Linking.openURL(item.meetUrl);
    } catch (cause) {
      Alert.alert('Unable to open meeting', cause instanceof Error ? cause.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.calendar}><Text style={styles.day}>{validDate ? starts.toLocaleDateString(undefined, { day: '2-digit' }) : '—'}</Text><Text style={styles.month}>{validDate ? starts.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : 'DATE'}</Text></View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{validDate ? starts.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : 'TIME TO BE CONFIRMED'}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.caption}>{item.courseTitle} · {item.durationMinutes} min · {item.instructorName}</Text>
        <View style={styles.attendance}><View style={[styles.attendanceDot, item.attendanceStatus === 'present' && styles.present]} /><Text style={styles.attendanceText}>Attendance: {item.attendanceStatus.replace('-', ' ')}</Text></View>
        <Button title="Join class" variant="success" compact onPress={() => { join(); }} />
      </View>
      <Video size={17} color={colors.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 13, marginBottom: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  calendar: { width: 42, height: 48, borderRadius: 12, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
  day: { color: colors.blue, fontSize: 16, fontWeight: '900' },
  month: { color: colors.blue, fontSize: 7, fontWeight: '900' },
  copy: { flex: 1 },
  eyebrow: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  title: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 5 },
  caption: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  attendance: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  attendanceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  present: { backgroundColor: colors.green },
  attendanceText: { color: colors.muted, fontSize: 8, textTransform: 'capitalize' },
});
