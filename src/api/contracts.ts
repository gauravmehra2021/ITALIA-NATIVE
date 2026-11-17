import { z } from 'zod';
import { ApiError } from './errors';
import type {
  Certificate,
  CourseSummary,
  DashboardSummary,
  Lesson,
  LiveClass,
  ProgressSummary,
  QuizAnswerResult,
  QuizSession,
  QuizSummary,
  Student,
  StudentNotification,
  TutorReply,
} from './types';

const studentSchema: z.ZodType<Student> = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string(),
  preferredLanguage: z.string().min(2),
});

const courseSchema: z.ZodType<CourseSummary> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string(),
  level: z.string(),
  progressPercent: z.number().min(0).max(100),
  completedLessons: z.number().int().nonnegative(),
  totalLessons: z.number().int().nonnegative(),
  accentColor: z.string().optional(),
  enrollmentStatus: z.enum(['enrolled', 'available', 'completed']),
});

const lessonSchema: z.ZodType<Lesson> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  contentType: z.enum(['video', 'pdf', 'audio', 'interactive']),
  durationMinutes: z.number().positive().optional(),
  completed: z.boolean(),
  contentUrl: z.string().optional(),
  chapterTitle: z.string().optional(),
  chapterNumber: z.number().optional(),
  videoUrl: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
  pdfUrl: z.string().optional().nullable(),
  contentText: z.string().optional().nullable(),
  practicalTask: z.string().optional().nullable(),
});

const quizSchema: z.ZodType<QuizSummary> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  questionCount: z.number().int().positive(),
  durationMinutes: z.number().positive(),
  status: z.enum(['new', 'in-progress', 'completed']),
  kind: z.enum(['topic', 'random', 'exam', 'weak-topics']),
});

const quizQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  audioUrl: z.string().url().optional(),
  answers: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2),
});

const quizSessionSchema: z.ZodType<QuizSession> = z.object({
  id: z.string().min(1),
  quizId: z.string().min(1),
  title: z.string().min(1),
  durationSeconds: z.number().int().positive(),
  questions: z.array(quizQuestionSchema).min(1),
});

const liveClassSchema: z.ZodType<LiveClass> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  startsAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().positive(),
  instructorName: z.string(),
  courseTitle: z.string(),
  meetUrl: z.string().url().optional(),
  attendanceStatus: z.enum(['not-marked', 'present', 'absent']),
});

const dashboardSchema: z.ZodType<DashboardSummary> = z.object({
  student: studentSchema,
  weeklyGoalMinutes: z.number().nonnegative(),
  minutesStudiedThisWeek: z.number().nonnegative(),
  averageQuizScorePercent: z.number().min(0).max(100),
  xpPoints: z.number().int().nonnegative(),
  currentStreakDays: z.number().int().nonnegative(),
  enrolledCourseCount: z.number().int().nonnegative(),
  upcomingClass: liveClassSchema.optional(),
  unreadNotifications: z.number().int().nonnegative(),
});

const progressSchema: z.ZodType<ProgressSummary> = z.object({
  weeklyActivityMinutes: z.array(z.number().nonnegative()).length(7),
  averageQuizScorePercent: z.number().min(0).max(100),
  completedLessonsThisMonth: z.number().int().nonnegative(),
  currentStreakDays: z.number().int().nonnegative(),
  bestStreakDays: z.number().int().nonnegative(),
  weakTopics: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    masteryPercent: z.number().min(0).max(100),
  })),
  recommendations: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
  })),
});

const certificateSchema: z.ZodType<Certificate> = z.object({
  id: z.string().min(1),
  certificateNumber: z.string().min(1),
  courseTitle: z.string().min(1),
  issuedAt: z.string().datetime({ offset: true }),
  verificationUrl: z.string().url(),
  downloadUrl: z.string().url().optional(),
});

const notificationSchema: z.ZodType<StudentNotification> = z.object({
  id: z.string().min(1),
  category: z.enum(['class', 'test', 'announcement', 'security']),
  title: z.string().min(1),
  message: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  read: z.boolean(),
});

const tutorReplySchema: z.ZodType<TutorReply> = z.object({
  messages: z.array(z.object({
    id: z.string().min(1),
    role: z.enum(['student', 'assistant']),
    content: z.string(),
    audioUrl: z.string().url().optional(),
    createdAt: z.string().datetime({ offset: true }),
  })).min(1),
});

const answerResultSchema: z.ZodType<QuizAnswerResult> = z.object({
  correct: z.boolean(),
  explanation: z.string(),
  correctAnswerId: z.string().min(1),
  scorePercent: z.number().min(0).max(100).optional(),
});

const challengeSchema = z.object({
  challengeId: z.string().min(1),
  expiresAt: z.string().datetime({ offset: true }),
});

const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  student: studentSchema,
});

const refreshedTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const responseContracts = {
  student: studentSchema,
  course: courseSchema,
  courses: z.array(courseSchema),
  lessons: z.array(lessonSchema),
  quizzes: z.array(quizSchema),
  quizSession: quizSessionSchema,
  quizAnswer: answerResultSchema,
  dashboard: dashboardSchema,
  progress: progressSchema,
  liveClasses: z.array(liveClassSchema),
  certificates: z.array(certificateSchema),
  notifications: z.array(notificationSchema),
  tutorReply: tutorReplySchema,
  authChallenge: challengeSchema,
  authSession: authSessionSchema,
  refreshedTokens: refreshedTokensSchema,
};

export function parseApiResponse<T>(value: unknown, schema: z.ZodType<T>): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError('The server returned data in an unexpected format.', 502, 'invalid_response');
  }
  return result.data;
}
