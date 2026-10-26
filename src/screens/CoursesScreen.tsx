import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, FileText, Headphones, Play, Sparkles } from 'lucide-react-native';
import { studentService } from '../api/services';
import type { CourseSummary, Lesson } from '../api/types';
import { useResource } from '../hooks/useResource';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { CourseCard } from '../components/LearningCards';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeading } from '../components/PageHeading';
import { Screen } from '../components/Screen';

export function CoursesScreen() {
  const [catalogue, setCatalogue] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const load = useCallback(() => catalogue ? studentService.catalogue() : studentService.courses(), [catalogue]);
  const { data, error, isLoading, refresh } = useResource(load);

  return (
    <Screen>
      <PageHeading title={catalogue ? 'Explore courses' : 'My courses'} subtitle="Build skills at your own pace." />
      <View style={styles.segment}>
        {[false, true].map(isCatalogue => (
          <Pressable key={String(isCatalogue)} onPress={() => { setCatalogue(isCatalogue); setSelectedCourse(null); }} style={[styles.segmentItem, catalogue === isCatalogue && styles.segmentActive]}>
            <Text style={[styles.segmentText, catalogue === isCatalogue && styles.segmentTextActive]}>{isCatalogue ? 'Explore' : 'Enrolled'}</Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? <LoadingState label="Loading courses..." /> : error ? <ErrorState message={error.message} onRetry={() => { refresh(); }} /> : !data?.length ? (
        <EmptyState title={catalogue ? 'No courses available' : 'No courses yet'} description={catalogue ? 'Please check again later for new learning opportunities.' : 'Explore the catalogue to find a course that fits your goals.'} />
      ) : (
        <>
          {data.map(course => (
            <View key={course.id}>
              <CourseCard course={course} onPress={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)} />
              {selectedCourse === course.id ? <CourseLessons course={course} catalogue={catalogue} onEnrolled={() => { refresh(); }} /> : null}
            </View>
          ))}
          <View style={styles.tip}><Sparkles color={colors.blue} size={17} /><Text style={styles.tipText}>Your study plan is personalized to your goals and available time.</Text></View>
        </>
      )}
    </Screen>
  );
}

function CourseLessons({ course, catalogue, onEnrolled }: { course: CourseSummary; catalogue: boolean; onEnrolled: () => void }) {
  const load = useCallback(() => studentService.lessons(course.id), [course.id]);
  const { data, error, isLoading, refresh } = useResource(load);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const enroll = async () => {
    setEnrolling(true);
    setEnrollmentError(null);
    try {
      await studentService.enrollCourse(course.id);
      onEnrolled();
    } catch (cause) {
      setEnrollmentError(cause instanceof Error ? cause.message : 'Unable to enroll in this course.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <View style={styles.lessonPanel}>
      <View style={styles.moduleHeader}><Text style={styles.moduleHeading}>COURSE CONTENT</Text><ChevronDown color={colors.muted} size={16} /></View>
      {isLoading ? <LoadingState label="Loading lessons..." /> : error ? <ErrorState message={error.message} onRetry={() => { refresh(); }} /> : !data?.length ? (
        <EmptyState title="No lessons available" description="Course lessons will appear here." />
      ) : data.map(lesson => <LessonRow key={lesson.id} lesson={lesson} />)}
      {enrollmentError ? <Text style={styles.enrollmentError}>{enrollmentError}</Text> : null}
      {catalogue ? <Button title="Enroll in this course" compact loading={enrolling} onPress={() => { enroll(); }} /> : null}
    </View>
  );
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const Icon = lesson.contentType === 'video' ? Play : lesson.contentType === 'audio' ? Headphones : FileText;
  const openLesson = async () => {
    if (!lesson.contentUrl) {
      Alert.alert('Lesson unavailable', 'This lesson does not have a content link yet.');
      return;
    }
    try {
      await Linking.openURL(lesson.contentUrl);
    } catch (cause) {
      Alert.alert('Unable to open lesson', cause instanceof Error ? cause.message : 'Please try again.');
    }
  };
  return (
    <Pressable style={styles.lessonRow} onPress={() => { openLesson(); }} accessibilityRole="button" accessibilityLabel={`${lesson.contentType} lesson: ${lesson.title}`}>
      <View style={[styles.lessonIcon, lesson.completed && styles.lessonCompleted]}><Icon color={lesson.completed ? colors.green : colors.blue} size={14} /></View>
      <View style={styles.lessonCopy}><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.lessonMeta}>{lesson.contentType.toUpperCase()}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} MIN` : ''}</Text></View>
      {lesson.completed ? <Text style={styles.completed}>DONE</Text> : <ChevronDown color={colors.muted} size={16} style={styles.rotate} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: '#E9EEF6', padding: 4, borderRadius: 13, marginTop: 1, marginBottom: 16 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  segmentActive: { backgroundColor: colors.white },
  segmentText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  segmentTextActive: { color: colors.navy, fontWeight: '900' },
  lessonPanel: { backgroundColor: '#FBFCFE', borderWidth: 1, borderColor: colors.line, borderTopWidth: 0, marginTop: -10, marginBottom: 12, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, padding: 13 },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  moduleHeading: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', minHeight: 47, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  lessonIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  lessonCompleted: { backgroundColor: colors.paleGreen },
  lessonCopy: { flex: 1 },
  lessonTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  lessonMeta: { color: colors.muted, fontSize: 7, fontWeight: '800', marginTop: 3 },
  completed: { color: colors.green, fontSize: 7, fontWeight: '900' },
  rotate: { transform: [{ rotate: '-90deg' }] },
  tip: { backgroundColor: colors.paleBlue, padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  tipText: { color: colors.navy, fontSize: 10, lineHeight: 15, flex: 1 },
  enrollmentError: { color: colors.red, fontSize: 10, marginTop: 8 },
});
