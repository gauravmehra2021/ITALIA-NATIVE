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
  MobileAssignment,
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
  async register(firstName: string, lastName: string, email: string, password: string): Promise<AuthChallenge> {
    const response = await apiRequest<unknown>(apiEndpoints.auth.register, {
      method: 'POST',
      authenticated: false,
      body: { firstName, lastName, email, password, preferredLanguage: 'en' },
    });
    return parseApiResponse(response, responseContracts.authChallenge);
  },
  async forgotPassword(email: string): Promise<AuthChallenge> {
    const response = await apiRequest<unknown>(apiEndpoints.auth.forgotPassword, {
      method: 'POST',
      authenticated: false,
      body: { email },
    });
    return parseApiResponse(response, responseContracts.authChallenge);
  },
  async resetPassword(challengeId: string, code: string, newPassword: string): Promise<void> {
    await apiRequest<void>(apiEndpoints.auth.resetPassword, {
      method: 'POST',
      authenticated: false,
      body: { challengeId, code, newPassword },
    });
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
  try {
    return parseApiResponse(await apiRequest<unknown>(path), schema);
  } catch (error) {
    console.warn(`[API] Remote call to ${path} failed, falling back to local dataset:`, error);
    return fallback;
  }
}

export const studentService = {
  dashboard: () => getOrFetch<DashboardSummary>(demoDashboard, apiEndpoints.dashboard, responseContracts.dashboard),
  courses: () => getOrFetch<CourseSummary[]>([
    ...demoCourses,
    ...demoCatalogue.filter(course => demoEnrollments.has(course.id)).map(course => ({ ...course, enrollmentStatus: 'enrolled' as const })),
  ], apiEndpoints.courses, responseContracts.courses),
  catalogue: () => getOrFetch<CourseSummary[]>(demoCatalogue.filter(course => !demoEnrollments.has(course.id)), apiEndpoints.catalogue, responseContracts.courses),
  async enrollCourse(courseId: string) {
    demoEnrollments.add(courseId);
    if (!isApiConfigured) {
      return;
    }
    try {
      await apiRequest<void>(apiEndpoints.enrollCourse(courseId), { method: 'POST', body: {} });
    } catch (error) {
      console.warn(`[API] enrollCourse failed, maintaining local enrollment:`, error);
    }
  },
  lessons: (courseId: string) =>
    getOrFetch<Lesson[]>(demoLessons(courseId), apiEndpoints.courseLessons(courseId), responseContracts.lessons),
  assignments: async (courseId: string): Promise<MobileAssignment[]> => {
    if (!isApiConfigured) return [];
    try {
      const response = await apiRequest<MobileAssignment[]>(apiEndpoints.courseAssignments(courseId));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  },
  submitAssignment: async (assignmentId: string, submissionText?: string, submissionFileUrl?: string): Promise<MobileAssignment> => {
    return apiRequest<MobileAssignment>(apiEndpoints.submitAssignment(assignmentId), {
      method: 'POST',
      body: { submissionText, submissionFileUrl },
    });
  },
  quizzes: () => getOrFetch<QuizSummary[]>(demoQuizzes, apiEndpoints.quizzes, responseContracts.quizzes),
  async startQuiz(quizId: string): Promise<QuizSession> {
    const demoSession: QuizSession = {
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
    };

    if (!isApiConfigured) {
      return demoSession;
    }
    try {
      const response = await apiRequest<unknown>(apiEndpoints.quizSession(quizId), { method: 'POST', body: {} });
      return parseApiResponse(response, responseContracts.quizSession);
    } catch (error) {
      console.warn(`[API] startQuiz failed, falling back to demo session:`, error);
      return demoSession;
    }
  },
  async submitQuizAnswer(quizId: string, sessionId: string, questionId: string, answerId: string): Promise<QuizAnswerResult> {
    const fallbackResult: QuizAnswerResult = {
      correct: answerId === 'b',
      explanation: 'In indirect questions, use statement word order: subject before verb.',
      correctAnswerId: 'b',
    };
    if (!isApiConfigured) {
      return fallbackResult;
    }
    try {
      const response = await apiRequest<unknown>(apiEndpoints.quizAnswer(quizId), {
        method: 'POST',
        body: { sessionId, questionId, answerId },
      });
      return parseApiResponse(response, responseContracts.quizAnswer);
    } catch (error) {
      console.warn(`[API] submitQuizAnswer failed, falling back to local evaluation:`, error);
      return fallbackResult;
    }
  },
  async tutorReply(message: string): Promise<TutorReply> {
    const fallbackReply: TutorReply = {
      messages: [{
        id: `demo-${Date.now()}`,
        role: 'assistant',
        content: `That’s a great question about “${message}”. In your connected tutor service, this response will be generated based on your current courses and learning level.`,
        createdAt: new Date().toISOString(),
      }],
    };
    if (!isApiConfigured) {
      return fallbackReply;
    }
    try {
      const response = await apiRequest<unknown>(apiEndpoints.tutorMessages, { method: 'POST', body: { message } });
      return parseApiResponse(response, responseContracts.tutorReply);
    } catch (error) {
      console.warn(`[API] tutorReply failed, returning fallback tutor reply:`, error);
      return fallbackReply;
    }
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
  async markNotificationRead(notificationId: string): Promise<void> {
    demoReadNotifications.add(notificationId);
    if (!isApiConfigured) {
      return;
    }
    try {
      await apiRequest<void>(apiEndpoints.notificationRead(notificationId), { method: 'POST' });
    } catch (error) {
      console.warn(`[API] markNotificationRead failed, maintained locally:`, error);
    }
  },
  profile: () => getOrFetch<Student>(demoDashboard.student, apiEndpoints.profile, responseContracts.student),
  async updateLanguage(language: string): Promise<void> {
    if (!isApiConfigured) {
      return;
    }
    try {
      await apiRequest<void>(apiEndpoints.language, { method: 'PUT', body: { language } });
    } catch (error) {
      console.warn(`[API] updateLanguage failed:`, error);
    }
  },
};
