import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import SectionHeader from '../../src/components/SectionHeader';
import StatTile from '../../src/components/StatTile';
import BookingStrip from '../../src/components/BookingStrip';
import TwoRowSlider from '../../src/components/TwoRowSlider';
import RecoShelf from '../../src/components/RecoShelf';
import ViewSwitcher, { ViewMode4 } from '../../src/components/ViewSwitcher';
import ItemViews from '../../src/components/ItemViews';
import { shelves } from '../../src/data/recommendations';
import { favouriteRefs } from '../../src/data/favourites';
import { caregivers } from '../../src/data/caregivers';
import { favouriteProviders } from '../../src/data/providers';
import { bookingsForView, viewBreakdown, viewCount } from '../../src/data/bookingViews';
import Card from '../../src/components/Card';
import AppDrawer from '../../src/components/AppDrawer';
import {
  appointments, currentPatient, documents, membership, notifications,
  familyScopes, minors, planBookings, prescriptions, productCategories,
  recoveryPlanOrders, secondOpinionBookings, supportStaff, wallet,
} from '../../src/data/mock';
import { grantedModules } from '../../src/data/people';
import { inr } from '../../src/data/checkout';
import { colors, radius, typography } from '../../src/theme/theme';

/** Non-booking shortcuts, shown beneath the booking categories. */
const quickActions: {
  icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; route: string;
}[] = [
  { icon: 'search-outline', label: 'Find a Doctor', sub: 'Starts-at prices', route: '/find/doctor' },
  { icon: 'business-outline', label: 'Find a Clinic', sub: 'Near you', route: '/find/clinic' },
  { icon: 'medkit-outline', label: 'Find a Hospital', sub: 'Multispeciality', route: '/find/hospital' },
  { icon: 'medical-outline', label: 'Family Doctor', sub: 'Second opinions', route: '/more/family-doctor' },
  { icon: 'headset-outline', label: 'Care Team', sub: 'Support staff', route: '/more/support-staff' },
  { icon: 'people-outline', label: 'Family', sub: 'Minors & dependents', route: '/more/family' },
  { icon: 'chatbubbles-outline', label: 'Messages', sub: 'Service chats', route: '/channels' },
  { icon: 'document-text-outline', label: 'Prescriptions', sub: 'Medicines', route: '/more/prescriptions' },
  { icon: 'card-outline', label: 'Wallet', sub: 'Balance & payments', route: '/more/wallet' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const upcoming = appointments.filter((a) => a.status === 'upcoming');
  const unread = notifications.filter((n) => !n.read).length;

  // Counts span all three product types, so "In progress" means an active plan
  // as much as an ongoing consult.
  const inProgress = recoveryPlanOrders.filter((o) => o.status === 'in_process').length
    + planBookings.filter((b) => b.status === 'active').length;
  const completed = appointments.filter((a) => a.status === 'completed').length
    + recoveryPlanOrders.filter((o) => o.status === 'completed').length
    + planBookings.filter((b) => b.status === 'completed').length;
  const secondOpinions = secondOpinionBookings.filter((b) => b.prescription).length;
  const favourites = favouriteProviders(favouriteRefs());
  const careTeam = [...supportStaff, ...caregivers()];
  const [favMode, setFavMode] = useState<ViewMode4>('slide');

  const trackTiles: {
    icon: keyof typeof Ionicons.glyphMap; label: string; sub: string;
    /** Optional chip under the tile — what the tile actually gets you. */
    tag?: string;
    count: number; tint: string; route: string;
  }[] = [
    { icon: 'calendar-outline', label: 'Upcoming', sub: 'Scheduled bookings', count: upcoming.length, tint: colors.primary, route: '/(tabs)/appointments?view=upcoming' },
    { icon: 'hourglass-outline', label: 'In Progress', sub: 'Care underway', count: inProgress, tint: colors.warning, route: '/(tabs)/appointments?view=in_progress' },
    // Finished, but the free window hasn't closed — the patient can still ask
    // the doctor something and it costs nothing. That's worth a tile of its
    // own; left inside Completed it goes unnoticed until it has expired.
    // Counted from the bookings list itself, so the tile and the head agree.
    { icon: 'chatbubble-ellipses-outline', label: 'Free Follow-up', sub: 'Ask at no cost', tag: 'Window still open', count: viewCount('free_followup'), tint: colors.secondaryDark, route: '/(tabs)/appointments?view=free_followup' },
    { icon: 'checkmark-done-outline', label: 'Completed', sub: 'Past bookings', count: completed, tint: colors.success, route: '/(tabs)/appointments?view=completed' },
    // The head says what it is; the tag says who gives it and how you reach
    // them, because "second opinion" alone doesn't tell you it's a real
    // conversation with your own doctor.
    { icon: 'medical-outline', label: 'Second Opinion', sub: 'By your family doctor', tag: 'Video · Chat · Audio', count: secondOpinions, tint: colors.secondary, route: '/more/family-doctor' },
    // Everything the doctors have written down. Routes to Records, which is
    // already the hub holding both lists, rather than picking one of them.
    { icon: 'documents-outline', label: 'Prescriptions & Documents', sub: 'Scripts, reports & files', count: prescriptions.length + documents.length, tint: colors.warningDark, route: '/(tabs)/records' },
  ];

  return (
    <ScreenWrapper>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuOpen(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={typography.bodyMuted}>Good afternoon,</Text>
          <Text style={typography.h1}>{currentPatient.full_name.split(' ')[0]}</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.bell}
            onPress={() => router.push('/more/family')}
            accessibilityLabel="Family"
          >
            <Ionicons name="people-outline" size={22} color={colors.textPrimary} />
            <View style={styles.famBadge}>
              <Text style={styles.famBadgeText}>{minors.length + familyScopes.linked.length}</Text>
            </View>
          </TouchableOpacity>
          {/* Bell with unread count — persistent entry point, as in the reference apps. */}
          <TouchableOpacity style={styles.bell} onPress={() => router.push('/more/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            {unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Image source={{ uri: currentPatient.avatar }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming and In progress open a cross-category list of exactly those
          bookings — consults, recovery plans and care plans together. */}
      <View style={styles.statsRow}>
        <StatTile
          icon="calendar-outline"
          label="Upcoming"
          value={String(upcoming.length)}
          onPress={() => router.push('/(tabs)/appointments?view=upcoming')}
        />
        <StatTile
          icon="hourglass-outline"
          label="In progress"
          value={String(inProgress)}
          tint={colors.warning}
          onPress={() => router.push('/(tabs)/appointments?view=in_progress')}
        />
        <StatTile
          icon="wallet-outline"
          label="Wallet"
          value={`₹${wallet.balance}`}
          tint={colors.secondary}
          onPress={() => router.push('/more/wallet')}
        />
      </View>

      {/* Agent sits beside the heading — an alternative to the manual tiles
          below for anyone who'd rather be guided than browse. */}
      <View style={styles.qaHeader}>
        <Text style={typography.h2}>Quick actions</Text>
        <TouchableOpacity
          style={styles.agentBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/agent')}
        >
          <Ionicons name="sparkles" size={14} color={colors.white} />
          <Text style={styles.agentBtnText}>Ask Agent</Text>
        </TouchableOpacity>
      </View>

      {/* Book Appointments — a two-row shelf that slides, so eight categories
          fit in the height of two without a wall of tiles. "See all" opens the
          same categories as a form for anyone who'd rather decide than swipe. */}
      <View style={styles.subHeadRow}>
        <Text style={[typography.label, styles.subHeadFlat]}>BOOK APPOINTMENTS</Text>
        <TouchableOpacity
          style={styles.seeAll}
          hitSlop={8}
          onPress={() => router.push('/quick-actions')}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <TwoRowSlider
        variant="tile"
        rows={3}
        intervalSec={15}
        items={productCategories.map((c) => ({
          id: c.key,
          title: c.name,
          subtitle: c.short,
          icon: c.icon,
          tint: c.tint,
        }))}
        onPress={(k) => router.push(`/book/${k}` as never)}
      />

      {/* Track your care — jump straight to a booking state or a second opinion. */}
      <Text style={[typography.label, styles.subHead]}>TRACK YOUR CARE</Text>
      <View style={styles.tileGrid}>
        {trackTiles.map((t) => (
          <TouchableOpacity
            key={t.label}
            activeOpacity={0.8}
            style={styles.tile}
            onPress={() => router.push(t.route as any)}
          >
            <View style={styles.tileTop}>
              <View style={[styles.tileIcon, { backgroundColor: `${t.tint}1A` }]}>
                <Ionicons name={t.icon} size={16} color={t.tint} />
              </View>
              {t.count > 0 ? (
                <View style={[styles.tileBadge, { backgroundColor: t.tint }]}>
                  <Text style={styles.tileBadgeText}>{t.count}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.tileLabel} numberOfLines={2}>{t.label}</Text>
            <Text style={styles.tileSub} numberOfLines={2}>{t.sub}</Text>
            {t.tag ? (
              <View style={[styles.tileTag, { backgroundColor: `${t.tint}1A` }]}>
                <Text style={[styles.tileTagText, { color: t.tint }]} numberOfLines={1}>
                  {t.tag}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* Shortcuts use the same two-row shelf as Book Appointments, so the
          two shelves read as one pattern rather than two layouts. */}
      <Text style={[typography.label, styles.subHead]}>SHORTCUTS</Text>
      <TwoRowSlider
        variant="tile"
        intervalSec={18}
        items={quickActions.map((a) => ({
          id: a.route,
          title: a.label,
          subtitle: a.sub,
          icon: a.icon,
          tint: colors.primary,
        }))}
        onPress={(route) => router.push(route as never)}
      />

      {/* Both strips read the same cross-category source as the status views,
          so a count here always matches what "See all" opens. */}
      <BookingStrip
        title="Upcoming appointments"
        subtitle="Scheduled and waiting to start"
        items={bookingsForView('upcoming')}
        emptyText="No upcoming appointments yet."
        breakdown={viewBreakdown('upcoming')}
        intervalSec={22}
        onSeeAll={() => router.push('/(tabs)/appointments?view=upcoming')}
        // Through the list, not past it: the card opens its booking page with
        // My Bookings underneath, so Back lands on the Upcoming head.
        onItemPress={(r) => router.push(`/(tabs)/appointments?view=upcoming&detail=${r.id}` as any)}
      />

      <BookingStrip
        title="In progress"
        subtitle="Care that has already begun"
        items={bookingsForView('in_progress')}
        emptyText="Nothing in progress right now."
        breakdown={viewBreakdown('in_progress')}
        intervalSec={28}
        onSeeAll={() => router.push('/(tabs)/appointments?view=in_progress')}
        onItemPress={(r) => router.push(`/(tabs)/appointments?view=in_progress&detail=${r.id}` as any)}
      />

      {/* Recommendation shelves. Each moves on its own timer and holds still
          while it's being touched. */}
      {shelves.map((sh) => <RecoShelf key={sh.key} shelf={sh} />)}

      {/* Providers the patient saved — highlighted, because it's their own
          list rather than something we suggested, and placed after the
          recommendations so the shelves read suggestion-first, saved-last. */}
      {favourites.length ? (
        <View style={styles.favShelf}>
          <View style={styles.favHead}>
            <View style={styles.favIcon}>
              <Ionicons name="heart" size={16} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.favTitle}>
                Your favourite doctor / clinic / hospital services
              </Text>
              <Text style={typography.caption}>
                {favourites.length} saved · book straight from here
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/favourites')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <ViewSwitcher
            mode={favMode}
            onChange={setFavMode}
            hint={favMode === 'slide' ? 'Swipe · auto every 26s' : `${favourites.length} saved`}
          />
          <ItemViews
            mode={favMode}
            intervalSec={26}
            tableTypeLabel="Kind"
            items={favourites.map((p) => ({
              id: `${p.kind}:${p.id}`,
              title: p.name,
              subtitle: p.headline,
              meta: `${p.solo.length + p.team.length} products · ${p.city}`,
              badge: p.kind === 'doctor' ? 'Doctor' : p.kind === 'clinic' ? 'Clinic' : 'Hospital',
              note: 'Saved by you',
              noteIcon: 'heart' as keyof typeof Ionicons.glyphMap,
              noteTint: colors.error,
              price: p.startsAt,
              icon: (p.kind === 'doctor' ? 'person-outline'
                : p.kind === 'clinic' ? 'business-outline' : 'medkit-outline') as keyof typeof Ionicons.glyphMap,
              tint: colors.error,
            }))}
            onPress={() => router.push('/favourites')}
          />
        </View>
      ) : null}


      <TouchableOpacity style={styles.discoverRow} onPress={() => router.push('/discover')}>
        <Ionicons name="grid-outline" size={15} color={colors.primary} />
        <Text style={styles.discoverText}>See every recommendation in one place</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </TouchableOpacity>

      {/* Who else's care I manage, and what each linked account lets me do. */}
      <SectionHeader
        title="Family"
        subtitle="Profiles you manage and accounts shared with you"
        actionLabel="Manage"
        onAction={() => router.push('/more/family')}
      />
      {minors.map((m) => (
        <TouchableOpacity key={m.id} activeOpacity={0.85} onPress={() => router.push('/more/family')}>
          <Card style={styles.famRow}>
            <Image source={{ uri: m.avatar }} style={styles.famAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{m.full_name}</Text>
              <Text style={typography.bodyMuted}>{m.relation} · minor · full access</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Card>
        </TouchableOpacity>
      ))}
      {familyScopes.linked.map((l) => {
        const mods = grantedModules(l.role_id);
        return (
          <TouchableOpacity key={l.id} activeOpacity={0.85} onPress={() => router.push('/more/family')}>
            <Card style={styles.famCard}>
              <View style={styles.famRow}>
                <Image source={{ uri: l.avatar }} style={styles.famAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{l.name}</Text>
                  <Text style={typography.bodyMuted}>{l.relation} · {l.role_name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
              {/* Spell out the access rather than just naming the role. */}
              <View style={styles.famChips}>
                {mods.slice(0, 4).map((m) => (
                  <View key={m.label} style={styles.famChip}>
                    <Text style={styles.famChipText}>
                      {m.label}{m.canManage ? ' ·  manage' : ''}
                    </Text>
                  </View>
                ))}
                {mods.length > 4 ? (
                  <View style={styles.famChip}>
                    <Text style={styles.famChipText}>+{mods.length - 4} more</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}

      <SectionHeader title="Your care team" actionLabel="Manage" onAction={() => router.push('/more/support-staff')} />
      <Card style={styles.careCard}>
        {careTeam.length ? (
          <>
            {careTeam.slice(0, 3).map((s) => (
              <View key={s.id} style={styles.careRow}>
                <Image source={{ uri: s.avatar }} style={styles.careAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.careName}>{s.name}</Text>
                  <Text style={typography.caption}>
                    {s.role}{s.canPay ? ' · can pay for bookings' : ''}
                  </Text>
                </View>
              </View>
            ))}
            {careTeam.length > 3 ? (
              <Text style={typography.caption}>
                +{careTeam.length - 3} more on your care team
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={typography.body}>
            No one on your care team yet. Add a coordinator, nurse or family member who
            can act for you.
          </Text>
        )}

        {/* Adding staff is the action this section exists for, so it's a
            button here and not only behind "Manage". */}
        <TouchableOpacity
          style={styles.careAddBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/more/support-staff')}
        >
          <Ionicons name="person-add-outline" size={16} color={colors.white} />
          <Text style={styles.careAddText}>Add care / support staff</Text>
        </TouchableOpacity>
      </Card>
      <AppDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  menuBtn: { marginRight: 10 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bell: { padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0, minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  qaHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  agentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: radius.pill,
  },
  agentBtnText: { color: colors.white, fontSize: 12.5, fontWeight: '700' },
  subHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 },
  subHeadFlat: { flex: 1 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  discoverRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 22, paddingVertical: 13, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
  },
  discoverText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  subHead: { marginBottom: 8 },
  // One tile design shared by "Book appointments" and "Track your care".
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  // Icon and chevron sit on their own row so the label gets the tile's full
  // width — at 393pt a side-by-side layout truncated every long category name.
  tile: {
    width: '47%', padding: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  tileIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary, lineHeight: 16 },
  tileSub: { fontSize: 10, color: colors.textMuted, marginTop: 1, lineHeight: 13 },
  tileTag: {
    alignSelf: 'flex-start', marginTop: 5,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill,
  },
  tileTagText: { fontSize: 9, fontWeight: '800' },
  tileBadge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  tileBadgeText: { fontSize: 10, fontWeight: '800', color: colors.white },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionTile: { width: '47%', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 },
  actionIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E8F1FC', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  actionSub: { fontSize: 10.5, color: colors.textMuted, marginTop: 2 },
  famBadge: {
    position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  famBadgeText: { color: colors.white, fontSize: 9.5, fontWeight: '800' },
  famCard: { marginBottom: 10, gap: 10 },
  famRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
  famAvatar: { width: 40, height: 40, borderRadius: 20 },
  famChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: -6 },
  famChip: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  famChipText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  favShelf: { marginTop: 24, marginBottom: 8, padding: 13, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.error, backgroundColor: '#FFF7F6' },
  favHead: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  favIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  favTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  careRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  careAvatar: { width: 40, height: 40, borderRadius: 20 },
  careName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  careAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 6, paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.primary,
  },
  careAddText: { fontSize: 13, fontWeight: '800', color: colors.white },
  careCard: { marginBottom: 8 },
});
