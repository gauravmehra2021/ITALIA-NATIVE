import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Award, Bell, ChevronRight, UserRound, Video } from 'lucide-react-native';
import { useAuth } from '../auth/AuthContext';
import { studentService } from '../api/services';
import { useResource } from '../hooks/useResource';
import { isApiConfigured } from '../config/api';
import type { RootStackParamList } from '../navigation/navigationTypes';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { InlineNotice } from '../components/Feedback';
import { PageHeading } from '../components/PageHeading';
import { Screen } from '../components/Screen';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const { student: sessionStudent, signOut } = useAuth();
  const loadProfile = useCallback(() => studentService.profile(), []);
  const { data: profile, error: profileError } = useResource(loadProfile);
  const student = profile ?? sessionStudent;

  const confirmSignOut = () => {
    if (!isApiConfigured) {
      Alert.alert('Demo mode', 'Set API_BASE_URL in src/config/api.ts to test sign-in and sign-out with the .NET API.');
      return;
    }
    Alert.alert('Sign out?', 'You can sign in again at any time.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => {
      signOut().catch(cause => {
        Alert.alert('Signed out on this device', cause instanceof Error ? cause.message : 'The server session could not be closed.');
      });
    } },
    ]);
  };

  return (
    <Screen>
      <PageHeading title="Your profile" subtitle="Your learning account and preferences." />
      <View style={styles.profile}>
        <View style={styles.avatar}><UserRound color={colors.blue} size={26} /></View>
        <Text style={styles.name}>{student?.displayName ?? 'Student'}</Text>
        {student?.email ? <Text style={styles.email}>{student.email}</Text> : null}
        <View style={styles.member}><Text style={styles.memberText}>✦  SSEUROPA LEARNER</Text></View>
      </View>
      {profileError ? <InlineNotice message={profileError.message} /> : null}
      <MenuItem icon={<Award color={colors.blue} size={17} />} title="My certificates" description="View and verify achievements" onPress={() => navigation.navigate('Certificates')} />
      <MenuItem icon={<Bell color={colors.blue} size={17} />} title="Notifications" description="Classes, tests and updates" onPress={() => navigation.navigate('Notifications')} />
      <MenuItem icon={<Video color={colors.blue} size={17} />} title="Live classes" description="Schedule and attendance" onPress={() => navigation.navigate('LiveClasses')} />
      <Button title="Sign out" variant="secondary" onPress={confirmSignOut} />
    </Screen>
  );
}

function MenuItem({ icon, title, description, onPress }: { icon: React.ReactNode; title: string; description: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem} accessibilityRole="button">
      <View style={styles.menuIcon}>{icon}</View>
      <View style={styles.menuCopy}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuDescription}>{description}</Text></View>
      <ChevronRight color="#AAB5C6" size={19} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', padding: 20, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, marginBottom: 13 },
  avatar: { width: 60, height: 60, borderRadius: 22, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#D9E7FC' },
  name: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 10 },
  email: { color: colors.muted, fontSize: 10, marginTop: 3 },
  member: { marginTop: 10, backgroundColor: colors.paleGold, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  memberText: { color: '#8E640A', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 11, marginBottom: 8 },
  menuIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  menuCopy: { flex: 1 },
  menuTitle: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  menuDescription: { color: colors.muted, fontSize: 9, marginTop: 3 },
});
