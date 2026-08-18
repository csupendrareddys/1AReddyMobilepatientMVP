import { doctors, productCategories } from './mock';
import {
  CategoryType, consultOfferingsFor, DEFAULT_SLOT, plansFor, productType, TEAM_POOL,
} from './bookingFlow';

/**
 * Finding care by *who gives it* rather than by what it's called.
 *
 * The category flow starts from a need ("a recovery plan"); this one starts
 * from a person or a place ("Dr. Anitha", "the clinic near me"). Same four
 * booking steps at the end — the difference is only how you arrive at a
 * product, so everything here resolves to the same catalogue entries the
 * category flow uses rather than a parallel set.
 */

export type ProviderKind = 'doctor' | 'clinic' | 'hospital';

export const PROVIDER_KINDS: {
  key: ProviderKind; label: string; plural: string; icon: string; blurb: string;
}[] = [
  {
    key: 'doctor',
    label: 'Find a Doctor',
    plural: 'Doctors',
    icon: 'person-outline',
    blurb: 'Search by name, speciality or language, then see everything they offer.',
  },
  {
    key: 'clinic',
    label: 'Find a Clinic',
    plural: 'Clinics',
    icon: 'business-outline',
    blurb: 'Neighbourhood clinics — shorter waits, the same records.',
  },
  {
    key: 'hospital',
    label: 'Find a Hospital',
    plural: 'Hospitals',
    icon: 'medkit-outline',
    blurb: 'Multispeciality hospitals for procedures and inpatient care.',
  },
];

/** One thing a provider sells, whichever category it lives in. */
export type ProviderProduct = {
  id: string;
  categoryKey: string;
  categoryName: string;
  name: string;
  description: string;
  /** How it must be booked — the product's own type, not the category's. */
  type: CategoryType;
  price: number;
  meta: string;
  /** Set for team plans: who else delivers it. */
  teamName?: string;
  teamSize?: number;
  /** The delivering team's id, so booking can skip straight past team choice. */
  teamId?: string;
};

export type ProviderProfile = {
  id: string;
  kind: ProviderKind;
  name: string;
  /** Qualification for a doctor; "Multispeciality hospital" for a place. */
  headline: string;
  avatar: string;
  city: string;
  rating: number;
  reviews: number;
  experienceYears: number;
  languages: string[];
  specialities: string[];
  about: string;
  /** Cheapest thing they offer — the "starts at" on the card. */
  startsAt: number;
  details: { label: string; value: string }[];
  /** Products they provide on their own. */
  solo: ProviderProduct[];
  /** Products they deliver as part of a team. */
  team: ProviderProduct[];
};

/** A line about each organisation, keyed by the roster name. */
const PLACE_NOTES: Record<string, { kind: ProviderKind; about: string }> = {
  'Larazen Multispeciality': {
    kind: 'hospital',
    about: 'A 400-bed multispeciality hospital with cardiology, orthopaedics and '
      + 'internal medicine departments, and an emergency room that runs around the clock.',
  },
  'Aster Community Unit': {
    kind: 'hospital',
    about: 'Community hospital with a strong chronic-care unit — diabetes, blood '
      + 'pressure and thyroid follow-up run as nurse-led programmes.',
  },
  'Sunrise Clinic': {
    kind: 'clinic',
    about: 'A neighbourhood clinic for everyday medicine — fevers, follow-ups, '
      + 'dressings and vaccinations — with same-day appointments most mornings.',
  },
  'Nirvaan Care Collective': {
    kind: 'clinic',
    about: 'A doctor-led collective running family medicine out of a single floor, '
      + 'with a paediatrician on site three days a week.',
  },
  'Reddy Care Team': {
    kind: 'clinic',
    about: 'A small doctor-led team taking a limited number of plans at a time, so '
      + 'the lead physician stays involved throughout.',
  },
};

/** Clinics and hospitals, taken from the roster that actually delivers plans. */
const PLACES = TEAM_POOL
  .filter((t) => PLACE_NOTES[t.name])
  .map((t) => ({
    name: t.name,
    kind: PLACE_NOTES[t.name].kind,
    city: t.city,
    about: PLACE_NOTES[t.name].about,
  }));

/** Every product in the catalogue, flattened, with its booking type resolved. */
function allProducts(): ProviderProduct[] {
  return productCategories.flatMap((c) => c.items.map((item) => ({
    id: item.id,
    categoryKey: c.key,
    categoryName: c.name,
    name: item.name,
    description: item.description,
    type: productType(item),
    price: item.price,
    meta: item.meta,
  })));
}

/**
 * What one doctor offers.
 *
 * Solo work is what they alone provide — their consultations. Team work is the
 * plans where they're one name on a roster. The patient's question is "what can
 * I book with this person", and both answer it, so both are listed — separated,
 * because booking a team plan means booking the team.
 */
function productsForDoctor(doctorId: string, doctorName: string) {
  const solo: ProviderProduct[] = [];
  const team: ProviderProduct[] = [];

  productCategories.forEach((c) => {
    consultOfferingsFor(c.key)
      .filter((o) => o.doctorId === doctorId)
      .forEach((o) => {
        const item = c.items.find((x) => x.id === o.id);
        if (!item) return;
        solo.push({
          id: o.id,
          categoryKey: c.key,
          categoryName: c.name,
          name: o.subCategory,
          description: item.description,
          type: 'consultation',
          price: o.priceFor(DEFAULT_SLOT),
          meta: `${DEFAULT_SLOT} min · ${o.slotRange}`,
        });
      });

    plansFor(c.key).forEach((p) => {
      // One row per plan: a doctor leading the same plan for two different
      // teams is still one thing the patient can book from this page.
      const led = p.teams.find((t) => t.members.some((m) => m.doctorId === doctorId));
      [led].filter(Boolean).forEach((t) => {
        if (!t) return;
        team.push({
          id: p.id,
          categoryKey: c.key,
          categoryName: c.name,
          name: p.name,
          description: p.description,
          type: 'plan',
          price: t.price,
          meta: p.duration,
          teamName: t.name,
          teamSize: t.members.length,
          teamId: t.id,
        });
      });
    });
  });

  return { solo, team };
}

/** What a clinic or hospital offers — the plans its teams deliver. */
function productsForPlace(placeName: string) {
  const solo: ProviderProduct[] = [];
  const team: ProviderProduct[] = [];

  productCategories.forEach((c) => {
    plansFor(c.key).forEach((p) => {
      p.teams
        .filter((t) => t.name === placeName)
        .forEach((t) => {
          team.push({
            id: p.id,
            categoryKey: c.key,
            categoryName: c.name,
            name: p.name,
            description: p.description,
            type: 'plan',
            price: t.price,
            meta: p.duration,
            teamName: t.name,
            teamSize: t.members.length,
            teamId: t.id,
          });
        });
    });
  });

  // A place's own walk-in consultations, so the list isn't plans only.
  allProducts()
    .filter((p) => p.type === 'consultation' && (p.categoryKey === 'physical' || p.categoryKey === 'hybrid'))
    .slice(0, 3)
    .forEach((p) => solo.push(p));

  return { solo, team };
}

/**
 * The lowest price worth advertising.
 *
 * Zero-priced entries are plan-covered or promotional, not a price anyone pays
 * to start — quoting "starts at ₹0" off the back of one is misleading, so they
 * don't count unless everything is free.
 */
const cheapest = (rows: ProviderProduct[]) => {
  const paid = rows.filter((r) => r.price > 0);
  const pool = paid.length ? paid : rows;
  return pool.reduce((min, r) => Math.min(min, r.price), Number.POSITIVE_INFINITY);
};

/** Every provider of one kind, ready to list. */
export function providersOfKind(kind: ProviderKind): ProviderProfile[] {
  if (kind === 'doctor') {
    return doctors.map((d) => {
      const { solo, team } = productsForDoctor(d.id, d.full_name);
      const all = [...solo, ...team];
      return {
        id: d.id,
        kind,
        name: d.full_name,
        headline: d.highest_qualification,
        avatar: d.profile_image,
        city: d.hospital_affiliations[0] ?? 'Larazen Multispeciality Hospital',
        rating: d.rating,
        reviews: d.total_reviews,
        experienceYears: d.experience_years,
        languages: d.languages_known,
        specialities: d.specializations,
        about: d.bio,
        startsAt: all.length ? cheapest(all) : d.consultation_fee,
        details: [
          { label: 'Doctor', value: d.full_name },
          { label: 'Qualification', value: d.highest_qualification },
          { label: 'Speciality', value: d.specializations.join(', ') },
          { label: 'Experience', value: `${d.experience_years} years` },
          { label: 'Practises at', value: d.hospital_affiliations.join(', ') },
          { label: 'Speaks', value: d.languages_known.join(', ') },
          { label: 'Rating', value: `${d.rating} from ${d.total_reviews} reviews` },
          { label: 'Next available', value: d.next_available },
          { label: 'Offers', value: `${solo.length} own · ${team.length} as part of a team` },
        ],
        solo,
        team,
      };
    });
  }

  return PLACES.filter((p) => p.kind === kind).map((p, i) => {
    const { solo, team } = productsForPlace(p.name);
    const all = [...solo, ...team];
    const staff = doctors.filter((d) => d.hospital_affiliations.includes(p.name));
    return {
      id: `${kind}-${i + 1}`,
      kind,
      name: p.name,
      headline: kind === 'hospital' ? 'Multispeciality hospital' : 'Neighbourhood clinic',
      avatar: `https://picsum.photos/seed/${encodeURIComponent(p.name)}/200`,
      city: p.city,
      rating: Math.round((4.2 + (i % 6) / 10) * 10) / 10,
      reviews: 120 + i * 47,
      experienceYears: 8 + i * 3,
      languages: ['English', 'Telugu', 'Hindi'],
      specialities: [...new Set(staff.flatMap((d) => d.specializations))].slice(0, 4),
      about: p.about,
      startsAt: all.length ? cheapest(all) : 500,
      details: [
        { label: kind === 'hospital' ? 'Hospital' : 'Clinic', value: p.name },
        { label: 'Location', value: p.city },
        { label: 'Doctors on record', value: String(staff.length) },
        { label: 'Specialities', value: [...new Set(staff.flatMap((d) => d.specializations))].slice(0, 4).join(', ') || '—' },
        { label: 'Offers', value: `${solo.length} consultations · ${team.length} plans` },
      ],
      solo,
      team,
    };
  });
}

export const providerById = (kind: ProviderKind, id: string) =>
  providersOfKind(kind).find((p) => p.id === id) ?? null;

/**
 * The patient's favourites, resolved to full profiles.
 *
 * Reads through `providersOfKind` so a favourite carries the same products,
 * prices and details as it does anywhere else — a shortcut, not a second
 * shallower copy of the provider.
 */
export function favouriteProviders(refs: { kind: ProviderKind; id: string }[]): ProviderProfile[] {
  return refs
    .map((r) => providerById(r.kind, r.id))
    .filter((p): p is ProviderProfile => !!p);
}
