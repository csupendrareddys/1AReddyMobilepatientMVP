import React, { useReducer, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import EmptyState from '../../src/components/EmptyState';
import TabHeader from '../../src/components/TabHeader';
import PersonSelector from '../../src/components/PersonSelector';
import ViewSwitcher, { ViewMode4 } from '../../src/components/ViewSwitcher';
import ItemViews from '../../src/components/ItemViews';
import {
  bookingsForView, categoriesInView, VIEW_ORDER, VIEW_TITLE, viewCount, ViewKey, UnifiedBooking,
} from '../../src/data/bookingViews';
import { peopleFor, SELF_ID } from '../../src/data/people';
import { channelForProduct, effectiveComms } from '../../src/data/channels';
import { ProductKind } from '../../src/data/checkout';
import { grantRecordsAccess } from '../../src/data/recordsAccess';
import AppModal from '../../src/components/AppModal';
import PrimaryButton from '../../src/components/PrimaryButton';
import { colors, radius, typography } from '../../src/theme/theme';

const ALL = 'all';

const STATUS_ICON: Record<ViewKey, keyof typeof Ionicons.glyphMap> = {
  pending: 'time-outline',
  upcoming: 'calendar-outline',
  in_progress: 'hourglass-outline',
  free_followup: 'chatbubble-ellipses-outline',
  completed: 'checkmark-done-outline',
  second_opinion: 'medical-outline',
  cancelled: 'close-circle-outline',
};

const STATUS_TINT: Record<ViewKey, string> = {
  pending: colors.warningDark,
  upcoming: colors.primary,
  in_progress: colors.warning,
  free_followup: colors.secondary,
  completed: colors.success,
  second_opinion: colors.secondary,
  cancelled: colors.textMuted,
};

/**
 * My Bookings — every product the patient has bought, on one screen.
 *
 * Two axes, deliberately kept apart: **status** (what stage it's at) as the
 * sub-heads, and **category** (what kind of product) as a filter that defaults
 * to All. Folding them together is what made the old two-mode screen
 * confusing — the same booking appeared or vanished depending on which mode
 * you happened to have left it in.
 */
export default function MyBookingsScreen() {
  const router = useRouter();
  // The dashboard tiles deep-link straight to a status, so arriving here
  // already shows what was tapped.
  const params = useLocalSearchParams<{ view?: string; category?: string; detail?: string }>();

  // In progress is where care actually is, so it's the useful landing stage.
  const [view, setView] = useState<ViewKey>(
    (VIEW_ORDER.includes(params.view as ViewKey) ? params.view : 'in_progress') as ViewKey,
  );
  const [category, setCategory] = useState<string>(params.category ?? ALL);
  const [mode, setMode] = useState<ViewMode4>('list');
  // The row asking to share records, held while its consent sheet is open.
  const [grantFor, setGrantFor] = useState<{ id: string; title: string; owner: string } | null>(null);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const people = peopleFor({ includeMinors: true, includeLinked: true, module: 'appt_upcoming' });
  const [personId, setPersonId] = useState(SELF_ID);

  const all = bookingsForView(view);
  const cats = categoriesInView(view);
  // A category with nothing in the newly-selected status shouldn't leave the
  // patient staring at an empty list — fall back to All.
  const activeCat = category !== ALL && cats.some((c) => c.key === category) ? category : ALL;
  const rows = activeCat === ALL ? all : all.filter((r) => r.categoryKey === activeCat);

  /** One place builds the detail route, however the booking was reached. */
  const openDetail = (r: UnifiedBooking) => (
    r.kindLabel === 'Second Opinion'
      ? router.push('/more/family-doctor' as never)
      : router.push({
        pathname: '/booking-detail',
        params: {
      kind: kindOf(r.kindLabel),
      name: r.title,
      provider: r.subtitle,
      patient: r.ownerName,
      date: r.meta,
      status: r.rejected ? 'rejected'
        : view === 'pending' ? 'pending'
          : view === 'upcoming' ? 'confirmed'
            : view === 'in_progress' ? 'in_progress'
              : view === 'cancelled' ? 'cancelled' : 'completed',
      completedOn: r.completedOn ?? '',
      awaiting: r.awaiting ?? '',
      bookedBy: r.raisedBy ?? (r.ownerKind === 'self' ? '' : 'You, on their behalf'),
      amount: String(r.paidAmount ?? 0),
      paid: 'true',
      records: String(r.recordsShared),
      consultType: r.kindLabel === 'Consultation' ? 'video' : '',
      slotMinutes: r.slotMinutes ? String(r.slotMinutes) : '',
          ref: r.id.toUpperCase(),
        },
      } as never)
  );

  /**
   * A card tapped on the dashboard lands here with `detail=<id>`: the list
   * mounts on the right head, then the booking's page opens on top of it — so
   * Back returns to My Bookings, not to the home screen the tap came from.
   */
  const openedDetail = useRef<string | null>(null);
  useEffect(() => {
    const id = params.detail;
    if (!id || openedDetail.current === id) return;
    const r = bookingsForView(view).find((x) => x.id === id);
    if (!r) return;
    openedDetail.current = id;
    openDetail(r);
  }, [params.detail, view]);

  // The same resolution the detail screen uses, so a row can advertise exactly
  // what opening it will offer.
  const kindOf = (label: string): ProductKind => (
    label === 'Consultation' ? 'appointment'
      : label === 'Recovery Plan' ? 'recovery_plan' : 'advanced_plan'
  );
  const capsFor = (title: string, label: string, provider: string, slot?: number) => {
    const ch = channelForProduct(kindOf(label), title, provider, slot);
    if (!ch || view !== 'in_progress') return undefined;
    const c = effectiveComms(ch);
    return { chat: c.chat, voice: c.audio, video: c.video, files: c.documents };
  };

  // The stage rail centres whatever is selected, so the chosen stage always
  // sits in the same place with its neighbours visible either side — the point
  // being that a patient can see there are five stages, not just the two that
  // happen to fit.
  const railRef = useRef<ScrollView>(null);
  const chipAt = useRef<Record<string, { x: number; w: number }>>({});
  const [railW, setRailW] = useState(0);
  // Chip positions arrive from onLayout, which runs *after* the first render.
  // Without a signal that they've landed, the centring effect fires against an
  // empty map and the rail never moves.
  const [measured, setMeasured] = useState(0);
  // Where each stage has to sit for its chip to land dead centre.
  const centreOf = (v: ViewKey) => {
    const l = chipAt.current[v];
    if (!l || !railW) return 0;
    return Math.max(0, l.x + l.w / 2 - railW / 2);
  };
  const offsets = railW ? VIEW_ORDER.map(centreOf) : [];
  // What the rail is already showing, so the centring effect doesn't fight a
  // scroll the user just finished.
  const atOffset = useRef(-1);

  useEffect(() => {
    if (!railW || !chipAt.current[view]) return;
    const x = centreOf(view);
    if (Math.abs(atOffset.current - x) < 2) return;
    atOffset.current = x;
    railRef.current?.scrollTo({ x, y: 0, animated: true });
  }, [view, railW, measured]);

  // Momentum-end doesn't fire for trackpad or wheel scrolling, so settling is
  // detected from the scroll stream itself rather than trusting one event.
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Sliding the rail is a way of choosing — whatever lands in the middle wins. */
  const pickNearest = (x: number) => {
    if (!offsets.length) return;
    atOffset.current = x;
    let best = 0;
    offsets.forEach((o, i) => {
      if (Math.abs(o - x) < Math.abs(offsets[best] - x)) best = i;
    });
    const next = VIEW_ORDER[best];
    if (next !== view) setView(next);
  };

  const at = VIEW_ORDER.indexOf(view);
  const prevView = at > 0 ? VIEW_ORDER[at - 1] : null;
  const nextView = at < VIEW_ORDER.length - 1 ? VIEW_ORDER[at + 1] : null;

  return (
    <ScreenWrapper>
      <TabHeader
        title="My Bookings"
        actions={[{ icon: 'sparkles-outline', label: 'Ask Agent', route: '/agent' }]}
      />

      <PersonSelector people={people} value={personId} onChange={setPersonId} />

      {/* ── Status sub-heads ─────────────────────────────────────── */}
      <ScrollView
        ref={railRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.statusRow,
          // Without slack at both ends the first and last stage clamp against
          // the edge and can never reach the middle like the others do.
          railW ? { paddingHorizontal: Math.max(4, railW / 2 - 72) } : null,
        ]}
        onLayout={(e) => setRailW(e.nativeEvent.layout.width)}
        snapToOffsets={offsets.length ? offsets : undefined}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e) => {
          const { x } = e.nativeEvent.contentOffset;
          if (settle.current) clearTimeout(settle.current);
          settle.current = setTimeout(() => pickNearest(x), 120);
        }}
        onMomentumScrollEnd={(e) => pickNearest(e.nativeEvent.contentOffset.x)}
        onScrollEndDrag={(e) => pickNearest(e.nativeEvent.contentOffset.x)}
      >
        {VIEW_ORDER.map((v) => {
          const active = view === v;
          return (
            <TouchableOpacity
              key={v}
              onPress={() => setView(v)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                const seen = chipAt.current[v];
                chipAt.current[v] = { x, w: width };
                if (!seen || seen.x !== x) setMeasured((n) => n + 1);
              }}
              style={[
                styles.statusChip,
                active && { backgroundColor: STATUS_TINT[v], borderColor: STATUS_TINT[v] },
              ]}
            >
              <Ionicons
                name={STATUS_ICON[v]}
                size={14}
                color={active ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.statusText, active && styles.statusTextActive]}>
                {VIEW_TITLE[v]}
              </Text>
              <View style={[styles.statusCount, active && styles.statusCountActive]}>
                <Text style={[styles.statusCountText, active && styles.statusCountTextActive]}>
                  {viewCount(v)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.railFoot}>
        {VIEW_ORDER.map((v) => (
          <View
            key={v}
            style={[
              styles.railDot,
              view === v && [styles.railDotOn, { backgroundColor: STATUS_TINT[v] }],
            ]}
          />
        ))}
        <Text style={styles.railHint}>
          Stage {at + 1} of {VIEW_ORDER.length} · slide to change
        </Text>
      </View>

      {/* ── Category filter, All by default ──────────────────────── */}
      {cats.length ? (
        <>
          <Text style={[typography.label, styles.filterLabel]}>FILTER BY CATEGORY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            <TouchableOpacity
              onPress={() => setCategory(ALL)}
              style={[styles.cat, activeCat === ALL && styles.catActive]}
            >
              <Ionicons
                name="albums-outline"
                size={13}
                color={activeCat === ALL ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.catText, activeCat === ALL && styles.catTextActive]}>All</Text>
              <View style={[styles.catCount, activeCat === ALL && styles.catCountActive]}>
                <Text style={[styles.catCountText, activeCat === ALL && styles.catCountTextActive]}>
                  {all.length}
                </Text>
              </View>
            </TouchableOpacity>

            {cats.map((c) => {
              const active = activeCat === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setCategory(active ? ALL : c.key)}
                  style={[styles.cat, active && styles.catActive]}
                >
                  <Text style={[styles.catText, active && styles.catTextActive]}>{c.label}</Text>
                  <View style={[styles.catCount, active && styles.catCountActive]}>
                    <Text style={[styles.catCountText, active && styles.catCountTextActive]}>
                      {c.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <ViewSwitcher
        mode={mode}
        onChange={setMode}
        hint={mode === 'slide'
          ? 'Swipe · auto every 24s'
          : `${rows.length} of ${all.length} ${VIEW_TITLE[view].toLowerCase()}`}
      />

      {rows.length ? (
        <ItemViews
          mode={mode}
          intervalSec={24}
          showPrice={false}
          tableTypeLabel="Product"
          items={rows.map((r) => ({
            id: r.id,
            title: r.title,
            subtitle: r.subtitle,
            meta: r.meta,
            badge: r.rejected ? 'Cancelled' : r.kindLabel,
            // Whose booking it is matters more at a glance on a shared
            // household account than what type of product it is.
            // What's holding this up matters more than whose it is, so it
            // takes the note line when both would apply.
            note: r.rejected ? 'Declined — refund available'
              : r.awaiting === 'provider' ? 'Waiting for provider to accept'
                : r.awaiting === 'payment'
                  ? `Payment pending${r.raisedBy ? ` · raised by ${r.raisedBy}` : ''}`
                  : r.ownerKind === 'self' ? undefined : `For ${r.ownerName}`,
            noteIcon: r.rejected ? 'close-circle-outline'
              : r.awaiting ? 'time-outline'
                : r.ownerKind === 'minor' ? 'happy-outline' : 'people-outline',
            // A status note carries a status colour, whatever the product is.
            noteTint: r.rejected ? colors.error
              : r.awaiting ? colors.warningDark : undefined,
            price: null,
            icon: r.icon,
            tint: r.tint,
            caps: capsFor(r.title, r.kindLabel, r.subtitle, r.slotMinutes),
            // The booking flow's "No, skip" isn't final — any list, any head,
            // can grant the provider access from right here.
            action: r.recordsShared ? undefined
              : { label: 'Give records access', icon: 'shield-outline' as const },
          }))}
          onAction={(id) => {
            const r = rows.find((x) => x.id === id);
            if (r) setGrantFor({ id: r.id, title: `${r.title} · ${r.subtitle}`, owner: r.ownerName });
          }}
          onPress={(id) => {
            const r = rows.find((x) => x.id === id);
            if (r) openDetail(r);
          }}
        />
      ) : (
        <EmptyState
          icon={STATUS_ICON[view]}
          title={activeCat === ALL
            ? `Nothing ${VIEW_TITLE[view].toLowerCase()}`
            : `Nothing ${VIEW_TITLE[view].toLowerCase()} in this category`}
          subtitle={activeCat === ALL
            ? 'Book something from Find Care to see it here.'
            : 'Clear the filter to see everything at this stage.'}
        />
      )}

      {/* Step through the stages in order rather than forcing a trip back up
          to the chips. */}
      <View style={styles.pager}>
        {prevView ? (
          <TouchableOpacity style={styles.pagerBtn} onPress={() => setView(prevView)} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={16} color={colors.primary} />
            <View>
              <Text style={styles.pagerHint}>Previous</Text>
              <Text style={styles.pagerLabel} numberOfLines={1}>{VIEW_TITLE[prevView]}</Text>
            </View>
          </TouchableOpacity>
        ) : <View style={styles.pagerSpacer} />}

        {nextView ? (
          <TouchableOpacity
            style={[styles.pagerBtn, styles.pagerBtnEnd]}
            onPress={() => setView(nextView)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={[styles.pagerHint, styles.pagerTextEnd]}>Next</Text>
              <Text style={[styles.pagerLabel, styles.pagerTextEnd]} numberOfLines={1}>
                {VIEW_TITLE[nextView]}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : <View style={styles.pagerSpacer} />}
      </View>
    {/* Granting access is consent, so it gets a sheet that says exactly
          what it covers — not a silent toggle. */}
      <AppModal
        visible={!!grantFor}
        onClose={() => setGrantFor(null)}
        title="Share health records?"
      >
        <Text style={typography.body}>
          Give the provider on{' '}
          <Text style={{ fontWeight: '700' }}>{grantFor?.title}</Text> access to{' '}
          {grantFor?.owner === 'Rohit Reddy' ? 'your' : `${grantFor?.owner}'s`} health
          records — vitals, habits &amp; lifestyle, surgeries, health records and
          previous prescriptions.
        </Text>
        <Text style={[typography.caption, { marginTop: 10 }]}>
          For this booking only. You can withdraw it any time from the booking's page.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <PrimaryButton
            label="Not now"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => setGrantFor(null)}
          />
          <PrimaryButton
            label="Give access"
            style={{ flex: 1 }}
            onPress={() => {
              if (grantFor) grantRecordsAccess(grantFor.id);
              setGrantFor(null);
              bump();
            }}
          />
        </View>
      </AppModal>
      </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Half a screen of padding at each end lets the first and last stage reach
  // the centre like every other one.
  statusRow: { gap: 8, paddingBottom: 10, paddingHorizontal: 4 },
  railFoot: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  railDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
  railDotOn: { width: 16 },
  railHint: { fontSize: 10.5, fontWeight: '600', color: colors.textMuted, marginLeft: 6 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  statusText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  statusTextActive: { color: colors.white },
  statusCount: {
    minWidth: 20, paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 10, backgroundColor: colors.background, alignItems: 'center',
  },
  statusCountActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  statusCountText: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
  statusCountTextActive: { color: colors.white },

  filterLabel: { marginBottom: 8 },
  catRow: { gap: 7, paddingBottom: 14 },
  cat: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  catActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  catText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  catTextActive: { color: colors.white },
  catCount: {
    minWidth: 18, paddingHorizontal: 5, borderRadius: 9,
    backgroundColor: colors.background, alignItems: 'center',
  },
  catCountActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  catCountText: { fontSize: 10.5, fontWeight: '800', color: colors.textSecondary },
  catCountTextActive: { color: colors.white },

  pager: {
    flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between',
    gap: 10, marginTop: 20,
  },
  pagerSpacer: { flex: 1 },
  pagerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pagerBtnEnd: { justifyContent: 'flex-end' },
  pagerHint: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  pagerLabel: { fontSize: 13, fontWeight: '600', color: colors.primary, marginTop: 1 },
  pagerTextEnd: { textAlign: 'right' },
});
