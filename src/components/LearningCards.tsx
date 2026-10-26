import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Award, BookOpen, Check, ChevronRight } from 'lucide-react-native';
import type { CourseSummary, QuizSummary } from '../api/types';
import { colors } from '../theme/colors';

export function ProgressBar({ value, color = colors.blue }: { value: number; color?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: safeValue }} style={styles.track}>
      <View style={[styles.fill, { width: `${safeValue}%`, backgroundColor: color }]} />
    </View>
  );
}

export function CourseCard({ course, onPress }: { course: CourseSummary; onPress: () => void }) {
  const accent = course.accentColor ?? colors.blue;
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button">
      <View style={[styles.courseIcon, { backgroundColor: `${accent}18` }]}><BookOpen color={accent} size={20} /></View>
      <View style={styles.courseBody}>
        <Text style={styles.eyebrow}>{course.category} · {course.level}</Text>
        <Text style={styles.title}>{course.title}</Text>
        <View style={styles.progressLabel}><Text style={styles.caption}>{course.completedLessons} of {course.totalLessons} lessons</Text><Text style={styles.percent}>{course.progressPercent}%</Text></View>
        <ProgressBar value={course.progressPercent} color={accent} />
      </View>
      <ChevronRight color="#AAB5C6" size={19} />
    </Pressable>
  );
}

export function QuizCard({ quiz, onPress }: { quiz: QuizSummary; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.quizCard, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button">
      <View style={styles.quizIcon}><Check color={colors.blue} size={18} /></View>
      <View style={styles.quizBody}>
        <Text style={styles.title}>{quiz.title}</Text>
        <Text style={styles.caption}>{quiz.questionCount} questions · {quiz.durationMinutes} min</Text>
      </View>
      <Text style={styles.pill}>{quiz.status === 'in-progress' ? 'Continue' : quiz.kind === 'exam' ? 'Exam' : 'Start'}</Text>
    </Pressable>
  );
}

export function ProgressCard({ label, value, note, color = colors.blue }: { label: string; value: string; note: string; color?: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricDot, { backgroundColor: color }]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.caption}>{note}</Text>
    </View>
  );
}

export function CertificateCard({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.certificateCard, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button">
      <View style={styles.certificateIcon}><Award color="#9B6E09" size={20} /></View>
      <View style={styles.certificateCopy}><Text style={styles.title}>{title}</Text><Text style={styles.caption}>{subtitle}</Text></View>
      <ChevronRight color="#9B6E09" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 17, borderWidth: 1, borderColor: colors.line, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  courseIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  courseBody: { flex: 1, paddingRight: 8 },
  eyebrow: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.75, marginBottom: 4 },
  title: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  caption: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  progressLabel: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, marginBottom: 5 },
  percent: { color: colors.ink, fontWeight: '800', fontSize: 9 },
  track: { height: 5, backgroundColor: '#E9EEF5', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  quizCard: { backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  quizIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paleBlue, marginRight: 11 },
  quizBody: { flex: 1 },
  pill: { backgroundColor: colors.paleBlue, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, color: colors.blue, fontSize: 8, fontWeight: '800' },
  metricCard: { flex: 1, minWidth: 0, backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 12 },
  metricDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 8 },
  metricLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  metricValue: { color: colors.ink, fontSize: 19, fontWeight: '900', marginTop: 5, marginBottom: 2 },
  certificateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paleGold, padding: 13, borderRadius: 16, marginVertical: 8 },
  certificateIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  certificateCopy: { flex: 1 },
  pressed: { opacity: 0.78 },
});
