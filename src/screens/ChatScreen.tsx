import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useChat } from '../hooks/use-chat';
import type { ChatMessage } from '../types/chat';

const INTRO_TEXT =
  'Hi! Ask me anything about your spending — like where your money went this month or where you can cut back. To answer, a summary of your spending is shared with the AI.';

function BrandGradient({ id }: { id: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7c3aed" />
          <Stop offset="100%" stopColor="#a855f7" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function TypingDots() {
  const a = useRef(new Animated.Value(0.3)).current;
  const b = useRef(new Animated.Value(0.3)).current;
  const c = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    const anims = [pulse(a, 0), pulse(b, 150), pulse(c, 300)];
    anims.forEach(anim => anim.start());
    return () => anims.forEach(anim => anim.stop());
  }, [a, b, c]);

  return (
    <View style={styles.typingRow}>
      {[a, b, c].map((value, index) => (
        <Animated.View
          key={index}
          style={[styles.typingDot, { opacity: value }]}
        />
      ))}
    </View>
  );
}

type BubbleProps = {
  message: ChatMessage;
  onRetry: (id: string) => void;
};

function MessageBubble({ message, onRetry }: BubbleProps) {
  const isUser = message.role === 'user';

  if (message.status === 'sending') {
    return (
      <View style={[styles.row, styles.rowAI]}>
        <View style={[styles.bubble, styles.bubbleAI]}>
          <TypingDots />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAI,
          message.status === 'error' && styles.bubbleError,
        ]}
      >
        {isUser && <BrandGradient id="chatSentGradient" />}
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextAI,
          ]}
        >
          {message.text}
        </Text>
        {message.status === 'error' && (
          <Pressable
            style={styles.retryButton}
            onPress={() => onRetry(message.id)}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <MaterialIcons name="refresh" size={15} color="#7c3aed" />
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { messages, sending, send, retry, suggestions } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  function handleSend() {
    if (!input.trim() || sending) return;
    send(input);
    setInput('');
  }

  function handleChip(question: string) {
    if (sending) return;
    send(question);
  }

  const canSend = input.trim().length > 0 && !sending;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="auto-awesome" size={23} color="#ffffff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Spendly AI</Text>
          <View style={styles.headerStatusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.headerStatus}>Analyzing your data</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={[styles.row, styles.rowAI]}>
              <View style={[styles.bubble, styles.bubbleAI]}>
                <Text style={[styles.bubbleText, styles.bubbleTextAI]}>
                  {INTRO_TEXT}
                </Text>
              </View>
            </View>
          ) : (
            messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                onRetry={retry}
              />
            ))
          )}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: insets.bottom + 12 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map(question => (
              <Pressable
                key={question}
                style={[styles.chip, sending && styles.chipDisabled]}
                onPress={() => handleChip(question)}
                disabled={sending}
                accessibilityRole="button"
                accessibilityLabel={question}
              >
                <Text style={styles.chipLabel}>{question}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your spending…"
              placeholderTextColor="#a2a8b4"
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <BrandGradient id="chatSendGradient" />
              <MaterialIcons name="arrow-upward" size={22} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#eceef2',
    backgroundColor: '#f5f6f8',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16181c',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16a34a',
  },
  headerStatus: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#16a34a',
  },
  thread: {
    padding: 18,
    paddingBottom: 8,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAI: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 11,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  bubbleUser: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 18,
  },
  bubbleAI: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
    shadowColor: 'rgba(20,22,40,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  bubbleError: {
    borderWidth: 1,
    borderColor: '#f0d3d3',
  },
  bubbleText: {
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  bubbleTextAI: {
    color: '#16181c',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  retryLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#7c3aed',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#8a90a0',
  },
  composer: {
    paddingTop: 8,
    paddingHorizontal: 14,
    backgroundColor: '#f5f6f8',
  },
  chipsRow: {
    gap: 8,
    paddingBottom: 9,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#dfe2e8',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 20,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4a4f5c',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e5ea',
    borderRadius: 26,
    paddingVertical: 5,
    paddingLeft: 16,
    paddingRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#16181c',
    paddingVertical: 6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(124,58,237,0.40)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;
