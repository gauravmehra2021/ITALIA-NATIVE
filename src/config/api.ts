declare const process: { env?: Record<string, string | undefined> } | undefined;

/**
 * Root URL of the .NET Web API (SSeuropa Mobile V1 API):
 * - Live Production API: https://api.sseuropa.com
 * - Local Android Emulator: http://10.0.2.2:5057 (if testing against localhost backend)
 * - Local iOS Simulator / Desktop: http://localhost:5057
 * - Can be overridden via environment variable EXPO_PUBLIC_API_BASE_URL / REACT_APP_API_BASE_URL
 */
const resolveBaseUrl = (): string => {
  let url = '';
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) {
    url = process.env.EXPO_PUBLIC_API_BASE_URL;
  } else if (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) {
    url = process.env.REACT_APP_API_BASE_URL;
  } else {
    // Default to the live production API URL
    url = 'https://api.sseuropa.com';
  }
  const clean = url.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean.slice(0, -4) : clean;
};

export const API_BASE_URL = resolveBaseUrl();
export const API_TIMEOUT_MS = 20_000;
export const API_VERSION = 'v1';

const root = `/api/${API_VERSION}`;

export const apiEndpoints = {
  auth: {
    login: `${root}/auth/login`,
    register: `${root}/auth/register`,
    forgotPassword: `${root}/auth/forgot-password`,
    resetPassword: `${root}/auth/reset-password`,
    verifyOtp: `${root}/auth/otp/verify`,
    refresh: `${root}/auth/refresh`,
    logout: `${root}/auth/logout`,
  },
  dashboard: `${root}/students/me/dashboard`,
  courses: `${root}/students/me/courses`,
  catalogue: `${root}/courses`,
  courseLessons: (courseId: string) => `${root}/students/me/courses/${encodeURIComponent(courseId)}/lessons`,
  courseAssignments: (courseId: string) => `${root}/students/me/courses/${encodeURIComponent(courseId)}/assignments`,
  submitAssignment: (assignmentId: string) => `${root}/assignments/${encodeURIComponent(assignmentId)}/submit`,
  enrollCourse: (courseId: string) => `${root}/students/me/courses/${encodeURIComponent(courseId)}/enroll`,
  quizzes: `${root}/students/me/quizzes`,
  quiz: (quizId: string) => `${root}/quizzes/${encodeURIComponent(quizId)}`,
  quizSession: (quizId: string) => `${root}/quizzes/${encodeURIComponent(quizId)}/sessions`,
  quizAnswer: (quizId: string) => `${root}/quizzes/${encodeURIComponent(quizId)}/answers`,
  tutorMessages: `${root}/students/me/ai-tutor/messages`,
  progress: `${root}/students/me/progress`,
  liveClasses: `${root}/students/me/live-classes`,
  certificates: `${root}/students/me/certificates`,
  subscription: `${root}/students/me/subscription`,
  notifications: `${root}/students/me/notifications`,
  notificationRead: (notificationId: string) => `${root}/students/me/notifications/${encodeURIComponent(notificationId)}/read`,
  profile: `${root}/students/me`,
  language: `${root}/students/me/preferences/language`,
} as const;

export const isApiConfigured = API_BASE_URL.trim().length > 0;
