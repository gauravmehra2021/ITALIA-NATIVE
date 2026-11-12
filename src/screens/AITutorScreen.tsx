import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Send, Sparkles, Volume2 } from 'lucide-react-native';
import Tts from 'react-native-tts';
import { studentService } from '../api/services';
import type { TutorMessage } from '../api/types';
import { tutorMessageSchema } from '../validation/schemas';
import { colors } from '../theme/colors';
import { APP_HEADER_HEIGHT } from '../components/AppHeader';
import { InlineNotice } from '../components/Feedback';
import { PageHeading } from '../components/PageHeading';

const suggestions = ['Explain past tense', 'Help with my homework', 'Give me a practice question'];

export function AITutorScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<TutorMessage>>(null);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    content: 'Hi! I’m your learning companion. What would you like to understand today?',
    createdAt: new Date().toISOString(),
  }]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      Tts.stop();
    };
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, isSending]);

  const sendMessage = async (value = input) => {
    const parsed = tutorMessageSchema.safeParse({ message: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Type a message first.');
      return;
    }

    const question: TutorMessage = {
      id: `student-${Date.now()}`,
      role: 'student',
      content: parsed.data.message,
      createdAt: new Date().toISOString(),
    };
    setMessages(current => [...current, question]);
    setInput('');
    setError(null);
    setIsSending(true);
    try {
      const reply = await studentService.tutorReply(parsed.data.message);
      setMessages(current => [...current, ...reply.messages]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your tutor could not reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const speak = async (text: string) => {
    try {
      await Tts.stop();
      Tts.speak(text);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Text-to-speech is not available.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + APP_HEADER_HEIGHT}>
      <View style={styles.heading}><View style={styles.tutorIcon}><Sparkles color={colors.gold} size={21} /></View><PageHeading title="Your AI tutor" subtitle="Ask anything. Learn at your pace." /></View>
      {error ? <InlineNotice message={error} onDismiss={() => setError(null)} /> : null}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        ListHeaderComponent={<Text style={styles.sessionLabel}>YOUR STUDY SESSION</Text>}
        renderItem={({ item }) => (
          <View style={[styles.messageRow, item.role === 'student' && styles.studentRow]}>
            {item.role === 'assistant' ? <View style={styles.miniIcon}><Sparkles color={colors.gold} size={13} /></View> : null}
            <View style={[styles.bubble, item.role === 'student' ? styles.studentBubble : styles.assistantBubble]}>
              <Text style={[styles.messageText, item.role === 'student' && styles.studentText]}>{item.content}</Text>
              {item.role === 'assistant' ? <Pressable onPress={() => { speak(item.content); }} style={styles.speakButton} accessibilityRole="button" accessibilityLabel="Listen to tutor response"><Volume2 size={13} color={colors.blue} /><Text style={styles.speakText}>Listen to answer</Text></Pressable> : null}
            </View>
          </View>
        )}
        ListFooterComponent={isSending ? <View style={styles.loadingBubble}><Text style={styles.loadingText}>Your tutor is thinking…</Text></View> : undefined}
        keyboardShouldPersistTaps="handled"
      />
      <View style={styles.composerArea}>
        <Text style={styles.tryAsking}>TRY ASKING</Text>
        <FlatList
          horizontal
          data={suggestions}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestions}
          renderItem={({ item }) => <Pressable onPress={() => setInput(item)} style={styles.suggestion}><Text style={styles.suggestionText}>{item}</Text></Pressable>}
        />
        <View style={styles.composer}>
          <Pressable onPress={() => inputRef.current?.focus()} style={styles.micButton} accessibilityRole="button" accessibilityLabel="Open keyboard voice input">
            <Mic color={colors.blue} size={17} />
          </Pressable>
          <TextInput ref={inputRef} value={input} onChangeText={setInput} placeholder="Ask your tutor anything..." placeholderTextColor={colors.muted} style={styles.input} multiline maxLength={2000} returnKeyType="send" onSubmitEditing={() => { sendMessage(); }} accessibilityLabel="Message your AI tutor" />
          <Pressable onPress={() => { sendMessage(); }} disabled={isSending} style={styles.sendButton} accessibilityRole="button" accessibilityLabel="Send message">
            <Send color={colors.white} size={16} />
          </Pressable>
        </View>
        <Text style={styles.disclaimer}>AI can make mistakes. Check important information with your course materials.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  heading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, gap: 11 },
  tutorIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingHorizontal: 16, paddingBottom: 12, flexGrow: 1 },
  sessionLabel: { textAlign: 'center', color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.7, marginVertical: 16 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 13, maxWidth: '92%' },
  studentRow: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  miniIcon: { width: 25, height: 25, borderRadius: 9, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  bubble: { borderRadius: 17, padding: 12, maxWidth: '100%' },
  assistantBubble: { backgroundColor: colors.white, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: colors.line },
  studentBubble: { backgroundColor: colors.blue, borderBottomRightRadius: 5 },
  messageText: { color: colors.ink, fontSize: 12, lineHeight: 18 },
  studentText: { color: colors.white },
  speakButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  speakText: { color: colors.blue, fontSize: 9, fontWeight: '800' },
  loadingBubble: { alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 10, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.line, marginLeft: 32 },
  loadingText: { color: colors.muted, fontSize: 10 },
  composerArea: { paddingTop: 8, paddingBottom: 3, paddingHorizontal: 13 },
  tryAsking: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginBottom: 7, marginLeft: 3 },
  suggestions: { paddingBottom: 8 },
  suggestion: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, marginRight: 7 },
  suggestionText: { color: colors.navy, fontSize: 9, fontWeight: '700' },
  composer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 6, borderColor: colors.line, borderWidth: 1 },
  micButton: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 39, maxHeight: 85, paddingHorizontal: 10, paddingVertical: 8, color: colors.ink, fontSize: 11 },
  sendButton: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { color: colors.muted, fontSize: 8, textAlign: 'center', paddingVertical: 7, paddingHorizontal: 5 },
});
