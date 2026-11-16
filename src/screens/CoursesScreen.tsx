import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BookOpen, CheckCircle, ChevronDown, ChevronRight, FileText, Headphones, Play, Sparkles } from 'lucide-react-native';
import { studentService } from '../api/services';
import type { CourseSummary, Lesson, MobileAssignment } from '../api/types';
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
          <Pressable
            key={String(isCatalogue)}
            onPress={() => { setCatalogue(isCatalogue); setSelectedCourse(null); }}
            style={[styles.segmentItem, catalogue === isCatalogue && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, catalogue === isCatalogue && styles.segmentTextActive]}>
              {isCatalogue ? 'Explore Catalogue' : 'Enrolled Courses'}
            </Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? <LoadingState label="Loading courses..." /> : error ? <ErrorState message={error.message} onRetry={() => { refresh(); }} /> : !data?.length ? (
        <EmptyState
          title={catalogue ? 'No courses available' : 'No courses yet'}
          description={catalogue ? 'Please check again later for new learning opportunities.' : 'Explore the catalogue to find a course that fits your goals.'}
        />
      ) : (
        <>
          {data.map(course => (
            <View key={course.id}>
              <CourseCard course={course} onPress={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)} />
              {selectedCourse === course.id ? (
                <CourseContentPanel course={course} catalogue={catalogue} onEnrolled={() => { refresh(); }} />
              ) : null}
            </View>
          ))}
          <View style={styles.tip}>
            <Sparkles color={colors.blue} size={17} />
            <Text style={styles.tipText}>All video tutorials, native audio recordings, PDFs, and practical tasks are synced live with the academic portal.</Text>
          </View>
        </>
      )}
    </Screen>
  );
}

function CourseContentPanel({ course, catalogue, onEnrolled }: { course: CourseSummary; catalogue: boolean; onEnrolled: () => void }) {
  const loadLessons = useCallback(() => studentService.lessons(course.id), [course.id]);
  const { data: lessons, error, isLoading, refresh } = useResource(loadLessons);

  const [assignments, setAssignments] = useState<MobileAssignment[]>([]);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  // Assignment submission dialog state
  const [submittingAssignId, setSubmittingAssignId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setLoadingAssign(true);
    try {
      const items = await studentService.assignments(course.id);
      setAssignments(items);
    } catch {
      setAssignments([]);
    } finally {
      setLoadingAssign(false);
    }
  }, [course.id]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!submissionText.trim() && !submissionFileUrl.trim()) {
      Alert.alert('Submission required', 'Please enter your practical task notes or paste your work URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      await studentService.submitAssignment(assignmentId, submissionText.trim(), submissionFileUrl.trim() || undefined);
      Alert.alert('Assignment Submitted!', 'Your practical work has been submitted to your mentor for review.');
      setSubmittingAssignId(null);
      setSubmissionText('');
      setSubmissionFileUrl('');
      await fetchAssignments();
    } catch (cause) {
      Alert.alert('Submission failed', cause instanceof Error ? cause.message : 'Could not submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group lessons by Chapter / Module
  const groupedLessons = (lessons ?? []).reduce((acc, l) => {
    const ch = l.chapterTitle || `Chapter ${l.chapterNumber ?? 1}`;
    if (!acc[ch]) acc[ch] = [];
    acc[ch].push(l);
    return acc;
  }, {} as Record<string, Lesson[]>);

  return (
    <View style={styles.lessonPanel}>
      <View style={styles.moduleHeader}>
        <Text style={styles.moduleHeading}>CURRICULUM · CHAPTERS & LESSONS</Text>
        <ChevronDown color={colors.muted} size={16} />
      </View>

      {isLoading ? (
        <LoadingState label="Loading chapter curriculum..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => { refresh(); }} />
      ) : !lessons?.length ? (
        <EmptyState title="No lessons available" description="Curriculum will appear once published by instructor." />
      ) : (
        Object.entries(groupedLessons).map(([chTitle, chLessons]) => (
          <View key={chTitle} style={styles.chapterGroup}>
            <View style={styles.chapterHeader}>
              <BookOpen color={colors.navy} size={14} />
              <Text style={styles.chapterHeading}>{chTitle}</Text>
              <Text style={styles.chapterCount}>{chLessons.length} lessons</Text>
            </View>
            {chLessons.map(lesson => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                isExpanded={expandedLessonId === lesson.id}
                onToggle={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id)}
              />
            ))}
          </View>
        ))
      )}

      {/* PRACTICAL ASSIGNMENTS SECTION */}
      <View style={[styles.moduleHeader, styles.moduleHeaderSpaced]}>
        <Text style={styles.moduleHeading}>PRACTICAL ASSIGNMENTS & HOMEWORK</Text>
        <FileText color={colors.muted} size={14} />
      </View>

      {loadingAssign ? (
        <LoadingState label="Loading assignments..." />
      ) : assignments.length === 0 ? (
        <Text style={styles.emptyAssignText}>No practical assignments posted for this course yet.</Text>
      ) : (
        assignments.map(a => (
          <View key={a.id} style={styles.assignmentCard}>
            <View style={styles.assignHeader}>
              <Text style={styles.assignTitle}>{a.title}</Text>
              <Text style={[styles.assignStatus, a.status === 'Graded' ? styles.statusGraded : a.submitted ? styles.statusSubmitted : styles.statusPending]}>
                {a.status === 'Graded' ? `GRADED (${a.marksObtained ?? 0}/${a.totalMarks})` : a.submitted ? 'SUBMITTED' : 'PENDING'}
              </Text>
            </View>
            <Text style={styles.assignChapter}>{a.chapterTitle} · Max {a.totalMarks} Marks</Text>
            <Text style={styles.assignDesc}>{a.description}</Text>

            {a.referenceFileUrl ? (
              <Pressable
                style={styles.refLink}
                onPress={() => { Linking.openURL(a.referenceFileUrl!); }}
              >
                <FileText color={colors.blue} size={13} />
                <Text style={styles.refLinkText}>View Reference Worksheet / Document</Text>
              </Pressable>
            ) : null}

            {a.status === 'Graded' && a.teacherFeedback ? (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackTitle}>Mentor Feedback:</Text>
                <Text style={styles.feedbackText}>{a.teacherFeedback}</Text>
              </View>
            ) : null}

            {/* Submission Input Box */}
            {submittingAssignId === a.id ? (
              <View style={styles.submitForm}>
                <Text style={styles.submitFormLabel}>Your Practical Work / Response:</Text>
                <TextInput
                  style={styles.submitInput}
                  multiline
                  numberOfLines={3}
                  value={submissionText}
                  onChangeText={setSubmissionText}
                  placeholder="Write your translation, dialogue, or summary here..."
                  placeholderTextColor={colors.muted}
                />
                <Text style={styles.submitFormLabel}>Attachment / Google Drive URL (Optional):</Text>
                <TextInput
                  style={styles.submitInputSingle}
                  value={submissionFileUrl}
                  onChangeText={setSubmissionFileUrl}
                  placeholder="https://..."
                  placeholderTextColor={colors.muted}
                />
                <View style={styles.submitRow}>
                  <Button
                    title="Submit to Mentor"
                    compact
                    loading={isSubmitting}
                    onPress={() => { handleSubmitAssignment(a.id); }}
                  />
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => setSubmittingAssignId(null)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : !a.submitted ? (
              <Button
                title="Submit Assignment"
                compact
                onPress={() => {
                  setSubmittingAssignId(a.id);
                  setSubmissionText(a.mySubmissionText ?? '');
                  setSubmissionFileUrl(a.mySubmissionFileUrl ?? '');
                }}
              />
            ) : (
              <Pressable
                style={styles.resubmitBtn}
                onPress={() => {
                  setSubmittingAssignId(a.id);
                  setSubmissionText(a.mySubmissionText ?? '');
                  setSubmissionFileUrl(a.mySubmissionFileUrl ?? '');
                }}
              >
                <Text style={styles.resubmitText}>Edit / Re-submit Work</Text>
              </Pressable>
            )}
          </View>
        ))
      )}

      {enrollmentError ? <Text style={styles.enrollmentError}>{enrollmentError}</Text> : null}
      {catalogue ? (
        <View style={styles.enrollBox}>
          <Button
            title="Unlock All Courses (Full App Access)"
            compact
            loading={enrolling}
            onPress={() => { enroll(); }}
          />
        </View>
      ) : null}
    </View>
  );
}

function LessonItem({
  lesson,
  isExpanded,
  onToggle,
}: {
  lesson: Lesson;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = lesson.contentType === 'video' ? Play : lesson.contentType === 'audio' ? Headphones : FileText;

  const openMedia = async (url?: string | null) => {
    const target = url || lesson.contentUrl;
    if (!target) {
      Alert.alert('Media Unavailable', 'This lesson does not have a streaming link yet.');
      return;
    }
    try {
      await Linking.openURL(target);
    } catch (cause) {
      Alert.alert('Unable to play media', cause instanceof Error ? cause.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.lessonItemContainer}>
      <Pressable
        style={styles.lessonRow}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${lesson.contentType} lesson: ${lesson.title}`}
      >
        <View style={[styles.lessonIcon, lesson.completed && styles.lessonCompleted]}>
          <Icon color={lesson.completed ? colors.green : colors.blue} size={14} />
        </View>
        <View style={styles.lessonCopy}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonMeta}>
            {lesson.contentType.toUpperCase()}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} MIN` : ''}
          </Text>
        </View>
        {lesson.completed ? (
          <CheckCircle color={colors.green} size={16} />
        ) : (
          <ChevronRight color={colors.muted} size={16} style={isExpanded ? styles.rotateDown : undefined} />
        )}
      </Pressable>

      {/* EXPANDED LESSON DETAILS */}
      {isExpanded && (
        <View style={styles.lessonExpandedContent}>
          {lesson.contentText ? (
            <View style={styles.lessonTextBlock}>
              <Text style={styles.sectionHeaderLabel}>📖 Lesson Explanation:</Text>
              <Text style={styles.lessonBodyText}>{lesson.contentText}</Text>
            </View>
          ) : null}

          {lesson.practicalTask ? (
            <View style={styles.practicalTaskBox}>
              <Text style={styles.practicalTaskHeader}>✍️ Practical Task:</Text>
              <Text style={styles.practicalTaskText}>{lesson.practicalTask}</Text>
            </View>
          ) : null}

          {/* Action media buttons */}
          <View style={styles.mediaButtonRow}>
            {(lesson.videoUrl || lesson.contentType === 'video') && (
              <Pressable
                style={[styles.mediaPill, styles.mediaPillVideo]}
                onPress={() => { openMedia(lesson.videoUrl); }}
              >
                <Play color={colors.blue} size={14} />
                <Text style={[styles.mediaPillText, styles.mediaTextBlue]}>Watch Video Tutorial</Text>
              </Pressable>
            )}

            {(lesson.audioUrl || lesson.contentType === 'audio') && (
              <Pressable
                style={[styles.mediaPill, styles.mediaPillAudio]}
                onPress={() => { openMedia(lesson.audioUrl); }}
              >
                <Headphones color="#7C3AED" size={14} />
                <Text style={[styles.mediaPillText, styles.mediaTextPurple]}>Listen Native Audio</Text>
              </Pressable>
            )}

            {lesson.pdfUrl && (
              <Pressable
                style={[styles.mediaPill, styles.mediaPillPdf]}
                onPress={() => { openMedia(lesson.pdfUrl); }}
              >
                <FileText color="#B45309" size={14} />
                <Text style={[styles.mediaPillText, styles.mediaTextAmber]}>PDF Notes</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
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
  moduleHeaderSpaced: { marginTop: 16 },
  moduleHeading: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  chapterGroup: { marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F4F7FB', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  chapterHeading: { color: colors.navy, fontSize: 10, fontWeight: '800', flex: 1 },
  chapterCount: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  lessonItemContainer: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  lessonRow: { flexDirection: 'row', alignItems: 'center', minHeight: 47, paddingHorizontal: 10 },
  lessonIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  lessonCompleted: { backgroundColor: colors.paleGreen },
  lessonCopy: { flex: 1 },
  lessonTitle: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  lessonMeta: { color: colors.muted, fontSize: 8, fontWeight: '800', marginTop: 2 },
  rotateDown: { transform: [{ rotate: '90deg' }] },
  lessonExpandedContent: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4, backgroundColor: '#F8FAFD' },
  sectionHeaderLabel: { fontSize: 9, fontWeight: '800', color: colors.navy, marginBottom: 3 },
  lessonTextBlock: { marginVertical: 4 },
  lessonBodyText: { fontSize: 10, color: colors.ink, lineHeight: 15 },
  practicalTaskBox: { marginVertical: 6, padding: 8, borderRadius: 8, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  practicalTaskHeader: { fontSize: 9, fontWeight: '800', color: '#B45309', marginBottom: 2 },
  practicalTaskText: { fontSize: 10, color: '#92400E', lineHeight: 14 },
  mediaButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  mediaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  mediaPillText: { fontSize: 9, fontWeight: '700' },
  emptyAssignText: { color: colors.muted, fontSize: 9, fontStyle: 'italic', marginVertical: 6 },
  assignmentCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 10, marginVertical: 4 },
  assignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assignTitle: { fontSize: 11, fontWeight: '800', color: colors.ink, flex: 1 },
  assignChapter: { fontSize: 8, color: colors.muted, fontWeight: '700', marginTop: 2 },
  assignDesc: { fontSize: 10, color: colors.ink, marginVertical: 4, lineHeight: 14 },
  assignStatus: { fontSize: 8, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusPending: { backgroundColor: '#FEF3C7', color: '#92400E' },
  statusSubmitted: { backgroundColor: colors.paleBlue, color: colors.blue },
  statusGraded: { backgroundColor: colors.paleGreen, color: colors.green },
  refLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginVertical: 4 },
  refLinkText: { fontSize: 9, color: colors.blue, fontWeight: '700' },
  feedbackBox: { backgroundColor: '#F0FDF4', padding: 8, borderRadius: 6, marginVertical: 4, borderWidth: 1, borderColor: '#BBF7D0' },
  feedbackTitle: { fontSize: 9, fontWeight: '800', color: '#166534' },
  feedbackText: { fontSize: 9, color: '#15803D', marginTop: 2 },
  submitForm: { marginTop: 8, backgroundColor: '#F4F7FB', padding: 8, borderRadius: 8 },
  submitFormLabel: { fontSize: 8, fontWeight: '800', color: colors.navy, marginBottom: 3 },
  submitInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 8, fontSize: 10, color: colors.ink, textAlignVertical: 'top' },
  submitInputSingle: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 6, fontSize: 10, color: colors.ink, marginBottom: 8 },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  cancelBtnText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  resubmitBtn: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4 },
  resubmitText: { color: colors.blue, fontSize: 9, fontWeight: '700' },
  enrollBox: { marginTop: 12 },
  mediaPillVideo: { backgroundColor: colors.paleBlue },
  mediaPillAudio: { backgroundColor: '#F0EAFB' },
  mediaPillPdf: { backgroundColor: '#FEF3C7' },
  mediaTextBlue: { color: colors.blue },
  mediaTextPurple: { color: '#7C3AED' },
  mediaTextAmber: { color: '#B45309' },
  tip: { backgroundColor: colors.paleBlue, padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  tipText: { color: colors.navy, fontSize: 10, lineHeight: 15, flex: 1 },
  enrollmentError: { color: colors.red, fontSize: 10, marginTop: 8 },
});
