import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agentAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/colors';
import Header from '../components/Header';
import type { ChatMessage } from '../types';
import LinearGradient from 'react-native-linear-gradient';
import { Zap, User, CheckCircle2, Send } from 'lucide-react-native';

const SUGGESTIONS = [
  'Book a service for my bike',
  'Check my service status',
  'What subscription plans are available?',
  'Find EV service centres nearby',
  'How do I upload vehicle documents?',
];

const TypingDots: React.FC = () => {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '.' : d + '.')), 400);
    return () => clearInterval(t);
  }, []);
  return <Text style={typingStyles.text}>KEMO AI is typing{dots}</Text>;
};

const typingStyles = StyleSheet.create({
  text: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic', marginLeft: 12, marginBottom: 8 },
});

function parseBooking(text: string): string | null {
  if (!text) return null;
  const match = text.match(/booking(?:\s+id)?[:\s*#]+([a-f0-9]{8,24})\b/i);
  return match ? match[1] : null;
}

const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  const bookingId = !isUser ? parseBooking(msg.content) : null;

  return (
    <View style={[bubbleStyles.row, isUser ? bubbleStyles.rowUser : bubbleStyles.rowAssistant]}>
      {!isUser && (
        <LinearGradient
          colors={['#1a6ef7', '#00e5ff']}
          style={bubbleStyles.avatarBox}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Zap size={16} color="#fff" />
        </LinearGradient>
      )}
      <View style={{ maxWidth: '75%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {isUser ? (
          <LinearGradient
            colors={['#1a4ef7', '#0d3fc7']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[bubbleStyles.bubble, bubbleStyles.bubbleUser]}
          >
            <Text style={[bubbleStyles.text, bubbleStyles.textUser]}>{msg.content}</Text>
            <Text style={bubbleStyles.time}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[bubbleStyles.bubble, bubbleStyles.bubbleAssistant]}>
            <Text style={[bubbleStyles.text, bubbleStyles.textAssistant]}>{msg.content}</Text>
            {bookingId && (
              <View style={bubbleStyles.bookingBadge}>
                <CheckCircle2 size={14} color="#22c55e" />
                <Text style={bubbleStyles.bookingBadgeText}>
                  Booking Confirmed · ID: <Text style={bubbleStyles.bookingId}>{bookingId.slice(-8).toUpperCase()}</Text>
                </Text>
              </View>
            )}
            <Text style={bubbleStyles.timeAssistant}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </View>
      {isUser && (
        <View style={bubbleStyles.avatarBoxUser}>
          <User size={16} color="#fff" />
        </View>
      )}
    </View>
  );
};

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, paddingHorizontal: 12 },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start', gap: 6 },
  avatarBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarBoxUser: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  avatarText: { fontSize: 16 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderBottomLeftRadius: 4 },
  text: { fontSize: 14, lineHeight: 20 },
  textUser: { color: '#fff' },
  textAssistant: { color: '#e2e8f0' },
  time: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' },
  timeAssistant: { fontSize: 10, color: '#64748b', marginTop: 6, textAlign: 'left' },
  bookingBadge: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingBadgeText: { color: '#22c55e', fontSize: 11, fontWeight: '600' },
  bookingId: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' },
});

const AIAgentScreen: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] ?? 'there'}! 👋 I'm your KevellMotor's AI assistant. I can help you book services, track your vehicle, check subscriptions, and much more. What can I help you with today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const res = await agentAPI.chat(updatedMessages);
      const reply: ChatMessage = { role: 'assistant', content: res.data.reply || res.data.message || 'I received your message.' };
      setMessages((prev) => [...prev, reply]);
      setSuggestions(res.data.suggestions || []);
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an issue. Please try again shortly.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [messages, loading, scrollToBottom]);

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat cleared. How can I help you, ${user?.name?.split(' ')[0] ?? 'there'}?`,
    }]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header
        title="KEMO - AI Booking Agent"
        subtitle="Powered by Kevell Motors AI"
        right={
          <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={loading ? <TypingDots /> : null}
          showsVerticalScrollIndicator={false}
        />

        {/* Dynamic Suggestions */}
        {suggestions.length > 0 && !loading && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(_, i) => String(i)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionChip} onPress={() => sendMessage(item)}>
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Initial Suggestions (only if no suggestions from backend yet) */}
        {messages.length < 3 && suggestions.length === 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Quick suggestions</Text>
            <FlatList
              data={SUGGESTIONS}
              keyExtractor={(_, i) => String(i)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionChip} onPress={() => sendMessage(item)}>
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.inputField}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about your EV service…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Send size={16} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  msgList: { paddingTop: 16, paddingBottom: 8 },
  clearBtn: { backgroundColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  clearBtnText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  suggestionsContainer: { paddingHorizontal: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  suggestionsLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 8, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  suggestionsList: { gap: 8 },
  suggestionChip: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  suggestionText: { color: Colors.textSecondary, fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, gap: 10,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  inputField: {
    flex: 1, backgroundColor: Colors.bgInput,
    color: Colors.textPrimary,
    borderRadius: 22, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});

export default AIAgentScreen;
