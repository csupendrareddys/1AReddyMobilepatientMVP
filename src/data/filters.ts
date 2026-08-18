import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doctors } from './mock';

/**
 * The four filters every listing shares: symptoms, specialisation, gender and
 * organ. One taxonomy for all of them, because a patient who learns that
 * "Heart" narrows the doctor list expects the same chip to narrow a plan list
 * the same way — four screens with four private filter vocabularies is chaos.
 *
 * Matching is by keyword against the item's searchable text. The backend will
 * eventually tag products and doctors properly; the keyword maps stand in for
 * those tags and live here so they're replaced in one place.
 */

export type FilterState = {
  symptoms: string[];
  specializations: string[];
  clinical: string[];
  genders: string[];
  organs: string[];
  locations: string[];
};

export const emptyFilters = (): FilterState => ({
  symptoms: [], specializations: [], clinical: [], genders: [], organs: [], locations: [],
});

export const activeCount = (f: FilterState) =>
  f.symptoms.length + f.specializations.length + f.clinical.length
  + f.genders.length + f.organs.length + f.locations.length;

/* ── Taxonomy ─────────────────────────────────────────────────────── */

export type FilterOption = {
  key: string;
  label: string;
  /** What in an item's text marks it as a match. Lower-case. */
  keywords: string[];
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

/**
 * The patient's own city and its neighbourhoods — what "near me" resolves to
 * until real geolocation is wired in.
 */
const NEAR_ME_CITIES = [
  'hyderabad', 'jubilee', 'banjara', 'madhapur', 'gachibowli', 'kondapur', 'somajiguda',
];

export const SYMPTOMS: FilterOption[] = [
  { key: 'fever', label: 'Fever', icon: 'thermometer', keywords: ['fever', 'viral', 'instant', 'general physician'] },
  { key: 'cough_cold', label: 'Cough & cold', icon: 'emoticon-sick-outline', keywords: ['cold', 'cough', 'respiratory', 'pulmo', 'chest clinic', 'wheeze'] },
  { key: 'headache', label: 'Headache', icon: 'head-alert-outline', keywords: ['headache', 'migraine', 'neuro', 'general physician'] },
  { key: 'chest_pain', label: 'Chest pain', icon: 'heart-flash', keywords: ['cardio', 'heart', 'chest', 'palpitat', 'lipid'] },
  { key: 'breathless', label: 'Breathlessness', icon: 'lungs', keywords: ['breath', 'asthma', 'pulmo', 'sleep', 'respiratory'] },
  { key: 'skin_rash', label: 'Skin rash', icon: 'hand-back-right-outline', keywords: ['skin', 'derma', 'rash', 'itch', 'acne', 'eczema'] },
  { key: 'hair_fall', label: 'Hair fall', icon: 'content-cut', keywords: ['hair', 'trichol', 'derma'] },
  { key: 'joint_pain', label: 'Joint pain', icon: 'bone', keywords: ['joint', 'ortho', 'knee', 'physio', 'sports', 'arthro'] },
  { key: 'back_pain', label: 'Back pain', icon: 'human-white-cane', keywords: ['back', 'spine', 'ortho', 'physio', 'lumbar'] },
  { key: 'stomach', label: 'Stomach pain', icon: 'stomach', keywords: ['stomach', 'abdom', 'gastro', 'digest', 'acidity'] },
  { key: 'sugar', label: 'Diabetes / sugar', icon: 'diabetes', keywords: ['diabet', 'sugar', 'metabolic', 'endocrin', 'reversal'] },
  { key: 'bp', label: 'Blood pressure', icon: 'heart-pulse', keywords: ['hypertension', 'bp', 'blood pressure', 'cardio', 'heart'] },
  { key: 'thyroid_sym', label: 'Thyroid', icon: 'butterfly-outline', keywords: ['thyroid', 'endocrin'] },
  { key: 'sleep', label: "Can't sleep", icon: 'sleep', keywords: ['sleep', 'insomnia', 'mind', 'stress'] },
  { key: 'anxiety', label: 'Stress & anxiety', icon: 'meditation', keywords: ['stress', 'anxiety', 'burnout', 'mind', 'psychiat', 'mental'] },
  { key: 'periods', label: 'Period problems', icon: 'calendar-heart', keywords: ['gynae', 'women', 'menstrual', 'period', 'obstet'] },
  { key: 'child_fever', label: 'Child unwell', icon: 'baby-face-outline', keywords: ['paediatric', 'child', 'kids', 'vaccination'] },
  { key: 'fatigue', label: 'Tiredness', icon: 'battery-low', keywords: ['fatigue', 'tired', 'anaemia', 'vitamin', 'general physician', 'health check'] },
];

export const SPECIALIZATIONS: FilterOption[] = [
  { key: 'gp', label: 'General Physician', icon: 'stethoscope', keywords: ['general physician', 'internal medicine', 'family doctor'] },
  { key: 'cardio', label: 'Cardiology', icon: 'heart-pulse', keywords: ['cardio', 'heart'] },
  { key: 'derma', label: 'Dermatology', icon: 'hand-back-right-outline', keywords: ['derma', 'skin', 'trichol'] },
  { key: 'ortho', label: 'Orthopaedics', icon: 'bone', keywords: ['ortho', 'sports injury', 'joint', 'bone'] },
  { key: 'gynae', label: 'Gynaecology', icon: 'human-female', keywords: ['gynae', 'obstet', 'women'] },
  { key: 'paeds', label: 'Paediatrics', icon: 'baby-face-outline', keywords: ['paediatric', 'child'] },
  { key: 'psych', label: 'Psychiatry', icon: 'brain', keywords: ['psychiat', 'mental', 'mind', 'behavioural'] },
  { key: 'pulmo', label: 'Pulmonology', icon: 'lungs', keywords: ['pulmo', 'sleep medicine', 'respiratory', 'chest'] },
  { key: 'endo', label: 'Endocrinology', icon: 'butterfly-outline', keywords: ['endocrin', 'thyroid', 'diabet', 'metabolic'] },
  { key: 'nephro', label: 'Nephrology', icon: 'water-outline', keywords: ['nephro', 'kidney', 'renal', 'transplant'] },
  { key: 'surgery', label: 'General Surgery', icon: 'medical-bag', keywords: ['surgeon', 'surgery', 'laparoscop'] },
  { key: 'nutrition', label: 'Nutrition', icon: 'food-apple-outline', keywords: ['nutrition', 'diet'] },
];

/**
 * Clinical specialisation — the sub-speciality, one level below the department.
 *
 * "Cardiology" is where a patient starts; "interventional cardiology" or
 * "preventive cardiology" is what actually decides whether this is the right
 * doctor for a stent or for a cholesterol plan. Kept separate from
 * SPECIALIZATIONS so the broad filter stays usable by people who don't know
 * the finer names.
 */
export const CLINICAL: FilterOption[] = [
  { key: 'preventive_cardio', label: 'Preventive cardiology', icon: 'heart-plus-outline', keywords: ['preventive cardio', 'lipid', 'cholesterol', 'cardio'] },
  { key: 'interventional', label: 'Interventional cardiology', icon: 'heart-flash', keywords: ['interventional', 'angio', 'stent', 'cardio'] },
  { key: 'diabetology', label: 'Diabetology', icon: 'diabetes', keywords: ['diabet', 'sugar', 'metabolic', 'reversal'] },
  { key: 'thyroid_care', label: 'Thyroid care', icon: 'butterfly-outline', keywords: ['thyroid', 'endocrin'] },
  { key: 'sports_injury', label: 'Sports injury', icon: 'run', keywords: ['sports', 'injury', 'ortho', 'physio'] },
  { key: 'joint_replacement', label: 'Joint replacement', icon: 'bone', keywords: ['joint', 'knee', 'hip', 'replacement', 'ortho', 'arthro'] },
  { key: 'trichology', label: 'Trichology', icon: 'content-cut', keywords: ['trichol', 'hair', 'derma'] },
  { key: 'cosmetic_derm', label: 'Cosmetic dermatology', icon: 'face-woman-shimmer-outline', keywords: ['cosmetic', 'acne', 'skin', 'derma'] },
  { key: 'neonatology', label: 'Neonatology', icon: 'baby-bottle-outline', keywords: ['neonat', 'newborn', 'paediatric', 'child'] },
  { key: 'child_nutrition', label: 'Child nutrition', icon: 'food-apple-outline', keywords: ['child nutrition', 'growth', 'paediatric', 'nutrition'] },
  { key: 'antenatal', label: 'Antenatal care', icon: 'human-pregnant', keywords: ['antenatal', 'obstet', 'pregnan', 'gynae'] },
  { key: 'fertility', label: 'Fertility', icon: 'baby-face-outline', keywords: ['fertility', 'ivf', 'gynae', 'obstet'] },
  { key: 'sleep_medicine', label: 'Sleep medicine', icon: 'sleep', keywords: ['sleep', 'pulmo', 'insomnia', 'apnoea'] },
  { key: 'asthma_care', label: 'Asthma & allergy', icon: 'lungs', keywords: ['asthma', 'allerg', 'pulmo', 'respiratory', 'wheeze'] },
  { key: 'transplant', label: 'Transplant care', icon: 'water-outline', keywords: ['transplant', 'nephro', 'kidney', 'renal'] },
  { key: 'laparoscopy', label: 'Laparoscopic surgery', icon: 'medical-bag', keywords: ['laparoscop', 'surgeon', 'surgery', 'hernia'] },
  { key: 'cbt', label: 'Cognitive behavioural therapy', icon: 'brain', keywords: ['cognitive', 'behavioural', 'psychiat', 'mind', 'stress'] },
  { key: 'geriatric', label: 'Geriatric care', icon: 'human-cane', keywords: ['geriatric', 'elder', 'ageing', 'longevity'] },
  { key: 'palliative', label: 'Palliative care', icon: 'hand-heart-outline', keywords: ['palliative', 'comfort', 'chronic'] },
  { key: 'rehab', label: 'Rehabilitation', icon: 'walk', keywords: ['rehab', 'physio', 'recovery', 'strength'] },
];

export const GENDERS: FilterOption[] = [
  { key: 'female', label: 'Female', icon: 'gender-female', keywords: [] },
  { key: 'male', label: 'Male', icon: 'gender-male', keywords: [] },
  { key: 'other', label: 'Other', icon: 'gender-transgender', keywords: [] },
];

export const ORGANS: FilterOption[] = [
  { key: 'heart', label: 'Heart', icon: 'heart-pulse', keywords: ['cardio', 'heart', 'lipid', 'bp', 'hypertension'] },
  { key: 'lungs', label: 'Lungs', icon: 'lungs', keywords: ['pulmo', 'respiratory', 'asthma', 'sleep', 'chest'] },
  { key: 'kidney', label: 'Kidneys', icon: 'water-outline', keywords: ['nephro', 'kidney', 'renal'] },
  { key: 'brain', label: 'Brain & mind', icon: 'brain', keywords: ['neuro', 'psychiat', 'mind', 'stress', 'mental', 'sleep'] },
  { key: 'stomach_o', label: 'Stomach & gut', icon: 'stomach', keywords: ['gastro', 'stomach', 'digest', 'acidity', 'metabolic'] },
  { key: 'bones', label: 'Bones & joints', icon: 'bone', keywords: ['ortho', 'joint', 'bone', 'physio', 'knee', 'spine'] },
  { key: 'skin_o', label: 'Skin & hair', icon: 'hand-back-right-outline', keywords: ['derma', 'skin', 'hair', 'rash'] },
  { key: 'eyes', label: 'Eyes', icon: 'eye-outline', keywords: ['eye', 'ophthal', 'cataract', 'vision'] },
  { key: 'teeth', label: 'Teeth', icon: 'tooth-outline', keywords: ['dental', 'tooth', 'teeth'] },
  { key: 'thyroid_o', label: 'Thyroid', icon: 'butterfly-outline', keywords: ['thyroid', 'endocrin'] },
  { key: 'womb', label: "Women's health", icon: 'human-female', keywords: ['gynae', 'obstet', 'women', 'antenatal', 'menstrual'] },
];

/**
 * Where care is delivered.
 *
 * "Near me" is first because it's what most people actually mean, and it
 * matches on the cities this account's providers practise in rather than on a
 * real device location — the permission prompt and geolocation belong to the
 * app shell, not the filter.
 */
export const LOCATIONS: FilterOption[] = [
  { key: 'near_me', label: 'Near me', icon: 'crosshairs-gps', keywords: NEAR_ME_CITIES },
  { key: 'telangana', label: 'Telangana', icon: 'map-marker-outline', keywords: ['hyderabad', 'jubilee', 'banjara', 'madhapur', 'gachibowli', 'kondapur', 'somajiguda', 'telangana', 'secunderabad'] },
  { key: 'andhra', label: 'Andhra Pradesh', icon: 'map-marker-outline', keywords: ['vijayawada', 'visakhapatnam', 'guntur', 'tirupati', 'andhra'] },
  { key: 'karnataka', label: 'Karnataka', icon: 'map-marker-outline', keywords: ['bengaluru', 'bangalore', 'mysuru', 'cubbon', 'karnataka'] },
  { key: 'tamil_nadu', label: 'Tamil Nadu', icon: 'map-marker-outline', keywords: ['chennai', 'coimbatore', 'madurai', 'tamil'] },
  { key: 'maharashtra', label: 'Maharashtra', icon: 'map-marker-outline', keywords: ['mumbai', 'pune', 'nagpur', 'maharashtra'] },
  { key: 'delhi', label: 'Delhi NCR', icon: 'map-marker-outline', keywords: ['delhi', 'gurugram', 'noida', 'ncr'] },
  { key: 'kerala', label: 'Kerala', icon: 'map-marker-outline', keywords: ['kochi', 'thiruvananthapuram', 'kozhikode', 'kerala'] },
  { key: 'west_bengal', label: 'West Bengal', icon: 'map-marker-outline', keywords: ['kolkata', 'howrah', 'bengal'] },
  { key: 'gujarat', label: 'Gujarat', icon: 'map-marker-outline', keywords: ['ahmedabad', 'surat', 'vadodara', 'gujarat'] },
  { key: 'rajasthan', label: 'Rajasthan', icon: 'map-marker-outline', keywords: ['jaipur', 'jodhpur', 'udaipur', 'rajasthan'] },
  { key: 'up', label: 'Uttar Pradesh', icon: 'map-marker-outline', keywords: ['lucknow', 'kanpur', 'varanasi', 'uttar pradesh'] },
  { key: 'online', label: 'Online only', icon: 'video-outline', keywords: ['video', 'online', 'chat', 'voice', 'instant', 'teleconsult'] },
];

export const FILTER_GROUPS = [
  { key: 'symptoms' as const, label: 'Symptoms', options: SYMPTOMS },
  { key: 'specializations' as const, label: 'Specialisation', options: SPECIALIZATIONS },
  { key: 'clinical' as const, label: 'Clinical specialisation', options: CLINICAL },
  { key: 'genders' as const, label: 'Gender', options: GENDERS },
  { key: 'organs' as const, label: 'Organ', options: ORGANS },
  { key: 'locations' as const, label: 'Location', options: LOCATIONS },
];

/* ── Doctor gender ────────────────────────────────────────────────── */

/** The backend carries this on the doctor row; a map stands in for it. */
const DOCTOR_GENDER: Record<string, 'female' | 'male'> = {
  d1: 'female', d2: 'male', d3: 'female', d4: 'male', d5: 'female',
  d6: 'female', d7: 'male', d8: 'female', d9: 'male', d10: 'female',
  d11: 'male', d12: 'female', d13: 'male', d14: 'female',
};

export const genderOfDoctor = (doctorId: string): string | undefined =>
  DOCTOR_GENDER[doctorId];

/** For rows that carry the doctor's name rather than an id. */
export const genderOfName = (name: string | undefined): string | undefined => {
  if (!name) return undefined;
  const d = doctors.find((x) => x.full_name === name.trim());
  return d ? DOCTOR_GENDER[d.id] : undefined;
};

/* ── Matching ─────────────────────────────────────────────────────── */

const anyKeywordHits = (text: string, keys: string[], options: FilterOption[]) =>
  keys.some((k) => {
    const opt = options.find((o) => o.key === k);
    return opt?.keywords.some((w) => text.includes(w));
  });

/**
 * Whether one row survives the active filters.
 *
 * Within a group, selections are ORed (Fever or Cough matches either); across
 * groups they're ANDed (Female and Heart means a female cardiologist). A
 * gender filter only passes rows whose gender is actually known — a lab or a
 * whole hospital is not an answer to "show me female doctors".
 */
export function matchesFilters(
  searchText: string,
  gender: string | undefined,
  f: FilterState,
): boolean {
  const text = searchText.toLowerCase();
  if (f.symptoms.length && !anyKeywordHits(text, f.symptoms, SYMPTOMS)) return false;
  if (f.specializations.length && !anyKeywordHits(text, f.specializations, SPECIALIZATIONS)) return false;
  if (f.clinical.length && !anyKeywordHits(text, f.clinical, CLINICAL)) return false;
  if (f.organs.length && !anyKeywordHits(text, f.organs, ORGANS)) return false;
  if (f.locations.length && !anyKeywordHits(text, f.locations, LOCATIONS)) return false;
  if (f.genders.length && !(gender && f.genders.includes(gender))) return false;
  return true;
}
