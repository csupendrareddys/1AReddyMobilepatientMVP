import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import Stepper from '../../src/components/Stepper';
import PrimaryButton from '../../src/components/PrimaryButton';
import PaymentPanel from '../../src/components/PaymentPanel';
import DetailsSheet from '../../src/components/DetailsSheet';
import DropdownModal from '../../src/components/DropdownModal';
import ChipRowsSlider from '../../src/components/ChipRowsSlider';
import ViewSwitcher, { ViewMode4 } from '../../src/components/ViewSwitcher';
import FilterBar from '../../src/components/FilterBar';
import {
  activeCount, emptyFilters, genderOfDoctor, genderOfName, matchesFilters,
} from '../../src/data/filters';
import MedicalRecordsShare, { emptyShare } from '../../src/components/MedicalRecordsShare';
import PersonSelector from '../../src/components/PersonSelector';
import EmptyState from '../../src/components/EmptyState';
import { findPerson, peopleFor, SELF_ID } from '../../src/data/people';
import {
  catalogueFor, CategoryType, categoryType, consultOfferingsFor, ConsultOffering,
  DEFAULT_SLOT, isMixedCategory, offeringsForSlot, PlanOffering, PlanTeam, plansFor,
  productType, SlotSize, SLOT_SIZES, startsFrom,
} from '../../src/data/bookingFlow';
import { bookedSlots, productCategories, timeSlots } from '../../src/data/mock';
import { Discount, inr, PaymentMethodKey, quoteFor, vouchersFor } from '../../src/data/checkout';
import { summarise } from '../../src/data/visitVitals';
import { colors, radius, typography } from '../../src/theme/theme';

/**
 * Booking, in the shape the category actually needs.
 *
 * Both kinds run four steps — two to choose, then records, then pay — but what
 * the first two steps ask differs completely:
 *
 *   plan          1. which plan   2. which team delivers it (and at what price)
 *   consultation  1. which doctor (for a chosen slot length)   2. day and time
 *
 * The old flow collapsed step 1 and 2 into a single review page, which worked
 * only because every product had exactly one provider at one price. A plan
 * several teams compete to deliver can't be shown that way — the choice of team
 * *is* the choice being made, and it changes what you pay.
 */

/** Three weeks of days, same rail the doctor booking uses. */
const DAYS = Array.from({ length: 21 }, (_, i) => {
  const d = new Date(2026, 7, 18 + i);
  return {
    key: `d${i}`,
    label: i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' }),
    sub: i === 0 ? '' : d.toLocaleDateString('en-GB', { month: 'short' }),
  };
});

export default function CategoryBookingScreen() {
  const { category, preselect, team: teamParam } = useLocalSearchParams<{
    category: string; preselect?: string; team?: string;
  }>();
  const router = useRouter();

  const cat = productCategories.find((c) => c.key === category);
  // The category decides how step 1 asks the question; the product the patient
  // picks decides how step 2 does. A consultation sitting inside Recovery Plans
  // is still booked as a consultation.
  const type = categoryType(category ?? '');
  const browsesPlans = type === 'plan';
  const catalogue = useMemo(() => catalogueFor(category ?? ''), [category]);
  const mixed = isMixedCategory(category ?? '');

  const [pickedType, setPickedType] = useState<CategoryType>(type);
  const [filters, setFilters] = useState(emptyFilters());
  const isPlan = pickedType === 'plan';

  const STEPS = browsesPlans
    ? ['Filters', mixed ? 'Product' : 'Plan', isPlan ? 'Team' : 'Doctor & slot', 'Records', 'Pay']
    : ['Filters', 'Doctor', 'Slot', 'Records', 'Pay'];

  // Arriving from the category browser, the choice is already made — start on
  // step 2 rather than showing the same list a second time. Arriving from a
  // provider's own page, the team is decided too, so booking one of their
  // plans starts straight at Records.
  const [step, setStep] = useState(preselect && teamParam ? 3 : preselect ? 2 : 0);
  const [mode, setMode] = useState<ViewMode4>('list');

  const people = peopleFor({ includeMinors: true, includeLinked: true, module: 'appt_booking', verb: 'manage' });
  const [personId, setPersonId] = useState(SELF_ID);
  const patient = findPerson(people, personId);

  /* Step 1 & 2 — plan branch */
  const plans = useMemo(() => (isPlan ? plansFor(category ?? '') : []), [category, isPlan]);
  const [planId, setPlanId] = useState<string | null>(preselect ?? null);
  const plan = plans.find((p) => p.id === planId) ?? null;
  const [teamId, setTeamId] = useState<string | null>(teamParam ?? null);
  const team = plan?.teams.find((t) => t.id === teamId) ?? null;

  /* Step 1 & 2 — consultation branch */
  const [slot, setSlot] = useState<SlotSize>(DEFAULT_SLOT);
  const offerings = useMemo(
    () => (browsesPlans ? [] : offeringsForSlot(category ?? '', slot))
      .filter((o) => matchesFilters(
        // The practice name carries the location, so a state filter bites on it.
        `${o.name} ${o.qualification} ${o.subCategory} ${o.practice} ${cat?.name ?? ''}`,
        genderOfDoctor(o.doctorId),
        filters,
      )),
    [category, browsesPlans, slot, filters, cat],
  );
  const [offeringId, setOfferingId] = useState<string | null>(preselect ?? null);
  // Resolve against the whole catalogue, not just the current slot filter — a
  // consultation picked from a plan list has no slot filter behind it.
  const offering = useMemo(
    () => consultOfferingsFor(category ?? '').find((o) => o.id === offeringId) ?? null,
    [category, offeringId],
  );
  const [dayIdx, setDayIdx] = useState(0);
  const [time, setTime] = useState<string | null>(null);

  /* Details popups */
  const [planInfo, setPlanInfo] = useState<PlanOffering | null>(null);
  const [teamInfo, setTeamInfo] = useState<PlanTeam | null>(null);
  const [docInfo, setDocInfo] = useState<ConsultOffering | null>(null);

  /* Steps 3 & 4 */
  const [share, setShare] = useState(emptyShare());
  const [voucherIds, setVoucherIds] = useState<string[]>([]);
  const [coupons, setCoupons] = useState<Discount[]>([]);
  const [credits, setCredits] = useState(0);
  const [method, setMethod] = useState<PaymentMethodKey>('razorpay');
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);

  const price = isPlan ? (team?.price ?? 0) : (offering?.priceFor(slot) ?? 0);
  const kind = isPlan ? 'service' : 'appointment';
  const vouchers = useMemo(() => vouchersFor(kind), [kind]);
  const quote = quoteFor({
    fee: price,
    overallDiscountPct: 5,
    vouchers: vouchers.filter((v) => voucherIds.includes(v.id)),
    coupons,
    creditsApplied: credits,
  });

  if (!cat) {
    return (
      <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
        <ScreenHeader title="Not found" />
        <EmptyState icon="help-circle-outline" title="Category not found" />
      </ScreenWrapper>
    );
  }

  const canContinue = step === 1 ? (isPlan ? !!plan : !!offering)
    : step === 2 ? (isPlan ? !!team : !!time)
      : step === 4 ? agreed : true;

  const productName = isPlan ? (plan?.name ?? cat.name) : (offering?.subCategory ?? cat.name);
  const providerName = isPlan ? (team?.name ?? '') : (offering?.name ?? '');

  /* ── Confirmation ───────────────────────────────────────────────── */
  if (done) {
    return (
      <ScreenWrapper scroll={false} contentStyle={styles.successWrap}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={34} color={colors.white} />
        </View>
        <Text style={[typography.h1, styles.center]}>
          {isPlan ? 'Sent to the team' : 'Booking confirmed'}
        </Text>
        <Text style={[typography.bodyMuted, styles.center]}>{productName}</Text>
        <Text style={[typography.bodyMuted, styles.center]}>
          {providerName}{isPlan ? '' : ` · ${DAYS[dayIdx].label} ${time ?? ''} · ${slot} min`}
        </Text>
        <Text style={[typography.bodyMuted, styles.center]}>
          {quote.total === 0 ? 'Fully covered' : `${inr(quote.total)} paid`} · for {patient.name}
        </Text>
        {isPlan ? (
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.noteText}>
              {team?.startsWithin ?? 'Starts once approved'} — your plan&apos;s term begins
              when {team?.name ?? 'the team'} accepts, not today.
            </Text>
          </View>
        ) : null}
        <PrimaryButton
          label="View booking details"
          style={styles.successBtn}
          onPress={() => router.replace({
            pathname: '/booking-detail',
            params: {
              kind: isPlan ? 'service' : 'appointment',
              name: productName,
              provider: providerName,
              patient: patient.name,
              status: isPlan ? 'pending' : 'confirmed',
              date: isPlan ? '2026-08-18' : DAYS[dayIdx].label,
              time: isPlan ? '' : (time ?? ''),
              amount: String(quote.total),
              paid: 'true',
              records: String(share.share),
              attachments: String(share.attachments.length),
              slotMinutes: String(slot),
            },
          } as never)}
        />
        <TouchableOpacity style={styles.homeLink} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeLinkText}>Back to home</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title={cat.name} />
      <Stepper steps={STEPS} current={step} onStep={setStep} canNext={canContinue} />

      <PersonSelector label="Patient" people={people} value={personId} onChange={setPersonId} />

      {/* ── Step 1 · filters ──────────────────────────────────────
          A page of its own: narrow the field before meeting it. Everything is
          optional — Skip books from the full list. */}
      {step === 0 ? (
        <>
          {/* Skip sits at the top as well as the bottom: a patient who
              doesn't want to filter shouldn't have to scroll past four
              filters to say so. */}
          <TouchableOpacity
            style={styles.topSkip}
            activeOpacity={0.8}
            onPress={() => { setFilters(emptyFilters()); setStep(1); }}
          >
            <Ionicons name="play-forward-outline" size={14} color={colors.primary} />
            <Text style={styles.topSkipText}>Skip filters — show everything</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.label}>Narrow it down first?</Text>
          <Text style={[typography.bodyMuted, styles.hint]}>
            Pick anything that applies — symptoms, a specialisation, a doctor&apos;s
            gender, the organ it concerns. Or skip and see everything.
          </Text>
          <FilterBar value={filters} onChange={setFilters} />
        </>
      ) : null}

      {/* Back on the list, the filters stay one tap away. */}
      {step === 1 && activeCount(filters) > 0 ? (
        <TouchableOpacity style={styles.filterSummary} onPress={() => setStep(0)}>
          <Ionicons name="funnel" size={13} color={colors.primary} />
          <Text style={styles.filterSummaryText}>
            {activeCount(filters)} filter{activeCount(filters) === 1 ? '' : 's'} applied — edit
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* ── Step 1 · plan category: pick a product ────────────────
          A plan category can hold consultations too — an admin adding a
          "Post-op review call" to Recovery Plans is a normal thing to do. Both
          kinds are listed here, each labelled, and picking one decides how the
          next step asks its question. */}
      {step === 1 && browsesPlans ? (
        <>
          <Text style={styles.label}>{mixed ? 'Choose what you need' : 'Choose a plan'}</Text>
          <Text style={[typography.bodyMuted, styles.hint]}>
            {mixed
              ? 'This category has plans delivered by a team over time, and one-off '
                + 'consultations. Plans ask you to choose a team next; consultations ask '
                + 'for a time.'
              : 'Each plan is delivered by several teams. Pick the plan first — you choose '
                + 'who delivers it, and at what price, on the next step.'}
          </Text>
          <ViewSwitcher
            mode={mode}
            onChange={setMode}
            modes={['list', 'grid', 'table']}
            hint={`${catalogue.length} options`}
          />
          <View style={mode === 'grid' ? styles.grid : undefined}>
            {catalogue.filter(({ item }) => {
              const plan = plans.find((x) => x.id === item.id);
              const lead = plan?.teams[0]?.members[0]?.doctorId;
              return matchesFilters(
                [item.name, item.description, cat?.name ?? '', (plan?.includes ?? []).join(' '),
                  // Teams carry their city, which is what a location filter matches.
                  (plan?.teams ?? []).map((t) => `${t.name} ${t.city}`).join(' ')].join(' '),
                lead ? genderOfDoctor(lead) : genderOfName(undefined),
                filters,
              );
            }).map(({ item, type: t }) => {
              const isConsult = t === 'consultation';
              const p = isConsult ? null : plans.find((x) => x.id === item.id);
              const o = isConsult
                ? consultOfferingsFor(category ?? '').find((x) => x.id === item.id) ?? null
                : null;
              const on = isConsult ? offeringId === item.id : planId === item.id;
              const from = p ? startsFrom(p.teams) : (o?.priceFor(DEFAULT_SLOT) ?? item.price);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    setPickedType(t);
                    if (isConsult) { setPlanId(null); setOfferingId(item.id); setTime(null); }
                    else { setOfferingId(null); setPlanId(item.id); setTeamId(null); }
                  }}
                  style={mode === 'grid' ? styles.gridCell : undefined}
                >
                  <Card style={[styles.pick, on && styles.pickOn]}>
                    <View style={styles.pickTop}>
                      <Text style={[typography.h3, { flex: 1 }]}>{item.name}</Text>
                      {on ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                    </View>
                    {mixed ? (
                      <View style={styles.badgeRow}>
                        <Badge
                          label={isConsult ? 'Consultation' : 'Plan'}
                          tone={isConsult ? 'primary' : 'warning'}
                        />
                        <Text style={typography.caption}>
                          {isConsult ? 'One appointment' : `${p?.teams.length ?? 0} teams`}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={typography.bodyMuted}>{item.description}</Text>

                    {mode !== 'table' && p ? (
                      <View style={styles.includes}>
                        {p.includes.slice(0, 3).map((line) => (
                          <View key={line} style={styles.includeRow}>
                            <Ionicons name="checkmark" size={13} color={colors.success} />
                            <Text style={styles.includeText}>{line}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {mode !== 'table' && o ? (
                      <View style={styles.freeAfter}>
                        <Text style={styles.freeAfterHead}>
                          WITH {o.name.toUpperCase()} · FREE FOR {o.freeAfter.days} DAYS AFTER
                        </Text>
                        <View style={styles.freeRow}>
                          <MiniStat icon="chatbubble-outline" label={`${o.freeAfter.messages} messages`} />
                          <MiniStat icon="call-outline" label={`${o.freeAfter.audioMin} min voice`} />
                          <MiniStat icon="videocam-outline" label={`${o.freeAfter.videoMin} min video`} />
                        </View>
                      </View>
                    ) : null}

                    <View style={styles.priceRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={typography.caption}>
                          {isConsult ? 'From' : 'Starts from'}
                        </Text>
                        <Text style={styles.price}>{inr(from)}</Text>
                        <Text style={typography.caption}>
                          {isConsult ? `${DEFAULT_SLOT} min · pick a time next` : `${p?.teams.length ?? 0} teams · ${item.meta}`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => (p ? setPlanInfo(p) : o ? setDocInfo(o) : undefined)}
                      >
                        <Ionicons name="eye-outline" size={14} color={colors.primary} />
                        <Text style={styles.detailBtnText}>View details</Text>
                      </TouchableOpacity>
                    </View>
                    {on ? (
                      <CardContinue
                        label={isConsult ? 'Continue — pick a time' : 'Continue — choose a team'}
                        onPress={() => setStep(2)}
                      />
                    ) : null}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      {/* ── Step 2 · plan: which team ─────────────────────────────── */}
      {step === 2 && isPlan && plan ? (
        <>
          <Text style={styles.label}>Who delivers {plan.name}?</Text>
          <Text style={[typography.bodyMuted, styles.hint]}>
            The plan is the same whoever you pick. What changes is the team, where
            they are, and the price.
          </Text>

          <Card style={styles.infoCard}>
            <Ionicons name="time-outline" size={17} color={colors.primary} />
            <Text style={styles.infoText}>
              Your plan runs from the day the team accepts it — not from the day you
              pay. Payment reserves your place; the term starts on approval.
            </Text>
          </Card>

          {plan.teams.map((t) => {
            const on = teamId === t.id;
            return (
              <TouchableOpacity key={t.id} activeOpacity={0.85} onPress={() => setTeamId(t.id)}>
                <Card style={[styles.pick, on && styles.pickOn]}>
                  <View style={styles.pickTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.h3}>{t.name}</Text>
                      <Text style={typography.caption}>{t.kind} · {t.city}</Text>
                    </View>
                    <View style={styles.teamPrice}>
                      <Text style={styles.price}>{inr(t.price)}</Text>
                      {on ? <Ionicons name="checkmark-circle" size={19} color={colors.primary} /> : null}
                    </View>
                  </View>

                  {t.members.map((m) => (
                    <View key={m.name} style={styles.memberRow}>
                      <Ionicons name="person-circle-outline" size={17} color={colors.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{m.name}</Text>
                        <Text style={styles.memberQual}>{m.qualification} · {m.role}</Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.priceRow}>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color={colors.warning} />
                      <Text style={styles.ratingText}>{t.rating} · {t.casesHandled} plans delivered</Text>
                    </View>
                    <TouchableOpacity style={styles.detailBtn} onPress={() => setTeamInfo(t)}>
                      <Ionicons name="eye-outline" size={14} color={colors.primary} />
                      <Text style={styles.detailBtnText}>View details</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.startsNote}>{t.startsWithin}</Text>
                  {on ? (
                    <CardContinue
                      label={`Continue with ${t.name} — ${inr(t.price)}`}
                      onPress={() => setStep(3)}
                    />
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          })}
        </>
      ) : null}

      {/* ── Step 1 · consultation: slot length, then doctor ───────── */}
      {step === 1 && !isPlan ? (
        <>
          <Text style={styles.label}>How long do you need?</Text>
          <Text style={[typography.bodyMuted, styles.hint]}>
            Longer slots cost more and not every doctor offers all three. Changing this
            changes who you can book.
          </Text>
          <View style={styles.slotRow}>
            {SLOT_SIZES.map((s) => {
              const on = slot === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.slotBtn, on && styles.slotBtnOn]}
                  onPress={() => { setSlot(s); setOfferingId(null); setTime(null); }}
                >
                  <Text style={[styles.slotBtnText, on && styles.slotBtnTextOn]}>{s} min</Text>
                  {s === DEFAULT_SLOT ? (
                    <Text style={[styles.slotHint, on && styles.slotHintOn]}>most booked</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <ViewSwitcher
            mode={mode}
            onChange={setMode}
            modes={['list', 'grid', 'table']}
            hint={`${offerings.length} doctors at ${slot} min`}
          />

          {offerings.length ? (
            <View style={mode === 'grid' ? styles.grid : undefined}>
              {offerings.map((o) => {
                const on = offeringId === o.id;
                return (
                  <TouchableOpacity
                    key={o.id}
                    activeOpacity={0.85}
                    onPress={() => { setOfferingId(o.id); setTime(null); }}
                    style={mode === 'grid' ? styles.gridCell : undefined}
                  >
                    <Card style={[styles.pick, on && styles.pickOn]}>
                      <View style={styles.pickTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={typography.h3}>{o.name}</Text>
                          <Text style={typography.caption}>{o.qualification}</Text>
                          <Text style={typography.caption}>{o.practice}</Text>
                        </View>
                        {on ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                      </View>

                      <Badge label={o.subCategory} tone="primary" />

                      {mode !== 'table' ? (
                        <View style={styles.freeAfter}>
                          <Text style={styles.freeAfterHead}>
                            FREE FOR {o.freeAfter.days} DAYS AFTER THE CALL
                          </Text>
                          <View style={styles.freeRow}>
                            <MiniStat icon="chatbubble-outline" label={`${o.freeAfter.messages} messages`} />
                            <MiniStat icon="call-outline" label={`${o.freeAfter.audioMin} min voice`} />
                            <MiniStat icon="videocam-outline" label={`${o.freeAfter.videoMin} min video`} />
                          </View>
                        </View>
                      ) : null}

                      <View style={styles.priceRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.price}>{inr(o.priceFor(slot))}</Text>
                          <Text style={typography.caption}>
                            {slot} min · consults {o.slotRange}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.detailBtn} onPress={() => setDocInfo(o)}>
                          <Ionicons name="eye-outline" size={14} color={colors.primary} />
                          <Text style={styles.detailBtnText}>View details</Text>
                        </TouchableOpacity>
                      </View>
                      {on ? (
                        <CardContinue
                          label={`Continue — pick a time · ${inr(o.priceFor(slot))}`}
                          onPress={() => setStep(2)}
                        />
                      ) : null}
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Card style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={17} color={colors.textMuted} />
              <Text style={styles.infoText}>
                No one in this category offers a {slot}-minute slot. Try another length.
              </Text>
            </Card>
          )}
        </>
      ) : null}

      {/* ── Step 2 · consultation: day and time ───────────────────── */}
      {step === 2 && !isPlan && offering ? (
        <>
          <Text style={styles.label}>{offering.name}</Text>
          <Text style={[typography.bodyMuted, styles.hint]}>
            {offering.qualification} · consults {offering.slotRange}
          </Text>

          <Card style={styles.slotCard}>
            <Text style={[typography.label, { marginBottom: 6 }]}>SLOT LENGTH</Text>
            <DropdownModal
              value={String(slot)}
              options={offering.sizes.map((s) => ({
                label: `${s} minutes · ${inr(offering.priceFor(s))}`,
                value: String(s),
              }))}
              onChange={(v) => { setSlot(Number(v) as SlotSize); setTime(null); }}
              title="Slot length"
            />
            <Text style={[typography.caption, { marginTop: 8 }]}>
              You picked {slot} min on the previous step. Changing it here changes the
              price and the times on offer.
            </Text>
          </Card>

          <Text style={styles.label}>Select a date</Text>
          <ChipRowsSlider
            items={DAYS.map((d) => ({ key: d.key, title: d.label, sub: d.sub }))}
            rows={2}
            selected={DAYS[dayIdx].key}
            onSelect={(k) => { setDayIdx(DAYS.findIndex((d) => d.key === k)); setTime(null); }}
            width={70}
          />

          <Text style={styles.label}>Available times</Text>
          <ChipRowsSlider
            items={timeSlots.map((t) => ({
              key: t,
              title: t,
              disabled: bookedSlots.includes(t),
            }))}
            rows={3}
            selected={time}
            onSelect={setTime}
            width={78}
          />
          <Text style={[typography.caption, styles.hint]}>
            Times shown are {slot}-minute slots with {offering.name}. Greyed-out times are
            already taken.
          </Text>
        </>
      ) : null}

      {/* ── Step 3 · records ──────────────────────────────────────── */}
      {step === 3 ? (
        <MedicalRecordsShare
          value={share}
          onChange={setShare}
          patientName={patient.name.split(' ')[0]}
        />
      ) : null}

      {/* ── Step 4 · pay ──────────────────────────────────────────── */}
      {step === 4 ? (
        <>
          <Text style={styles.label}>Review</Text>
          <Card style={styles.summary}>
            <SummaryRow label="Patient" value={patient.name} />
            <SummaryRow label={isPlan ? 'Plan' : 'Consultation'} value={productName} />
            <SummaryRow label={isPlan ? 'Delivered by' : 'Doctor'} value={providerName} />
            {isPlan ? (
              <SummaryRow label="Begins" value={team?.startsWithin ?? '—'} />
            ) : (
              <>
                <SummaryRow label="Date" value={DAYS[dayIdx].label} />
                <SummaryRow label="Time" value={`${time ?? '—'} · ${slot} min`} />
              </>
            )}
            <SummaryRow
              label="Records shared"
              value={share.share ? 'Yes — see the Records step' : 'No'}
            />
            {summarise(share.vitals, share.customVitals).length ? (
              <SummaryRow
                label="Vitals"
                value={summarise(share.vitals, share.customVitals).join(' · ')}
              />
            ) : null}
          </Card>

          <PaymentPanel
            quote={quote}
            vouchers={vouchers}
            appliedVoucherIds={voucherIds}
            onToggleVoucher={(id) => setVoucherIds((s) => (
              s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
            coupons={coupons}
            onApplyCoupon={(c) => setCoupons((s) => [...s, c])}
            onRemoveCoupon={(id) => setCoupons((s) => s.filter((c) => c.id !== id))}
            creditsApplied={credits}
            onCreditsChange={setCredits}
            method={method}
            onMethodChange={setMethod}
            agreed={agreed}
            onAgreedChange={setAgreed}
            reserves={!isPlan}
            consentNoun={isPlan ? 'plan' : 'consultation'}
          />
        </>
      ) : null}

      {/* ── Navigation ────────────────────────────────────────────── */}
      <View style={styles.navRow}>
        {step === 0 ? (
          <PrimaryButton
            label="Skip filters"
            variant="outline"
            style={styles.navBtn}
            onPress={() => { setFilters(emptyFilters()); setStep(1); }}
          />
        ) : (
          <PrimaryButton
            label="Back"
            variant="outline"
            style={styles.navBtn}
            onPress={() => setStep(step - 1)}
          />
        )}
        <PrimaryButton
          label={step === 4
            ? (quote.total === 0 ? 'Confirm' : `Pay ${inr(quote.total)}`)
            : step === 3 ? (share.share ? 'Continue with sharing' : 'Skip & continue')
              : step === 0
                ? (activeCount(filters) ? `Apply ${activeCount(filters)} & continue` : 'Continue')
                : 'Continue'}
          disabled={!canContinue}
          style={styles.navBtn}
          onPress={() => (step === 4 ? setDone(true) : setStep(step + 1))}
        />
      </View>

      {/* ── Details popups ───────────────────────────────────────── */}
      <DetailsSheet
        visible={!!planInfo}
        onClose={() => setPlanInfo(null)}
        title={planInfo?.name ?? ''}
        subtitle={planInfo?.description}
        rows={planInfo?.details ?? []}
        about={planInfo?.about ?? ''}
        moreLabel="More about this plan"
        footer={planInfo ? {
          label: 'Choose this plan',
          onPress: () => { setPlanId(planInfo.id); setTeamId(null); setPlanInfo(null); },
        } : undefined}
      />

      <DetailsSheet
        visible={!!teamInfo}
        onClose={() => setTeamInfo(null)}
        title={teamInfo?.name ?? ''}
        subtitle={teamInfo ? `${teamInfo.kind} · ${teamInfo.city}` : undefined}
        rows={teamInfo?.details ?? []}
        about={teamInfo?.about ?? ''}
        moreLabel="More about this team"
        footer={teamInfo ? {
          label: `Choose this team · ${inr(teamInfo.price)}`,
          onPress: () => { setTeamId(teamInfo.id); setTeamInfo(null); },
        } : undefined}
      />

      <DetailsSheet
        visible={!!docInfo}
        onClose={() => setDocInfo(null)}
        title={docInfo?.name ?? ''}
        subtitle={docInfo?.subCategory}
        rows={docInfo?.details ?? []}
        about={docInfo?.about ?? ''}
        moreLabel="More about this doctor"
        footer={docInfo ? {
          label: `Choose · ${inr(docInfo.priceFor(slot))}`,
          onPress: () => { setOfferingId(docInfo.id); setTime(null); setDocInfo(null); },
        } : undefined}
      />
    </ScreenWrapper>
  );
}

/**
 * The advance button that appears on a card once it's picked.
 *
 * Selection and continuation belong together: after choosing a team at the
 * bottom of a long list, the Continue at the foot of the page is off-screen,
 * and scrolling to find it is exactly the moment people wonder whether the tap
 * registered. The selected card saying "Continue" answers both.
 */
function CardContinue({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={cardContinueStyles.btn} activeOpacity={0.85} onPress={onPress}>
      <Text style={cardContinueStyles.text}>{label}</Text>
      <Ionicons name="arrow-forward" size={16} color={colors.white} />
    </TouchableOpacity>
  );
}

const cardContinueStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 10, paddingVertical: 12, borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  text: { fontSize: 13.5, fontWeight: '800', color: colors.white },
});

function MiniStat({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={12} color={colors.primary} />
      <Text style={styles.miniStatText}>{label}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={typography.bodyMuted}>{label}</Text>
      <Text style={styles.sumValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, marginTop: 18, marginBottom: 6 },
  topSkip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginBottom: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: '#F4F8FE',
  },
  topSkipText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  filterSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginTop: 12, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: '#F4F8FE',
  },
  filterSummaryText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  hint: { marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCell: { width: '48%' },

  pick: { gap: 9, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  pickOn: { borderColor: colors.primary, backgroundColor: '#F6FAFF' },
  pickTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  includes: { gap: 4 },
  includeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  includeText: { flex: 1, fontSize: 12, color: colors.textSecondary },
  priceRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  price: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.primary,
  },
  detailBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  teamPrice: { alignItems: 'flex-end', gap: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  memberQual: { fontSize: 11, color: colors.textMuted },
  ratingRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { fontSize: 11.5, color: colors.textSecondary },
  startsNote: { fontSize: 11, color: colors.primary, fontWeight: '600' },

  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.textSecondary },

  slotRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  slotBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  slotBtnOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  slotBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.textSecondary },
  slotBtnTextOn: { color: colors.white },
  slotHint: { fontSize: 9.5, color: colors.textMuted, marginTop: 1 },
  slotHintOn: { color: 'rgba(255,255,255,0.85)' },
  slotCard: { gap: 4, marginBottom: 4 },

  freeAfter: { gap: 5 },
  freeAfterHead: { fontSize: 9.5, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4 },
  freeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniStat: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: '#E8F1FC',
  },
  miniStatText: { fontSize: 10.5, fontWeight: '700', color: colors.primary },

  summary: { gap: 6, marginBottom: 4 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 4 },
  sumValue: { flex: 1.4, fontSize: 13, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 22, marginBottom: 8 },
  navBtn: { flex: 1 },

  successWrap: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22 },
  successIcon: {
    width: 74, height: 74, borderRadius: 37, backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  center: { textAlign: 'center' },
  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 14,
    padding: 12, borderRadius: radius.md, backgroundColor: '#E8F1FC',
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.primary },
  successBtn: { alignSelf: 'stretch', marginTop: 20 },
  homeLink: { paddingVertical: 14 },
  homeLinkText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
});
