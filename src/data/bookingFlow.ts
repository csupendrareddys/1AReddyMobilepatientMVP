import { CategoryItem, doctors, productCategories } from './mock';

/**
 * How a category is booked.
 *
 * The backend marks each category as a consultation or a plan, and the two are
 * bought in genuinely different ways: a consultation is one doctor for a fixed
 * number of minutes, a plan is a package that several teams compete to deliver
 * at their own price. Rather than force both through one screen, the booking
 * flow branches on this — the same four steps either way, but steps 1 and 2
 * ask what each kind actually needs.
 */

export type CategoryType = 'consultation' | 'plan';

const CATEGORY_TYPE: Record<string, CategoryType> = {
  instant: 'consultation',
  online: 'consultation',
  physical: 'consultation',
  // Everything that runs over time, hybrid included: bought from a team, not
  // from a slot.
  hybrid: 'plan',
  recovery: 'plan',
  healthcare: 'plan',
  advanced: 'plan',
  longevity: 'plan',
};

export const categoryType = (key: string): CategoryType => CATEGORY_TYPE[key] ?? 'plan';

/**
 * What one product is, which is not always what its category is.
 *
 * The backend types the category *and* each product in it. They usually agree,
 * but an admin can put a one-off consultation inside Recovery Plans — "Post-op
 * review call", say — and when they do, that product has to be booked as a
 * consultation: a doctor and a slot, not a team and a term. The product's own
 * type wins, because the product is what's being bought.
 */
export function productType(item: { kind: string }): CategoryType {
  return item.kind === 'appointment' ? 'consultation' : 'plan';
}

/** Everything in a category, each tagged with how it must be booked. */
export function catalogueFor(categoryKey: string): {
  item: CategoryItem; type: CategoryType;
}[] {
  const cat = productCategories.find((c) => c.key === categoryKey);
  if (!cat) return [];
  return cat.items.map((item) => ({ item, type: productType(item) }));
}

/** True when a category holds both kinds, so the list has to say which is which. */
export function isMixedCategory(categoryKey: string): boolean {
  const kinds = new Set(catalogueFor(categoryKey).map((x) => x.type));
  return kinds.size > 1;
}

/* ── Deterministic variation ──────────────────────────────────────── */

/**
 * A stable pseudo-random number from a string.
 *
 * Prices and team line-ups have to be the same every render — a plan that
 * costs ₹4,000 on the list and ₹4,600 when you open it is worse than one that
 * costs a made-up number consistently.
 */
function seed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const pick = <T,>(arr: T[], s: number, offset = 0): T => arr[(s + offset) % arr.length];

/* ── Plans ────────────────────────────────────────────────────────── */

export type ProviderMember = {
  /** Set when this slot is filled by a doctor in the catalogue. */
  doctorId?: string;
  name: string;
  qualification: string;
  role: string;
};

export type PlanTeam = {
  id: string;
  name: string;
  /** Hospital, clinic or an independent doctor-led team. */
  kind: string;
  price: number;
  city: string;
  rating: number;
  casesHandled: number;
  members: ProviderMember[];
  /** How soon delivery begins once the team accepts. */
  startsWithin: string;
  /** The rows of the "view details" table. */
  details: { label: string; value: string }[];
  /** The deeper read behind the details table. */
  about: string;
};

export type PlanOffering = {
  id: string;
  categoryKey: string;
  name: string;
  description: string;
  /** What the plan covers, whoever delivers it. */
  includes: string[];
  duration: string;
  teams: PlanTeam[];
  details: { label: string; value: string }[];
  about: string;
};

export type TeamOrg = { name: string; kind: string; city: string; factor: number };

/**
 * The organisations that deliver plans.
 *
 * Exported because "find a clinic" and "which teams deliver this plan" have to
 * be the same list — when they were separate, a hospital's page showed zero
 * plans because its name was spelled slightly differently in two files.
 */
export const TEAM_POOL: TeamOrg[] = [
  { name: 'Reddy Care Team', kind: 'Doctor-led team', city: 'Jubilee Hills', factor: 1.0 },
  { name: 'Larazen Multispeciality', kind: 'Hospital', city: 'Banjara Hills', factor: 1.28 },
  { name: 'Sunrise Clinic', kind: 'Clinic', city: 'Madhapur', factor: 0.78 },
  { name: 'Aster Community Unit', kind: 'Hospital', city: 'Gachibowli', factor: 1.12 },
  { name: 'Nirvaan Care Collective', kind: 'Doctor-led team', city: 'Kondapur', factor: 0.88 },
];

const ROLES = [
  'Lead physician', 'Care coordinator', 'Nutritionist', 'Physiotherapist',
  'Nurse practitioner', 'Counsellor',
];

const QUALS = [
  'MBBS, MD (Internal Medicine)', 'MBBS, DNB', 'BSc Nursing, RN',
  'MSc Clinical Nutrition', 'MPT (Sports)', 'MA Clinical Psychology',
];

const START_WINDOWS = [
  'Starts within 24 hrs of approval',
  'Starts the same day it is approved',
  'Starts within 48 hrs of approval',
];

/** Two to four teams offering the same plan at their own price. */
function teamsFor(item: CategoryItem): PlanTeam[] {
  const s = seed(item.id);
  const count = 2 + (s % 3);
  const start = s % TEAM_POOL.length;

  return Array.from({ length: count }, (_, i) => {
    const pool = TEAM_POOL[(start + i) % TEAM_POOL.length];
    const ts = seed(`${item.id}-${pool.name}`);
    // Round to something a price list would actually print.
    const price = Math.round((item.price * pool.factor) / 50) * 50;
    const size = 2 + (ts % 3);
    const members = Array.from({ length: size }, (_, m) => {
      const d = doctors[(ts + m * 3) % doctors.length];
      // Only the lead is one of our doctors; the rest of the team are the
      // clinic's own staff, so they carry no doctor id.
      return {
        doctorId: m === 0 ? d.id : undefined,
        name: m === 0 ? d.full_name : `${pick(ROLES, ts, m)} — ${d.full_name.replace('Dr. ', '')}`,
        qualification: m === 0 ? d.highest_qualification : pick(QUALS, ts, m),
        role: m === 0 ? 'Lead physician' : pick(ROLES, ts, m + 1),
      };
    });

    return {
      id: `${item.id}-${pool.name.toLowerCase().replace(/\W+/g, '-')}`,
      name: pool.name,
      kind: pool.kind,
      price,
      city: pool.city,
      rating: Math.round((4 + (ts % 10) / 10) * 10) / 10,
      casesHandled: 40 + (ts % 260),
      members,
      startsWithin: pick(START_WINDOWS, ts),
      details: [
        { label: 'Delivered by', value: `${pool.name} · ${pool.kind}` },
        { label: 'Location', value: pool.city },
        { label: 'Team size', value: `${size} ${size === 1 ? 'professional' : 'professionals'}` },
        { label: 'Plans delivered', value: String(40 + (ts % 260)) },
        { label: 'Price', value: `₹${price.toLocaleString('en-IN')}` },
        { label: 'Begins', value: pick(START_WINDOWS, ts) },
      ],
      about:
        `${pool.name} runs this plan out of ${pool.city}. The lead physician sets the `
        + 'protocol and reviews progress at each checkpoint; the rest of the team handles '
        + 'the day-to-day contact. Price differences between teams reflect how much '
        + 'one-to-one time is included and how senior the lead is — the plan itself is '
        + 'the same either way.',
    };
  });
}

const INCLUDES_BY_CATEGORY: Record<string, string[]> = {
  recovery: [
    'Daily check-ins for the length of the plan',
    'A written recovery protocol, adjusted weekly',
    'Chat with your care team, plus scheduled calls',
    'Red-flag guidance — what means "call us now"',
  ],
  healthcare: [
    'Scheduled preventive screening',
    'Reports read and explained, not just delivered',
    'A year-round point of contact for questions',
    'Reminders for anything falling due',
  ],
  advanced: [
    'A named specialist leading your care',
    'Multi-disciplinary review at each checkpoint',
    'Coordination between your specialists',
    'Priority scheduling for reviews',
  ],
  longevity: [
    'Baseline marker panel and quarterly repeats',
    'Nutrition, movement and sleep protocols',
    'Quarterly review with the full care team',
    'Access to the team throughout the year',
  ],
  hybrid: [
    'In-person visits where they matter',
    'Online follow-ups for everything else',
    'One record across both, so nothing is repeated',
    'Direct messaging between visits',
  ],
};

/** Every plan in a category, with the teams that deliver it. */
export function plansFor(categoryKey: string): PlanOffering[] {
  const cat = productCategories.find((c) => c.key === categoryKey);
  if (!cat) return [];

  return cat.items.filter((item) => productType(item) === 'plan').map((item) => ({
    id: item.id,
    categoryKey,
    name: item.name,
    description: item.description,
    includes: INCLUDES_BY_CATEGORY[categoryKey] ?? INCLUDES_BY_CATEGORY.recovery,
    duration: item.meta,
    teams: teamsFor(item),
    details: [
      { label: 'Plan', value: item.name },
      { label: 'Category', value: cat.name },
      { label: 'Runs for', value: item.meta },
      { label: 'Delivered by', value: `${teamsFor(item).length} teams` },
      { label: 'Starts from', value: `₹${startsFrom(teamsFor(item)).toLocaleString('en-IN')}` },
    ],
    about:
      `${item.description} The plan is defined centrally — the protocol, the checkpoints `
      + 'and what has to be recorded are the same whoever delivers it. What changes between '
      + 'teams is who you see, where they are, how much one-to-one time is included, and '
      + 'therefore the price.',
  }));
}

export const startsFrom = (teams: PlanTeam[]) =>
  teams.reduce((min, t) => Math.min(min, t.price), Number.POSITIVE_INFINITY);

export const planById = (categoryKey: string, id: string) =>
  plansFor(categoryKey).find((p) => p.id === id) ?? null;

/* ── Consultations ────────────────────────────────────────────────── */

export type SlotSize = 10 | 15 | 30;

export const SLOT_SIZES: SlotSize[] = [10, 15, 30];
/** The middle option, and what most consultations are actually booked at. */
export const DEFAULT_SLOT: SlotSize = 15;

export type ConsultOffering = {
  id: string;
  doctorId: string;
  name: string;
  qualification: string;
  /** Where they practise — the "practice qualification" on the card. */
  practice: string;
  /** Which product within the category this is, e.g. "Video Consultation". */
  subCategory: string;
  /** Consulting window, so the slot list isn't the first sight of it. */
  slotRange: string;
  rating: number;
  experienceYears: number;
  languages: string[];
  /** Slot lengths this doctor offers. */
  sizes: SlotSize[];
  /** Included after the consultation ends — the follow-up allowance. */
  freeAfter: { messages: number; audioMin: number; videoMin: number; days: number };
  about: string;
  details: { label: string; value: string }[];
  /** Price for one slot length. */
  priceFor: (size: SlotSize) => number;
};

const SLOT_FACTOR: Record<SlotSize, number> = { 10: 0.75, 15: 1, 30: 1.7 };

const SLOT_WINDOWS = ['09:00 – 13:00', '10:00 – 18:00', '14:00 – 20:00', '08:00 – 12:00'];

/**
 * Doctors offering one category's consultations, priced per slot length.
 *
 * A 10-minute slot isn't two-thirds the work of a 15 and a 30 isn't double, so
 * the multipliers aren't linear — they're what a clinic would actually charge.
 */
export function consultOfferingsFor(categoryKey: string): ConsultOffering[] {
  const cat = productCategories.find((c) => c.key === categoryKey);
  if (!cat) return [];

  return cat.items.filter((item) => productType(item) === 'consultation').map((item, i) => {
    const s = seed(item.id);
    const d = doctors[(s + i) % doctors.length];
    const base = item.price;
    // Not every doctor sells every length — a 30-minute slot is a different
    // commitment, and some only do the short ones.
    const sizes: SlotSize[] = s % 4 === 0 ? [10, 15] : s % 5 === 0 ? [15, 30] : [10, 15, 30];

    return {
      id: item.id,
      doctorId: d.id,
      name: d.full_name,
      qualification: d.highest_qualification,
      practice: d.hospital_affiliations[0] ?? 'Larazen Multispeciality Hospital',
      subCategory: item.name,
      slotRange: pick(SLOT_WINDOWS, s),
      rating: d.rating,
      experienceYears: d.experience_years,
      languages: d.languages_known,
      sizes,
      freeAfter: {
        messages: 3 + (s % 5),
        audioMin: 5 + (s % 3) * 5,
        videoMin: 5 + (s % 2) * 5,
        days: 3 + (s % 5),
      },
      about: d.bio,
      details: [
        { label: 'Doctor', value: d.full_name },
        { label: 'Qualification', value: d.highest_qualification },
        { label: 'Practises at', value: d.hospital_affiliations[0] ?? '—' },
        { label: 'Experience', value: `${d.experience_years} years` },
        { label: 'Speaks', value: d.languages_known.join(', ') },
        { label: 'Rating', value: `${d.rating} from ${d.total_reviews} reviews` },
        { label: 'Consulting hours', value: pick(SLOT_WINDOWS, s) },
        { label: 'Slot lengths', value: sizes.map((x) => `${x} min`).join(' · ') },
      ],
      priceFor: (size: SlotSize) => Math.round((base * SLOT_FACTOR[size]) / 10) * 10,
    };
  });
}

/** Only the doctors who sell the length the patient asked for. */
export const offeringsForSlot = (categoryKey: string, size: SlotSize) =>
  consultOfferingsFor(categoryKey).filter((o) => o.sizes.includes(size));

export const offeringById = (categoryKey: string, id: string) =>
  consultOfferingsFor(categoryKey).find((o) => o.id === id) ?? null;
