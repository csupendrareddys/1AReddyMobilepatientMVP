import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../src/components/ScreenWrapper';
import ScreenHeader from '../src/components/ScreenHeader';
import Card from '../src/components/Card';
import Badge from '../src/components/Badge';
import EmptyState from '../src/components/EmptyState';
import {
  groupedChannels, ServiceChannel, STATUS_CHIP, validityLabel,
} from '../src/data/channels';
import { colors, radius, typography } from '../src/theme/theme';

/**
 * Every conversation that came with a purchased service.
 *
 * A group service opens several channels at once — the group chat plus a
 * private leg with each provider — so those cluster under one heading rather
 * than scattering through a flat list, exactly as the web groups them by
 * `service_group_id`.
 */
export default function ChannelsScreen() {
  const router = useRouter();
  const groups = groupedChannels();

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Messages" fallback="/(tabs)" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Conversations opened by the services you&apos;ve bought. Each stays open
        for as long as the service runs.
      </Text>

      {groups.length ? groups.map((g) => (
        <View key={g.key} style={styles.group}>
          {g.heading ? (
            <View style={styles.groupHead}>
              <Ionicons name="people-circle-outline" size={16} color={colors.secondary} />
              <Text style={styles.groupTitle} numberOfLines={2}>{g.heading}</Text>
            </View>
          ) : null}
          {g.channels.map((c) => (
            <ChannelRow key={c.id} channel={c} onPress={() => router.push(`/channel/${c.id}`)} />
          ))}
        </View>
      )) : (
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          subtitle="Buy a service that includes messaging and it'll appear here."
        />
      )}
    </ScreenWrapper>
  );
}

function ChannelRow({ channel, onPress }: { channel: ServiceChannel; onPress: () => void }) {
  const chip = STATUS_CHIP[channel.status];
  const ended = channel.status !== 'active';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.row}>
        {channel.kind === 'group' ? (
          <View style={styles.groupAvatar}>
            {channel.counterparts.slice(0, 3).map((p, i) => (
              <Image
                key={p.name}
                source={{ uri: p.avatar }}
                style={[styles.stackAvatar, { left: i * 13, zIndex: 3 - i }]}
              />
            ))}
          </View>
        ) : (
          <Image source={{ uri: channel.counterparts[0].avatar }} style={styles.avatar} />
        )}

        <View style={{ flex: 1 }}>
          <View style={styles.rowTop}>
            <Text style={[typography.h3, { flex: 1 }]} numberOfLines={1}>{channel.title}</Text>
            <Text style={typography.caption}>{channel.lastTime}</Text>
          </View>
          <Text
            style={[typography.bodyMuted, ended && styles.mutedText]}
            numberOfLines={1}
          >
            {channel.lastMessage}
          </Text>
          <View style={styles.metaRow}>
            <Badge label={chip.label} tone={chip.tone === 'success' ? 'success' : 'neutral'} />
            <Text style={typography.caption}>{validityLabel(channel)}</Text>
            {channel.kind === 'group' ? (
              <Text style={typography.caption}>· {channel.counterparts.length} providers</Text>
            ) : null}
          </View>
        </View>

        {channel.unread ? (
          <View style={styles.unread}><Text style={styles.unreadText}>{channel.unread}</Text></View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 16 },
  group: { marginBottom: 10 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8, paddingHorizontal: 2 },
  groupTitle: { flex: 1, fontSize: 12, fontWeight: '800', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  groupAvatar: { width: 46, height: 46, justifyContent: 'center' },
  stackAvatar: {
    position: 'absolute', width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: colors.surface,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mutedText: { fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  unread: {
    minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { fontSize: 11.5, fontWeight: '800', color: colors.white },
});
