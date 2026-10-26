import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useResource } from '../hooks/useResource';
import { studentService } from '../api/services';
import type { QuizAnswerResult, QuizQuestion, QuizSession, QuizSummary } from '../api/types';
import type { TabParamList } from '../navigation/navigationTypes';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeading } from '../components/PageHeading';
import { ProgressBar, QuizCard } from '../components/LearningCards';
import { Screen } from '../components/Screen';

type TabNavigation = BottomTabNavigationProp<TabParamList>;

export function QuizzesScreen() {
  const load = useCallback(() => studentService.quizzes(), []);
  const { data, error, isLoading, refresh } = useResource(load);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const navigation = useNavigation<TabNavigation>();
  const activeSessionId = session?.id;

  useEffect(() => {
    if (!activeSessionId) return undefined;
    const timer = setInterval(() => {
      setSecondsRemaining(value => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSessionId]);

  const startQuiz = async (quiz: QuizSummary) => {
    setSessionLoading(true);
    setSessionError(null);
    try {
      const started = await studentService.startQuiz(quiz.id);
      setSession(started);
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setCorrectAnswers(0);
      setQuizScore(null);
      setSecondsRemaining(started.durationSeconds);
    } catch (cause) {
      setSessionError(cause instanceof Error ? cause.message : 'Unable to start this quiz.');
    } finally {
      setSessionLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !selectedAnswer || !currentQuestion) return;
    setSubmitting(true);
    setSessionError(null);
    try {
      const result = await studentService.submitQuizAnswer(session.quizId, session.id, currentQuestion.id, selectedAnswer);
      setAnswerResult(result);
      if (result.correct) setCorrectAnswers(count => count + 1);
    } catch (cause) {
      setSessionError(cause instanceof Error ? cause.message : 'Unable to submit this answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = session?.questions[questionIndex];
  const finishOrAdvance = () => {
    if (session && questionIndex + 1 < session.questions.length) {
      setQuestionIndex(index => index + 1);
      setSelectedAnswer(null);
      setAnswerResult(null);
    } else {
      setQuizScore(session?.questions.length ? Math.round(correctAnswers / session.questions.length * 100) : 0);
      setSession(null);
    }
  };

  if (quizScore !== null) {
    return (
      <Screen>
        <PageHeading title="Quiz complete!" subtitle="You made time to practice. That’s a win." />
        <View style={styles.resultCard}><Text style={styles.resultScore}>{quizScore}%</Text><Text style={styles.resultLabel}>YOUR SCORE</Text><Text style={styles.resultXp}>✦  {Math.round(quizScore / 10) * 10} XP earned</Text></View>
        <Button title="Back to quizzes" onPress={() => setQuizScore(null)} />
        <Button title="View progress" variant="secondary" onPress={() => { setQuizScore(null); navigation.navigate('Progress'); }} />
      </Screen>
    );
  }

  if (session) {
    return (
      <Screen>
        <Pressable onPress={() => setSession(null)}><Text style={styles.back}>‹  All quizzes</Text></Pressable>
        <View style={styles.quizHeader}><Text style={styles.eyebrow}>{session.title.toUpperCase()}</Text><Text style={styles.questionCount}>Question {questionIndex + 1} of {session.questions.length}</Text><ProgressBar value={(questionIndex + 1) / session.questions.length * 100} /><Text style={[styles.timer, secondsRemaining === 0 && styles.timerExpired]}>◷ {formatTime(secondsRemaining)}</Text></View>
        {currentQuestion ? <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          onSelect={setSelectedAnswer}
          answerResult={answerResult}
          secondsRemaining={secondsRemaining}
          onSubmit={() => { submitAnswer(); }}
          onContinue={finishOrAdvance}
          submitting={submitting}
        /> : <EmptyState title="Quiz complete" description="Your results have been saved." action={{ label: 'Back to quizzes', onPress: () => setSession(null) }} />}
        {sessionError ? <Text style={styles.error}>{sessionError}</Text> : null}
      </Screen>
    );
  }

  function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  return (
    <Screen>
      <PageHeading title="Ready for a challenge?" subtitle="Practice a little. Improve a lot." />
      <View style={styles.streakCard}><Text style={styles.streakIcon}>✦</Text><View style={styles.streakCopy}><Text style={styles.streakTitle}>Your quiz streak</Text><Text style={styles.streakDescription}>Keep your practice going!</Text></View></View>
      <View style={styles.modeGrid}>
        {[
          { name: 'Topic quiz', kind: 'topic', description: 'Focus on one skill', icon: '◉' },
          { name: 'Random quiz', kind: 'random', description: 'A little of everything', icon: '⤨' },
          { name: 'Exam simulation', kind: 'exam', description: 'Practice under time', icon: '▣' },
          { name: 'Weak topics', kind: 'weak-topics', description: 'Practice what needs work', icon: '↗' },
        ].map(mode => (
          <Pressable key={mode.kind} onPress={() => {
            const matching = data?.find(quiz => quiz.kind === mode.kind) ?? data?.[0];
            if (matching) startQuiz(matching);
          }} style={styles.modeCard}>
            <Text style={styles.modeIcon}>{mode.icon}</Text><Text style={styles.modeTitle}>{mode.name}</Text><Text style={styles.modeDescription}>{mode.description}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Pick up a quiz</Text><Pressable onPress={() => navigation.navigate('Progress')}><Text style={styles.link}>Weak topics</Text></Pressable></View>
      {sessionError ? <Text style={styles.error}>{sessionError}</Text> : null}
      {sessionLoading ? <LoadingState label="Starting quiz..." /> : isLoading ? <LoadingState label="Loading quizzes..." /> : error ? <ErrorState message={error.message} onRetry={() => { refresh(); }} /> : !data?.length ? (
        <EmptyState title="No quizzes available" description="New practice activities will appear here when they’re ready." />
      ) : data.map(quiz => <QuizCard key={quiz.id} quiz={quiz} onPress={() => { startQuiz(quiz); }} />)}
      <Button title="View your progress" variant="secondary" onPress={() => navigation.navigate('Progress')} />
    </Screen>
  );
}

function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  answerResult,
  secondsRemaining,
  onSubmit,
  onContinue,
  submitting,
}: {
  question: QuizQuestion;
  selectedAnswer: string | null;
  onSelect: (answerId: string) => void;
  answerResult: QuizAnswerResult | null;
  secondsRemaining: number;
  onSubmit: () => void;
  onContinue: () => void;
  submitting: boolean;
}) {
  const playAudio = async (audioUrl?: string) => {
    if (!audioUrl) return;
    try {
      await Linking.openURL(audioUrl);
    } catch (cause) {
      Alert.alert('Unable to play question audio', cause instanceof Error ? cause.message : 'Please try again.');
    }
  };
  return (
    <View style={styles.questionCard}>
      <Text style={styles.prompt}>{question.prompt}</Text>
      {question.audioUrl ? <Button title="♫  Listen to question" variant="secondary" onPress={() => { playAudio(question.audioUrl); }} /> : null}
      {question.answers.map((answer, index) => {
        const isCorrect = answerResult?.correctAnswerId === answer.id;
        const selectedWrong = answerResult && selectedAnswer === answer.id && !answerResult.correct;
        return (
          <Pressable key={answer.id} disabled={Boolean(answerResult)} onPress={() => onSelect(answer.id)} style={[
            styles.answer,
            selectedAnswer === answer.id && !answerResult && styles.answerSelected,
            isCorrect && styles.answerCorrect,
            selectedWrong && styles.answerWrong,
          ]}>
            <Text style={styles.answerLetter}>{String.fromCharCode(65 + index)}</Text><Text style={styles.answerText}>{answer.text}</Text>
          </Pressable>
        );
      })}
      {secondsRemaining === 0 ? <Text style={styles.expiredMessage}>Time is up. Your submitted answers have been saved.</Text> : null}
      {answerResult ? <View style={[styles.explanation, answerResult.correct ? styles.explanationCorrect : styles.explanationWrong]}><Text style={styles.explanationTitle}>{answerResult.correct ? 'That’s right!' : 'Let’s learn why.'}</Text><Text style={styles.explanationText}>{answerResult.explanation}</Text></View> : null}
      {answerResult ? <Button title="Next question  →" onPress={onContinue} /> : <Button title={secondsRemaining === 0 ? 'Finish quiz' : 'Check answer'} onPress={secondsRemaining === 0 ? onContinue : onSubmit} disabled={secondsRemaining > 0 && !selectedAnswer} loading={submitting} />}
    </View>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.blue, fontSize: 12, fontWeight: '800', marginBottom: 14 },
  quizHeader: { backgroundColor: colors.white, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: colors.line, marginBottom: 13 },
  eyebrow: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  questionCount: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 9 },
  timer: { color: colors.blue, fontSize: 10, fontWeight: '800', marginTop: 8, textAlign: 'right' },
  timerExpired: { color: colors.red },
  questionCard: { backgroundColor: colors.white, borderRadius: 17, borderWidth: 1, borderColor: colors.line, padding: 16 },
  prompt: { color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '800', marginBottom: 11 },
  answer: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 12, marginTop: 8 },
  answerSelected: { borderColor: colors.blue, backgroundColor: colors.paleBlue },
  answerCorrect: { borderColor: colors.green, backgroundColor: colors.paleGreen },
  answerWrong: { borderColor: colors.red, backgroundColor: '#FFF0F0' },
  answerLetter: { color: colors.muted, fontSize: 10, fontWeight: '900', marginRight: 10 },
  answerText: { color: colors.ink, fontSize: 11, flex: 1 },
  explanation: { padding: 12, borderRadius: 12, marginTop: 11 },
  explanationCorrect: { backgroundColor: colors.paleGreen },
  explanationWrong: { backgroundColor: '#FFF0F0' },
  explanationTitle: { color: colors.ink, fontSize: 11, fontWeight: '900', marginBottom: 4 },
  explanationText: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  expiredMessage: { color: colors.red, fontSize: 10, lineHeight: 15, marginTop: 10 },
  resultCard: { backgroundColor: colors.navy, borderRadius: 18, padding: 24, alignItems: 'center', marginVertical: 14 },
  resultScore: { color: colors.gold, fontSize: 50, fontWeight: '900' },
  resultLabel: { color: '#CFDBEF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  resultXp: { color: colors.white, fontSize: 12, fontWeight: '800', marginTop: 18 },
  error: { color: colors.red, fontSize: 10, marginVertical: 7 },
  streakCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.navy, borderRadius: 16, padding: 15, marginBottom: 18 },
  streakIcon: { color: colors.gold, fontSize: 22, marginRight: 12 },
  streakCopy: { flex: 1 },
  streakTitle: { color: colors.white, fontSize: 12, fontWeight: '800' },
  streakDescription: { color: '#CBD8ED', fontSize: 9, marginTop: 4 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 20 },
  modeCard: { flexBasis: '48%', flexGrow: 1, backgroundColor: colors.white, borderRadius: 15, borderColor: colors.line, borderWidth: 1, padding: 13, minHeight: 100 },
  modeIcon: { color: colors.blue, fontSize: 18, fontWeight: '900', marginBottom: 7 },
  modeTitle: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  modeDescription: { color: colors.muted, fontSize: 9, marginTop: 4 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  link: { color: colors.blue, fontSize: 10, fontWeight: '800' },
});
