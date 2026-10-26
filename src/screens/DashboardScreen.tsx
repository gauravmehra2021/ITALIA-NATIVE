import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ArrowRight, Bell, CalendarClock, CheckCircle2, Sparkles } from 'lucide-react-native';
import { studentService } from '../api/services';
import { useResource } from '../hooks/useResource';
import type { RootStackParamList, TabParamList } from '../navigation/navigationTypes';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { CourseCard } from '../components/LearningCards';
import { ErrorState, LoadingState } from '../components/Feedback';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { ProgressCard } from '../components/LearningCards';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type TabNavigation = BottomTabNavigationProp<TabParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<Navigation>();
  const tabNavigation = useNavigation<TabNavigation>();
  const load = useCallback(() => studentService.dashboard(), []);
  const { data, error, isLoading, refresh } = useResource(load);

  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (error || !data) return <Screen><ErrorState message={error?.message ?? 'Dashboard data is unavailable.'} onRetry={() => { refresh(); }} /></Screen>;

  const goalPercent = data.weeklyGoalMinutes > 0
    ? Math.min(100, Math.round(data.minutesStudiedThisWeek / data.weeklyGoalMinutes * 100))
    : 0;

  return (
    <Screen>
      <View style={styles.greetingRow}>
        <View style={styles.greetingCopy}>
          <Text style={styles.greeting}>Good morning, {data.student.displayName.split(' ')[0]} ☀</Text>
          <Text style={styles.subtitle}>A little progress today goes a long way.</Text>
        </View>
        <View style={styles.streakPill}><Sparkles color="#A87400" size={13} /><Text style={styles.streakText}>{data.currentStreakDays} day streak</Text></View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>YOUR LEARNING JOURNEY</Text>
        <Text style={styles.heroTitle}>Make today{'\n'}a learning day.</Text>
        <Text style={styles.heroSubtitle}>You’re doing great. Keep your momentum going!</Text>
        <Button title="Continue learning  →" onPress={() => tabNavigation.navigate('Courses')} />
        <View style={styles.goalBadge}><Text style={styles.goalPercent}>{goalPercent}%</Text><Text style={styles.goalLabel}>weekly goal</Text></View>
      </View>

      <View style={styles.quickActions}>
        <QuickAction icon={<CalendarClock color={colors.blue} size={19} />} label="Join class" onPress={() => navigation.navigate('LiveClasses')} />
        <QuickAction icon={<CheckCircle2 color="#A87400" size={19} />} label="Start quiz" onPress={() => tabNavigation.navigate('Quizzes')} />
        <QuickAction icon={<Sparkles color={colors.green} size={19} />} label="Ask AI tutor" onPress={() => tabNavigation.navigate('AITutor')} />
      </View>

      <SectionTitle title="Your learning at a glance" action="See progress" onAction={() => tabNavigation.navigate('Progress')} />
      <View style={styles.metricRow}>
        <ProgressCard label="COURSES" value={String(data.enrolledCourseCount)} note="in progress" color={colors.blue} />
        <ProgressCard label="AVG. SCORE" value={`${data.averageQuizScorePercent}%`} note="quiz average" color={colors.green} />
        <ProgressCard label="XP POINTS" value={data.xpPoints.toLocaleString()} note="keep learning" color={colors.gold} />
      </View>

      {data.upcomingClass ? (
        <View style={styles.classCard}>
          <View style={styles.classTopline}><Text style={styles.liveLabel}>●  UP NEXT · LIVE CLASS</Text><Text style={styles.classTime}>{formatDate(data.upcomingClass.startsAt)}</Text></View>
          <Text style={styles.classTitle}>{data.upcomingClass.title}</Text>
          <Text style={styles.classDetails}>{data.upcomingClass.courseTitle} · {data.upcomingClass.durationMinutes} min · {data.upcomingClass.instructorName}</Text>
          <Button title="View class  →" variant="success" compact onPress={() => navigation.navigate('LiveClasses')} />
        </View>
      ) : (
        <View style={styles.notice}><CalendarClock color={colors.blue} size={18} /><Text style={styles.noticeText}>No upcoming classes scheduled.</Text></View>
      )}

      <View style={styles.notifications}>
        <Bell color={colors.blue} size={18} />
        <View style={styles.notificationCopy}><Text style={styles.notificationTitle}>{data.unreadNotifications} new updates</Text><Text style={styles.subtitleSmall}>Class reminders and learning tips</Text></View>
        <Pressable onPress={() => navigation.navigate('Notifications')} accessibilityRole="button" accessibilityLabel="View notifications"><ArrowRight color={colors.blue} size={18} /></Pressable>
      </View>
      <SectionTitle title="Keep learning" action="All courses" onAction={() => tabNavigation.navigate('Courses')} />
      <FeaturedCourse />
    </Screen>
  );
}

function FeaturedCourse() {
  const load = useCallback(() => studentService.courses(), []);
  const { data, error, isLoading } = useResource(load);
  const navigation = useNavigation<TabNavigation>();

  if (isLoading) return <View style={styles.featuredLoading}><LoadingState label="Loading courses..." /></View>;
  if (error || !data?.length) return <Text style={styles.emptyText}>{error?.message ?? 'No enrolled courses yet.'}</Text>;
  return <CourseCard course={data[0]} onPress={() => navigation.navigate('Courses')} />;
}

function QuickAction({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress} accessibilityRole="button">
      <View style={styles.quickIcon}>{icon}</View><Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Time to be confirmed';
  return parsed.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  greetingCopy: { flex: 1 },
  greeting: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 4 },
  streakPill: { backgroundColor: colors.paleGold, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 },
  streakText: { color: '#885D00', fontWeight: '700', fontSize: 9 },
  hero: { backgroundColor: colors.navy, borderRadius: 22, padding: 22, overflow: 'hidden', minHeight: 226, marginBottom: 18 },
  heroEyebrow: { color: '#BFD3F6', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  heroTitle: { color: colors.white, fontSize: 27, fontWeight: '800', lineHeight: 32, marginTop: 10, letterSpacing: -0.6 },
  heroSubtitle: { color: '#CFDBEF', fontSize: 11, marginTop: 7, marginBottom: 15, maxWidth: 230 },
  goalBadge: { position: 'absolute', right: 14, bottom: 19, width: 68, height: 68, borderRadius: 36, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '8deg' }] },
  goalPercent: { color: colors.gold, fontSize: 15, fontWeight: '900' },
  goalLabel: { color: colors.white, fontSize: 7, marginTop: 2 },
  quickActions: { backgroundColor: colors.white, paddingVertical: 15, paddingHorizontal: 5, borderRadius: 18, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 23, borderWidth: 1, borderColor: colors.line },
  quickAction: { alignItems: 'center', minWidth: 82 },
  quickIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paleBlue },
  quickLabel: { color: colors.ink, fontSize: 9, fontWeight: '700', marginTop: 7 },
  metricRow: { flexDirection: 'row', gap: 8, marginBottom: 19 },
  classCard: { backgroundColor: colors.white, padding: 15, borderRadius: 17, borderWidth: 1, borderColor: '#DFE8F5', marginBottom: 14 },
  classTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6, color: colors.green },
  classTime: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  classTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 12 },
  classDetails: { color: colors.muted, fontSize: 10, marginTop: 4 },
  notifications: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  notificationCopy: { flex: 1 },
  notificationTitle: { color: colors.ink, fontSize: 11, fontWeight: '800', marginBottom: 3 },
  subtitleSmall: { color: colors.muted, fontSize: 9 },
  notice: { backgroundColor: colors.white, padding: 14, borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 },
  noticeText: { color: colors.ink, fontSize: 11 },
  featuredLoading: { height: 90 },
  emptyText: { color: colors.muted, fontSize: 11, marginVertical: 14 },
});
