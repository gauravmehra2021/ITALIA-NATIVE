import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Bell, ChevronDown, Languages, UserRound } from 'lucide-react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { studentService } from '../api/services';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/navigationTypes';
import { InlineNotice } from './Feedback';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function Logo() {
  return (
    <View style={styles.brand}>
      <View style={styles.mark}><Text style={styles.markText}>SS</Text><View style={styles.markUnderline} /></View>
      <View>
        <Text style={styles.name}>sseuropa</Text>
        <Text style={styles.tagline}>LEARN · GROW · SUCCEED</Text>
      </View>
    </View>
  );
}

export function AppHeader() {
  const navigation = useNavigation<Navigation>();
  const canGoBack = useNavigationState(state => state.index > 0);
  const [language, setLanguage] = React.useState('EN');
  const [error, setError] = React.useState<string | null>(null);

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
    <View>
      {error ? <InlineNotice message={error} onDismiss={() => setError(null)} /> : null}
      <View style={styles.header}>
        {canGoBack ? (
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft color={colors.navy} size={19} />
          </Pressable>
        ) : null}
        <Logo />
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 66, paddingHorizontal: 18, backgroundColor: colors.white, borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy, borderWidth: 1.5, borderColor: colors.gold },
  markText: { color: colors.white, fontSize: 14, fontWeight: '900', letterSpacing: -2 },
  markUnderline: { position: 'absolute', width: 17, height: 1.5, backgroundColor: colors.gold, bottom: 8 },
  name: { color: colors.navy, fontWeight: '900', fontSize: 17, letterSpacing: -0.4 },
  tagline: { color: colors.muted, fontSize: 6, fontWeight: '800', letterSpacing: 0.8, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  backButton: { width: 30, height: 34, alignItems: 'center', justifyContent: 'center', marginRight: -5 },
  languageButton: { flexDirection: 'row', gap: 4, alignItems: 'center', padding: 7, borderRadius: 12, backgroundColor: colors.canvas },
  language: { color: colors.navy, fontSize: 9, fontWeight: '900' },
  iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, top: 5, right: 5, backgroundColor: colors.gold, borderWidth: 1, borderColor: colors.white },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D6E4FA' },
});
