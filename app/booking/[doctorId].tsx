import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Stepper from '../../src/components/Stepper';
import PrimaryButton from '../../src/components/PrimaryButton';
import PaymentPanel from '../../src/components/PaymentPanel';
import MedicalRecordsShare, { emptyShare } from '../../src/components/MedicalRecordsShare';
import {
  bookedSlots, consultationTypes, ConsultationTypeKey, doctors, timeSlots,
} from '../../src/data/mock';
import ChipRowsSlider from '../../src/components/ChipRowsSlider';
import {
  Discount, inr, PaymentMethodKey, quoteFor, vouchersFor,
} from '../../src/data/checkout';
import { summarise } from '../../src/data/visitVitals';
import { SHARE_SECTION_META } from '../../src/data/shareSections';
import PersonSelector from '../../src/components/PersonSelector';
import { findPerson, peopleFor, SELF_ID } from '../../src/data/people';
import { colors, radius, typography } from '../../src/theme/theme';

const STEPS = ['Consultation', 'Date & time', 'Records', 'Pay'];

/** Three weeks of days — enough that the rail is worth sliding. */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dates = Array.from({ length: 21 }).map((_, i) => {
  const d = new Date(2026, 7, 16 + i);
  const num = String(d.getDate()).padStart(2, '0');
  const day = DAY_NAMES[d.getDay()];
  const month = d.toLocaleString('en-GB', { month: 'short' });
  return {
    label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${day} ${num}`,
    day,
    num,
    month,
  };
});

export default function BookAppointmentScreen() {
  const { doctorId, start, type: typeParam } = useLocalSearchParams<{
    doctorId: string; start?: string; type?: string;
  }>();
  const router = useRouter();
  const doctor = doctors.find((d) => d.id === doctorId) ?? doctors[0];

  // Booking for someone else needs `manage` on appt_booking, not just view.
  const people = peopleFor({ includeMinors: true, includeLinked: true, module: 'appt_booking', verb: 'manage' });
  const [personId, setPersonId] = useState(SELF_ID);
  const patient = findPerson(people, personId);

  // A product page that already names the consultation kind skips step 1 —
  // re-asking what the patient just chose is how flows feel broken.
  const validType = consultationTypes.some((t) => t.key === typeParam);
  const [step, setStep] = useState(start === 'slot' ? 1 : 0);
  const [typeKey, setTypeKey] = useState<ConsultationTypeKey>(
    validType ? (typeParam as ConsultationTypeKey) : 'video',
  );
  const [dateIdx, setDateIdx] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [share, setShare] = useState(emptyShare());
  const [confirmed, setConfirmed] = useState(false);

  const type = consultationTypes.find((t) => t.key === typeKey)!;

  // Settlement state, identical in shape for every product this app sells.
  const vouchers = useMemo(() => vouchersFor('appointment'), []);
  const [voucherIds, setVoucherIds] = useState<string[]>([]);
  const [coupons, setCoupons] = useState<Discount[]>([]);
  const [credits, setCredits] = useState(0);
  const [method, setMethod] = useState<PaymentMethodKey>('razorpay');
  const [agreed, setAgreed] = useState(false);

  const quote = quoteFor({
    fee: type.price,
    listPrice: type.price > 0 ? Math.round(type.price * 1.2) : null,
    // Stand-ins for the admin's per-offering pricing row.
    incrementFixed: type.price > 0 ? 50 : 0,
    overallDiscountPct: type.price > 0 ? 5 : 0,
    vouchers: vouchers.filter((v) => voucherIds.includes(v.id)),
    coupons,
    creditsApplied: credits,
  });

  if (confirmed) {
    return (
      <ScreenWrapper scroll={false} contentStyle={styles.successWrap}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={36} color={colors.white} />
        </View>
        <Text style={[typography.h1, styles.successTitle]}>Appointment booked</Text>
        <Text style={[typography.bodyMuted, styles.successSub]}>For {patient.name}</Text>
        <Text style={[typography.bodyMuted, styles.successSub]}>
          {doctor.full_name} · {dates[dateIdx].label} at {slot}
        </Text>
        <Text style={[typography.bodyMuted, styles.successSub]}>
          {type.name} · {quote.total === 0 ? 'Fully covered' : inr(quote.total)} paid
        </Text>
        <Text style={[typography.caption, styles.successSub]}>
          {share.share
            ? 'Your selected records were shared with the doctor.'
            : 'No medical records were shared.'}
        </Text>
        {/* The detail view is where every follow-on action lives — joining,
            attaching a document, the prescription — so it leads. */}
        <PrimaryButton
          label="View booking details"
          style={styles.successBtn}
          onPress={() => router.replace({
            pathname: '/booking-detail',
            params: {
              kind: 'appointment',
              name: type.name,
              provider: doctor.full_name,
              patient: patient.name,
              date: dates[dateIdx].label,
              time: slot ?? '',
              status: 'confirmed',
              consultType: typeKey,
              amount: String(quote.total),
              paid: 'true',
              records: String(share.share),
              attachments: String(share.attachments.length),
              symptoms: share.symptoms.join(', '),
              ref: 'LZ-8841',
            },
          } as never)}
        />
        <PrimaryButton
          label="Go to My Bookings"
          variant="outline"
          style={styles.successBtnAlt}
          onPress={() => router.replace('/(tabs)/appointments?view=upcoming')}
        />
        <TouchableOpacity
          style={styles.homeLink}
          onPress={() => { setConfirmed(false); setStep(0); setSlot(null); }}
        >
          <Ionicons name="add-circle-outline" size={15} color={colors.primary} />
          <Text style={styles.homeLinkText}>Book another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeLink} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="home-outline" size={15} color={colors.primary} />
          <Text style={styles.homeLinkText}>Back to home</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  // Sharing records is optional, so step 2 never blocks; paying needs consent.
  const canContinue = step === 0 ? true : step === 1 ? !!slot : step === 2 ? true : agreed;

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Book appointment" />

      <Stepper steps={STEPS} current={step} onStep={setStep} canNext={canContinue} />

      <PersonSelector label="Patient" people={people} value={personId} onChange={setPersonId} />

      <Card style={styles.doctorCard}>
        <Text style={typography.h3}>{doctor.full_name}</Text>
        <Text style={typography.bodyMuted}>{doctor.specializations.join(', ')}</Text>
      </Card>

      {step === 0 ? (
        <>
          <Text style={styles.label}>How would you like to consult?</Text>
          {consultationTypes.map((t) => {
            const active = typeKey === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.85}
                onPress={() => setTypeKey(t.key)}
                style={[styles.typeRow, active && styles.typeRowActive]}
              >
                <View style={[styles.typeIcon, active && styles.typeIconActive]}>
                  <Ionicons name={t.icon} size={20} color={active ? colors.white : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{t.name}</Text>
                  <Text style={typography.bodyMuted}>{t.description}</Text>
                </View>
                <View style={styles.typeRight}>
                  <Text style={styles.typePrice}>{t.price === 0 ? 'Free' : inr(t.price)}</Text>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          {/* The picked row carries its own advance, so choosing and moving on
              are one gesture instead of a scroll hunt for the nav button. */}
          <TouchableOpacity
            style={styles.cardContinue}
            activeOpacity={0.85}
            onPress={() => setStep(1)}
          >
            <Text style={styles.cardContinueText}>
              Continue with {type.short_name} — {type.price === 0 ? 'Free' : inr(type.price)}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Text style={styles.label}>Select a date</Text>
          <ChipRowsSlider
            rows={2}
            width={70}
            items={dates.map((d, i) => ({
              key: String(i),
              title: i === 0 ? 'Today' : `${d.day} ${d.num}`,
              sub: i === 0 ? `${d.day} ${d.num}` : d.month,
            }))}
            selected={String(dateIdx)}
            onSelect={(k) => { setDateIdx(Number(k)); setSlot(null); }}
          />

          <Text style={styles.label}>Available times</Text>
          <ChipRowsSlider
            rows={3}
            width={64}
            tint={colors.secondary}
            items={timeSlots.map((t) => ({
              key: t,
              title: t,
              disabled: bookedSlots.includes(t),
            }))}
            selected={slot}
            onSelect={setSlot}
          />
          <Text style={styles.slotNote}>
            {timeSlots.length - bookedSlots.length} of {timeSlots.length} slots free
            on {dates[dateIdx].label.toLowerCase()} · slide for more
          </Text>
        </>
      ) : null}

      {step === 2 ? (
        <MedicalRecordsShare
          value={share}
          onChange={setShare}
          patientName={patient.name.split(' ')[0]}
          scopeKind={personId === SELF_ID ? 'self' : 'minor'}
          scopeId={personId === SELF_ID ? null : personId}
        />
      ) : null}

      {step === 3 ? (
        <>
          <Text style={styles.label}>Booking summary</Text>
          <Card style={styles.summary}>
            <SummaryRow label="Patient" value={patient.name} />
            <SummaryRow label="Doctor" value={doctor.full_name} />
            <SummaryRow label="Type" value={type.name} />
            <SummaryRow label="Date" value={dates[dateIdx].label} />
            <SummaryRow label="Time" value={slot ?? '—'} />
            <SummaryRow
              label="Symptoms"
              value={share.symptoms.length ? share.symptoms.join(', ') : 'None selected'}
            />
            {/* Naming the sections beats "selected items" — the patient is
                about to pay, and this is their last chance to notice that
                something they'd rather keep private is going with it. */}
            <SummaryRow
              label="Records shared"
              value={share.share
                ? (SHARE_SECTION_META
                  .filter((s) => share.sections[s.key])
                  .map((s) => s.title)
                  .join(', ') || 'None selected')
                : 'No'}
            />
            {summarise(share.vitals, share.customVitals).length ? (
              <SummaryRow
                label="Vitals"
                value={summarise(share.vitals, share.customVitals).join(' · ')}
              />
            ) : null}
            {share.attachments.length ? (
              <SummaryRow label="Attachments" value={`${share.attachments.length} file(s)`} />
            ) : null}
          </Card>

          <PaymentPanel
            quote={quote}
            vouchers={vouchers}
            appliedVoucherIds={voucherIds}
            onToggleVoucher={(id) => setVoucherIds((s) =>
              s.includes(id) ? s.filter((x) => x !== id) : [...s, id])}
            coupons={coupons}
            onApplyCoupon={(c) => setCoupons((s) => [...s, c])}
            onRemoveCoupon={(id) => setCoupons((s) => s.filter((c) => c.id !== id))}
            creditsApplied={credits}
            onCreditsChange={setCredits}
            method={method}
            onMethodChange={setMethod}
            agreed={agreed}
            onAgreedChange={setAgreed}
          />
        </>
      ) : null}

      <View style={styles.navRow}>
        {step > 0 ? (
          <PrimaryButton label="Back" variant="outline" style={styles.navBtn} onPress={() => setStep(step - 1)} />
        ) : null}
        <PrimaryButton
          label={step === 3
            ? (quote.total === 0 ? 'Confirm booking' : `Pay ${inr(quote.total)}`)
            : step === 2 ? (share.share ? 'Continue with sharing' : 'Skip & continue')
              : 'Continue'}
          disabled={!canContinue}
          style={styles.navBtn}
          onPress={() => (step === 3 ? setConfirmed(true) : setStep(step + 1))}
        />
      </View>
    </ScreenWrapper>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={typography.bodyMuted}>{label}</Text>
      <Text style={[typography.body, styles.sumValue]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContinue: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 12, paddingVertical: 13, borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  cardContinueText: { fontSize: 13.5, fontWeight: '800', color: colors.white },
  doctorCard: { marginBottom: 10, gap: 3 },
  label: { ...typography.label, marginTop: 18, marginBottom: 10 },
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  typeRowActive: { borderColor: colors.primary, borderWidth: 2 },
  typeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F1FC', alignItems: 'center', justifyContent: 'center' },
  typeIconActive: { backgroundColor: colors.primary },
  typeRight: { alignItems: 'flex-end', gap: 8 },
  typePrice: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  slotNote: { fontSize: 11.5, color: colors.textMuted, marginTop: 10 },
  summary: { gap: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  sumValue: { flex: 1, textAlign: 'right', fontWeight: '600' },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  navBtn: { flex: 1 },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  successTitle: { marginTop: 20 },
  successSub: { marginTop: 6, textAlign: 'center' },
  successBtn: { marginTop: 24, width: 240 },
  successBtnAlt: { marginTop: 10, width: 240 },
  homeLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 18 },
  homeLinkText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
