import { Ionicons } from '@expo/vector-icons';
import { ProductKind } from './checkout';
import { familyDoctor, minors } from './mock';
import { colors } from './../theme/theme';

/**
 * The dashboard's recommendation shelves.
 *
 * Each shelf is a feed the backend will serve from the entity/recommendation
 * tables — what this patient's family doctor offers, what they've shown
 * interest in, what suits their dependents, and what fits their stated needs.
 * Until those endpoints exist these are fixed lists in the same shape, so the
 * screens can be built and laid out against real-looking data.
 *
 * Every row is a sellable product, so tapping one goes to the same checkout as
 * browsing to it any other way.
 */

export type RecoItem = {
  id: string;
  name: string;
  provider: string;
  kind: ProductKind;
  price: number;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  /** Why this was surfaced — recommendations should say what they're based on. */
  reason: string;
  /**
   * Solo = the provider delivers it alone; team = delivered with colleagues.
   * Only shelves that split their heads set this.
   */
  group?: 'solo' | 'team';
};

export type Shelf = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  /** Seconds between auto-advances. Staggered so the shelves don't all move together. */
  intervalSec: number;
  items: RecoItem[];
};

const kid = minors[0]?.full_name.split(' ')[0] ?? 'your child';

export const shelves: Shelf[] = [
  {
    key: 'family-doctor',
    title: `Book ${familyDoctor.name.split(' ').slice(0, 2).join(' ')}'s services`,
    subtitle: `Everything your family doctor offers · ${familyDoctor.hospital}`,
    icon: 'medical-outline',
    tint: colors.primary,
    intervalSec: 20,
    items: [
      { id: 'fd-1', name: 'Annual Health Review', provider: familyDoctor.name, kind: 'service', price: 1499, meta: '60 min · in person', icon: 'clipboard-outline', tint: colors.primary, reason: 'Your family doctor', group: 'solo', },
      { id: 'fd-2', name: 'Second Opinion — Reports', provider: familyDoctor.name, kind: 'service', price: 899, meta: 'Reply in 48 hrs', icon: 'documents-outline', tint: colors.primary, reason: 'Your family doctor', group: 'solo', },
      { id: 'fd-3', name: 'Video Consultation', provider: familyDoctor.name, kind: 'appointment', price: 500, meta: 'Pick your slot', icon: 'videocam-outline', tint: colors.primary, reason: 'Your family doctor', group: 'solo', },
      { id: 'fd-4', name: 'Home Visit', provider: familyDoctor.name, kind: 'appointment', price: 1200, meta: 'Same day', icon: 'home-outline', tint: colors.primary, reason: 'Your family doctor', group: 'solo', },
      { id: 'fd-5', name: 'Chronic Care Follow-up — 3 Months', provider: familyDoctor.name, kind: 'recovery_plan', price: 4999, meta: '3 months · chat included', icon: 'pulse-outline', tint: colors.primary, reason: 'Your family doctor', group: 'team', },
      { id: 'fd-6', name: 'Family Health Check — 4 Members', provider: familyDoctor.name, kind: 'group_offering', price: 5999, meta: '4 members · 1 visit', icon: 'people-outline', tint: colors.primary, reason: 'Your family doctor', group: 'team', },
      { id: 'fd-7', name: 'Vaccination Advisory', provider: familyDoctor.name, kind: 'service', price: 399, meta: '20 min · video', icon: 'shield-checkmark-outline', tint: colors.primary, reason: 'Your family doctor', group: 'solo', },
      { id: 'fd-8', name: 'Diet & Lifestyle Plan', provider: familyDoctor.name, kind: 'service', price: 2499, meta: '6 weeks · chat', icon: 'nutrition-outline', tint: colors.primary, reason: 'Your family doctor', group: 'team', },
    ],
  },

  {
    key: 'interested',
    title: 'Recommended for you',
    subtitle: 'Picked up from what you browsed and searched',
    icon: 'sparkles-outline',
    tint: colors.secondary,
    intervalSec: 25,
    items: [
      { id: 'in-1', name: 'Diabetes Reversal Plan – 90 Days', provider: 'Larazen Metabolic', kind: 'recovery_plan', price: 8999, meta: '90 days · team of 3', icon: 'fitness-outline', tint: colors.secondary, reason: 'You viewed this twice' },
      { id: 'in-2', name: 'Advanced Lipid Panel', provider: 'Larazen Diagnostics', kind: 'service', price: 2199, meta: 'Home collection', icon: 'flask-outline', tint: colors.secondary, reason: 'Based on your last lab report' },
      { id: 'in-3', name: 'Cardiac Longevity Plan – 12 Months', provider: 'Larazen Heart Institute', kind: 'advanced_plan', price: 27999, meta: '12 months · 3 doctors', icon: 'heart-circle-outline', tint: colors.secondary, reason: 'You searched cardiology' },
      { id: 'in-4', name: 'Sleep Study — Home', provider: 'Larazen Sleep Lab', kind: 'service', price: 4499, meta: '1 night · at home', icon: 'moon-outline', tint: colors.secondary, reason: 'You searched sleep' },
      { id: 'in-5', name: 'Stress & Burnout Programme', provider: 'Larazen Mind', kind: 'group_offering', price: 3999, meta: '6 weeks · group', icon: 'leaf-outline', tint: colors.secondary, reason: 'Popular with people like you' },
      { id: 'in-6', name: 'Physiotherapy Package — 6 weeks', provider: 'Dr. Suresh Iyer', kind: 'service', price: 5499, meta: '6 weeks · chat', icon: 'body-outline', tint: colors.secondary, reason: 'You bought this before' },
      { id: 'in-7', name: 'Thyroid Care Plan – 3 Months', provider: 'Larazen Endocrine', kind: 'recovery_plan', price: 3499, meta: '3 months', icon: 'pulse-outline', tint: colors.secondary, reason: 'Viewed last week' },
      { id: 'in-8', name: 'Executive Health Check', provider: 'Larazen Multispeciality', kind: 'service', price: 7999, meta: 'Full day · 40 tests', icon: 'briefcase-outline', tint: colors.secondary, reason: 'Matches your profile' },
    ],
  },

  {
    key: 'family',
    title: `Recommended for ${kid} & your family`,
    subtitle: 'Suited to the dependents on your account',
    icon: 'happy-outline',
    tint: colors.warningDark,
    intervalSec: 30,
    items: [
      { id: 'fa-1', name: 'Child Wellness Check – 5 to 12 yrs', provider: 'Larazen Paediatrics', kind: 'service', price: 1299, meta: '45 min · in person', icon: 'happy-outline', tint: colors.warningDark, reason: `${kid} is due a review` },
      { id: 'fa-2', name: 'Paediatric Vaccination Schedule', provider: 'Larazen Paediatrics', kind: 'service', price: 899, meta: 'Per visit', icon: 'shield-checkmark-outline', tint: colors.warningDark, reason: 'DPT booster due' },
      { id: 'fa-3', name: 'Childhood Asthma Care – 6 Months', provider: 'Dr. Meera Joshi', kind: 'recovery_plan', price: 6499, meta: '6 months · chat', icon: 'medkit-outline', tint: colors.warningDark, reason: `${kid}'s asthma history` },
      { id: 'fa-4', name: 'Growth & Nutrition Tracking', provider: 'Larazen Paediatrics', kind: 'service', price: 1799, meta: 'Quarterly reviews', icon: 'trending-up-outline', tint: colors.warningDark, reason: 'Growth monitoring on file' },
      { id: 'fa-5', name: 'Family Dental Package – 4 Members', provider: 'Larazen Dental', kind: 'group_offering', price: 4999, meta: '4 members', icon: 'people-outline', tint: colors.warningDark, reason: 'Covers your household' },
      { id: 'fa-6', name: 'Antenatal Care Programme', provider: 'Larazen Women’s Health', kind: 'group_offering', price: 12999, meta: '9 months · team', icon: 'heart-outline', tint: colors.warningDark, reason: 'Available to linked members' },
      { id: 'fa-7', name: 'Elder Care Plan – 12 Months', provider: 'Larazen Geriatrics', kind: 'advanced_plan', price: 18999, meta: '12 months · 3 doctors', icon: 'accessibility-outline', tint: colors.warningDark, reason: 'For Venkat Reddy' },
      { id: 'fa-8', name: 'Paediatric Video Consultation', provider: 'Larazen Paediatrics', kind: 'appointment', price: 450, meta: 'Same day', icon: 'videocam-outline', tint: colors.warningDark, reason: 'Quick access for minors' },
    ],
  },

  {
    key: 'fits',
    title: 'Fits your needs',
    subtitle: 'Matched to your records, plan and location',
    icon: 'options-outline',
    tint: colors.success,
    intervalSec: 35,
    items: [
      { id: 'ft-1', name: 'Home Sample Collection', provider: 'Larazen Diagnostics', kind: 'service', price: 199, meta: 'Same day · free on Care Plus', icon: 'water-outline', tint: colors.success, reason: 'Free on your membership' },
      { id: 'ft-2', name: 'Hypertension Monitoring – 3 Months', provider: 'Dr. Karthik Menon', kind: 'recovery_plan', price: 3999, meta: '3 months · chat', icon: 'pulse-outline', tint: colors.success, reason: 'Your BP readings' },
      { id: 'ft-3', name: 'Nutrition Programme — 12 weeks', provider: 'Dr. Neha Kulkarni', kind: 'service', price: 4999, meta: '12 weeks · chat', icon: 'nutrition-outline', tint: colors.success, reason: 'Borderline LDL on file' },
      { id: 'ft-4', name: 'Weekend Clinic Visit', provider: 'Larazen Multispeciality', kind: 'appointment', price: 700, meta: 'Sat & Sun slots', icon: 'calendar-outline', tint: colors.success, reason: 'Matches your usual times' },
      { id: 'ft-5', name: 'Annual Preventive Screening', provider: 'Larazen Diagnostics', kind: 'service', price: 3499, meta: '25 tests', icon: 'analytics-outline', tint: colors.success, reason: 'Last screening was a year ago' },
      { id: 'ft-6', name: 'Metabolic Longevity Plan – 6 Months', provider: 'Larazen Longevity', kind: 'advanced_plan', price: 19999, meta: '6 months · 3 doctors', icon: 'infinite-outline', tint: colors.success, reason: 'Fits your BMI and markers' },
      { id: 'ft-7', name: 'Physiotherapy — Home Sessions', provider: 'Dr. Suresh Iyer', kind: 'service', price: 6499, meta: '8 sessions · at home', icon: 'body-outline', tint: colors.success, reason: 'Near your address' },
      { id: 'ft-8', name: 'Instant Voice Consultation', provider: 'Next available doctor', kind: 'appointment', price: 400, meta: 'Avg wait 3 min', icon: 'call-outline', tint: colors.success, reason: 'For anything urgent' },
    ],
  },
];

/**
 * Which head an item belongs under. Tagged items say so themselves; untagged
 * ones derive it from the product kind — one person delivers a consultation
 * or a plain service, a team delivers everything that runs as a programme.
 */
export const groupOf = (r: RecoItem): 'solo' | 'team' =>
  r.group ?? (r.kind === 'appointment' || r.kind === 'service' ? 'solo' : 'team');

export const shelfByKey = (key: string) => shelves.find((s) => s.key === key) ?? null;
