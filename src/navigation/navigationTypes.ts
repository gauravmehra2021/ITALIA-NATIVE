import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Dashboard: undefined;
  Courses: undefined;
  Quizzes: undefined;
  AITutor: undefined;
  Progress: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Login: undefined;
  LiveClasses: undefined;
  Certificates: undefined;
  Notifications: undefined;
  Profile: undefined;
};
