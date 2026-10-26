/**
 * Set this to the root URL of the .NET API, for example:
 * http://10.0.2.2:5000 (Android emulator) or https://api.example.com.
 *
 * Leave empty to run the bundled demo data. Do not use localhost from a device:
 * use your computer's LAN address, or the Android emulator host above.
 */
export const API_BASE_URL = '';
export const API_TIMEOUT_MS = 20_000;
export const API_VERSION = 'v1';

const root = `/api/${API_VERSION}`;

export const apiEndpoints = {
  auth: {
    login: `${root}/auth/login`,
    verifyOtp: `${root}/auth/otp/verify`,
    refresh: `${root}/auth/refresh`,
    logout: `${root}/auth/logout`,
  },
  dashboard: `${root}/students/me/dashboard`,
  courses: `${root}/students/me/courses`,
  catalogue: `${root}/courses`,
  courseLessons: (courseId: string) => `${root}/students/me/courses/${encodeURIComponent(courseId)}/lessons`,
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
