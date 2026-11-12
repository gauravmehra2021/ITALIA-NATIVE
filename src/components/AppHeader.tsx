import React from 'react';
import { Alert, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, ChevronDown, Languages, UserRound } from 'lucide-react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { studentService } from '../api/services';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/navigationTypes';
import { BrandMark } from './BrandMark';
import { InlineNotice } from './Feedback';

export const APP_HEADER_HEIGHT = 62;

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function Logo() {
  return (
    <View style={styles.brand}>
      <BrandMark size={40} />
      <View>
        <Text style={styles.name}>sseuropa</Text>
        <Text style={styles.tagline}>LEARN · GROW · SUCCEED</Text>
      </View>
    </View>
  );
}

export function AppHeader() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const canGoBack = useNavigationState(state => state.index > 0);
  const [language, setLanguage] = React.useState('EN');
  const [error, setError] = React.useState<string | null>(null);
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  );

  const chooseLanguage = () => {
    Alert.alert('Choose language', undefined, [
      ...[
        { code: 'EN', label: 'English' },
        { code: 'IT', label: 'Italiano' },
        { code: 'ES', label: 'Español' },
        { code: 'FR', label: 'Français' },
      ].map(item => ({
        text: item.label,
        onPress: () => {
          const changeLanguage = async () => {
            try {
              await studentService.updateLanguage(item.code.toLowerCase());
              setLanguage(item.code);
              setError(null);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : 'Unable to save your language preference.');
            }
          };
          changeLanguage();
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: topInset,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.leftGroup}>
          {canGoBack ? (
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <ArrowLeft color={colors.navy} size={20} />
            </Pressable>
          ) : null}
          <Logo />
        </View>
        <View style={styles.actions}>
          <Pressable onPress={chooseLanguage} style={styles.languageButton} accessibilityRole="button" accessibilityLabel="Choose language">
            <Languages color={colors.navy} size={15} /><Text style={styles.language}>{language}</Text><ChevronDown color={colors.navy} size={13} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Notifications">
            <Bell color={colors.navy} size={20} /><View style={styles.dot} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatar} accessibilityRole="button" accessibilityLabel="Open profile">
            <UserRound color={colors.blue} size={18} />
          </Pressable>
        </View>
      </View>
      {error ? (
        <View style={styles.noticeWrap}>
          <InlineNotice message={error} onDismiss={() => setError(null)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 2,
    shadowColor: colors.navy,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    height: APP_HEADER_HEIGHT,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: colors.navy, fontWeight: '900', fontSize: 17, letterSpacing: -0.4 },
  tagline: { color: colors.muted, fontSize: 6.5, fontWeight: '800', letterSpacing: 0.8, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  languageButton: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 12, backgroundColor: colors.canvas },
  language: { color: colors.navy, fontSize: 10, fontWeight: '900' },
  iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, top: 5, right: 5, backgroundColor: colors.gold, borderWidth: 1, borderColor: colors.white },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D6E4FA' },
  noticeWrap: { paddingHorizontal: 16, paddingBottom: 8 },
});
