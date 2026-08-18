import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appointments, consultChat, doctors, ChatMessage } from '../../src/data/mock';
import { colors, radius } from '../../src/theme/theme';

const mmss = (total: number) => {
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function ConsultationRoomScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const router = useRouter();
  const appt = appointments.find((a) => a.id === appointmentId) ?? appointments[0];
  const doctor = doctors.find((d) => d.id === appt.doctor_id) ?? doctors[0];

  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(consultChat);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  // Simulated connect + call timer. No signalling, no media — this is a design
  // surface only, so the states are driven locally.
  useEffect(() => {
    const t = setTimeout(() => setConnected(true), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [connected]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, {
      id: `local-${m.length}`,
      from: 'me',
      text,
      time: mmss(seconds),
    }]);
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          {/* Leaving the call shouldn't require ending it — this backs out and
              keeps the appointment as it was. */}
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/appointments'))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Leave call"
          >
            <Ionicons name="chevron-down" size={22} color={colors.white} />
          </TouchableOpacity>
          <Image source={{ uri: doctor.profile_image }} style={styles.headerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>{doctor.full_name}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, connected ? styles.dotLive : styles.dotWaiting]} />
              <Text style={styles.headerMeta}>
                {connected ? `In call · ${mmss(seconds)}` : 'Connecting…'}
              </Text>
            </View>
          </View>
          <Text style={styles.roomId}>#{appt.id.toUpperCase()}</Text>
        </View>

        {/* Stage */}
        <View style={styles.stage}>
          <View style={styles.remote}>
            {connected ? (
              <>
                <Image source={{ uri: doctor.profile_image }} style={styles.remoteImage} blurRadius={1} />
                <Text style={styles.remoteLabel}>{doctor.full_name}</Text>
              </>
            ) : (
              <View style={styles.connecting}>
                <Image source={{ uri: doctor.profile_image }} style={styles.connectingAvatar} />
                <Text style={styles.connectingText}>Connecting to {doctor.full_name}…</Text>
              </View>
            )}

            {/* Mirrored self-view, as in the reference call rooms. */}
            <View style={styles.pip}>
              {camOn ? (
                <Image
                  source={{ uri: 'https://i.pravatar.cc/300?img=59' }}
                  style={styles.pipImage}
                />
              ) : (
                <View style={styles.pipOff}>
                  <Ionicons name="videocam-off" size={20} color={colors.white} />
                </View>
              )}
              <Text style={styles.pipLabel}>{micOn ? 'You' : 'You (Muted)'}</Text>
            </View>
          </View>

          {chatOpen ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.chatPanel}
            >
              <View style={styles.chatHeader}>
                <Text style={styles.chatTitle}>In-call chat</Text>
                <TouchableOpacity onPress={() => setChatOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(m) => m.id}
                contentContainerStyle={styles.chatList}
                renderItem={({ item }) => (
                  <View style={[styles.bubbleWrap, item.from === 'me' && styles.bubbleWrapMe]}>
                    <View style={[styles.bubble, item.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                      <Text style={item.from === 'me' ? styles.bubbleTextMe : styles.bubbleTextThem}>
                        {item.text}
                      </Text>
                    </View>
                    <Text style={styles.bubbleTime}>{item.time}</Text>
                  </View>
                )}
              />
              <View style={styles.chatInputRow}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Type a message"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  style={styles.chatInput}
                  onSubmitEditing={send}
                  returnKeyType="send"
                />
                <TouchableOpacity style={styles.sendBtn} onPress={send}>
                  <Ionicons name="send" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : null}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <CtrlButton
            icon={micOn ? 'mic' : 'mic-off'}
            active={!micOn}
            onPress={() => setMicOn((v) => !v)}
          />
          <CtrlButton
            icon={camOn ? 'videocam' : 'videocam-off'}
            active={!camOn}
            onPress={() => setCamOn((v) => !v)}
          />
          <CtrlButton
            icon="chatbubble-ellipses"
            active={chatOpen}
            activeTone={colors.primary}
            onPress={() => setChatOpen((v) => !v)}
          />
          <TouchableOpacity
            style={styles.endBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/appointments'))}
          >
            <Ionicons name="call" size={22} color={colors.white} style={styles.endIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function CtrlButton({
  icon, active, onPress, activeTone = '#c62828',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
  activeTone?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.ctrl, active && { backgroundColor: activeTone }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={22} color={colors.white} />
    </TouchableOpacity>
  );
}

const DARK = '#0d1b2a';
const PANEL = '#16273a';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerName: { color: colors.white, fontSize: 15, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotLive: { backgroundColor: '#4ade80' },
  dotWaiting: { backgroundColor: '#fbbf24' },
  headerMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  roomId: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },

  stage: { flex: 1, flexDirection: 'row', paddingHorizontal: 12, gap: 10 },
  remote: { flex: 1, borderRadius: radius.lg, backgroundColor: PANEL, overflow: 'hidden' },
  remoteImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  remoteLabel: {
    position: 'absolute', left: 12, bottom: 12, color: colors.white, fontSize: 12, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
  },
  connecting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  connectingAvatar: { width: 96, height: 96, borderRadius: 48, opacity: 0.85 },
  connectingText: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  pip: { position: 'absolute', right: 12, top: 12, width: 96, height: 132, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#22384f' },
  // Mirror the self-view so it reads like a mirror, not a camera.
  pipImage: { width: '100%', height: '100%', transform: [{ scaleX: -1 }] },
  pipOff: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pipLabel: { position: 'absolute', bottom: 6, left: 6, color: colors.white, fontSize: 10, fontWeight: '600' },

  chatPanel: { width: 260, backgroundColor: PANEL, borderRadius: radius.lg, overflow: 'hidden' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  chatTitle: { color: colors.white, fontWeight: '700', fontSize: 13 },
  chatList: { padding: 10, gap: 10 },
  bubbleWrap: { alignItems: 'flex-start', maxWidth: '92%' },
  bubbleWrapMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.md },
  bubbleThem: { backgroundColor: '#24405c', borderTopLeftRadius: 4 },
  bubbleMe: { backgroundColor: colors.primary, borderTopRightRadius: 4 },
  bubbleTextThem: { color: 'rgba(255,255,255,0.92)', fontSize: 12.5, lineHeight: 18 },
  bubbleTextMe: { color: colors.white, fontSize: 12.5, lineHeight: 18 },
  bubbleTime: { color: 'rgba(255,255,255,0.4)', fontSize: 9.5, marginTop: 3 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  chatInput: {
    flex: 1, backgroundColor: '#22384f', borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 9, color: colors.white, fontSize: 12.5,
  },
  sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 18 },
  ctrl: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#22384f', alignItems: 'center', justifyContent: 'center' },
  endBtn: { width: 68, height: 52, borderRadius: 26, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' },
  endIcon: { transform: [{ rotate: '135deg' }] },
});
