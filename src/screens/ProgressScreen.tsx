import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { studentService } from '../api/services';
import { useResource } from '../hooks/useResource';
import type { TabParamList } from '../navigation/navigationTypes';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { ErrorState, LoadingState } from '../components/Feedback';
import { PageHeading } from '../components/PageHeading';
import { ProgressCard } from '../components/LearningCards';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';

export function ProgressScreen() {
  const load = useCallback(() => studentService.progress(), []);
  const { data, error, isLoading, refresh } = useResource(load);
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();

  if (isLoading) return <Screen><LoadingState label="Loading your progress..." /></Screen>;
  if (error || !data) return <Screen><ErrorState message={error?.message ?? 'Progress is unavailable.'} onRetry={() => { refresh(); }} /></Screen>;

  const goalMinutes = data.weeklyActivityMinutes.reduce((sum, value) => sum + value, 0);
  const chartMax = Math.max(1, ...data.weeklyActivityMinutes);

  return (
    <Screen>
      <PageHeading title="Your progress" subtitle="Every step forward counts." />
      <View style={styles.overview}>
        <View><Text style={styles.eyebrow}>LEARNING THIS WEEK</Text><Text style={styles.overviewBig}>{Math.floor(goalMinutes / 60)}<Text style={styles.overviewSmall}> hrs {goalMinutes % 60} min</Text></Text><Text style={styles.goodNote}>A great week of learning</Text></View>
        <View style={styles.circle}><Text style={styles.circleText}>{data.currentStreakDays} ✦</Text><Text style={styles.circleCaption}>day streak</Text></View>
      </View>
      <View style={styles.analytics}>
        <View style={styles.analyticsHead}><Text style={styles.cardTitle}>Study activity</Text><Text style={styles.caption}>Last 7 days</Text></View>
        <View style={styles.chart}>
          {data.weeklyActivityMinutes.map((value, index) => (
            <View key={`day-${index}`} style={styles.chartColumn}>
              <Text style={styles.chartValue}>{value}</Text><View style={[styles.chartBar, { height: Math.max(5, value / chartMax * 82) }, index === data.weeklyActivityMinutes.length - 1 ? styles.highlightBar : styles.normalBar]} /><Text style={styles.chartLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index % 7]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.legend}>Minutes of learning each day</Text>
      </View>
      <View style={styles.metrics}>
        <ProgressCard label="QUIZ SCORES" value={`${data.averageQuizScorePercent}%`} note="average score" color={colors.green} />
        <ProgressCard label="COMPLETED" value={String(data.completedLessonsThisMonth)} note="lessons this month" color={colors.blue} />
        <ProgressCard label="BEST STREAK" value={`${data.bestStreakDays} days`} note="personal best" color={colors.gold} />
      </View>
      <SectionTitle title="Topics to practice" />
      {data.weakTopics.map(topic => (
        <View key={topic.id} style={styles.topic}>
          <View style={styles.topicCopy}><Text style={styles.cardTitle}>{topic.name}</Text><Text style={styles.caption}>{topic.masteryPercent}% mastery</Text></View>
          <Pressable onPress={() => navigation.navigate('Quizzes')}><Text style={styles.practice}>Practice</Text></Pressable>
        </View>
      ))}
      <SectionTitle title="Recommended for you" />
      {data.recommendations.map(item => (
        <View key={item.id} style={styles.recommendation}><Text style={styles.recommendationTitle}>{item.title}</Text><Text style={styles.recommendationText}>{item.description}</Text><Button title="Find a lesson  →" compact onPress={() => navigation.navigate('Courses')} /></View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  overview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.navy, padding: 18, borderRadius: 18, marginBottom: 13 },
  eyebrow: { color: '#BFD3F6', fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  overviewBig: { color: colors.white, fontSize: 28, fontWeight: '900', marginTop: 6 },
  overviewSmall: { color: '#C5D3EA', fontSize: 12, fontWeight: '600' },
  goodNote: { color: '#7EE0B0', fontSize: 9, marginTop: 4 },
  circle: { width: 67, height: 67, borderRadius: 34, borderWidth: 3, borderColor: colors.gold, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  circleText: { color: colors.white, fontWeight: '900', fontSize: 13 },
  circleCaption: { color: '#CBD8ED', fontSize: 7, marginTop: 2 },
  analytics: { backgroundColor: colors.white, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: colors.line, marginBottom: 12 },
  analyticsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  caption: { color: colors.muted, fontSize: 9, lineHeight: 14 },
  chart: { height: 130, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 10 },
  chartColumn: { alignItems: 'center', justifyContent: 'flex-end', height: 115, width: 30 },
  chartValue: { color: colors.muted, fontSize: 7, marginBottom: 3 },
  chartBar: { width: 17, borderRadius: 6 },
  highlightBar: { backgroundColor: colors.blue },
  normalBar: { backgroundColor: '#C9D9F5' },
  chartLabel: { color: colors.muted, fontSize: 8, marginTop: 5 },
  legend: { color: colors.muted, fontSize: 8, marginTop: 7 },
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  topic: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 13, marginBottom: 9 },
  topicCopy: { flex: 1 },
  practice: { color: colors.blue, fontWeight: '800', fontSize: 10 },
  recommendation: { backgroundColor: colors.paleBlue, padding: 15, borderRadius: 16, marginBottom: 10 },
  recommendationTitle: { color: colors.navy, fontSize: 13, fontWeight: '900' },
  recommendationText: { color: '#526986', fontSize: 10, lineHeight: 16, marginTop: 5 },
});
