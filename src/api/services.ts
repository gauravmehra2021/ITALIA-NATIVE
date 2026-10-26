import { apiEndpoints, isApiConfigured } from '../config/api';
import { apiRequest } from './httpClient';
import { parseApiResponse, responseContracts } from './contracts';
import {
  demoCertificates,
  demoCatalogue,
  demoClasses,
  demoCourses,
  demoDashboard,
  demoLessons,
  demoNotifications,
  demoProgress,
  demoQuizzes,
  demoSubscription,
} from './demoData';
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
  Subscription,
  TutorReply,
} from './types';

export type AuthChallenge = { challengeId: string; expiresAt: string };
export type AuthSession = { accessToken: string; refreshToken: string; student: Student };

const demoEnrollments = new Set<string>();
const demoReadNotifications = new Set<string>();

export const authService = {
  async beginLogin(email: string, password: string): Promise<AuthChallenge> {
    const response = await apiRequest<unknown>(apiEndpoints.auth.login, {
      method: 'POST',
      authenticated: false,
      body: { email, password },
    });
    return parseApiResponse(response, responseContracts.authChallenge);
  },
  async verifyOtp(challengeId: string, code: string): Promise<AuthSession> {
    const response = await apiRequest<unknown>(apiEndpoints.auth.verifyOtp, {
      method: 'POST',
      authenticated: false,
      body: { challengeId, code },
    });
    return parseApiResponse(response, responseContracts.authSession);
  },
  async logout(): Promise<void> {
    return apiRequest<void>(apiEndpoints.auth.logout, { method: 'POST' });
  },
};

async function getOrFetch<T>(fallback: T, path: string, schema: import('zod').ZodType<T>): Promise<T> {
  if (!isApiConfigured) return fallback;
  return parseApiResponse(await apiRequest<unknown>(path), schema);
}

export const studentService = {
  dashboard: () => getOrFetch<DashboardSummary>(demoDashboard, apiEndpoints.dashboard, responseContracts.dashboard),
  courses: () => getOrFetch<CourseSummary[]>([
    ...demoCourses,
    ...demoCatalogue.filter(course => demoEnrollments.has(course.id)).map(course => ({ ...course, enrollmentStatus: 'enrolled' as const })),
  ], apiEndpoints.courses, responseContracts.courses),
  catalogue: () => getOrFetch<CourseSummary[]>(demoCatalogue.filter(course => !demoEnrollments.has(course.id)), apiEndpoints.catalogue, responseContracts.courses),
  enrollCourse(courseId: string) {
    if (!isApiConfigured) {
      demoEnrollments.add(courseId);
      return Promise.resolve();
    }
    return apiRequest<void>(apiEndpoints.enrollCourse(courseId), { method: 'POST', body: {} });
  },
  lessons: (courseId: string) =>
    getOrFetch<Lesson[]>(demoLessons(courseId), apiEndpoints.courseLessons(courseId), responseContracts.lessons),
  quizzes: () => getOrFetch<QuizSummary[]>(demoQuizzes, apiEndpoints.quizzes, responseContracts.quizzes),
  startQuiz(quizId: string): Promise<QuizSession> {
    if (!isApiConfigured) {
      return Promise.resolve({
        id: 'demo-session',
        quizId,
        title: 'Everyday English · Unit 4',
        durationSeconds: 600,
        questions: [
          {
            id: 'question-1',
            prompt: 'Choose the correct phrase: “Could you tell me where _____?”',
            answers: [
              { id: 'a', text: 'is the station' },
              { id: 'b', text: 'the station is' },
              { id: 'c', text: 'does the station' },
            ],
          },
        ],
      });
    }
    return apiRequest<unknown>(apiEndpoints.quizSession(quizId), { method: 'POST', body: {} })
      .then(response => parseApiResponse(response, responseContracts.quizSession));
  },
  submitQuizAnswer(quizId: string, sessionId: string, questionId: string, answerId: string) {
    if (!isApiConfigured) {
      return Promise.resolve<QuizAnswerResult>({
        correct: answerId === 'b',
        explanation: 'In indirect questions, use statement word order: subject before verb.',
        correctAnswerId: 'b',
      });
    }
    return apiRequest<unknown>(apiEndpoints.quizAnswer(quizId), {
      method: 'POST',
      body: { sessionId, questionId, answerId },
    }).then(response => parseApiResponse(response, responseContracts.quizAnswer));
  },
  tutorReply(message: string): Promise<TutorReply> {
    if (!isApiConfigured) {
      return Promise.resolve({
        messages: [{
          id: `demo-${Date.now()}`,
          role: 'assistant',
          content: `That’s a great question about “${message}”. In your connected tutor service, this response will be generated based on your current courses and learning level.`,
          createdAt: new Date().toISOString(),
        }],
      });
    }
    return apiRequest<unknown>(apiEndpoints.tutorMessages, { method: 'POST', body: { message } })
      .then(response => parseApiResponse(response, responseContracts.tutorReply));
  },
  progress: () => getOrFetch<ProgressSummary>(demoProgress, apiEndpoints.progress, responseContracts.progress),
  liveClasses: () => getOrFetch<LiveClass[]>(demoClasses, apiEndpoints.liveClasses, responseContracts.liveClasses),
  certificates: () => getOrFetch<Certificate[]>(demoCertificates, apiEndpoints.certificates, responseContracts.certificates),
  subscription: () => getOrFetch<Subscription>(demoSubscription, apiEndpoints.subscription, responseContracts.subscription),
  notifications: () => getOrFetch<StudentNotification[]>(
    demoNotifications.map(item => ({ ...item, read: item.read || demoReadNotifications.has(item.id) })),
    apiEndpoints.notifications,
    responseContracts.notifications,
  ),
  markNotificationRead(notificationId: string) {
    if (!isApiConfigured) {
      demoReadNotifications.add(notificationId);
      return Promise.resolve();
    }
    return apiRequest<void>(apiEndpoints.notificationRead(notificationId), { method: 'POST' });
  },
  profile: () => getOrFetch<Student>(demoDashboard.student, apiEndpoints.profile, responseContracts.student),
  updateLanguage(language: string) {
    return isApiConfigured
      ? apiRequest<void>(apiEndpoints.language, { method: 'PUT', body: { language } })
      : Promise.resolve();
  },
};
