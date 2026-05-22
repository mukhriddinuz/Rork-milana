import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { usePathname } from 'expo-router';
import { Sparkles, X, Send } from 'lucide-react-native';
import { FontFamily } from '@/constants/typography';
import { useProducts } from '@/contexts/ProductsContext';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL;
const SECRET_KEY = process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY;
const MODEL_ID = 'anthropic/claude-haiku-4.5';

const VISIBLE_ROUTES = ['/', '/catalog', '/favorites'];

const SYSTEM_PROMPT_BASE = `You are the MILANA AI Stylist — a polite, articulate, professional fashion consultant for a luxury Uzbek e-commerce house. 

Tone: warm, concise, elegant. Never use exclamation points or emoji. Speak like a trusted personal shopper in a Milanese atelier — short paragraphs, never more than 4 sentences per reply unless the client explicitly asks for detail.

You help with: 
- Outfit and silhouette recommendations
- Sizing guidance (ask for height/weight/usual size if needed; cite typical EU/Uzbek conventions)
- Style pairing (colour, fabric, occasion, season)
- Product suggestions strictly from the MILANA catalogue listed below

Rules:
- If a client asks for something not in the catalogue, suggest the closest in-catalogue alternative.
- Reference items by their model number (e.g. "M-204") when recommending.
- Never quote prices unless the client asks.
- Reply in the language the client writes in (Russian, Uzbek, or English).
- Decline politely and redirect to fashion if asked anything off-topic.`;

function buildSystemPrompt(catalogue: string): string {
  return `${SYSTEM_PROMPT_BASE}\n\nCurrent MILANA catalogue (partial):\n${catalogue}`;
}

export default function AIStylistChat() {
  const pathname = usePathname();
  const { products } = useProducts();
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Welcome to MILANA. I am your personal AI stylist. Tell me the occasion, your usual size, or a piece you already love — and I will curate the rest.',
    },
  ]);

  const scrollRef = useRef<ScrollView | null>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const visible = useMemo<boolean>(() => {
    if (!pathname) return false;
    return VISIBLE_ROUTES.some((r) => pathname === r || pathname.endsWith(r));
  }, [pathname]);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: open ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, slide]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const catalogueSnippet = useMemo<string>(() => {
    return products
      .slice(0, 40)
      .map((p) => {
        const audience = p.targetAudience ? ` [${p.targetAudience}]` : '';
        const desc = p.description ? ` — ${p.description.slice(0, 80)}` : '';
        return `• ${p.modelNumber} (${p.category})${audience}${desc}`;
      })
      .join('\n');
  }, [products]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!TOOLKIT_URL || !SECRET_KEY) {
      setMessages((prev) => [
        ...prev,
        { id: `u_${Date.now()}`, role: 'user', content: text },
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: 'The stylist service is not yet configured. Please contact support.',
        },
      ]);
      setInput('');
      return;
    }

    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const apiMessages: ApiMessage[] = [
        { role: 'system', content: buildSystemPrompt(catalogueSnippet) },
        ...nextMessages.map<ApiMessage>((m) => ({ role: m.role, content: m.content })),
      ];

      const res = await fetch(`${TOOLKIT_URL}/v2/vercel/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SECRET_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: apiMessages,
          temperature: 0.6,
          max_tokens: 400,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
      }

      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = data?.choices?.[0]?.message?.content?.trim() ?? '';

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: reply || 'I apologise — could you rephrase that?',
        },
      ]);
    } catch (err) {
      console.error('[AIStylist] send failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: 'Apologies — the stylist is briefly unavailable. Please try again in a moment.',
        },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [input, sending, messages, catalogueSnippet]);

  if (!visible && !open) return null;

  const panelTranslate = slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const panelOpacity = slide;
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <>
      {!open && (
        <View pointerEvents="box-none" style={styles.fabWrap}>
          <Animated.View
            pointerEvents="none"
            style={[styles.fabHalo, { transform: [{ scale: haloScale }], opacity: haloOpacity }]}
          />
          <Pressable
            onPress={() => setOpen(true)}
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
            accessibilityLabel="Open AI Stylist"
            testID="ai-stylist-fab"
          >
            <Sparkles size={20} color="#F5EFE3" strokeWidth={1.4} />
          </Pressable>
        </View>
      )}

      {open && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <Animated.View
            style={[
              styles.panel,
              { opacity: panelOpacity, transform: [{ translateY: panelTranslate }] },
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.flex}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIcon}>
                    <Sparkles size={14} color="#0B0B0B" strokeWidth={1.4} />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>MILANA STYLIST</Text>
                    <Text style={styles.headerSub}>Personal AI consultant</Text>
                  </View>
                </View>
                <Pressable onPress={() => setOpen(false)} hitSlop={12} testID="ai-stylist-close">
                  <X size={20} color="#0B0B0B" strokeWidth={1.4} />
                </Pressable>
              </View>

              <View style={styles.divider} />

              <ScrollView
                ref={scrollRef}
                style={styles.flex}
                contentContainerStyle={styles.thread}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                keyboardShouldPersistTaps="handled"
              >
                {messages.map((m) => (
                  <View
                    key={m.id}
                    style={[styles.bubbleRow, m.role === 'user' ? styles.rowRight : styles.rowLeft]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          m.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                        ]}
                      >
                        {m.content}
                      </Text>
                    </View>
                  </View>
                ))}
                {sending && (
                  <View style={[styles.bubbleRow, styles.rowLeft]}>
                    <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                      <ActivityIndicator size="small" color="#7A7A7A" />
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.divider} />

              <View style={styles.inputRow}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask the stylist…"
                  placeholderTextColor="#A8A8A8"
                  style={styles.input}
                  multiline
                  maxLength={500}
                  onSubmitEditing={send}
                  blurOnSubmit={false}
                  editable={!sending}
                  testID="ai-stylist-input"
                />
                <Pressable
                  onPress={send}
                  disabled={sending || !input.trim()}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    (sending || !input.trim()) && styles.sendBtnDisabled,
                    pressed && styles.sendBtnPressed,
                  ]}
                  testID="ai-stylist-send"
                >
                  <Send size={16} color="#F5EFE3" strokeWidth={1.6} />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fabWrap: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'web' ? 28 : 96,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
  },
  fabHalo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4B98C',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D4B98C',
  },
  fabPressed: { transform: [{ scale: 0.96 }] },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,11,0.35)',
  },
  panel: {
    position: 'absolute',
    right: Platform.OS === 'web' ? 20 : 12,
    left: Platform.OS === 'web' ? undefined : 12,
    bottom: Platform.OS === 'web' ? 28 : 24,
    width: Platform.OS === 'web' ? 380 : undefined,
    height: Platform.OS === 'web' ? 560 : '78%',
    maxHeight: 640,
    backgroundColor: '#FBF8F2',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DFCB',
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0E6D2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D4B98C',
  },
  headerTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 2,
    color: '#0B0B0B',
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#8A8275',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8DFCB' },
  thread: { padding: 16, gap: 10 },
  bubbleRow: { flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EADFC9',
  },
  bubbleUser: {
    backgroundColor: '#0B0B0B',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontFamily: FontFamily.regular,
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTextAssistant: { color: '#0B0B0B' },
  bubbleTextUser: { color: '#F5EFE3' },
  typingBubble: { paddingHorizontal: 18, paddingVertical: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: '#0B0B0B',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DFCB',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnPressed: { transform: [{ scale: 0.95 }] },
});
