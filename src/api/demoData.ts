import type {
  Certificate,
  CourseSummary,
  DashboardSummary,
  LiveClass,
  ProgressSummary,
  QuizSummary,
  StudentNotification,
} from './types';

export const demoDashboard: DashboardSummary = {
  student: {
    id: 'student-demo',
    displayName: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    preferredLanguage: 'en',
  },
  weeklyGoalMinutes: 420,
  minutesStudiedThisWeek: 288,
  averageQuizScorePercent: 86,
  xpPoints: 1240,
  currentStreakDays: 7,
  enrolledCourseCount: 3,
  upcomingClass: {
    id: 'class-101',
    title: 'Speak with confidence',
    startsAt: '2026-10-06T14:30:00+05:30',
    durationMinutes: 45,
    instructorName: 'Maria R.',
    courseTitle: 'English for Everyday Life',
    attendanceStatus: 'not-marked',
  },
  unreadNotifications: 2,
};

export const demoCourses: CourseSummary[] = [
  {
    id: 'english-a2',
    title: 'English for Everyday Life',
    category: 'Language',
    level: 'A2',
    progressPercent: 68,
    completedLessons: 12,
    totalLessons: 18,
    enrollmentStatus: 'enrolled',
  },
  {
    id: 'digital-skills',
    title: 'Digital Skills Essentials',
    category: 'Digital',
    level: 'Beginner',
    progressPercent: 34,
    completedLessons: 6,
    totalLessons: 16,
    accentColor: '#168A5B',
    enrollmentStatus: 'enrolled',
  },
  {
    id: 'italian-a1',
    title: 'Italian Conversation',
    category: 'Language',
    level: 'A1',
    progressPercent: 12,
    completedLessons: 2,
    totalLessons: 15,
    accentColor: '#8C5CC7',
    enrollmentStatus: 'enrolled',
  },
];

export const demoCatalogue: CourseSummary[] = [{
  id: 'study-skills',
  title: 'Study Skills for Success',
  category: 'Learning skills',
  level: 'Beginner',
  progressPercent: 0,
  completedLessons: 0,
  totalLessons: 8,
  accentColor: '#C38714',
  enrollmentStatus: 'available',
}];

export const demoLessons = (courseId: string) => [
  { id: `${courseId}-lesson-1`, title: 'Everyday conversations', contentType: 'video' as const, durationMinutes: 12, completed: true },
  { id: `${courseId}-lesson-2`, title: 'Practice phrases', contentType: 'pdf' as const, completed: false },
  { id: `${courseId}-lesson-3`, title: 'Listen and repeat', contentType: 'audio' as const, durationMinutes: 8, completed: false },
];

export const demoQuizzes: QuizSummary[] = [
  { id: 'quiz-unit-4', title: 'Everyday English · Unit 4', questionCount: 12, durationMinutes: 10, status: 'in-progress', kind: 'topic' },
  { id: 'quiz-digital-safety', title: 'Digital safety basics', questionCount: 8, durationMinutes: 6, status: 'new', kind: 'topic' },
  { id: 'exam-a2', title: 'A2 level practice exam', questionCount: 30, durationMinutes: 25, status: 'new', kind: 'exam' },
];

export const demoProgress: ProgressSummary = {
  weeklyActivityMinutes: [46, 62, 54, 78, 66, 88, 72],
  averageQuizScorePercent: 86,
  completedLessonsThisMonth: 20,
  currentStreakDays: 7,
  bestStreakDays: 12,
  weakTopics: [{ id: 'indirect-questions', name: 'Indirect questions', masteryPercent: 54 }],
  recommendations: [
    { id: 'short-session', title: 'You learn best in short sessions.', description: 'Try a 10-minute lesson today to keep your streak and build confidence.' },
  ],
};

export const demoClasses: LiveClass[] = [
  demoDashboard.upcomingClass!,
  {
    id: 'class-102',
    title: 'Everyday digital skills',
    startsAt: '2026-10-07T10:00:00+05:30',
    durationMinutes: 50,
    instructorName: 'Luca B.',
    courseTitle: 'Digital Skills Essentials',
    attendanceStatus: 'not-marked',
  },
  {
    id: 'class-103',
    title: 'Italian for beginners',
    startsAt: '2026-10-09T16:00:00+05:30',
    durationMinutes: 45,
    instructorName: 'Sofia M.',
    courseTitle: 'Italian Conversation',
    attendanceStatus: 'present',
  },
];

export const demoCertificates: Certificate[] = [
  {
    id: 'certificate-841',
    certificateNumber: 'SS-2026-DS-00841',
    courseTitle: 'Digital Skills Essentials',
    issuedAt: '2026-10-01T12:00:00Z',
    verificationUrl: 'https://verify.example.invalid/SS-2026-DS-00841',
  },
];

export const demoNotifications: StudentNotification[] = [
  { id: 'notification-1', category: 'class', title: 'Your live class starts soon', message: '“Speak with confidence” begins at 14:30.', createdAt: '2026-10-06T14:20:00+05:30', read: false },
  { id: 'notification-2', category: 'test', title: 'Quiz results are ready', message: 'You scored 86% on Everyday English · Unit 3.', createdAt: '2026-10-06T12:00:00+05:30', read: false },
  { id: 'notification-3', category: 'security', title: 'New sign-in to your account', message: 'A secure sign-in was detected on this device.', createdAt: '2026-10-05T08:30:00+05:30', read: true },
];
