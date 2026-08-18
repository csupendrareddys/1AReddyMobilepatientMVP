import {
  ProfileField, ProfileGroup, RecordEntry, PrescriptionItem,
  profileGroups as selfProfileGroups,
  vitals as selfVitals, habits as selfHabits,
  surgeries as selfSurgeries, generalRecords as selfGeneral,
  providerPrescriptions as selfProviderRx, otherRecords as selfOther,
  prescriptions as selfPrescriptions,
} from './mock';

/**
 * Per-minor profile and health data.
 *
 * A minor is a login-less sub-account: they have their own profile sections and
 * their own medical record, but no Family Group of their own (the web makes the
 * same exclusion) and no contact identity of their own — the guardian's phone
 * is the contact of record.
 */
export type MinorRecord = {
  profileGroups: Record<string, ProfileGroup[]>;
  vitals: Record<string, string>;
  habits: Record<string, string>;
  surgeries: RecordEntry[];
  generalRecords: RecordEntry[];
  providerPrescriptions: RecordEntry[];
  otherRecords: RecordEntry[];
  prescriptions: PrescriptionItem[];
};

/**
 * The web's four Female Health fields, blank.
 *
 * Every profile carries the section — whether it's *shown* is a separate
 * question (see `showsFemaleHealth`). Without it, switching a minor's gender to
 * female would reveal the tab and then render nothing.
 */
export const femaleHealthGroup = (): ProfileGroup[] => [
  {
    key: 'female_health',
    title: 'Female Health',
    fields: [
      { key: 'lmp_date', label: 'LMP Date', value: '', type: 'date' },
      { key: 'lmp_remarks', label: 'LMP Remarks', value: '', type: 'multiline' },
      {
        key: 'pregnancy_status',
        label: 'Pregnancy Status',
        value: 'Not pregnant',
        type: 'select',
        options: ['Not pregnant', 'Pregnant', 'Planning pregnancy', 'Post-partum'],
      },
      { key: 'pregnancy_remarks', label: 'Pregnancy Remarks', value: '', type: 'multiline' },
    ],
  },
];

/** Years old on today's demo date, from a `YYYY-MM-DD` string. */
export function ageFromDob(dob: string): number | null {
  const y = Number(String(dob).slice(0, 4));
  return Number.isFinite(y) && y > 1900 ? 2026 - y : null;
}

/**
 * Whether to offer the Female Health section.
 *
 * The web gates on gender alone, which would put LMP and pregnancy questions on
 * a four-year-old's profile. We keep the gender gate and add an age floor: an
 * unknown date of birth still shows it (better than hiding a section an adult
 * needs), a known one under 12 doesn't.
 */
export function showsFemaleHealth(gender: string, dob: string): boolean {
  if (gender.toLowerCase() !== 'female') return false;
  const age = ageFromDob(dob);
  return age === null || age >= 12;
}

const arjun: MinorRecord = {
  profileGroups: {
    personal: [
      {
        key: 'personal_details',
        title: 'Personal Details',
        fields: [
          { key: 'first_name', label: 'First Name', value: 'Arjun' },
          { key: 'middle_name', label: 'Middle Name', value: '' },
          { key: 'last_name', label: 'Last Name', value: 'Reddy' },
          { key: 'dob', label: 'Date of Birth', value: '2018-02-14', type: 'date' },
          { key: 'gender', label: 'Gender', value: 'Male', type: 'select', options: ['Male', 'Female', 'Other'] },
          { key: 'blood_group', label: 'Blood Group', value: 'O+', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
          { key: 'languages_known', label: 'Languages Known', value: 'English, Telugu' },
        ],
      },
      {
        key: 'contact_identity',
        title: 'Contact & Identity',
        fields: [
          { key: 'phone_number', label: 'Phone Number', value: '+91 98450 12345 (guardian)' },
          { key: 'email', label: 'Email', value: '' },
          { key: 'aadhar_number', label: 'Aadhar Number', value: 'XXXX XXXX 8821' },
          { key: 'citizenship', label: 'Citizenship', value: 'Indian' },
        ],
      },
      {
        key: 'address',
        title: 'Address',
        fields: [
          { key: 'address_line', label: 'Address', value: '12-4-88, Jubilee Hills', type: 'multiline' },
          { key: 'city', label: 'City', value: 'Hyderabad' },
          { key: 'state', label: 'State', value: 'Telangana' },
          { key: 'pincode', label: 'Pincode', value: '500033', type: 'number' },
        ],
      },
      {
        key: 'emergency_contact',
        title: 'Emergency Contact',
        fields: [
          { key: 'emergency_contact_name', label: 'Contact Name', value: 'Rohit Reddy' },
          { key: 'emergency_contact_phone', label: 'Contact Phone', value: '+91 98450 12345' },
          { key: 'emergency_contact_relation', label: 'Relation', value: 'Father', type: 'select', options: ['Father', 'Mother', 'Guardian'] },
        ],
      },
    ],
    insurance: [
      {
        key: 'insurance',
        title: 'Insurance',
        fields: [
          { key: 'insurance_provider', label: 'Insurance Provider', value: 'Star Health (family floater)' },
          { key: 'insurance_policy_number', label: 'Policy Number', value: 'SH-4471-99820' },
          { key: 'insurance_valid_till', label: 'Valid Till', value: '2027-03-31', type: 'date' },
          { key: 'insurance_coverage_amount', label: 'Coverage Amount', value: 'Shared — ₹5,00,000' },
        ],
      },
    ],
    female_health: femaleHealthGroup(),
    vitals: [
      {
        key: 'vitals',
        title: 'Vitals',
        fields: [
          { key: 'height_cm', label: 'Height (cm)', value: '128', type: 'number' },
          { key: 'weight_kg', label: 'Weight (kg)', value: '26', type: 'number' },
          { key: 'bmi', label: 'BMI', value: '15.9', type: 'number' },
          { key: 'blood_pressure_systolic', label: 'BP Systolic (mmHg)', value: '96', type: 'number' },
          { key: 'blood_pressure_diastolic', label: 'BP Diastolic (mmHg)', value: '62', type: 'number' },
          { key: 'heart_rate', label: 'Heart Rate (bpm)', value: '92', type: 'number' },
          { key: 'temperature', label: 'Temperature (°F)', value: '98.2', type: 'number' },
        ],
      },
    ],
    habits: [
      {
        key: 'habits',
        title: 'Habits & Lifestyle',
        fields: [
          { key: 'diet', label: 'Diet', value: 'Vegetarian', type: 'select', options: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian'] },
          { key: 'exercise', label: 'Exercise', value: 'Outdoor play, ~1 hr daily' },
          { key: 'sleep_pattern', label: 'Sleep Pattern', value: '9–10 hours' },
          { key: 'screen_time', label: 'Screen Time', value: '1 hr / day' },
        ],
      },
    ],
  },
  vitals: {
    blood_group: 'O+',
    height: '128 cm',
    weight: '26 kg',
    bmi: '15.9',
    blood_pressure: '96/62 mmHg',
    pulse: '92 bpm',
    temperature: '98.2 °F',
    spo2: '99%',
    last_recorded: '2026-07-12',
  },
  habits: {
    diet: 'Vegetarian',
    exercise: 'Outdoor play, ~1 hr daily',
    sleep: '9–10 hours',
    screen_time: '1 hr / day',
    allergies: 'Dust',
  },
  surgeries: [],
  generalRecords: [
    {
      id: 'ar-gr1',
      record_type: 'diagnosis',
      record_date: '2025-08-19',
      details: 'Condition: Mild intermittent asthma  ·  Trigger: Dust, exertion  ·  Status: Well controlled',
      notes: 'Reliever inhaler as needed. No night-time symptoms.',
      attachments: [],
    },
    {
      id: 'ar-gr2',
      record_type: 'vaccination',
      record_date: '2026-02-20',
      details: 'Vaccine: DPT Booster  ·  Dose: 2nd booster  ·  Site: Left arm',
      attachments: [{ id: 'ar-a1', filename: 'Immunisation_Card.pdf' }],
    },
    {
      id: 'ar-gr3',
      record_type: 'lab_report',
      record_date: '2026-06-30',
      details: 'Haemoglobin: 12.4 g/dL  ·  WBC: 7,200 /µL  ·  Eosinophils: 6%',
      notes: 'Complete blood count — mildly raised eosinophils, consistent with atopy.',
      attachments: [{ id: 'ar-a2', filename: 'CBC_Jun2026.pdf' }],
    },
    {
      id: 'ar-gr4',
      record_type: 'growth_monitoring',
      record_date: '2026-07-12',
      details: 'Height: 128 cm (60th centile)  ·  Weight: 26 kg (55th centile)  ·  BMI: 15.9',
      attachments: [],
    },
  ],
  providerPrescriptions: [
    {
      id: 'ar-pr1',
      record_type: 'prescription',
      record_date: '2025-08-19',
      details: 'Prescribed by: Dr. Anitha Rao  ·  Diagnosis: Mild intermittent asthma  ·  Medicines: 1',
      attachments: [{ id: 'ar-a3', filename: 'Rx_Arjun_Aug2025.pdf' }],
    },
  ],
  otherRecords: [
    {
      id: 'ar-or1',
      record_type: 'birth_certificate',
      record_date: '2018-03-02',
      details: 'Issued by: GHMC Hyderabad  ·  Registration no: 2018/HYD/44821',
      attachments: [{ id: 'ar-a4', filename: 'Birth_Certificate.pdf' }],
    },
    {
      id: 'ar-or2',
      record_type: 'school_health_card',
      record_date: '2026-06-05',
      details: 'School: Little Scholars  ·  Fitness: Cleared for sports',
      attachments: [],
    },
  ],
  prescriptions: [
    {
      id: 'ar-rx1',
      doctor_name: 'Dr. Anitha Rao',
      date: '2025-08-19',
      diagnosis: 'Mild intermittent asthma',
      medicines: [
        { name: 'Salbutamol inhaler 100mcg', dosage: '2 puffs', duration: 'As needed', instructions: 'With spacer' },
      ],
      lab_tests: ['Absolute Eosinophil Count'],
      advice: 'Avoid dust exposure. Use spacer for every dose. Warm-up before sport.',
      follow_up: '2026-08-19',
    },
  ],
};

const aarohi: MinorRecord = {
  profileGroups: {
    personal: [
      {
        key: 'personal_details',
        title: 'Personal Details',
        fields: [
          { key: 'first_name', label: 'First Name', value: 'Aarohi' },
          { key: 'middle_name', label: 'Middle Name', value: '' },
          { key: 'last_name', label: 'Last Name', value: 'Reddy' },
          { key: 'dob', label: 'Date of Birth', value: '2021-09-03', type: 'date' },
          { key: 'gender', label: 'Gender', value: 'Female', type: 'select', options: ['Male', 'Female', 'Other'] },
          { key: 'blood_group', label: 'Blood Group', value: 'A+', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
          { key: 'languages_known', label: 'Languages Known', value: 'Telugu' },
        ],
      },
      {
        key: 'contact_identity',
        title: 'Contact & Identity',
        fields: [
          { key: 'phone_number', label: 'Phone Number', value: '+91 98450 12345 (guardian)' },
          { key: 'email', label: 'Email', value: '' },
          { key: 'aadhar_number', label: 'Aadhar Number', value: 'XXXX XXXX 9145' },
          { key: 'citizenship', label: 'Citizenship', value: 'Indian' },
        ],
      },
      {
        key: 'address',
        title: 'Address',
        fields: [
          { key: 'address_line', label: 'Address', value: '12-4-88, Jubilee Hills', type: 'multiline' },
          { key: 'city', label: 'City', value: 'Hyderabad' },
          { key: 'state', label: 'State', value: 'Telangana' },
          { key: 'pincode', label: 'Pincode', value: '500033', type: 'number' },
        ],
      },
      {
        key: 'emergency_contact',
        title: 'Emergency Contact',
        fields: [
          { key: 'emergency_contact_name', label: 'Contact Name', value: 'Meena Reddy' },
          { key: 'emergency_contact_phone', label: 'Contact Phone', value: '+91 98450 67890' },
          { key: 'emergency_contact_relation', label: 'Relation', value: 'Mother', type: 'select', options: ['Father', 'Mother', 'Guardian'] },
        ],
      },
    ],
    insurance: [
      {
        key: 'insurance',
        title: 'Insurance',
        fields: [
          { key: 'insurance_provider', label: 'Insurance Provider', value: 'Star Health (family floater)' },
          { key: 'insurance_policy_number', label: 'Policy Number', value: 'SH-4471-99820' },
          { key: 'insurance_valid_till', label: 'Valid Till', value: '2027-03-31', type: 'date' },
          { key: 'insurance_coverage_amount', label: 'Coverage Amount', value: 'Shared — ₹5,00,000' },
        ],
      },
    ],
    female_health: femaleHealthGroup(),
    vitals: [
      {
        key: 'vitals',
        title: 'Vitals',
        fields: [
          { key: 'height_cm', label: 'Height (cm)', value: '108', type: 'number' },
          { key: 'weight_kg', label: 'Weight (kg)', value: '17', type: 'number' },
          { key: 'bmi', label: 'BMI', value: '14.6', type: 'number' },
          { key: 'blood_pressure_systolic', label: 'BP Systolic (mmHg)', value: '92', type: 'number' },
          { key: 'blood_pressure_diastolic', label: 'BP Diastolic (mmHg)', value: '58', type: 'number' },
          { key: 'heart_rate', label: 'Heart Rate (bpm)', value: '98', type: 'number' },
          { key: 'temperature', label: 'Temperature (°F)', value: '98.4', type: 'number' },
        ],
      },
    ],
    habits: [
      {
        key: 'habits',
        title: 'Habits & Lifestyle',
        fields: [
          { key: 'diet', label: 'Diet', value: 'Vegetarian', type: 'select', options: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian'] },
          { key: 'exercise', label: 'Exercise', value: 'Active play' },
          { key: 'sleep_pattern', label: 'Sleep Pattern', value: '11 hours + nap' },
          { key: 'screen_time', label: 'Screen Time', value: '30 min / day' },
        ],
      },
    ],
  },
  vitals: {
    blood_group: 'A+',
    height: '108 cm',
    weight: '17 kg',
    bmi: '14.6',
    blood_pressure: '92/58 mmHg',
    pulse: '98 bpm',
    temperature: '98.4 °F',
    spo2: '99%',
    last_recorded: '2026-08-01',
  },
  habits: {
    diet: 'Vegetarian',
    exercise: 'Active play',
    sleep: '11 hours + afternoon nap',
    screen_time: '30 min / day',
    allergies: 'None known',
  },
  surgeries: [],
  generalRecords: [
    {
      id: 'aa-gr1',
      record_type: 'vaccination',
      record_date: '2026-03-10',
      details: 'Vaccine: MMR  ·  Dose: 2nd  ·  Site: Right thigh',
      attachments: [{ id: 'aa-a1', filename: 'Immunisation_Card.pdf' }],
    },
    {
      id: 'aa-gr2',
      record_type: 'growth_monitoring',
      record_date: '2026-08-01',
      details: 'Height: 108 cm (65th centile)  ·  Weight: 17 kg (58th centile)  ·  BMI: 14.6',
      notes: 'Growth tracking along expected centile.',
      attachments: [],
    },
    {
      id: 'aa-gr3',
      record_type: 'consultation',
      record_date: '2026-05-22',
      details: 'Doctor: Dr. Anitha Rao  ·  Reason: Recurrent cold  ·  Outcome: Viral, supportive care',
      attachments: [],
    },
  ],
  providerPrescriptions: [
    {
      id: 'aa-pr1',
      record_type: 'prescription',
      record_date: '2026-05-22',
      details: 'Prescribed by: Dr. Anitha Rao  ·  Diagnosis: Viral upper respiratory infection  ·  Medicines: 2',
      attachments: [{ id: 'aa-a2', filename: 'Rx_Aarohi_May2026.pdf' }],
    },
  ],
  otherRecords: [
    {
      id: 'aa-or1',
      record_type: 'birth_certificate',
      record_date: '2021-09-20',
      details: 'Issued by: GHMC Hyderabad  ·  Registration no: 2021/HYD/77310',
      attachments: [{ id: 'aa-a3', filename: 'Birth_Certificate.pdf' }],
    },
  ],
  prescriptions: [
    {
      id: 'aa-rx1',
      doctor_name: 'Dr. Anitha Rao',
      date: '2026-05-22',
      diagnosis: 'Viral upper respiratory infection',
      medicines: [
        { name: 'Paracetamol syrup 250mg/5ml', dosage: '5 ml', duration: '3 days', instructions: 'If fever above 100°F' },
        { name: 'Multivitamin drops', dosage: '1 ml, once daily', duration: '30 days', instructions: 'After breakfast' },
      ],
      lab_tests: [],
      advice: 'Plenty of fluids and rest. Return if fever persists beyond 3 days.',
      follow_up: '2026-05-29',
    },
  ],
};

const BY_ID: Record<string, MinorRecord> = { mn1: arjun, mn2: aarohi };

/* ── Minors added in-session ──────────────────────────────────────── */

export type NewMinorInput = {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  guardian_name: string;
  guardian_phone: string;
  /** Field key → value, from the Vitals block of the add form. */
  vitals: Record<string, string>;
  /** Field key → value, from the Habits block. */
  habits: Record<string, string>;
  female_health: Record<string, string>;
  /** Anything the standard fields didn't cover, per section. */
  extra: { section: 'vitals' | 'habits'; label: string; value: string }[];
  documents: { id: string; filename: string }[];
};

const fieldsWith = (fields: ProfileField[], values: Record<string, string>) =>
  fields.map((f) => ({ ...f, value: values[f.key] ?? f.value }));

const customFields = (input: NewMinorInput, section: 'vitals' | 'habits'): ProfileField[] =>
  input.extra
    .filter((x) => x.section === section && x.label.trim())
    .map((x, i) => ({ key: `${section}_custom_${i}`, label: x.label.trim(), value: x.value.trim() }));

/**
 * Build a full record for a minor the guardian just added.
 *
 * A new minor gets the same section structure as an existing one — empty where
 * nothing was entered — so every profile screen works the moment they're
 * created, rather than only for the two seeded children.
 */
export function createMinorRecord(input: NewMinorInput): MinorRecord {
  const name = `${input.first_name} ${input.last_name}`.trim();

  return {
    profileGroups: {
      personal: [
        {
          key: 'personal_details',
          title: 'Personal Details',
          fields: [
            { key: 'first_name', label: 'First Name', value: input.first_name },
            { key: 'middle_name', label: 'Middle Name', value: '' },
            { key: 'last_name', label: 'Last Name', value: input.last_name },
            { key: 'dob', label: 'Date of Birth', value: input.dob, type: 'date' },
            { key: 'gender', label: 'Gender', value: input.gender, type: 'select', options: ['Male', 'Female', 'Other'] },
            { key: 'blood_group', label: 'Blood Group', value: input.blood_group, type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
            { key: 'languages_known', label: 'Languages Known', value: '' },
          ],
        },
        {
          key: 'contact_identity',
          title: 'Contact & Identity',
          fields: [
            { key: 'phone_number', label: 'Phone Number', value: `${input.guardian_phone} (guardian)` },
            { key: 'email', label: 'Email', value: '' },
            { key: 'aadhar_number', label: 'Aadhar Number', value: '' },
            { key: 'citizenship', label: 'Citizenship', value: 'Indian' },
          ],
        },
        {
          key: 'address',
          title: 'Address',
          fields: [
            { key: 'address_line', label: 'Address', value: '', type: 'multiline' },
            { key: 'city', label: 'City', value: '' },
            { key: 'state', label: 'State', value: '' },
            { key: 'pincode', label: 'Pincode', value: '', type: 'number' },
          ],
        },
        {
          key: 'emergency_contact',
          title: 'Emergency Contact',
          fields: [
            { key: 'emergency_contact_name', label: 'Contact Name', value: input.guardian_name },
            { key: 'emergency_contact_phone', label: 'Contact Phone', value: input.guardian_phone },
            { key: 'emergency_contact_relation', label: 'Relation', value: 'Guardian', type: 'select', options: ['Father', 'Mother', 'Guardian'] },
          ],
        },
      ],
      insurance: [
        {
          key: 'insurance',
          title: 'Insurance',
          fields: [
            { key: 'insurance_provider', label: 'Insurance Provider', value: '' },
            { key: 'insurance_policy_number', label: 'Policy Number', value: '' },
            { key: 'insurance_valid_till', label: 'Valid Till', value: '', type: 'date' },
            { key: 'insurance_coverage_amount', label: 'Coverage Amount', value: '' },
          ],
        },
      ],
      female_health: [
        {
          ...femaleHealthGroup()[0],
          fields: fieldsWith(femaleHealthGroup()[0].fields, input.female_health),
        },
      ],
      vitals: [
        {
          key: 'vitals',
          title: 'Vitals',
          fields: [
            ...fieldsWith([
              { key: 'height_cm', label: 'Height (cm)', value: '', type: 'number' },
              { key: 'weight_kg', label: 'Weight (kg)', value: '', type: 'number' },
              { key: 'blood_pressure_systolic', label: 'BP Systolic (mmHg)', value: '', type: 'number' },
              { key: 'blood_pressure_diastolic', label: 'BP Diastolic (mmHg)', value: '', type: 'number' },
              { key: 'heart_rate', label: 'Heart Rate (bpm)', value: '', type: 'number' },
              { key: 'temperature', label: 'Temperature (°F)', value: '', type: 'number' },
              { key: 'blood_sugar_fasting', label: 'Blood Sugar — Fasting (mg/dL)', value: '', type: 'number' },
            ], input.vitals),
            ...customFields(input, 'vitals'),
          ],
        },
      ],
      habits: [
        {
          key: 'habits',
          title: 'Habits & Lifestyle',
          fields: [
            ...fieldsWith([
              { key: 'diet', label: 'Diet', value: 'Vegetarian', type: 'select', options: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian'] },
              { key: 'exercise', label: 'Exercise', value: '' },
              { key: 'sleep_pattern', label: 'Sleep Pattern', value: '' },
              { key: 'screen_time', label: 'Screen Time', value: '' },
              { key: 'allergies', label: 'Allergies', value: '' },
            ], input.habits),
            ...customFields(input, 'habits'),
          ],
        },
      ],
    },
    vitals: {
      blood_group: input.blood_group,
      height: input.vitals.height_cm ? `${input.vitals.height_cm} cm` : '—',
      weight: input.vitals.weight_kg ? `${input.vitals.weight_kg} kg` : '—',
      blood_pressure: input.vitals.blood_pressure_systolic
        ? `${input.vitals.blood_pressure_systolic}/${input.vitals.blood_pressure_diastolic || '—'} mmHg` : '—',
      pulse: input.vitals.heart_rate ? `${input.vitals.heart_rate} bpm` : '—',
      temperature: input.vitals.temperature ? `${input.vitals.temperature} °F` : '—',
    },
    habits: {
      diet: input.habits.diet || '—',
      exercise: input.habits.exercise || '—',
      sleep: input.habits.sleep_pattern || '—',
      screen_time: input.habits.screen_time || '—',
      allergies: input.habits.allergies || 'None recorded',
    },
    surgeries: [],
    // Documents attached while adding the child start life as their first
    // health record, so nothing the guardian uploaded is stranded.
    generalRecords: input.documents.length ? [{
      id: `${input.id}-gr1`,
      record_type: 'uploaded_at_signup',
      record_date: '2026-08-18',
      details: `Documents added when ${input.first_name || name} was created.`,
      attachments: input.documents,
    }] : [],
    providerPrescriptions: [],
    otherRecords: [],
    prescriptions: [],
  };
}

/** Make a newly created minor's record resolvable by `recordFor`. */
export function registerMinorRecord(id: string, rec: MinorRecord) {
  BY_ID[id] = rec;
}

/** The logged-in patient's own record, in the same shape. */
const self: MinorRecord = {
  profileGroups: selfProfileGroups,
  vitals: selfVitals,
  habits: selfHabits,
  surgeries: selfSurgeries,
  generalRecords: selfGeneral,
  providerPrescriptions: selfProviderRx,
  otherRecords: selfOther,
  prescriptions: selfPrescriptions,
};

/**
 * Resolve whose data to show. Every profile/records screen reads through this
 * so a scoped screen can never accidentally render the guardian's data.
 */
export function recordFor(scopeKind: string, scopeId: string | null): MinorRecord {
  if (scopeKind === 'minor' && scopeId && BY_ID[scopeId]) return BY_ID[scopeId];
  return self;
}
