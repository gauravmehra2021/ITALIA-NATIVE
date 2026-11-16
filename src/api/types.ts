export type Student = {
  id: string;
  displayName: string;
  email: string;
  preferredLanguage: string;
};

export type CourseSummary = {
  id: string;
  title: string;
  category: string;
  level: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  accentColor?: string;
  enrollmentStatus: 'enrolled' | 'available' | 'completed';
  price?: number;
  currency?: string;
  paymentUrl?: string | null;
};

export type Lesson = {
  id: string;
  title: string;
  contentType: 'video' | 'pdf' | 'audio' | 'interactive';
  durationMinutes?: number;
  completed: boolean;
  contentUrl?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  videoUrl?: string | null;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  contentText?: string | null;
  practicalTask?: string | null;
};

export type MobileAssignment = {
  id: string;
  courseId: string;
  chapterTitle: string;
  title: string;
  description: string;
  referenceFileUrl?: string | null;
  dueDateUtc?: string | null;
  totalMarks: number;
  submitted: boolean;
  mySubmissionText?: string | null;
  mySubmissionFileUrl?: string | null;
  marksObtained?: number | null;
  teacherFeedback?: string | null;
  status: string;
};

export type QuizSummary = {
  id: string;
  title: string;
  questionCount: number;
  durationMinutes: number;
  status: 'new' | 'in-progress' | 'completed';
  kind: 'topic' | 'random' | 'exam' | 'weak-topics';
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  audioUrl?: string;
  answers: Array<{ id: string; text: string }>;
};

export type QuizSession = {
  id: string;
  quizId: string;
  title: string;
  durationSeconds: number;
  questions: QuizQuestion[];
};

export type QuizAnswerResult = {
  correct: boolean;
  explanation: string;
  correctAnswerId: string;
  scorePercent?: number;
};

export type DashboardSummary = {
  student: Student;
  weeklyGoalMinutes: number;
  minutesStudiedThisWeek: number;
  averageQuizScorePercent: number;
  xpPoints: number;
  currentStreakDays: number;
  enrolledCourseCount: number;
  upcomingClass?: LiveClass;
  unreadNotifications: number;
};

export type ProgressSummary = {
  weeklyActivityMinutes: number[];
  averageQuizScorePercent: number;
  completedLessonsThisMonth: number;
  currentStreakDays: number;
  bestStreakDays: number;
  weakTopics: Array<{ id: string; name: string; masteryPercent: number }>;
  recommendations: Array<{ id: string; title: string; description: string }>;
};

export type LiveClass = {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  instructorName: string;
  courseTitle: string;
  meetUrl?: string;
  attendanceStatus: 'not-marked' | 'present' | 'absent';
};

export type Certificate = {
  id: string;
  certificateNumber: string;
  courseTitle: string;
  issuedAt: string;
  verificationUrl: string;
  downloadUrl?: string;
};

export type Subscription = {
  status: 'active' | 'pending' | 'expired' | 'none';
  planName?: string;
  amount?: number;
  currency?: string;
  renewsAt?: string;
  provider?: 'paypal' | 'other';
  maskedPaymentMethod?: string;
  managementUrl?: string;
};

export type StudentNotification = {
  id: string;
  category: 'class' | 'test' | 'announcement' | 'security';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type TutorMessage = {
  id: string;
  role: 'student' | 'assistant';
  content: string;
  audioUrl?: string;
  createdAt: string;
};

export type TutorReply = {
  messages: TutorMessage[];
};
