import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, ChartNoAxesColumnIncreasing, House, Sparkles, Target, type LucideIcon } from 'lucide-react-native';
import { useAuth } from '../auth/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CoursesScreen } from '../screens/CoursesScreen';
import { QuizzesScreen } from '../screens/QuizzesScreen';
import { AITutorScreen } from '../screens/AITutorScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { LiveClassesScreen } from '../screens/LiveClassesScreen';
import { CertificatesScreen } from '../screens/CertificatesScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { RootStackParamList, TabParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();
const tabIcons: Record<keyof TabParamList, LucideIcon> = {
  Dashboard: House,
  Courses: BookOpen,
  Quizzes: Target,
  AITutor: Sparkles,
  Progress: ChartNoAxesColumnIncreasing,
};

function renderTabIcon(routeName: keyof TabParamList, color: string, size: number, focused: boolean) {
  const Icon = tabIcons[routeName];
  return <Icon color={color} size={focused ? size + 1 : size} strokeWidth={focused ? 2.7 : 2} />;
}

function renderHeader() {
  return <AppHeader />;
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: [styles.tabBar, { height: 62 + insets.bottom, paddingBottom: Math.max(insets.bottom, 4) }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color, size, focused }) => renderTabIcon(route.name, color, size, focused),
      })}>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tabs.Screen name="Courses" component={CoursesScreen} />
      <Tabs.Screen name="Quizzes" component={QuizzesScreen} />
      <Tabs.Screen name="AITutor" component={AITutorScreen} options={{ tabBarLabel: 'AI Tutor' }} />
      <Tabs.Screen name="Progress" component={ProgressScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { isLoading, isAuthenticated, bootError } = useAuth();
  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.blue} /><Text style={styles.loadingText}>Preparing your learning space...</Text></View>;
  }
  if (bootError) {
    return <View style={styles.loading}><Text style={styles.errorTitle}>Secure sign-in is unavailable</Text><Text style={styles.loadingText}>{bootError}</Text><Text style={styles.errorHelp}>Restart the app after resolving the device keychain issue.</Text></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isAuthenticated ? 'student' : 'guest'}
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{
          header: renderHeader,
          contentStyle: { backgroundColor: colors.canvas },
          animation: 'slide_from_right',
        }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: true }} />
            <Stack.Screen name="LiveClasses" component={LiveClassesScreen} options={{ title: 'Live classes' }} />
            <Stack.Screen name="Certificates" component={CertificatesScreen} options={{ title: 'Certificates' }} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false, animation: 'fade' }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: 5 },
  tabLabel: { fontSize: 8, fontWeight: '700' },
  tabItem: { paddingVertical: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: colors.canvas },
  loadingText: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 12 },
  errorTitle: { color: colors.ink, fontSize: 16, textAlign: 'center', fontWeight: '800' },
  errorHelp: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 10 },
});
