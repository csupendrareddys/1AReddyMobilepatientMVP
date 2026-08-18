import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChipRowsSlider from '../src/components/ChipRowsSlider';
import {
  bookedSlots, CategoryItem, familyMembers, productCategories, symptoms, timeSlots,
} from '../src/data/mock';
import { colors, radius, typography } from '../src/theme/theme';

const inr = (v: number) => `₹${v.toLocaleString('en-IN')}`;

/**
 * Care Assistant — a scripted booking agent.
 *
 * The conversation is a deterministic state machine over the real product
 * catalogue, so every option it offers is a product the app actually sells.
 * There is no model behind it and no network call: this screen is a design of
 * the interaction, not an implementation of the assistant.
 */
type Step =
  | 'intent' | 'symptom' | 'category' | 'product'
  | 'who' | 'date' | 'time' | 'confirm' | 'done';

type ChatMsg = {
  id: number;
  from: 'agent' | 'user';
  text?: string;
  card?: 'summary' | 'booked';
};

type Draft = {
  categoryKey?: string;
  item?: CategoryItem;
  who?: string;
  date?: string;
  time?: string;
};

const CONSULT_KEYS = ['instant', 'online', 'physical', 'hybrid'];
const PLAN_KEYS = ['recovery', 'healthcare', 'advanced', 'longevity'];
const DATES = [
  'Today', 'Tomorrow', 'Wed 19 Aug', 'Thu 20 Aug', 'Fri 21 Aug', 'Sat 22 Aug',
  'Mon 24 Aug', 'Tue 25 Aug', 'Wed 26 Aug', 'Thu 27 Aug',
];

export default function AgentScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState<Step>('intent');
  const [draft, setDraft] = useState<Draft>({});
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');

  /** Queue an agent message behind a short "typing" pause. */
  const agentSay = (text: string, opts?: { card?: ChatMsg['card']; delay?: number }) => {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: nextId.current++, from: 'agent', text, card: opts?.card }]);
    }, opts?.delay ?? 600);
    timers.current.push(t);
  };

  const userSay = (text: string) =>
    setMessages((m) => [...m, { id: nextId.current++, from: 'user', text }]);

  // Opening greeting.
  useEffect(() => {
    agentSay(
      "Hi Rohit 👋 I'm your care assistant. I can find the right care and book it for you.\n\nWhat would you like to do?",
      { delay: 400 },
    );
    return () => { timers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages, typing]);

  const chipsFor = (s: Step): string[] => {
    switch (s) {
      case 'intent':
        return ['Book a consultation', 'Start a care plan', "I'm not sure"];
      case 'symptom':
        return symptoms.slice(0, 6);
      case 'category': {
        const keys = draft.categoryKey === '__plans' ? PLAN_KEYS : CONSULT_KEYS;
        return productCategories.filter((c) => keys.includes(c.key)).map((c) => c.name);
      }
      case 'product': {
        const cat = productCategories.find((c) => c.key === draft.categoryKey);
        return cat ? cat.items.map((i) => i.short_name) : [];
      }
      case 'who':
        return ['Myself', ...familyMembers.map((f) => f.name.split(' ')[0])];
      case 'date':
        return DATES;
      case 'time':
        return timeSlots;
      case 'confirm':
        return ['Confirm booking', 'Start over'];
      case 'done':
        return ['View my bookings', 'Book something else'];
      default:
        return [];
    }
  };

  const handleChoice = (choice: string) => {
    userSay(choice);

    switch (step) {
      case 'intent': {
        if (choice === 'Book a consultation') {
          setDraft({ categoryKey: undefined });
          setStep('category');
          agentSay('Great. What kind of consultation suits you?');
        } else if (choice === 'Start a care plan') {
          setDraft({ categoryKey: '__plans' });
          setStep('category');
          agentSay('Sure. Which kind of plan are you looking for?');
        } else {
          setStep('symptom');
          agentSay("No problem — tell me what's bothering you and I'll suggest something.");
        }
        return;
      }

      case 'symptom': {
        setDraft({ categoryKey: 'online' });
        setStep('product');
        agentSay(
          `Thanks. For ${choice.toLowerCase()}, an online consultation with a general physician is usually the quickest start.\n\nWhich format works for you?`,
        );
        return;
      }

      case 'category': {
        const cat = productCategories.find((c) => c.name === choice);
        if (!cat) return;
        setDraft((d) => ({ ...d, categoryKey: cat.key }));
        setStep('product');
        agentSay(`${cat.name} — here's what's available. Which one shall I book?`);
        return;
      }

      case 'product': {
        const cat = productCategories.find((c) => c.key === draft.categoryKey);
        const item = cat?.items.find((i) => i.short_name === choice);
        if (!item) return;
        setDraft((d) => ({ ...d, item }));
        setStep('who');
        agentSay(`${item.name} — ${item.price === 0 ? 'free' : inr(item.price)}.\n\nWho is this for?`);
        return;
      }

      case 'who': {
        setDraft((d) => ({ ...d, who: choice }));
        setStep('date');
        agentSay('Which day would you like?');
        return;
      }

      case 'date': {
        setDraft((d) => ({ ...d, date: choice }));
        setStep('time');
        agentSay(`Here are the free slots for ${choice.toLowerCase()}.`);
        return;
      }

      case 'time': {
        setDraft((d) => ({ ...d, time: choice }));
        setStep('confirm');
        agentSay("Here's everything — shall I go ahead?", { card: 'summary', delay: 700 });
        return;
      }

      case 'confirm': {
        if (choice === 'Confirm booking') {
          setStep('done');
          agentSay("Done — you're booked. I've added it to your bookings.", { card: 'booked', delay: 800 });
        } else {
          setDraft({});
          setStep('intent');
          agentSay("No problem, let's start again. What would you like to do?");
        }
        return;
      }

      case 'done': {
        if (choice === 'View my bookings') {
          router.replace('/(tabs)/appointments');
        } else {
          setDraft({});
          setStep('intent');
          agentSay('What would you like to book?');
        }
        return;
      }
    }
  };

  // Free text is accepted, but the agent steers back to the current question —
  // an honest scripted fallback rather than pretending to understand.
  const sendFreeText = () => {
    const text = input.trim();
    if (!text) return;
    userSay(text);
    setInput('');
    agentSay("I've noted that. To keep things quick, pick one of the options below and I'll take it from there.");
  };

  const chips = typing ? [] : chipsFor(step);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {/* Deep-linking straight to /agent leaves no history, so back must fall
            through to the dashboard rather than dispatch an unhandled GO_BACK. */}
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={16} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>Care Assistant</Text>
          <View style={styles.statusRow}>
            <View style={styles.dot} />
            <Text style={typography.caption}>{typing ? 'Typing…' : 'Online'}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView ref={scrollRef} contentContainerStyle={styles.chat} showsVerticalScrollIndicator={false}>
          {messages.map((m) => (
            <View key={m.id}>
              {m.text ? (
                <View style={[styles.bubbleWrap, m.from === 'user' && styles.bubbleWrapMe]}>
                  <View style={[styles.bubble, m.from === 'user' ? styles.bubbleMe : styles.bubbleAgent]}>
                    <Text style={m.from === 'user' ? styles.textMe : styles.textAgent}>{m.text}</Text>
                  </View>
                </View>
              ) : null}

              {m.card === 'summary' && draft.item ? (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Booking summary</Text>
                  <SummaryRow label="Service" value={draft.item.name} />
                  <SummaryRow label="For" value={draft.who ?? '—'} />
                  <SummaryRow label="When" value={`${draft.date} · ${draft.time}`} />
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryTotal}>
                    <Text style={styles.summaryTotalLabel}>Total</Text>
                    <Text style={styles.summaryTotalValue}>
                      {draft.item.price === 0 ? 'Free' : inr(draft.item.price)}
                    </Text>
                  </View>
                </View>
              ) : null}

              {m.card === 'booked' && draft.item ? (
                <View style={styles.bookedCard}>
                  <Ionicons name="checkmark-circle" size={30} color={colors.success} />
                  <Text style={styles.bookedTitle}>{draft.item.short_name}</Text>
                  <Text style={styles.bookedMeta}>
                    {draft.date} · {draft.time} · {draft.who}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}

          {typing ? (
            <View style={styles.bubbleWrap}>
              <View style={[styles.bubble, styles.bubbleAgent, styles.typingBubble]}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Quick replies. Dates and times use the same rowed sliders as the
            booking screen, so the agent offers exactly what the form does. */}
        {step === 'date' || step === 'time' ? (
          <View style={styles.sliderWrap}>
            <ChipRowsSlider
              rows={step === 'date' ? 2 : 3}
              width={step === 'date' ? 86 : 64}
              tint={step === 'date' ? colors.primary : colors.secondary}
              selected={null}
              items={chips.map((c) => ({
                key: c,
                title: c,
                disabled: step === 'time' && bookedSlots.includes(c),
              }))}
              onSelect={handleChoice}
            />
          </View>
        ) : chips.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
          >
            {chips.map((c) => (
              <TouchableOpacity key={c} style={styles.chip} onPress={() => handleChoice(c)}>
                <Text style={styles.chipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            onSubmitEditing={sendFreeText}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendFreeText}>
            <Ionicons name="send" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },

  chat: { padding: 16, gap: 10, paddingBottom: 8 },
  bubbleWrap: { alignItems: 'flex-start', maxWidth: '86%' },
  bubbleWrapMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: radius.lg },
  bubbleAgent: { backgroundColor: colors.surface, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleMe: { backgroundColor: colors.primary, borderTopRightRadius: 4 },
  textAgent: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  textMe: { fontSize: 14, color: colors.white, lineHeight: 20 },

  typingBubble: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 13 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted, opacity: 0.9 },
  typingDot2: { opacity: 0.6 },
  typingDot3: { opacity: 0.35 },

  summaryCard: {
    marginTop: 8, padding: 14, borderRadius: radius.md, gap: 7,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
  },
  summaryTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  sumLabel: { fontSize: 12.5, color: colors.textSecondary },
  sumValue: { flex: 1, fontSize: 12.5, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 3 },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },

  bookedCard: {
    marginTop: 8, padding: 16, borderRadius: radius.md, alignItems: 'center', gap: 4,
    backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#C3E6C6',
  },
  bookedTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  bookedMeta: { fontSize: 12, color: colors.textSecondary },

  chipScroll: { flexGrow: 0, maxHeight: 56 },
  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  sliderWrap: { paddingHorizontal: 16, paddingVertical: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface,
  },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.primary },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1, height: 42, borderRadius: radius.pill, backgroundColor: colors.background,
    paddingHorizontal: 14, fontSize: 14, color: colors.textPrimary,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
