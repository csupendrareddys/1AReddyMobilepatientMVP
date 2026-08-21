// Static, in-memory design data only. Field names mirror the shapes used by
// JlmushIITMfrontend/src/features/service-receiver so this UI can later be
// wired to the real API surface without a redesign. Nothing here calls the
// network — this project intentionally has zero backend dependency.

export type Doctor = {
  id: string;
  full_name: string;
  profile_image: string;
  highest_qualification: string;
  specializations: string[];
  languages_known: string[];
  experience_years: number;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  hospital_affiliations: string[];
  next_available: string;
  bio: string;
};

export const doctors: Doctor[] = [
  {
    id: 'd1',
    full_name: 'Dr. Anitha Rao',
    profile_image: 'https://i.pravatar.cc/150?img=47',
    highest_qualification: 'MD, Internal Medicine',
    specializations: ['General Physician', 'Diabetes Care'],
    languages_known: ['English', 'Telugu', 'Hindi'],
    experience_years: 12,
    consultation_fee: 500,
    rating: 4.8,
    total_reviews: 231,
    hospital_affiliations: ['Larazen Multispeciality Hospital'],
    next_available: 'Today, 4:30 PM',
    bio: 'Dr. Anitha focuses on preventive care and long-term management of chronic conditions like diabetes and hypertension.',
  },
  {
    id: 'd2',
    full_name: 'Dr. Karthik Menon',
    profile_image: 'https://i.pravatar.cc/150?img=12',
    highest_qualification: 'MBBS, DNB Cardiology',
    specializations: ['Cardiologist'],
    languages_known: ['English', 'Malayalam'],
    experience_years: 9,
    consultation_fee: 800,
    rating: 4.6,
    total_reviews: 154,
    hospital_affiliations: ['Larazen Heart Institute'],
    next_available: 'Tomorrow, 10:00 AM',
    bio: 'Interventional cardiologist with a focus on early detection and non-surgical heart care.',
  },
  {
    id: 'd3',
    full_name: 'Dr. Priya Sharma',
    profile_image: 'https://i.pravatar.cc/150?img=32',
    highest_qualification: 'MD, Dermatology',
    specializations: ['Dermatologist', 'Cosmetology'],
    languages_known: ['English', 'Hindi'],
    experience_years: 7,
    consultation_fee: 600,
    rating: 4.9,
    total_reviews: 302,
    hospital_affiliations: ['Larazen Skin & Hair Clinic'],
    next_available: 'Today, 6:00 PM',
    bio: 'Specialises in acne, pigmentation, and skin-allergy management for all age groups.',
  },
  {
    id: 'd4',
    full_name: 'Dr. Suresh Iyer',
    profile_image: 'https://i.pravatar.cc/150?img=15',
    highest_qualification: 'MS Orthopaedics',
    specializations: ['Orthopaedic Surgeon'],
    languages_known: ['English', 'Tamil'],
    experience_years: 15,
    consultation_fee: 700,
    rating: 4.7,
    total_reviews: 189,
    hospital_affiliations: ['Larazen Multispeciality Hospital'],
    next_available: 'Fri, 9:30 AM',
    bio: 'Joint replacement and sports-injury specialist treating both surgical and conservative cases.',
  },
  {
    id: 'd5',
    full_name: 'Dr. Meera Joshi',
    profile_image: 'https://i.pravatar.cc/150?img=26',
    highest_qualification: 'MD, Paediatrics',
    specializations: ['Paediatrician', 'Child Nutrition'],
    languages_known: ['English', 'Marathi', 'Hindi'],
    experience_years: 11,
    consultation_fee: 550,
    rating: 4.9,
    total_reviews: 412,
    hospital_affiliations: ['Larazen Children’s Clinic'],
    next_available: 'Today, 5:15 PM',
    bio: 'Dr. Meera has looked after children from newborn to teenage for over a decade, with a special interest in childhood asthma and growth.',
  },
  {
    id: 'd6',
    full_name: 'Dr. Kavya Nair',
    profile_image: 'https://i.pravatar.cc/150?img=44',
    highest_qualification: 'DM, Nephrology',
    specializations: ['Nephrologist', 'Transplant Care'],
    languages_known: ['English', 'Malayalam', 'Tamil'],
    experience_years: 14,
    consultation_fee: 900,
    rating: 4.7,
    total_reviews: 168,
    hospital_affiliations: ['Larazen Kidney Centre'],
    next_available: 'Tomorrow, 11:00 AM',
    bio: 'Dr. Kavya leads the renal programme and has managed more than 400 transplant recipients through recovery.',
  },
  {
    id: 'd7',
    full_name: 'Dr. Rahul Verma',
    profile_image: 'https://i.pravatar.cc/150?img=33',
    highest_qualification: 'MS, General Surgery',
    specializations: ['General Surgeon', 'Laparoscopy'],
    languages_known: ['English', 'Hindi', 'Punjabi'],
    experience_years: 16,
    consultation_fee: 850,
    rating: 4.6,
    total_reviews: 203,
    hospital_affiliations: ['Larazen Multispeciality Hospital'],
    next_available: 'Fri, 2:00 PM',
    bio: 'Dr. Rahul specialises in minimally invasive abdominal surgery and same-day discharge procedures.',
  },
  {
    id: 'd8',
    full_name: 'Dr. Sneha Iyer',
    profile_image: 'https://i.pravatar.cc/150?img=31',
    highest_qualification: 'MD, Dermatology',
    specializations: ['Dermatologist', 'Trichology'],
    languages_known: ['English', 'Tamil', 'Kannada'],
    experience_years: 8,
    consultation_fee: 650,
    rating: 4.8,
    total_reviews: 289,
    hospital_affiliations: ['Larazen Skin & Hair Clinic'],
    next_available: 'Today, 7:00 PM',
    bio: 'Dr. Sneha treats chronic skin conditions and hair loss, with a focus on evidence-based long-term plans.',
  },
  {
    id: 'd9',
    full_name: 'Dr. Arun Prasad',
    profile_image: 'https://i.pravatar.cc/150?img=52',
    highest_qualification: 'DM, Cardiology',
    specializations: ['Cardiologist', 'Preventive Cardiology'],
    languages_known: ['English', 'Telugu', 'Hindi'],
    experience_years: 19,
    consultation_fee: 1100,
    rating: 4.9,
    total_reviews: 376,
    hospital_affiliations: ['Larazen Heart Institute'],
    next_available: 'Tomorrow, 9:30 AM',
    bio: 'Dr. Arun runs the preventive cardiology clinic and works largely on reversing early cardiac risk.',
  },
  {
    id: 'd10',
    full_name: 'Dr. Fatima Sheikh',
    profile_image: 'https://i.pravatar.cc/150?img=20',
    highest_qualification: 'MD, Obstetrics & Gynaecology',
    specializations: ['Obstetrician', 'Gynaecologist'],
    languages_known: ['English', 'Urdu', 'Hindi'],
    experience_years: 13,
    consultation_fee: 750,
    rating: 4.8,
    total_reviews: 331,
    hospital_affiliations: ['Larazen Women’s Health'],
    next_available: 'Today, 3:00 PM',
    bio: 'Dr. Fatima supports women through pregnancy and beyond, with particular care for high-risk pregnancies.',
  },
  {
    id: 'd11',
    full_name: 'Dr. Vikram Desai',
    profile_image: 'https://i.pravatar.cc/150?img=60',
    highest_qualification: 'MD, Pulmonology',
    specializations: ['Pulmonologist', 'Sleep Medicine'],
    languages_known: ['English', 'Gujarati', 'Hindi'],
    experience_years: 15,
    consultation_fee: 800,
    rating: 4.6,
    total_reviews: 142,
    hospital_affiliations: ['Larazen Chest Clinic'],
    next_available: 'Wed, 10:00 AM',
    bio: 'Dr. Vikram treats asthma, COPD and sleep-disordered breathing, and runs the home sleep-study service.',
  },
  {
    id: 'd12',
    full_name: 'Dr. Lakshmi Menon',
    profile_image: 'https://i.pravatar.cc/150?img=24',
    highest_qualification: 'MD, Endocrinology',
    specializations: ['Endocrinologist', 'Thyroid Care'],
    languages_known: ['English', 'Malayalam', 'Tamil'],
    experience_years: 10,
    consultation_fee: 700,
    rating: 4.7,
    total_reviews: 254,
    hospital_affiliations: ['Larazen Endocrine Centre'],
    next_available: 'Tomorrow, 4:00 PM',
    bio: 'Dr. Lakshmi manages thyroid disease and diabetes, with an emphasis on getting patients off unnecessary medication.',
  },
  {
    id: 'd13',
    full_name: 'Dr. Sanjay Kulkarni',
    profile_image: 'https://i.pravatar.cc/150?img=15',
    highest_qualification: 'MS, Orthopaedics',
    specializations: ['Orthopaedic Surgeon', 'Sports Injury'],
    languages_known: ['English', 'Marathi', 'Hindi'],
    experience_years: 17,
    consultation_fee: 750,
    rating: 4.5,
    total_reviews: 187,
    hospital_affiliations: ['Larazen Bone & Joint Centre'],
    next_available: 'Thu, 11:30 AM',
    bio: 'Dr. Sanjay handles joint replacement and sports injuries, and supervises the post-operative physio programme.',
  },
  {
    id: 'd14',
    full_name: 'Dr. Ananya Bose',
    profile_image: 'https://i.pravatar.cc/150?img=9',
    highest_qualification: 'MD, Psychiatry',
    specializations: ['Psychiatrist', 'Cognitive Behavioural Therapy'],
    languages_known: ['English', 'Bengali', 'Hindi'],
    experience_years: 12,
    consultation_fee: 900,
    rating: 4.9,
    total_reviews: 198,
    hospital_affiliations: ['Larazen Mind Clinic'],
    next_available: 'Today, 6:30 PM',
    bio: 'Dr. Ananya works on anxiety, mood disorders and burnout, combining medication review with talking therapy.',
  },
];

export type Appointment = {
  id: string;
  doctor_id: string;
  doctor_name: string;
  specialization: string;
  appointment_date: string;
  start_time: string;
  appointment_type: 'video' | 'in_person' | 'phone';
  /**
   * A booking is not confirmed the moment it's paid — the provider has to
   * accept it first. `pending` is that wait; `rejected` is them declining,
   * which owes the patient their money back.
   */
  status: 'pending' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  chief_complaint: string;
  /** Which of the eight booking categories this was bought from. */
  category: string;
  /** Slot length in minutes — how long the consult's channel stays open. */
  duration_min: number;
};

export const appointments: Appointment[] = [
  {
    id: 'a1',
    doctor_id: 'd1',
    doctor_name: 'Dr. Anitha Rao',
    specialization: 'General Physician',
    appointment_date: '2026-08-18',
    start_time: '16:30',
    appointment_type: 'video',
    status: 'upcoming',
    category: 'online',
    duration_min: 15,
    chief_complaint: 'Follow-up on blood sugar levels',
  },
  {
    id: 'a2',
    doctor_id: 'd2',
    doctor_name: 'Dr. Karthik Menon',
    specialization: 'Cardiologist',
    appointment_date: '2026-08-20',
    start_time: '10:00',
    appointment_type: 'in_person',
    status: 'upcoming',
    category: 'physical',
    duration_min: 30,
    chief_complaint: 'Routine heart checkup',
  },
  {
    id: 'a3',
    doctor_id: 'd3',
    doctor_name: 'Dr. Priya Sharma',
    specialization: 'Dermatologist',
    appointment_date: '2026-07-30',
    start_time: '18:00',
    appointment_type: 'video',
    status: 'completed',
    category: 'online',
    duration_min: 15,
    chief_complaint: 'Skin allergy consultation',
  },
  {
    id: 'a4',
    doctor_id: 'd4',
    doctor_name: 'Dr. Suresh Iyer',
    specialization: 'Orthopaedic Surgeon',
    appointment_date: '2026-07-15',
    start_time: '09:30',
    appointment_type: 'in_person',
    status: 'cancelled',
    category: 'physical',
    duration_min: 30,
    chief_complaint: 'Knee pain evaluation',
  },
  {
    id: 'a5',
    doctor_id: 'd3',
    doctor_name: 'Dr. Priya Sharma',
    specialization: 'Dermatologist',
    appointment_date: '2026-08-24',
    start_time: '11:30',
    appointment_type: 'video',
    status: 'upcoming',
    category: 'online',
    duration_min: 15,
    chief_complaint: 'Recurring rash review',
  },
  {
    id: 'a6',
    doctor_id: 'd1',
    doctor_name: 'Dr. Anitha Rao',
    specialization: 'General Physician',
    appointment_date: '2026-08-27',
    start_time: '09:00',
    appointment_type: 'phone',
    status: 'upcoming',
    category: 'online',
    duration_min: 15,
    chief_complaint: 'Lab report walkthrough',
  },
  {
    id: 'a7',
    doctor_id: 'd4',
    doctor_name: 'Dr. Suresh Iyer',
    specialization: 'Orthopaedic Surgeon',
    appointment_date: '2026-09-02',
    start_time: '15:00',
    appointment_type: 'in_person',
    status: 'upcoming',
    category: 'physical',
    duration_min: 30,
    chief_complaint: 'Post-physiotherapy assessment',
  },
  {
    id: 'a8',
    doctor_id: 'd1',
    doctor_name: 'Dr. Anitha Rao',
    specialization: 'General Physician',
    appointment_date: '2026-08-17',
    start_time: '14:00',
    appointment_type: 'video',
    status: 'in_progress',
    category: 'instant',
    duration_min: 10,
    chief_complaint: 'Sudden rash after new medication',
  },
  {
    id: 'a9',
    doctor_id: 'd2',
    doctor_name: 'Dr. Karthik Menon',
    specialization: 'Cardiologist',
    appointment_date: '2026-08-17',
    start_time: '14:30',
    appointment_type: 'video',
    status: 'in_progress',
    category: 'online',
    duration_min: 15,
    chief_complaint: 'Scheduled BP review',
  },
  {
    id: 'a10',
    doctor_id: 'd4',
    doctor_name: 'Dr. Suresh Iyer',
    specialization: 'Orthopaedic Surgeon',
    appointment_date: '2026-08-17',
    start_time: '14:15',
    appointment_type: 'in_person',
    status: 'in_progress',
    category: 'physical',
    duration_min: 30,
    chief_complaint: 'Knee review at clinic',
  },
  {
    id: 'a11',
    doctor_id: 'd3',
    doctor_name: 'Dr. Priya Sharma',
    specialization: 'Dermatologist',
    appointment_date: '2026-08-17',
    start_time: '14:20',
    appointment_type: 'video',
    status: 'in_progress',
    category: 'hybrid',
    duration_min: 20,
    chief_complaint: 'Online follow-up after clinic visit',
  },
  {
    id: 'a12',
    doctor_id: 'd1',
    doctor_name: 'Dr. Anitha Rao',
    specialization: 'General Physician',
    appointment_date: '2026-08-19',
    start_time: '12:00',
    appointment_type: 'video',
    status: 'upcoming',
    category: 'instant',
    duration_min: 10,
    chief_complaint: 'Instant consult credit — unused',
  },
  {
    id: 'a13',
    doctor_id: 'd3',
    doctor_name: 'Dr. Priya Sharma',
    specialization: 'Dermatologist',
    appointment_date: '2026-08-25',
    start_time: '17:00',
    appointment_type: 'video',
    status: 'upcoming',
    category: 'hybrid',
    duration_min: 20,
    chief_complaint: 'Clinic visit then video review',
  },
  {
    id: 'a14',
    doctor_id: 'd9',
    doctor_name: 'Dr. Arun Prasad',
    specialization: 'Cardiologist',
    appointment_date: '2026-08-21',
    start_time: '09:30',
    appointment_type: 'video',
    status: 'pending',
    category: 'online',
    duration_min: 15,
    chief_complaint: 'Chest tightness on exertion',
  },
  {
    id: 'a15',
    doctor_id: 'd13',
    doctor_name: 'Dr. Sanjay Kulkarni',
    specialization: 'Orthopaedic Surgeon',
    appointment_date: '2026-08-23',
    start_time: '11:30',
    appointment_type: 'in_person',
    status: 'pending',
    category: 'physical',
    duration_min: 30,
    chief_complaint: 'Shoulder pain after a fall',
  },
  {
    id: 'a16',
    doctor_id: 'd14',
    doctor_name: 'Dr. Ananya Bose',
    specialization: 'Psychiatrist',
    appointment_date: '2026-08-19',
    start_time: '18:30',
    appointment_type: 'video',
    status: 'pending',
    category: 'instant',
    duration_min: 10,
    chief_complaint: 'Sleep trouble for three weeks',
  },
  {
    id: 'a19',
    doctor_id: 'd2',
    doctor_name: 'Dr. Karthik Menon',
    specialization: 'Cardiologist',
    appointment_date: '2026-08-15',
    start_time: '10:00',
    appointment_type: 'video',
    status: 'completed',
    category: 'online',
    duration_min: 15,
    chief_complaint: 'Palpitations after starting new medication',
  },
  {
    id: 'a20',
    doctor_id: 'd3',
    doctor_name: 'Dr. Priya Sharma',
    specialization: 'Dermatologist',
    appointment_date: '2026-08-11',
    start_time: '16:30',
    appointment_type: 'video',
    status: 'completed',
    category: 'instant',
    duration_min: 10,
    chief_complaint: 'Rash review after two weeks of treatment',
  },
  {
    id: 'a21',
    doctor_id: 'd4',
    doctor_name: 'Dr. Suresh Iyer',
    specialization: 'Orthopaedic Surgeon',
    appointment_date: '2026-08-08',
    start_time: '11:15',
    appointment_type: 'in_person',
    status: 'completed',
    category: 'physical',
    duration_min: 30,
    chief_complaint: 'Post-cast review of wrist fracture',
  },
  {
    id: 'a18',
    doctor_id: 'd10',
    doctor_name: 'Dr. Fatima Sheikh',
    specialization: 'Obstetrician',
    appointment_date: '2026-08-20',
    start_time: '15:00',
    appointment_type: 'in_person',
    status: 'pending',
    category: 'physical',
    duration_min: 30,
    chief_complaint: 'Routine antenatal review',
  },
  {
    id: 'a17',
    doctor_id: 'd11',
    doctor_name: 'Dr. Vikram Desai',
    specialization: 'Pulmonologist',
    appointment_date: '2026-08-16',
    start_time: '10:00',
    appointment_type: 'video',
    status: 'rejected',
    category: 'online',
    duration_min: 15,
    chief_complaint: 'Persistent cough at night',
  },
];

export const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

/** Slots already taken, so the grid shows real availability rather than a
 *  wall of identical options. */
export const bookedSlots = ['09:30', '12:30', '15:00', '18:00'];

export type PrescriptionItem = {
  id: string;
  doctor_name: string;
  date: string;
  diagnosis: string;
  medicines: { name: string; dosage: string; duration: string; instructions?: string }[];
  lab_tests: string[];
  advice?: string;
  follow_up?: string;
};

export const prescriptions: PrescriptionItem[] = [
  {
    id: 'p1',
    doctor_name: 'Dr. Anitha Rao',
    date: '2026-07-30',
    diagnosis: 'Type 2 Diabetes Mellitus — stable, on oral therapy',
    medicines: [
      { name: 'Metformin 500mg', dosage: '1 tablet, twice daily', duration: '30 days', instructions: 'After food' },
      { name: 'Vitamin D3', dosage: '1 capsule, weekly', duration: '8 weeks', instructions: 'After breakfast' },
    ],
    lab_tests: ['HbA1c', 'Fasting Blood Glucose', 'Serum Creatinine'],
    advice: '30 minutes of brisk walking daily. Reduce refined carbohydrates.',
    follow_up: '2026-08-30',
  },
  {
    id: 'p2',
    doctor_name: 'Dr. Priya Sharma',
    date: '2026-06-12',
    diagnosis: 'Allergic contact dermatitis',
    medicines: [
      { name: 'Cetirizine 10mg', dosage: '1 tablet, at night', duration: '10 days', instructions: 'Before bed' },
    ],
    lab_tests: ['Absolute Eosinophil Count'],
    advice: 'Avoid fragranced soaps. Apply moisturiser twice daily.',
    follow_up: '2026-06-26',
  },
  /* Older than three months. A prescription history that only reaches back a
     few weeks isn't one — the reason a patient opens this screen is usually to
     find something from a while ago. */
  {
    id: 'p3',
    doctor_name: 'Dr. Karthik Menon',
    date: '2026-03-04',
    diagnosis: 'Essential hypertension — newly diagnosed',
    medicines: [
      { name: 'Telmisartan 40mg', dosage: '1 tablet, every morning', duration: '90 days', instructions: 'Before food' },
    ],
    lab_tests: ['Lipid Profile', 'Serum Electrolytes', 'ECG'],
    advice: 'Reduce added salt. Check blood pressure twice weekly and log it.',
    follow_up: '2026-06-04',
  },
  {
    id: 'p4',
    doctor_name: 'Dr. Suresh Iyer',
    date: '2025-11-19',
    diagnosis: 'Lumbar spondylosis with mechanical low back pain',
    medicines: [
      { name: 'Aceclofenac 100mg', dosage: '1 tablet, twice daily', duration: '7 days', instructions: 'After food' },
      { name: 'Methylcobalamin 1500mcg', dosage: '1 tablet, daily', duration: '30 days' },
    ],
    lab_tests: ['X-ray Lumbosacral Spine'],
    advice: 'Core strengthening under a physiotherapist. Avoid lifting from the waist.',
  },
  {
    id: 'p5',
    doctor_name: 'Dr. Anitha Rao',
    date: '2025-08-02',
    diagnosis: 'Iron deficiency anaemia',
    medicines: [
      { name: 'Ferrous Ascorbate 100mg', dosage: '1 tablet, daily', duration: '60 days', instructions: 'On an empty stomach' },
    ],
    lab_tests: ['Complete Blood Count', 'Serum Ferritin'],
    advice: 'Take with citrus, not with tea or milk — both block absorption.',
    follow_up: '2025-10-02',
  },
];

/* ── Health Records — the six section heads the web page renders ───────────
 * Vitals · Habits & Lifestyle · Surgeries · Health Records ·
 * Provider Prescriptions · Others
 * ────────────────────────────────────────────────────────────────────────── */

/** Vitals and Habits are single objects rendered as Field/Value tables. */
export const vitals: Record<string, string> = {
  blood_group: 'O+',
  height: '174 cm',
  weight: '71 kg',
  bmi: '23.5',
  blood_pressure: '122/80 mmHg',
  pulse: '76 bpm',
  temperature: '98.4 °F',
  spo2: '98%',
  respiratory_rate: '16 / min',
  last_recorded: '2026-08-10',
};

export const habits: Record<string, string> = {
  smoking: 'Never',
  alcohol: 'Occasionally',
  tobacco: 'Never',
  diet: 'Vegetarian',
  exercise: '4 days / week, brisk walking',
  sleep: '6–7 hours',
  stress_level: 'Moderate',
  occupation: 'Software engineer (desk-bound)',
};

/** Every list section shares this shape — Type / Date / Details / Attachments. */
export type RecordEntry = {
  id: string;
  record_type: string;
  record_date: string;
  details: string;
  notes?: string;
  attachments: { id: string; filename: string }[];
};

export const surgeries: RecordEntry[] = [
  {
    id: 'sg1',
    record_type: 'appendectomy',
    record_date: '2019-03-14',
    details: 'Hospital: Larazen Multispeciality  ·  Surgeon: Dr. Suresh Iyer  ·  Anaesthesia: General',
    notes: 'Laparoscopic, uneventful recovery.',
    attachments: [{ id: 'sa1', filename: 'Appendectomy_Discharge.pdf' }],
  },
  {
    id: 'sg2',
    record_type: 'knee_arthroscopy',
    record_date: '2025-11-22',
    details: 'Hospital: Larazen Multispeciality  ·  Surgeon: Dr. Suresh Iyer  ·  Side: Right',
    notes: 'Meniscal repair. Full range of motion regained.',
    attachments: [
      { id: 'sa2', filename: 'Knee_Op_Notes.pdf' },
      { id: 'sa3', filename: 'Post_Op_MRI.jpg' },
    ],
  },
];

export const generalRecords: RecordEntry[] = [
  {
    id: 'gr1',
    record_type: 'lab_report',
    record_date: '2026-07-28',
    details: 'Total Cholesterol: 186 mg/dL  ·  LDL: 108 mg/dL  ·  HDL: 48 mg/dL  ·  Triglycerides: 142 mg/dL',
    notes: 'Lipid profile — borderline LDL.',
    attachments: [{ id: 'ga1', filename: 'Lipid_Profile_Jul2026.pdf' }],
  },
  {
    id: 'gr2',
    record_type: 'diagnosis',
    record_date: '2025-11-02',
    details: 'Condition: Type 2 Diabetes Mellitus  ·  Status: Under management  ·  HbA1c: 6.8%',
    attachments: [],
  },
  {
    id: 'gr3',
    record_type: 'imaging',
    record_date: '2026-02-11',
    details: 'Modality: X-Ray  ·  Region: Chest PA  ·  Impression: Normal study',
    attachments: [{ id: 'ga2', filename: 'Chest_XRay_Feb2026.jpg' }],
  },
  {
    id: 'gr4',
    record_type: 'vaccination',
    record_date: '2026-01-08',
    details: 'Vaccine: Influenza (Quadrivalent)  ·  Dose: Annual  ·  Site: Left deltoid',
    attachments: [],
  },
  {
    id: 'gr5',
    record_type: 'consultation',
    record_date: '2026-07-30',
    details: 'Doctor: Dr. Anitha Rao  ·  Reason: Diabetes follow-up  ·  Outcome: Continue current therapy',
    attachments: [],
  },
];

export const providerPrescriptions: RecordEntry[] = [
  {
    id: 'pr1',
    record_type: 'prescription',
    record_date: '2026-07-30',
    details: 'Prescribed by: Dr. Anitha Rao  ·  Diagnosis: Type 2 Diabetes  ·  Medicines: 2',
    attachments: [{ id: 'pa1', filename: 'Rx_AnithaRao_Jul2026.pdf' }],
  },
  {
    id: 'pr2',
    record_type: 'prescription',
    record_date: '2026-06-12',
    details: 'Prescribed by: Dr. Priya Sharma  ·  Diagnosis: Allergic contact dermatitis  ·  Medicines: 1',
    attachments: [{ id: 'pa2', filename: 'Rx_PriyaSharma_Jun2026.pdf' }],
  },
];

export const otherRecords: RecordEntry[] = [
  {
    id: 'or1',
    record_type: 'insurance_document',
    record_date: '2026-04-11',
    details: 'Provider: Star Health  ·  Policy: SH-4471-99820  ·  Valid till: 2027-03-31',
    attachments: [{ id: 'oa1', filename: 'Insurance_Policy.pdf' }],
  },
  {
    id: 'or2',
    record_type: 'identity_proof',
    record_date: '2026-05-02',
    details: 'Type: Aadhaar  ·  Verified: Yes',
    attachments: [{ id: 'oa2', filename: 'Aadhar_Card.pdf' }],
  },
];

/* ────────────────────────────────────────────────────────────────────────
 * BOOKING CATEGORIES — what a patient sees under "Book Appointments".
 *
 * Each category is a shelf that can hold any of the three sellable product
 * kinds from the web app: an Appointment, a Service, or a Group Service.
 * `kind` is carried per item so the UI can badge it accordingly.
 * ──────────────────────────────────────────────────────────────────────── */

export type ProductKind = 'appointment' | 'service' | 'group_service';

export type CategoryItem = {
  id: string;
  name: string;
  short_name: string;
  kind: ProductKind;
  description: string;
  price: number;
  meta: string;
  /** Where booking this item continues. */
  route: string;
};

export type ProductCategory = {
  key: string;
  name: string;
  tagline: string;
  /** Two-to-three word descriptor used on the compact home tiles. */
  short: string;
  icon: 'flash-outline' | 'videocam-outline' | 'business-outline' | 'git-merge-outline'
    | 'thermometer-outline' | 'shield-checkmark-outline' | 'heart-circle-outline'
    | 'infinite-outline';
  tint: string;
  items: CategoryItem[];
};

export const productCategories: ProductCategory[] = [
  {
    key: 'instant',
    name: 'Instant Consultation',
    tagline: 'Talk to a doctor now — no appointment',
    short: 'Available now',
    icon: 'flash-outline',
    tint: '#E8833A',
    items: [
      { id: 'ic1', name: 'Instant Video Consultation', short_name: 'Instant Video', kind: 'appointment', description: 'Connect to the next available doctor over video.', price: 600, meta: 'Avg wait 4 min', route: '/booking/d1' },
      { id: 'ic2', name: 'Instant Voice Consultation', short_name: 'Instant Voice', kind: 'appointment', description: 'A voice call with the next free doctor.', price: 400, meta: 'Avg wait 3 min', route: '/booking/d1' },
      { id: 'ic3', name: 'Instant Chat Consultation', short_name: 'Instant Chat', kind: 'appointment', description: 'Start messaging a doctor straight away.', price: 250, meta: 'Replies in ~5 min', route: '/booking/d1' },
      { id: 'ic4', name: 'Instant Paediatric Consult', short_name: 'Instant Paediatric', kind: 'appointment', description: 'Reach a paediatrician for your child within minutes.', price: 700, meta: 'Avg wait 6 min', route: '/booking/d5' },
      { id: 'ic5', name: 'Instant Second Opinion', short_name: 'Instant 2nd Opinion', kind: 'appointment', description: 'Upload a report and get a specialist read straight away.', price: 900, meta: 'Reply in ~15 min', route: '/booking/d9' },
      { id: 'ic6', name: 'Instant Gynaecology Consult', short_name: 'Instant Gynae', kind: 'appointment', description: 'Speak to a women’s health specialist now.', price: 800, meta: 'Avg wait 7 min', route: '/booking/d10' },
      { id: 'ic7', name: 'Instant Mental Health Support', short_name: 'Instant Mind', kind: 'appointment', description: 'Talk to a psychiatrist without an appointment.', price: 950, meta: 'Avg wait 8 min', route: '/booking/d14' },
      { id: 'ic8', name: 'Instant Dermatology Consult', short_name: 'Instant Derma', kind: 'appointment', description: 'Send a photo and speak to a skin specialist.', price: 650, meta: 'Avg wait 5 min', route: '/booking/d8' },
      { id: 'ic9', name: 'Instant Prescription Refill', short_name: 'Refill Request', kind: 'service', description: 'A doctor reviews and reissues an existing prescription.', price: 199, meta: 'Within 30 min', route: '/checkout' },
      { id: 'ic10', name: 'Instant Lab Report Review', short_name: 'Report Review', kind: 'service', description: 'A physician explains your latest results.', price: 399, meta: 'Within 1 hour', route: '/checkout' },
      { id: 'ic11', name: 'Instant Fever & Cold Consult', short_name: 'Instant Fever', kind: 'appointment', description: 'Same-minute advice for fever, cough and cold.', price: 350, meta: 'Avg wait 3 min', route: '/booking/d1' },
    ],
  },
  {
    key: 'online',
    name: 'Online Consultation',
    tagline: 'Book a video, voice or chat consult',
    short: 'Video, voice, chat',
    icon: 'videocam-outline',
    tint: '#1976d2',
    items: [
      { id: 'oc1', name: 'Video Consultation', short_name: 'Video Consult', kind: 'appointment', description: 'Scheduled video call with chat and whiteboard.', price: 500, meta: 'Pick your slot', route: '/booking/d1' },
      { id: 'oc2', name: 'Voice Consultation', short_name: 'Voice Consult', kind: 'appointment', description: 'Audio-only call at a time that suits you.', price: 300, meta: 'Pick your slot', route: '/booking/d1' },
      { id: 'oc3', name: 'Chat Consultation', short_name: 'Chat Consult', kind: 'appointment', description: 'Message your doctor, reply within 24 hours.', price: 200, meta: 'Reply in 24 hrs', route: '/booking/d1' },
      { id: 'oc4', name: 'Scheduled Paediatric Video', short_name: 'Paediatric Video', kind: 'appointment', description: 'Book a video slot with a paediatrician.', price: 550, meta: 'Pick your slot', route: '/booking/d5' },
      { id: 'oc5', name: 'Cardiology Video Consultation', short_name: 'Cardiology Video', kind: 'appointment', description: 'Video review with a cardiologist, reports included.', price: 1100, meta: 'Pick your slot', route: '/booking/d9' },
      { id: 'oc6', name: 'Dermatology Video Consultation', short_name: 'Derma Video', kind: 'appointment', description: 'Skin and hair review over video.', price: 650, meta: 'Pick your slot', route: '/booking/d8' },
      { id: 'oc7', name: 'Endocrine Video Consultation', short_name: 'Endocrine Video', kind: 'appointment', description: 'Thyroid and diabetes review over video.', price: 700, meta: 'Pick your slot', route: '/booking/d12' },
      { id: 'oc8', name: 'Mental Health Video Session', short_name: 'Mind Video', kind: 'appointment', description: 'A 45-minute session with a psychiatrist.', price: 900, meta: '45 min slot', route: '/booking/d14' },
      { id: 'oc9', name: 'Nutrition Video Consultation', short_name: 'Nutrition Video', kind: 'appointment', description: 'Diet review with a clinical nutritionist.', price: 500, meta: 'Pick your slot', route: '/booking/d5' },
      { id: 'oc10', name: 'Follow-up Video Review', short_name: 'Follow-up Video', kind: 'appointment', description: 'A short review after an earlier consultation.', price: 300, meta: '15 min slot', route: '/booking/d1' },
      { id: 'oc11', name: 'Online Pre-Surgery Counselling', short_name: 'Pre-Surgery Chat', kind: 'service', description: 'Understand a planned procedure before you commit.', price: 799, meta: '40 min · video', route: '/checkout' },
    ],
  },
  {
    key: 'physical',
    name: 'Physical Consultation',
    tagline: 'See a doctor in person',
    short: 'Clinic or home',
    icon: 'business-outline',
    tint: '#26a69a',
    items: [
      { id: 'pc1', name: 'Doctor Clinic Visit', short_name: 'Clinic Visit', kind: 'appointment', description: 'Visit your doctor at the clinic.', price: 700, meta: 'In clinic', route: '/booking/d1' },
      { id: 'pc2', name: 'Doctor Home Visit', short_name: 'Home Visit', kind: 'appointment', description: 'A doctor comes to your home.', price: 1200, meta: 'At home', route: '/booking/d1' },
      { id: 'pc3', name: 'Community Health Camp', short_name: 'Health Camp', kind: 'appointment', description: 'Reserve a place at an organised health camp.', price: 0, meta: 'Free · Camp', route: '/booking/d1' },
      { id: 'pc4', name: 'Home Sample Collection', short_name: 'Home Sample', kind: 'service', description: 'A phlebotomist collects samples at home.', price: 199, meta: 'Same day', route: '/more/recovery-plans' },
      { id: 'pc5', name: 'Paediatric Clinic Visit', short_name: 'Paediatric Visit', kind: 'appointment', description: 'See a paediatrician in person at the clinic.', price: 600, meta: 'Book a slot', route: '/booking/d5' },
      { id: 'pc6', name: 'Cardiology Clinic Visit', short_name: 'Cardiology Visit', kind: 'appointment', description: 'In-person cardiac assessment with ECG.', price: 1200, meta: 'Book a slot', route: '/booking/d9' },
      { id: 'pc7', name: 'Orthopaedic Clinic Visit', short_name: 'Ortho Visit', kind: 'appointment', description: 'Joint and bone assessment in person.', price: 800, meta: 'Book a slot', route: '/booking/d13' },
      { id: 'pc8', name: 'Gynaecology Clinic Visit', short_name: 'Gynae Visit', kind: 'appointment', description: 'In-person women’s health consultation.', price: 750, meta: 'Book a slot', route: '/booking/d10' },
      { id: 'pc9', name: 'Home Doctor Visit — Elder Care', short_name: 'Home Elder Visit', kind: 'service', description: 'A physician visits an elderly family member at home.', price: 1500, meta: 'Same day', route: '/checkout' },
      { id: 'pc10', name: 'Home Physiotherapy Session', short_name: 'Home Physio', kind: 'service', description: 'A physiotherapist runs a session at your home.', price: 899, meta: 'Per session', route: '/checkout' },
      { id: 'pc11', name: 'In-Clinic Health Screening', short_name: 'Clinic Screening', kind: 'service', description: 'A guided screening visit with same-day results.', price: 2499, meta: '2 hours · 20 tests', route: '/checkout' },
    ],
  },
  {
    key: 'hybrid',
    name: 'Hybrid Consultation',
    tagline: 'In-person visit paired with online follow-ups',
    short: 'In-person + online',
    icon: 'git-merge-outline',
    tint: '#5e35b1',
    items: [
      { id: 'hy1', name: 'Clinic Visit + Video Follow-ups', short_name: 'Clinic + Video', kind: 'service', description: 'First consult at the clinic, then two video follow-ups.', price: 1499, meta: '1 clinic · 2 video', route: '/booking/d1' },
      { id: 'hy2', name: 'Home Visit + Online Review', short_name: 'Home + Online', kind: 'service', description: 'A doctor visits you, then reviews progress online.', price: 1899, meta: '1 home · 1 video', route: '/booking/d1' },
      { id: 'hy3', name: 'Diagnostics + Online Report Review', short_name: 'Tests + Review', kind: 'service', description: 'Lab tests at a centre, results explained over video.', price: 2299, meta: 'Tests · 1 video', route: '/booking/d1' },
      { id: 'hy4', name: 'Hybrid Care Package – 30 Days', short_name: 'Hybrid Care (30d)', kind: 'group_service', description: 'A month of blended in-person and online care.', price: 6999, meta: '30 Days · 2 doctors', route: '/more/health-plans' },
      // Communication-enabled products: buying one opens a service channel.
      // The group offering opens a group chat plus a private leg per provider.
      { id: 'hy5', name: 'Diet & Nutrition Programme — 12 weeks', short_name: 'Diet Programme', kind: 'service', description: 'A nutritionist plans, reviews and adjusts your diet over 12 weeks. Message them any time.', price: 4999, meta: '12 weeks · chat included', route: '/checkout' },
      { id: 'hy6', name: 'Diabetes Group Coaching — 8 weeks', short_name: 'Diabetes Coaching', kind: 'group_service', description: 'Twice-weekly group sessions with an endocrinologist, nutritionist and fitness coach.', price: 7499, meta: '8 weeks · 3 providers', route: '/checkout' },
      { id: 'hy7', name: 'Surgery Consult + Online Follow-ups', short_name: 'Surgery Hybrid', kind: 'service', description: 'Surgical opinion in person, then two online reviews.', price: 2999, meta: '1 clinic · 2 video', route: '/checkout' },
      { id: 'hy8', name: 'Maternity Hybrid Package', short_name: 'Maternity Hybrid', kind: 'group_service', description: 'Clinic scans with online midwife support between visits.', price: 9999, meta: '9 months · team', route: '/checkout' },
      { id: 'hy9', name: 'Paediatric Growth Hybrid Plan', short_name: 'Child Growth Hybrid', kind: 'service', description: 'Quarterly clinic checks with online questions any time.', price: 3499, meta: '12 months', route: '/checkout' },
      { id: 'hy10', name: 'Cardiac Rehab Hybrid — 12 Weeks', short_name: 'Cardiac Rehab', kind: 'group_service', description: 'Supervised clinic sessions with remote monitoring.', price: 14999, meta: '12 weeks · 3 doctors', route: '/checkout' },
      { id: 'hy11', name: 'Mental Health Hybrid Programme', short_name: 'Mind Hybrid', kind: 'service', description: 'Alternating in-person and online therapy sessions.', price: 7999, meta: '8 weeks · chat', route: '/checkout' },
    ],
  },
  {
    key: 'recovery',
    name: 'Recovery Plans',
    tagline: 'Guided plans for a specific illness',
    short: 'Illness programmes',
    icon: 'thermometer-outline',
    tint: '#f44336',
    items: [
      { id: 'rc1', name: 'Malaria Recovery Plan – 10 Days', short_name: 'Malaria Care (10d)', kind: 'service', description: 'Daily symptom checks through to clearance.', price: 2499, meta: '10 Days', route: '/more/recovery-plans' },
      { id: 'rc2', name: 'Viral Fever Recovery Plan – 7 Days', short_name: 'Viral Fever Care (7d)', kind: 'service', description: 'Supportive care to recover safely at home.', price: 1299, meta: '7 Days', route: '/more/recovery-plans' },
      { id: 'rc3', name: 'Dengue Recovery Plan – 10 Days', short_name: 'Dengue Care (10d)', kind: 'service', description: 'Platelet monitoring through the critical phase.', price: 3999, meta: '10 Days', route: '/more/recovery-plans' },
      { id: 'rc4', name: 'Typhoid Recovery Plan – 14 Days', short_name: 'Typhoid Care (14d)', kind: 'service', description: 'Supervised antibiotic course with diet support.', price: 2999, meta: '14 Days', route: '/more/recovery-plans' },
      { id: 'rc5', name: 'Post-COVID Recovery Plan – 21 Days', short_name: 'Post-COVID (21d)', kind: 'service', description: 'Breathing, stamina and fatigue monitoring after COVID.', price: 3299, meta: '21 Days', route: '/checkout' },
      { id: 'rc6', name: 'Post-Surgery Wound Care – 14 Days', short_name: 'Wound Care (14d)', kind: 'service', description: 'Daily wound review and dressing guidance.', price: 2799, meta: '14 Days', route: '/checkout' },
      { id: 'rc7', name: 'Chikungunya Recovery Plan – 14 Days', short_name: 'Chikungunya (14d)', kind: 'service', description: 'Joint-pain management through the recovery phase.', price: 2799, meta: '14 Days', route: '/checkout' },
      { id: 'rc8', name: 'Post-Dengue Strength Plan – 21 Days', short_name: 'Post-Dengue (21d)', kind: 'service', description: 'Rebuild strength and platelet counts after dengue.', price: 3499, meta: '21 Days', route: '/checkout' },
      { id: 'rc9', name: 'Jaundice Recovery Plan – 30 Days', short_name: 'Jaundice (30d)', kind: 'service', description: 'Liver function tracking with a supervised diet.', price: 4299, meta: '30 Days', route: '/checkout' },
      { id: 'rc10', name: 'Fracture Rehabilitation – 45 Days', short_name: 'Fracture Rehab (45d)', kind: 'service', description: 'Guided physiotherapy from cast removal to full use.', price: 5999, meta: '45 Days', route: '/checkout' },
      { id: 'rc11', name: 'Post-Delivery Recovery – 60 Days', short_name: 'Post-Delivery (60d)', kind: 'group_service', description: 'Mother and newborn support through the fourth trimester.', price: 8999, meta: '60 Days · team', route: '/checkout' },
    ],
  },
  {
    key: 'healthcare',
    name: 'Healthcare Plans',
    tagline: 'Preventive checks and ongoing management',
    short: 'Preventive care',
    icon: 'shield-checkmark-outline',
    tint: '#5e35b1',
    items: [
      { id: 'hc1', name: 'Annual Preventive Health Plan – 12 Months', short_name: 'Annual Health (12m)', kind: 'group_service', description: 'Yearly full-body checks with a physician review.', price: 7999, meta: '12 Months · 2 doctors', route: '/more/health-plans' },
      { id: 'hc2', name: 'Diabetes Management Plan – 6 Months', short_name: 'Diabetes Care (6m)', kind: 'group_service', description: 'Glucose tracking, diet and medication review.', price: 8999, meta: '6 Months · 3 doctors', route: '/more/health-plans' },
      { id: 'hc3', name: 'Thyroid Care Plan – 3 Months', short_name: 'Thyroid Care (3m)', kind: 'group_service', description: 'Dose titration with periodic thyroid panels.', price: 4999, meta: '3 Months · 2 doctors', route: '/more/health-plans' },
      { id: 'hc4', name: 'Full Body Health Checkup', short_name: 'Full Body Check', kind: 'service', description: '62 parameters including lipid, liver and kidney panels.', price: 2499, meta: 'Report in 24 hrs', route: '/more/recovery-plans' },
      { id: 'hc5', name: 'Diabetes Preventive Plan – 12 Months', short_name: 'Diabetes Prevent', kind: 'service', description: 'Quarterly screening for anyone at risk of diabetes.', price: 7999, meta: '12 Months', route: '/checkout' },
      { id: 'hc6', name: 'Heart Health Screening – 6 Months', short_name: 'Heart Screening', kind: 'service', description: 'Lipids, ECG and echo with a cardiologist review.', price: 6499, meta: '6 Months', route: '/checkout' },
      { id: 'hc7', name: 'Women’s Wellness Plan – 12 Months', short_name: 'Women’s Wellness', kind: 'service', description: 'Screening and reviews built around women’s health.', price: 8999, meta: '12 Months', route: '/checkout' },
      { id: 'hc8', name: 'Child Immunisation Plan – 24 Months', short_name: 'Child Immunisation', kind: 'service', description: 'The full schedule tracked and reminded, visit by visit.', price: 5999, meta: '24 Months', route: '/checkout' },
      { id: 'hc9', name: 'Senior Citizen Care Plan – 12 Months', short_name: 'Senior Care', kind: 'group_service', description: 'Regular reviews and home visits for elderly parents.', price: 15999, meta: '12 Months · team', route: '/checkout' },
      { id: 'hc10', name: 'Corporate Executive Health – 12 Months', short_name: 'Executive Health', kind: 'service', description: 'A full annual work-up with a dedicated physician.', price: 19999, meta: '12 Months', route: '/checkout' },
      { id: 'hc11', name: 'Family Preventive Cover – 6 Months', short_name: 'Family Cover', kind: 'group_service', description: 'Preventive checks for up to four family members.', price: 8999, meta: '6 Months · 4 members', route: '/checkout' },
    ],
  },
  {
    key: 'advanced',
    name: 'Advance Care Plans',
    tagline: 'Surgical recovery and chronic management',
    short: 'Surgical & chronic',
    icon: 'heart-circle-outline',
    tint: '#00897b',
    items: [
      { id: 'ac1', name: 'Post-Kidney Surgery Recovery Plan – 30 Days', short_name: 'Post-Kidney Rehab (30d)', kind: 'group_service', description: 'Renal monitoring and diet support after surgery.', price: 18999, meta: '30 Days · 3 doctors', route: '/more/health-plans' },
      { id: 'ac2', name: 'Post-Heart Surgery Recovery Plan – 45 Days', short_name: 'Post-Heart Rehab (45d)', kind: 'group_service', description: 'Surgeon-led recovery through cardiac rehab.', price: 29999, meta: '45 Days · 4 doctors', route: '/more/health-plans' },
      { id: 'ac3', name: 'Post-Stroke Recovery Plan – 60 Days', short_name: 'Stroke Rehab (60d)', kind: 'group_service', description: 'Neurology, physiotherapy and speech therapy.', price: 34999, meta: '60 Days · 4 doctors', route: '/more/health-plans' },
      { id: 'ac4', name: 'Chronic Heart Care Plan – 90 Days', short_name: 'Chronic Heart Care (90d)', kind: 'group_service', description: 'Long-term support for chronic cardiac conditions.', price: 24999, meta: '90 Days · 3 doctors', route: '/more/health-plans' },
      { id: 'ac5', name: 'Post-Spinal Surgery Recovery – 60 Days', short_name: 'Spinal Recovery', kind: 'group_service', description: 'Neurosurgeon and physio team through spinal recovery.', price: 32999, meta: '60 Days · 3 doctors', route: '/checkout' },
      { id: 'ac6', name: 'Cancer Care Support Plan – 6 Months', short_name: 'Cancer Support', kind: 'group_service', description: 'Oncology, nutrition and counselling in one plan.', price: 49999, meta: '6 Months · 4 doctors', route: '/checkout' },
      { id: 'ac7', name: 'Stroke Rehabilitation – 90 Days', short_name: 'Stroke Rehab', kind: 'group_service', description: 'Neurology, physio and speech therapy after a stroke.', price: 38999, meta: '90 Days · 4 doctors', route: '/checkout' },
      { id: 'ac8', name: 'Chronic Kidney Care – 12 Months', short_name: 'CKD Care', kind: 'group_service', description: 'Nephrology-led management of chronic kidney disease.', price: 44999, meta: '12 Months · 3 doctors', route: '/checkout' },
      { id: 'ac9', name: 'COPD Management Plan – 12 Months', short_name: 'COPD Care', kind: 'group_service', description: 'Pulmonology team managing long-term lung disease.', price: 29999, meta: '12 Months · 3 doctors', route: '/checkout' },
      { id: 'ac10', name: 'Transplant Aftercare – 12 Months', short_name: 'Transplant Care', kind: 'group_service', description: 'Post-transplant monitoring and immunosuppression review.', price: 59999, meta: '12 Months · 4 doctors', route: '/checkout' },
      { id: 'ac11', name: 'Bariatric Surgery Support – 12 Months', short_name: 'Bariatric Support', kind: 'group_service', description: 'Surgery, nutrition and psychology through weight loss.', price: 39999, meta: '12 Months · 4 doctors', route: '/checkout' },
    ],
  },
  {
    key: 'longevity',
    name: 'Longevity Plans',
    tagline: 'Long-term healthy ageing programmes',
    short: 'Healthy ageing',
    icon: 'infinite-outline',
    tint: '#E8833A',
    items: [
      { id: 'lg1', name: 'Longevity & Healthy Ageing Plan – 12 Months', short_name: 'Healthy Ageing (12m)', kind: 'group_service', description: 'Whole-body ageing markers with quarterly reviews.', price: 39999, meta: '12 Months · 5 doctors', route: '/more/health-plans' },
      { id: 'lg2', name: 'Metabolic Longevity Plan – 6 Months', short_name: 'Metabolic Longevity (6m)', kind: 'group_service', description: 'Metabolic health, body composition and nutrition.', price: 19999, meta: '6 Months · 3 doctors', route: '/more/health-plans' },
      { id: 'lg3', name: 'Cardiac Longevity Plan – 12 Months', short_name: 'Cardiac Longevity (12m)', kind: 'group_service', description: 'Preventive cardiology with advanced lipid testing.', price: 27999, meta: '12 Months · 3 doctors', route: '/more/health-plans' },
      { id: 'lg4', name: 'Cognitive Health Plan – 12 Months', short_name: 'Cognitive Health (12m)', kind: 'group_service', description: 'Memory, sleep and cognitive-function tracking.', price: 22999, meta: '12 Months · 3 doctors', route: '/more/health-plans' },
      { id: 'lg5', name: 'Hormonal Longevity Plan – 12 Months', short_name: 'Hormonal Longevity', kind: 'group_service', description: 'Hormone panels and correction across the year.', price: 24999, meta: '12 Months · 3 doctors', route: '/checkout' },
      { id: 'lg6', name: 'Gut Health & Microbiome Plan – 6 Months', short_name: 'Gut Health', kind: 'group_service', description: 'Microbiome testing with a guided nutrition protocol.', price: 17999, meta: '6 Months · 3 doctors', route: '/checkout' },
      { id: 'lg7', name: 'Sleep Optimisation Plan – 6 Months', short_name: 'Sleep Plan', kind: 'group_service', description: 'Home sleep studies and a supervised correction plan.', price: 15999, meta: '6 Months · 2 doctors', route: '/checkout' },
      { id: 'lg8', name: 'Fitness & Body Composition – 12 Months', short_name: 'Body Composition', kind: 'group_service', description: 'DEXA-tracked strength and composition programme.', price: 21999, meta: '12 Months · 3 doctors', route: '/checkout' },
      { id: 'lg9', name: 'Immunity & Inflammation Plan – 12 Months', short_name: 'Immunity Plan', kind: 'group_service', description: 'Inflammatory markers tracked and brought down.', price: 23999, meta: '12 Months · 3 doctors', route: '/checkout' },
      { id: 'lg10', name: 'Skin & Hair Longevity Plan – 12 Months', short_name: 'Skin Longevity', kind: 'group_service', description: 'Dermatology-led ageing programme for skin and hair.', price: 18999, meta: '12 Months · 2 doctors', route: '/checkout' },
      { id: 'lg11', name: 'Executive Longevity Programme – 12 Months', short_name: 'Executive Longevity', kind: 'group_service', description: 'The full longevity work-up with a dedicated team.', price: 59999, meta: '12 Months · 5 doctors', route: '/checkout' },
    ],
  },
];

export const kindLabel: Record<ProductKind, string> = {
  appointment: 'Appointment',
  service: 'Service',
  group_service: 'Group Service',
};

/* ── Family Doctor ──────────────────────────────────────────────────────── */

export const familyDoctor = {
  id: 'fd1',
  name: 'Dr. Anitha Rao',
  avatar: 'https://i.pravatar.cc/150?img=47',
  qualification: 'MD, Internal Medicine',
  speciality: 'General Physician',
  hospital: 'Larazen Multispeciality Hospital',
  linked_since: '2025-09-14',
  empanel_code: 'FD-4471',
};

export type SecondOpinionBooking = {
  booking_id: string;
  type: string;
  provider_name: string;
  booked_date: string;
  completed_date: string;
  prescription?: {
    id: string;
    status: string;
    doctor_name: string;
    issue_date: string;
    diagnosis: string;
    medicines: { name: string; dosage: string; frequency: string; duration: string }[];
    notes?: string;
    doctors_advice?: string;
    has_pdf: boolean;
  };
  /**
   * The second-opinion conversation as it stands, if one has been started.
   *
   * Structural rather than imported from channels.ts so the data file stays a
   * data file; `secondOpinionChannel()` turns this into a real channel.
   */
  thread?: {
    messagesUsed?: number;
    messagesToday?: number;
    videoCallsUsed?: number;
    audioCallsUsed?: number;
    unread?: number;
    messages?: { from: 'me' | 'them'; text: string; time: string; kind?: 'text' | 'document' }[];
    documents?: { fileName: string; sizeLabel: string; uploadedBy: string; uploadedOn: string }[];
    calls?: {
      title: string;
      mode: 'audio' | 'video';
      scheduledStart: string;
      durationMin: number;
      status: 'scheduled' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    }[];
  };
};

/**
 * Second opinions from previous years, as a compact table.
 *
 * A patient who has been with a practice a while accumulates these steadily,
 * and the Completed head is capped because of it. They're written as rows
 * rather than objects because the list only renders what's here — the dates,
 * who it was with, and what was reviewed.
 *
 * Columns: completed, booked, type, treating doctor, diagnosis, medicine.
 */
const OLDER_SECOND_OPINIONS: [string, string, string, string, string, string][] = [
  ['2026-04-28', '2026-04-26', 'video_consultation', 'Dr. Meera Joshi', 'Recurrent tonsillitis — conservative management', 'Amoxicillin 500mg'],
  ['2026-04-14', '2026-04-12', 'in_person_consultation', 'Dr. Karthik Menon', 'Palpitations — benign ectopics', 'Metoprolol 25mg'],
  ['2026-04-02', '2026-04-01', 'home_visit', 'Dr. Suresh Iyer', 'Early adhesive capsulitis', 'Naproxen 250mg'],
  ['2026-03-22', '2026-03-20', 'video_consultation', 'Dr. Sneha Iyer', 'Acne vulgaris — moderate', 'Adapalene 0.1% gel'],
  ['2026-03-09', '2026-03-07', 'in_person_consultation', 'Dr. Lakshmi Menon', 'Subclinical hypothyroidism', 'Levothyroxine 25mcg'],
  ['2026-02-25', '2026-02-23', 'video_consultation', 'Dr. Vikram Desai', 'Post-viral cough', 'Levocetirizine 5mg'],
  ['2026-02-11', '2026-02-10', 'home_visit', 'Dr. Priya Sharma', 'Acute urticaria', 'Fexofenadine 180mg'],
  ['2026-01-30', '2026-01-28', 'in_person_consultation', 'Dr. Rahul Verma', 'Post-operative review — hernia repair', 'Paracetamol 650mg'],
  ['2026-01-16', '2026-01-14', 'video_consultation', 'Dr. Arun Prasad', 'Borderline blood pressure', 'Amlodipine 2.5mg'],
  ['2026-01-04', '2026-01-03', 'video_consultation', 'Dr. Fatima Sheikh', 'Iron-deficiency anaemia', 'Ferrous ascorbate 100mg'],
  ['2025-12-20', '2025-12-18', 'in_person_consultation', 'Dr. Sanjay Kulkarni', 'Plantar fasciitis', 'Etoricoxib 60mg'],
  ['2025-12-06', '2025-12-04', 'video_consultation', 'Dr. Ananya Bose', 'Sleep-onset insomnia', 'Melatonin 3mg'],
  ['2025-11-22', '2025-11-20', 'home_visit', 'Dr. Suresh Iyer', 'Lower back spasm', 'Chlorzoxazone 250mg'],
  ['2025-11-08', '2025-11-06', 'video_consultation', 'Dr. Meera Joshi', 'Childhood eczema flare', 'Hydrocortisone 1% cream'],
  ['2025-10-25', '2025-10-23', 'in_person_consultation', 'Dr. Karthik Menon', 'ECG review — normal variant', 'Rosuvastatin 5mg'],
  ['2025-10-11', '2025-10-09', 'video_consultation', 'Dr. Sneha Iyer', 'Seasonal hair fall', 'Biotin 10mg'],
  ['2025-09-27', '2025-09-25', 'video_consultation', 'Dr. Lakshmi Menon', 'Vitamin D deficiency', 'Cholecalciferol 60000 IU'],
  ['2025-09-13', '2025-09-11', 'in_person_consultation', 'Dr. Vikram Desai', 'Exercise-induced wheeze', 'Salbutamol inhaler 100mcg'],
  ['2025-08-30', '2025-08-28', 'home_visit', 'Dr. Priya Sharma', 'Insect-bite reaction', 'Calamine lotion'],
  ['2025-08-16', '2025-08-14', 'video_consultation', 'Dr. Rahul Verma', 'Gallstones — watchful waiting', 'Ursodeoxycholic acid 300mg'],
  ['2025-08-02', '2025-07-31', 'video_consultation', 'Dr. Arun Prasad', 'Statin intolerance review', 'Atorvastatin 10mg'],
  ['2025-07-19', '2025-07-17', 'in_person_consultation', 'Dr. Fatima Sheikh', 'Menstrual irregularity', 'Tranexamic acid 500mg'],
  ['2025-07-05', '2025-07-03', 'video_consultation', 'Dr. Sanjay Kulkarni', 'Knee pain — early osteoarthritis', 'Glucosamine 750mg'],
  ['2025-06-21', '2025-06-19', 'video_consultation', 'Dr. Ananya Bose', 'Work-related anxiety', 'Escitalopram 5mg'],
  ['2025-06-07', '2025-06-05', 'home_visit', 'Dr. Meera Joshi', 'Paediatric fever — viral', 'Paracetamol syrup 250mg/5ml'],
  ['2025-05-24', '2025-05-22', 'in_person_consultation', 'Dr. Suresh Iyer', 'Ankle sprain — grade 1', 'Diclofenac gel'],
  ['2025-05-10', '2025-05-08', 'video_consultation', 'Dr. Lakshmi Menon', 'Weight gain review', 'Metformin 500mg'],
  ['2025-04-26', '2025-04-24', 'video_consultation', 'Dr. Karthik Menon', 'Chest tightness — musculoskeletal', 'Pantoprazole 40mg'],
];

const olderSecondOpinions: SecondOpinionBooking[] = OLDER_SECOND_OPINIONS.map(
  ([completed, booked, type, doctor, diagnosis, medicine], i) => ({
    booking_id: `sob-old-${i + 1}`,
    type,
    provider_name: doctor,
    booked_date: booked,
    completed_date: completed,
    prescription: {
      id: `sorx-old-${i + 1}`,
      status: 'finalised',
      doctor_name: doctor,
      issue_date: completed,
      diagnosis,
      medicines: [
        { name: medicine, dosage: '1 dose', frequency: 'As directed', duration: 'As prescribed' },
      ],
      has_pdf: true,
    },
  }),
);

/**
 * Bookings you can ask your family doctor about.
 *
 * Ordered newest first. The first four completed within the 14-day window, so
 * they sit under In Progress; the rest have closed and sit under Completed.
 * Between them they cover the states the screen has to render: untouched,
 * part-used, call already taken, allowance spent while the window is still
 * open, and long finished.
 *
 * Note the treating doctor is never Dr. Anitha Rao — she's the family doctor
 * giving the opinion, so asking her to review her own prescription would be
 * nonsense.
 */
export const secondOpinionBookings: SecondOpinionBooking[] = [
  // ── In progress: 12 days left, conversation just started ──────────
  {
    booking_id: 'sob4',
    type: 'in_person_consultation',
    provider_name: 'Dr. Sneha Iyer',
    booked_date: '2026-08-15',
    completed_date: '2026-08-16',
    prescription: {
      id: 'sorx4',
      status: 'finalised',
      doctor_name: 'Dr. Sneha Iyer',
      issue_date: '2026-08-16',
      diagnosis: 'Seborrhoeic dermatitis — scalp and eyebrows',
      medicines: [
        { name: 'Ketoconazole 2% shampoo', dosage: 'Twice weekly', frequency: 'Leave 5 min', duration: '4 weeks' },
        { name: 'Clobetasol lotion 0.05%', dosage: 'Thin layer', frequency: 'Once at night', duration: '10 days' },
      ],
      notes: 'Review if scaling persists past four weeks.',
      doctors_advice: 'Avoid hot water on the scalp. Do not scratch.',
      has_pdf: true,
    },
    thread: {
      messagesUsed: 2,
      messagesToday: 1,
      unread: 1,
      messages: [
        { from: 'me', text: 'Dr. Anitha, is a steroid lotion safe on the face for 10 days?', time: '16 Aug' },
        { from: 'them', text: 'On the eyebrows, keep it to 5 days and only a thin film. The shampoo does most of the work.', time: '16 Aug' },
        { from: 'me', text: 'Understood. Sending you the photo from this morning.', time: '08:20' },
        { from: 'them', text: 'Much less redness than the photo in the prescription. Carry on.', time: '09:05' },
      ],
      documents: [
        { fileName: 'Scalp_Photo_18Aug.jpg', sizeLabel: '820 KB', uploadedBy: 'You', uploadedOn: '2026-08-18' },
      ],
    },
  },

  // ── In progress: 10 days left, nothing used yet ───────────────────
  {
    booking_id: 'sob0',
    type: 'video_consultation',
    provider_name: 'Dr. Lakshmi Menon',
    booked_date: '2026-08-12',
    completed_date: '2026-08-14',
    prescription: {
      id: 'sorx0',
      status: 'finalised',
      doctor_name: 'Dr. Lakshmi Menon',
      issue_date: '2026-08-14',
      diagnosis: 'Type 2 Diabetes Mellitus — dose review',
      medicines: [
        { name: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '90 days' },
        { name: 'Vitamin D3 60000 IU', dosage: '1 sachet', frequency: 'Weekly', duration: '8 weeks' },
      ],
      notes: 'Repeat HbA1c in three months.',
      doctors_advice: 'Take Metformin after meals to avoid nausea.',
      has_pdf: true,
    },
  },

  // ── In progress: 7 days left, the free video call has been taken ──
  {
    booking_id: 'sob5',
    type: 'video_consultation',
    provider_name: 'Dr. Arun Prasad',
    booked_date: '2026-08-10',
    completed_date: '2026-08-11',
    prescription: {
      id: 'sorx5',
      status: 'finalised',
      doctor_name: 'Dr. Arun Prasad',
      issue_date: '2026-08-11',
      diagnosis: 'Dyslipidaemia — raised LDL',
      medicines: [
        { name: 'Rosuvastatin 10mg', dosage: '1 tablet', frequency: 'At night', duration: '90 days' },
      ],
      notes: 'Repeat lipid profile in 12 weeks.',
      doctors_advice: 'Report any unexplained muscle pain immediately.',
      has_pdf: true,
    },
    thread: {
      messagesUsed: 1,
      messagesToday: 0,
      videoCallsUsed: 1,
      messages: [
        { from: 'me', text: 'Do I really need a statin at 35? Would diet alone do it?', time: '12 Aug' },
        { from: 'them', text: 'Let us talk it through properly — I have booked the video call included with this.', time: '12 Aug' },
        { from: 'them', text: 'Rx_Second_Opinion_Notes.pdf', time: '13 Aug', kind: 'document' },
        { from: 'them', text: 'As discussed: three months of diet and exercise first, repeat the panel, then decide.', time: '13 Aug' },
      ],
      calls: [
        {
          title: 'Second opinion — video',
          mode: 'video',
          scheduledStart: '2026-08-13 · 18:30',
          durationMin: 5,
          status: 'completed',
        },
      ],
      documents: [
        { fileName: 'Rx_Second_Opinion_Notes.pdf', sizeLabel: '198 KB', uploadedBy: 'Dr. Anitha Rao', uploadedOn: '2026-08-13' },
      ],
    },
  },

  // ── In progress: 2 days left, free messages already spent ─────────
  {
    booking_id: 'sob6',
    type: 'home_visit',
    provider_name: 'Dr. Sanjay Kulkarni',
    booked_date: '2026-08-05',
    completed_date: '2026-08-06',
    prescription: {
      id: 'sorx6',
      status: 'finalised',
      doctor_name: 'Dr. Sanjay Kulkarni',
      issue_date: '2026-08-06',
      diagnosis: 'Lumbar strain — no red flags',
      medicines: [
        { name: 'Aceclofenac 100mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days' },
        { name: 'Thiocolchicoside 4mg', dosage: '1 capsule', frequency: 'Twice daily', duration: '5 days' },
      ],
      notes: 'Imaging not indicated at this stage.',
      doctors_advice: 'Keep moving gently. No bed rest beyond two days.',
      has_pdf: true,
    },
    thread: {
      messagesUsed: 5,
      messagesToday: 2,
      messages: [
        { from: 'me', text: 'Second opinion please — he says no MRI, but the pain goes down my leg.', time: '07 Aug' },
        { from: 'them', text: 'Down the leg past the knee, or just the back of the thigh?', time: '07 Aug' },
        { from: 'me', text: 'Back of the thigh, stops above the knee. No numbness.', time: '07 Aug' },
        { from: 'them', text: 'Then I agree with him — no scan yet. Referred pain, not a trapped nerve.', time: '08 Aug' },
        { from: 'me', text: 'And if it is still there next week?', time: '14 Aug' },
        { from: 'them', text: 'Then we scan. Message me on day 14 either way.', time: '14 Aug' },
        { from: 'me', text: 'Day 12 today, much better but not gone.', time: '16 Aug' },
      ],
    },
  },

  // ── Completed: window closed ──────────────────────────────────────
  {
    booking_id: 'sob1',
    type: 'video_consultation',
    provider_name: 'Dr. Karthik Menon',
    booked_date: '2026-07-18',
    completed_date: '2026-07-20',
    prescription: {
      id: 'sorx1',
      status: 'finalised',
      doctor_name: 'Dr. Karthik Menon',
      issue_date: '2026-07-20',
      diagnosis: 'Essential hypertension — stage 1',
      medicines: [
        { name: 'Telmisartan 40mg', dosage: '1 tablet', frequency: 'Once daily', duration: '90 days' },
      ],
      notes: 'Monitor BP twice weekly and log readings.',
      doctors_advice: 'Reduce salt intake. Continue brisk walking.',
      has_pdf: true,
    },
    thread: {
      messages: [
        { from: 'me', text: 'Is 40mg a strong starting dose for someone my age?', time: '21 Jul' },
        { from: 'them', text: 'It is a standard start, and your readings justify it. Log them for two weeks and we will look together.', time: '21 Jul' },
        { from: 'me', text: 'BP_Log_Jul2026.pdf', time: '28 Jul', kind: 'document' },
        { from: 'them', text: 'Averaging 128/82 — that is the response we wanted. Stay on it.', time: '29 Jul' },
      ],
      documents: [
        { fileName: 'BP_Log_Jul2026.pdf', sizeLabel: '96 KB', uploadedBy: 'You', uploadedOn: '2026-07-28' },
      ],
      calls: [
        {
          title: 'Second opinion — voice',
          mode: 'audio',
          scheduledStart: '2026-07-29 · 19:00',
          durationMin: 5,
          status: 'completed',
        },
      ],
    },
  },
  {
    booking_id: 'sob7',
    type: 'video_consultation',
    provider_name: 'Dr. Vikram Desai',
    booked_date: '2026-06-30',
    completed_date: '2026-07-02',
    prescription: {
      id: 'sorx7',
      status: 'finalised',
      doctor_name: 'Dr. Vikram Desai',
      issue_date: '2026-07-02',
      diagnosis: 'Allergic rhinitis with mild nocturnal cough',
      medicines: [
        { name: 'Montelukast 10mg', dosage: '1 tablet', frequency: 'At night', duration: '30 days' },
        { name: 'Fluticasone nasal spray', dosage: '2 sprays each nostril', frequency: 'Once daily', duration: '30 days' },
      ],
      notes: 'Consider allergen testing if symptoms recur next season.',
      doctors_advice: 'Wash bedding weekly at 60°C.',
      has_pdf: true,
    },
    thread: {
      messages: [
        { from: 'me', text: 'Montelukast for a month — is that too long?', time: '03 Jul' },
        { from: 'them', text: 'A month is normal for the season. Stop it if you notice mood changes or vivid dreams and tell me.', time: '03 Jul' },
        { from: 'me', text: 'No side effects so far, breathing much easier at night.', time: '11 Jul' },
      ],
    },
  },
  {
    booking_id: 'sob2',
    type: 'in_person_consultation',
    provider_name: 'Dr. Priya Sharma',
    booked_date: '2026-06-10',
    completed_date: '2026-06-12',
    prescription: {
      id: 'sorx2',
      status: 'finalised',
      doctor_name: 'Dr. Priya Sharma',
      issue_date: '2026-06-12',
      diagnosis: 'Allergic contact dermatitis',
      medicines: [
        { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'At night', duration: '10 days' },
        { name: 'Mometasone cream', dosage: 'Thin layer', frequency: 'Twice daily', duration: '7 days' },
      ],
      doctors_advice: 'Avoid fragranced soaps. Moisturise twice daily.',
      has_pdf: true,
    },
    thread: {
      messages: [
        { from: 'me', text: 'Two creams and a tablet for a rash — is all of it needed?', time: '13 Jun' },
        { from: 'them', text: 'The steroid is the one that matters. Stop it at seven days; keep the moisturiser going.', time: '13 Jun' },
        { from: 'me', text: 'Cleared up in five. Thank you.', time: '19 Jun' },
      ],
    },
  },
  {
    booking_id: 'sob8',
    type: 'in_person_consultation',
    provider_name: 'Dr. Rahul Verma',
    booked_date: '2026-05-19',
    completed_date: '2026-05-21',
    prescription: {
      id: 'sorx8',
      status: 'finalised',
      doctor_name: 'Dr. Rahul Verma',
      issue_date: '2026-05-21',
      diagnosis: 'Reducible inguinal hernia — surgery advised',
      medicines: [
        { name: 'Pantoprazole 40mg', dosage: '1 tablet', frequency: 'Before breakfast', duration: '14 days' },
      ],
      notes: 'Elective laparoscopic repair discussed. Patient to decide timing.',
      doctors_advice: 'Avoid heavy lifting until repaired.',
      has_pdf: true,
    },
    thread: {
      messages: [
        { from: 'me', text: 'He says operate. Is there any way to avoid surgery?', time: '22 May' },
        { from: 'them', text: 'Not for a hernia — it will not close on its own. Waiting is reasonable while it stays reducible, but repair is the fix.', time: '22 May' },
        { from: 'them', text: 'If it ever becomes hard, painful and will not push back in, that is an emergency. Go straight in.', time: '22 May' },
        { from: 'me', text: 'Clear. I will book it for after the exams.', time: '23 May' },
      ],
    },
  },
  {
    booking_id: 'sob3',
    type: 'home_visit',
    provider_name: 'Dr. Suresh Iyer',
    booked_date: '2026-05-02',
    completed_date: '2026-05-02',
  },
  ...olderSecondOpinions,
];

export type HealthRecord = {
  id: string;
  type: 'vitals' | 'lab_report' | 'diagnosis';
  title: string;
  date: string;
  value?: string;
};

export const healthRecords: HealthRecord[] = [
  { id: 'r1', type: 'vitals', title: 'Blood Pressure', date: '2026-08-10', value: '122/80 mmHg' },
  { id: 'r2', type: 'vitals', title: 'Blood Glucose (Fasting)', date: '2026-08-10', value: '96 mg/dL' },
  { id: 'r3', type: 'vitals', title: 'Weight', date: '2026-08-10', value: '71 kg' },
  { id: 'r4', type: 'lab_report', title: 'Lipid Profile', date: '2026-07-28' },
  { id: 'r5', type: 'diagnosis', title: 'Type 2 Diabetes — under management', date: '2025-11-02' },
];

export type PatientDocument = {
  id: string;
  name: string;
  category: string;
  uploaded_date: string;
  size: string;
};

export const documents: PatientDocument[] = [
  { id: 'doc1', name: 'Lipid_Profile_Jul2026.pdf', category: 'Lab Report', uploaded_date: '2026-07-28', size: '842 KB' },
  { id: 'doc2', name: 'Aadhar_Card.pdf', category: 'Identity', uploaded_date: '2026-05-02', size: '1.1 MB' },
  { id: 'doc3', name: 'Insurance_Policy.pdf', category: 'Insurance', uploaded_date: '2026-04-11', size: '2.4 MB' },
  { id: 'doc4', name: 'Discharge_Summary_Aug2026.pdf', category: 'Hospital Record', uploaded_date: '2026-08-06', size: '1.6 MB' },
  { id: 'doc5', name: 'Chest_Xray.jpg', category: 'Imaging', uploaded_date: '2026-07-02', size: '3.2 MB' },
  { id: 'doc6', name: 'ECG_Report_Mar2026.pdf', category: 'Lab Report', uploaded_date: '2026-03-04', size: '512 KB' },
  { id: 'doc7', name: 'MRI_Lumbar_Spine.pdf', category: 'Imaging', uploaded_date: '2025-11-19', size: '8.7 MB' },
  { id: 'doc8', name: 'Vaccination_Certificate.pdf', category: 'Immunisation', uploaded_date: '2025-06-14', size: '318 KB' },
];

export type SpendingItem = {
  id: string;
  label: string;
  date: string;
  amount: number;
  status: 'paid' | 'refunded' | 'pending';
};

export const spending: SpendingItem[] = [
  { id: 's1', label: 'Consultation — Dr. Karthik Menon', date: '2026-08-20', amount: 800, status: 'pending' },
  { id: 's2', label: 'Consultation — Dr. Priya Sharma', date: '2026-07-30', amount: 600, status: 'paid' },
  { id: 's3', label: 'Consultation — Dr. Suresh Iyer', date: '2026-07-15', amount: 700, status: 'refunded' },
  { id: 's4', label: 'Lab Test — Lipid Profile', date: '2026-07-28', amount: 950, status: 'paid' },
];

export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar: string;
};

export const familyMembers: FamilyMember[] = [
  { id: 'f1', name: 'Meena Reddy', relation: 'Spouse', age: 34, avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: 'f2', name: 'Arjun Reddy', relation: 'Son', age: 8, avatar: 'https://i.pravatar.cc/150?img=68' },
  { id: 'f3', name: 'Lakshmi Reddy', relation: 'Mother', age: 61, avatar: 'https://i.pravatar.cc/150?img=48' },
];

/**
 * A Health Plan is a *product* — an admin-authored, condition-specific care
 * package ("Thyroid Care — 3 Months", "Cardiac Surgery Care — 6 Months") run by
 * a multidisciplinary care team and paid in installments. It is NOT the
 * subscription tier; that is `membership`.
 */
/**
 * CATEGORY 3 — Advanced Healing & Support.
 * Split into Surgical Recovery vs Long-Term Chronic Management so patients can
 * find the right one. Pattern: [Procedure/Condition] Plan – [Duration].
 * Team-based and paid in installments.
 */
export type HealthPlan = {
  id: string;
  name: string;
  short_name: string;
  category: 'Surgical Recovery' | 'Chronic Management';
  speciality: string;
  description: string;
  patient_price: number;
  duration_label: string;
  duration_days: number;
  doctors_included: number;
  total_consultations: number;
  includes: string[];
  featured?: boolean;
};

export const healthPlans: HealthPlan[] = [
  {
    id: 'plan1',
    name: 'Post-Kidney Surgery Recovery Plan – 30 Days',
    short_name: 'Post-Kidney Rehab (30d)',
    category: 'Surgical Recovery',
    speciality: 'Nephrology',
    description: 'Structured recovery after kidney surgery, with renal function monitoring and diet support.',
    patient_price: 18999,
    duration_label: '30 Days',
    duration_days: 30,
    doctors_included: 3,
    total_consultations: 8,
    includes: ['Nephrologist reviews', 'Renal function panels', 'Renal diet plan', 'Wound care checks'],
  },
  {
    id: 'plan2',
    name: 'Post-Heart Surgery Recovery Plan – 45 Days',
    short_name: 'Post-Heart Rehab (45d)',
    category: 'Surgical Recovery',
    speciality: 'Cardiology',
    description: 'Cardiac surgeon-led recovery from discharge through supervised cardiac rehabilitation.',
    patient_price: 29999,
    duration_label: '45 Days',
    duration_days: 45,
    doctors_included: 4,
    total_consultations: 12,
    includes: ['Cardiac surgeon reviews', 'Supervised cardiac rehab', 'ECG & echo follow-ups', 'Cardiac diet counselling'],
    featured: true,
  },
  {
    id: 'plan3',
    name: 'Post-Stroke Recovery Plan – 60 Days',
    short_name: 'Stroke Rehab (60d)',
    category: 'Surgical Recovery',
    speciality: 'Neurology',
    description: 'Continuity of care after a stroke — neurology, physiotherapy and speech therapy together.',
    patient_price: 34999,
    duration_label: '60 Days',
    duration_days: 60,
    doctors_included: 4,
    total_consultations: 16,
    includes: ['Neurologist reviews', 'Physiotherapy sessions', 'Speech & swallow therapy', 'Caregiver guidance'],
  },
  {
    id: 'plan4',
    name: 'Chronic Heart Care Plan – 90 Days',
    short_name: 'Chronic Heart Care (90d)',
    category: 'Chronic Management',
    speciality: 'Cardiology',
    description: 'Long-term support for heart failure and chronic cardiac conditions, with quarterly reviews.',
    patient_price: 24999,
    duration_label: '90 Days',
    duration_days: 90,
    doctors_included: 3,
    total_consultations: 14,
    includes: ['Cardiologist reviews', 'Medication optimisation', 'BP & weight tracking', 'Lifestyle coaching'],
  },
];

/** Care teams a patient picks between when booking a plan. */
export const careTeams: Record<string, { id: string; name: string; lead: string; hospital: string }[]> = {
  plan1: [
    { id: 't1', name: 'Team Nephron', lead: 'Dr. Kavya Nair', hospital: 'Larazen Kidney Centre' },
    { id: 't2', name: 'Team Renova', lead: 'Dr. Anitha Rao', hospital: 'Larazen Multispeciality Hospital' },
  ],
  plan2: [
    { id: 't3', name: 'Team Cardia', lead: 'Dr. Karthik Menon', hospital: 'Larazen Heart Institute' },
    { id: 't4', name: 'Team Pulse', lead: 'Dr. Suresh Iyer', hospital: 'Larazen Multispeciality Hospital' },
  ],
  plan3: [
    { id: 't5', name: 'Team Neuro+', lead: 'Dr. Priya Sharma', hospital: 'Larazen Neuro Institute' },
  ],
  plan4: [
    { id: 't6', name: 'Team Cardia', lead: 'Dr. Karthik Menon', hospital: 'Larazen Heart Institute' },
  ],
};

export type PlanInstallment = {
  id: string;
  installment_no: number;
  amount: number;
  due_label: string;
  status: 'paid' | 'pending';
  is_booking?: boolean;
};

export type PlanBooking = {
  id: string;
  plan_name: string;
  /** When it actually finished. Only set once the plan is over. */
  completed_on?: string;
  status: 'pending_payment' | 'pending_acceptance' | 'confirmed' | 'active'
    | 'completed' | 'cancelled' | 'rejected';
  team_name: string;
  amount_paid: number;
  total_payable: number;
  installments: PlanInstallment[];
  documents: { id: string; doctor_name: string; file_name: string; note?: string }[];
  category: string;
};

export const planBookings: PlanBooking[] = [
  {
    id: 'pb1',
    category: 'advanced',
    plan_name: 'Chronic Heart Care Plan – 90 Days',
    status: 'active',
    team_name: 'Team Cardia',
    amount_paid: 12499,
    total_payable: 24999,
    installments: [
      { id: 'i1', installment_no: 1, amount: 12499, due_label: 'Paid on 2026-06-01', status: 'paid', is_booking: true },
      { id: 'i2', installment_no: 2, amount: 12500, due_label: 'Due 2026-09-01', status: 'pending' },
    ],
    documents: [
      { id: 'pd1', doctor_name: 'Dr. Karthik Menon', file_name: 'Medication_Optimisation.pdf', note: 'Beta blocker dose revised at week 6' },
    ],
  },
  {
    id: 'pb2',
    category: 'advanced',
    plan_name: 'Post-Kidney Surgery Recovery Plan – 30 Days',
    completed_on: '2026-06-20',
    status: 'completed',
    team_name: 'Team Nephron',
    amount_paid: 18999,
    total_payable: 18999,
    installments: [
      { id: 'i3', installment_no: 1, amount: 9499, due_label: 'Paid on 2025-12-10', status: 'paid', is_booking: true },
      { id: 'i4', installment_no: 2, amount: 9500, due_label: 'Paid on 2026-01-10', status: 'paid' },
    ],
    documents: [
      { id: 'pd2', doctor_name: 'Dr. Kavya Nair', file_name: 'Discharge_Summary.pdf' },
      { id: 'pd3', doctor_name: 'Renal Diet Team', file_name: 'Recovery_Milestones.pdf', note: 'Renal function back to baseline' },
    ],
  },
  {
    id: 'pb3',
    category: 'advanced',
    plan_name: 'Post-Spinal Surgery Recovery – 60 Days',
    status: 'pending_acceptance',
    team_name: 'Team Ortho+',
    amount_paid: 0,
    total_payable: 32999,
    installments: [
      { id: 'i5', installment_no: 1, amount: 11000, due_label: 'Due on acceptance', status: 'pending', is_booking: true },
    ],
    documents: [],
  },
  {
    id: 'pb4',
    category: 'healthcare',
    plan_name: 'Preventive Health Plan – 12 Months',
    status: 'active',
    team_name: 'Team Wellness',
    amount_paid: 4999,
    total_payable: 14999,
    installments: [
      { id: 'i6', installment_no: 1, amount: 4999, due_label: 'Paid on 2026-07-01', status: 'paid', is_booking: true },
      { id: 'i7', installment_no: 2, amount: 5000, due_label: 'Due 2026-11-01', status: 'pending' },
    ],
    documents: [
      { id: 'pd4', doctor_name: 'Dr. Meera Joshi', file_name: 'Annual_Screening_Plan.pdf' },
    ],
  },
  {
    id: 'pb5',
    category: 'healthcare',
    plan_name: 'Family Preventive Cover – 6 Months',
    status: 'pending_payment',
    team_name: 'Team Wellness',
    amount_paid: 0,
    total_payable: 8999,
    installments: [
      { id: 'i8', installment_no: 1, amount: 3000, due_label: 'Due now', status: 'pending', is_booking: true },
    ],
    documents: [],
  },
  {
    id: 'pb6',
    category: 'longevity',
    plan_name: 'Longevity & Healthy Ageing Plan – 12 Months',
    status: 'active',
    team_name: 'Team Longevity',
    amount_paid: 13333,
    total_payable: 39999,
    installments: [
      { id: 'i9', installment_no: 1, amount: 13333, due_label: 'Paid on 2026-08-01', status: 'paid', is_booking: true },
      { id: 'i10', installment_no: 2, amount: 13333, due_label: 'Due 2026-12-01', status: 'pending' },
    ],
    documents: [
      { id: 'pd5', doctor_name: 'Dr. Kavya Nair', file_name: 'Baseline_Marker_Panel.pdf' },
    ],
  },
  {
    id: 'pb8',
    category: 'healthcare',
    plan_name: 'Heart Health Screening – 6 Months',
    status: 'confirmed',
    team_name: 'Team Cardia',
    amount_paid: 6499,
    total_payable: 6499,
    installments: [
      { id: 'i12', installment_no: 1, amount: 6499, due_label: 'Paid on 2026-08-15', status: 'paid', is_booking: true },
    ],
    documents: [],
  },
  {
    id: 'pb7',
    category: 'longevity',
    plan_name: 'Metabolic Longevity Plan – 6 Months',
    status: 'pending_acceptance',
    team_name: 'Team Metabolic',
    amount_paid: 0,
    total_payable: 19999,
    installments: [
      { id: 'i11', installment_no: 1, amount: 6666, due_label: 'Due on acceptance', status: 'pending', is_booking: true },
    ],
    documents: [],
  },
];

export type MarketplaceProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

export const marketplaceProducts: MarketplaceProduct[] = [
  { id: 'm1', name: 'Digital BP Monitor', category: 'Devices', price: 1499, image: 'https://picsum.photos/seed/bp-monitor/200' },
  { id: 'm2', name: 'Vitamin D3 Supplement', category: 'Wellness', price: 349, image: 'https://picsum.photos/seed/vitamind/200' },
  { id: 'm3', name: 'Glucometer Strips (50)', category: 'Devices', price: 899, image: 'https://picsum.photos/seed/glucometer/200' },
];

export type SupportStaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  phone: string;
  /** Set for caregivers the patient added — they sign in with their own login. */
  email?: string;
  /** Roles bounding what they may do, from `familyRoles`. */
  roleIds?: string[];
  /**
   * Kept out of the roles on purpose: paying is the one permission where a
   * mistake costs money, so it's granted explicitly rather than bundled.
   */
  canPay?: boolean;
  /** True once a login has been issued to them. */
  invited?: boolean;
};

export const supportStaff: SupportStaffMember[] = [
  { id: 'ss1', name: 'Rahul Verma', role: 'Care Coordinator', avatar: 'https://i.pravatar.cc/150?img=33', phone: '+91 98765 43210' },
  { id: 'ss2', name: 'Sneha Kulkarni', role: 'Nutrition Counselor', avatar: 'https://i.pravatar.cc/150?img=44', phone: '+91 91234 56789' },
];

/* ────────────────────────────────────────────────────────────────────────
 * MEMBERSHIP — tiers, subscription state and self-service upgrade/downgrade.
 *
 * Mirrors the web's MembershipPlansPanel. Amounts there are quoted by the
 * server (proration is server-side); the figures here stand in for that quote.
 * ──────────────────────────────────────────────────────────────────────── */

export type BillingPeriod = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'biennial' | 'triennial';

export const PERIOD_LABEL: Record<BillingPeriod, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Half-yearly',
  annual: 'Annual',
  biennial: '2-yearly',
  triennial: '3-yearly',
};

export type MembershipTier = {
  id: string;
  name: string;
  /** Headline "up to X% off consultations and services". */
  member_discount_pct: number;
  /** Rank drives whether another tier is an upgrade, downgrade or lateral. */
  rank: number;
  periods: Partial<Record<BillingPeriod, number>>;
  features: string[];
};

export const membershipTiers: MembershipTier[] = [
  {
    id: 'mt1',
    name: 'Care Free',
    member_discount_pct: 0,
    rank: 0,
    periods: { monthly: 0 },
    features: ['Book consultations at list price', 'Health record storage', 'One family member'],
  },
  {
    id: 'mt2',
    name: 'Care Plus',
    member_discount_pct: 10,
    rank: 1,
    periods: { monthly: 499, quarterly: 1399, semi_annual: 2699, annual: 4999 },
    features: ['10% off consultations & services', 'Up to 4 family members', 'Priority slots', 'Free home sample collection'],
  },
  {
    id: 'mt3',
    name: 'Care Premium',
    member_discount_pct: 20,
    rank: 2,
    periods: { monthly: 999, quarterly: 2799, semi_annual: 5399, annual: 9999, biennial: 18999 },
    features: ['20% off consultations & services', 'Unlimited family members', 'Annual full-body checkup', 'Dedicated care coordinator', '24×7 instant consults'],
  },
];

export type SubscriptionStatus = 'pending' | 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended';

export const membershipSubscription = {
  status: 'active' as SubscriptionStatus,
  plan_id: 'mt2',
  plan_period: 'monthly' as BillingPeriod,
  started_on: '2025-09-15',
  current_period_end: '2026-09-15',
  /** Days left in the paid period — drives the proration credit below. */
  days_remaining: 30,
};

/**
 * Health credits redeemable toward a renewal. The server caps how much of a
 * given offering a wallet may cover; `max_redeemable_pct` stands in for that.
 */
export const healthCredits = {
  available: 320,
  max_redeemable_pct: 20,
};

export const membership = {
  plan_name: 'Family Care',
  status: 'active' as const,
  renews_on: '2026-09-15',
  members_covered: 3,
  credits_remaining: 2,
};

export const currentPatient = {
  id: 'patient-1',
  full_name: 'Rohit Reddy',
  email: 'rohit.reddy@example.com',
  phone: '+91 98450 12345',
  avatar: 'https://i.pravatar.cc/150?img=59',
  gender: 'Male',
  date_of_birth: '1991-04-12',
  // Health profile
  blood_group: 'O+',
  height_cm: 174,
  weight_kg: 71,
  allergies: ['Penicillin', 'Dust mites'],
  chronic_conditions: ['Type 2 Diabetes'],
  current_medications: ['Metformin 500mg'],
  // Emergency contact
  emergency_contact: { name: 'Meena Reddy', phone: '+91 98450 67890', relation: 'Spouse' },
  // Insurance
  insurance: { provider: 'Star Health', policy_number: 'SH-4471-99820', valid_till: '2027-03-31' },
};

/* ────────────────────────────────────────────────────────────────────────
 * PROFILE SETTINGS — mirrors the web patient ProfileSetting module.
 *
 * Tabs: Personal (Personal Details · Contact & Identity · Address ·
 * Emergency Contact) · Insurance · Female Health · Vitals ·
 * Habits & Lifestyle · Surgeries · Health Records · Prescriptions ·
 * Family Group. Field keys match the web section components.
 * ──────────────────────────────────────────────────────────────────────── */

export type ProfileField = {
  key: string;
  label: string;
  value: string;
  /** `select` and `date` render a chooser rather than a plain text input. */
  type?: 'text' | 'select' | 'date' | 'number' | 'multiline';
  options?: string[];
};

export type ProfileGroup = { key: string; title: string; fields: ProfileField[] };

export const profileGroups: Record<string, ProfileGroup[]> = {
  personal: [
    {
      key: 'personal_details',
      title: 'Personal Details',
      fields: [
        { key: 'first_name', label: 'First Name', value: 'Rohit' },
        { key: 'middle_name', label: 'Middle Name', value: '' },
        { key: 'last_name', label: 'Last Name', value: 'Reddy' },
        { key: 'dob', label: 'Date of Birth', value: '1991-04-12', type: 'date' },
        { key: 'gender', label: 'Gender', value: 'Male', type: 'select', options: ['Male', 'Female', 'Other'] },
        { key: 'blood_group', label: 'Blood Group', value: 'O+', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
        { key: 'languages_known', label: 'Languages Known', value: 'English, Telugu, Hindi' },
      ],
    },
    {
      key: 'contact_identity',
      title: 'Contact & Identity',
      fields: [
        { key: 'phone_number', label: 'Phone Number', value: '+91 98450 12345' },
        { key: 'alternative_phone', label: 'Alternative Phone', value: '+91 90000 11223' },
        { key: 'email', label: 'Email', value: 'rohit.reddy@example.com' },
        { key: 'alternative_email', label: 'Alternative Email', value: '' },
        { key: 'aadhar_number', label: 'Aadhar Number', value: 'XXXX XXXX 4471' },
        { key: 'pan_number', label: 'PAN Number', value: 'ABCDE1234F' },
        { key: 'religion', label: 'Religion', value: 'Hindu', type: 'select', options: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'] },
        { key: 'caste', label: 'Caste', value: 'General', type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'Other'] },
        { key: 'citizenship', label: 'Citizenship', value: 'Indian' },
      ],
    },
    {
      key: 'address',
      title: 'Address',
      fields: [
        { key: 'address_line', label: 'Address', value: '12-4-88, Jubilee Hills', type: 'multiline' },
        { key: 'city', label: 'City', value: 'Hyderabad' },
        { key: 'state', label: 'State', value: 'Telangana', type: 'select', options: ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra'] },
        { key: 'pincode', label: 'Pincode', value: '500033', type: 'number' },
        { key: 'country', label: 'Country', value: 'India' },
      ],
    },
    {
      key: 'emergency_contact',
      title: 'Emergency Contact',
      fields: [
        { key: 'emergency_contact_name', label: 'Contact Name', value: 'Meena Reddy' },
        { key: 'emergency_contact_phone', label: 'Contact Phone', value: '+91 98450 67890' },
        { key: 'emergency_contact_relation', label: 'Relation', value: 'Spouse', type: 'select', options: ['Spouse', 'Father', 'Mother', 'Sibling', 'Friend', 'Guardian'] },
        { key: 'emergency_contact_email', label: 'Contact Email', value: 'meena.reddy@example.com' },
      ],
    },
  ],
  insurance: [
    {
      key: 'insurance',
      title: 'Insurance',
      fields: [
        { key: 'insurance_provider', label: 'Insurance Provider', value: 'Star Health', type: 'select', options: ['Star Health', 'HDFC Ergo', 'ICICI Lombard', 'Niva Bupa', 'Other'] },
        { key: 'insurance_policy_number', label: 'Policy Number', value: 'SH-4471-99820' },
        { key: 'insurance_valid_till', label: 'Valid Till', value: '2027-03-31', type: 'date' },
        { key: 'insurance_coverage_amount', label: 'Coverage Amount', value: '₹5,00,000', type: 'number' },
      ],
    },
  ],
  female_health: [
    {
      key: 'female_health',
      title: 'Female Health',
      fields: [
        // The web's FemaleHealthSection carries exactly these four, with these
        // four pregnancy states. "Planning" is kept separate from "not
        // pregnant" because it changes prescribing and vaccination advice.
        { key: 'lmp_date', label: 'LMP Date', value: '2026-08-02', type: 'date' },
        { key: 'lmp_remarks', label: 'LMP Remarks', value: 'Regular 28-day cycle, no unusual pain.', type: 'multiline' },
        { key: 'pregnancy_status', label: 'Pregnancy Status', value: 'Not pregnant', type: 'select', options: ['Not pregnant', 'Pregnant', 'Planning pregnancy', 'Post-partum'] },
        { key: 'pregnancy_remarks', label: 'Pregnancy Remarks', value: '', type: 'multiline' },
      ],
    },
  ],
  vitals: [
    {
      key: 'vitals',
      title: 'Vitals',
      fields: [
        { key: 'height_cm', label: 'Height (cm)', value: '174', type: 'number' },
        { key: 'weight_kg', label: 'Weight (kg)', value: '71', type: 'number' },
        { key: 'bmi', label: 'BMI', value: '23.5', type: 'number' },
        { key: 'blood_pressure_systolic', label: 'BP Systolic (mmHg)', value: '122', type: 'number' },
        { key: 'blood_pressure_diastolic', label: 'BP Diastolic (mmHg)', value: '80', type: 'number' },
        { key: 'heart_rate', label: 'Heart Rate (bpm)', value: '76', type: 'number' },
        { key: 'temperature', label: 'Temperature (°F)', value: '98.4', type: 'number' },
        { key: 'blood_sugar_fasting', label: 'Blood Sugar — Fasting (mg/dL)', value: '96', type: 'number' },
        { key: 'blood_sugar_pp', label: 'Blood Sugar — PP (mg/dL)', value: '132', type: 'number' },
      ],
    },
  ],
  habits: [
    {
      key: 'habits',
      title: 'Habits & Lifestyle',
      fields: [
        { key: 'smoking', label: 'Smoking', value: 'Never', type: 'select', options: ['Never', 'Occasionally', 'Regularly', 'Former smoker'] },
        { key: 'alcohol', label: 'Alcohol', value: 'Occasionally', type: 'select', options: ['Never', 'Occasionally', 'Regularly'] },
        { key: 'tobacco', label: 'Tobacco', value: 'Never', type: 'select', options: ['Never', 'Occasionally', 'Regularly'] },
        { key: 'drugs', label: 'Drugs', value: 'Never', type: 'select', options: ['Never', 'Occasionally', 'Regularly'] },
        { key: 'diet', label: 'Diet', value: 'Vegetarian', type: 'select', options: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian'] },
        { key: 'exercise', label: 'Exercise', value: '4 days / week, brisk walking' },
        { key: 'sleep_pattern', label: 'Sleep Pattern', value: '6–7 hours' },
        { key: 'caffeine', label: 'Caffeine', value: '2 cups / day' },
      ],
    },
  ],
};

/**
 * Per-section audit trail — the web renders a "last updated by …" line under
 * each section title for accountability.
 */
export const sectionUpdates: Record<string, { updated_at: string; updated_by: string }> = {
  personal_details: { updated_at: '2026-08-10', updated_by: 'Rohit Reddy' },
  contact_identity: { updated_at: '2026-07-02', updated_by: 'Rohit Reddy' },
  address: { updated_at: '2026-05-14', updated_by: 'Rohit Reddy' },
  emergency_contact: { updated_at: '2026-05-14', updated_by: 'Rohit Reddy' },
  insurance: { updated_at: '2026-04-11', updated_by: 'Care Coordinator' },
  female_health: { updated_at: '—', updated_by: '—' },
  vitals: { updated_at: '2026-08-10', updated_by: 'Dr. Anitha Rao' },
  habits: { updated_at: '2026-06-20', updated_by: 'Rohit Reddy' },
  surgeries: { updated_at: '2025-11-22', updated_by: 'Dr. Suresh Iyer' },
  health_records: { updated_at: '2026-07-28', updated_by: 'Larazen Diagnostics' },
  prescriptions: { updated_at: '2026-07-30', updated_by: 'Dr. Anitha Rao' },
  family_group: { updated_at: '2026-03-08', updated_by: 'Rohit Reddy' },
};

/** Contact verification state — badges are only shown when the server says so. */
export const contactVerification = {
  phone_verified: true,
  email_verified: false,
};

/** House / family group — members, their relation, and what they may see. */
export type HouseMember = {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar: string;
  is_head?: boolean;
  permissions: string[];
};

export const houseGroup = {
  name: 'Reddy Household',
  invite_code: 'HG-8842-RDY',
  members: [
    { id: 'hm1', name: 'Rohit Reddy', relation: 'Self', age: 35, avatar: 'https://i.pravatar.cc/150?img=59', is_head: true, permissions: ['Appointments', 'Records', 'Billing'] },
    { id: 'hm2', name: 'Meena Reddy', relation: 'Wife', age: 34, avatar: 'https://i.pravatar.cc/150?img=5', permissions: ['Appointments', 'Records'] },
    { id: 'hm3', name: 'Arjun Reddy', relation: 'Son', age: 8, avatar: 'https://i.pravatar.cc/150?img=68', permissions: ['Appointments'] },
    { id: 'hm4', name: 'Lakshmi Reddy', relation: 'Mother', age: 61, avatar: 'https://i.pravatar.cc/150?img=48', permissions: ['Appointments', 'Records'] },
  ] as HouseMember[],
};

/* ────────────────────────────────────────────────────────────────────────
 * FAMILY — three distinct things the web page manages:
 *
 *   1. Minor profiles   — login-less sub-accounts a guardian opens into.
 *   2. Linked family    — adults who can act for me / accounts I can open.
 *   3. Roles            — the permission matrix that bounds what they may do.
 * ──────────────────────────────────────────────────────────────────────── */

export type Minor = {
  id: string;
  full_name: string;
  relation: string;
  dob: string;
  gender: string;
  avatar: string;
};

export const minors: Minor[] = [
  { id: 'mn1', full_name: 'Arjun Reddy', relation: 'Son', dob: '2018-02-14', gender: 'Male', avatar: 'https://i.pravatar.cc/150?img=68' },
  { id: 'mn2', full_name: 'Aarohi Reddy', relation: 'Daughter', dob: '2021-09-03', gender: 'Female', avatar: 'https://i.pravatar.cc/150?img=45' },
];

export const minorRelationOptions = ['Son', 'Daughter', 'Child', 'Dependent'];

/**
 * The module catalog is backend-owned (`app/api/patient_family/module_catalog.py`).
 * Each leaf carries two verbs — view (read) and manage (create / edit / act).
 */
export type PatientModule = { key: string; label: string; group: string };

export const patientModules: PatientModule[] = [
  { key: 'profile_personal', label: 'Personal details', group: 'Profile' },
  { key: 'profile_contact', label: 'Contact & identity', group: 'Profile' },
  { key: 'profile_address', label: 'Address', group: 'Profile' },
  { key: 'profile_emergency', label: 'Emergency contact', group: 'Profile' },
  { key: 'profile_insurance', label: 'Insurance & documents', group: 'Profile' },
  { key: 'profile_female_health', label: 'Female health', group: 'Profile' },
  { key: 'health_vitals', label: 'Vitals', group: 'Health' },
  { key: 'health_habits', label: 'Habits & lifestyle', group: 'Health' },
  { key: 'health_surgeries', label: 'Surgeries', group: 'Health' },
  { key: 'health_records', label: 'Health records', group: 'Health' },
  { key: 'appt_upcoming', label: 'Upcoming appointments', group: 'Appointments' },
  { key: 'appt_history', label: 'Past appointments', group: 'Appointments' },
  { key: 'appt_service_list', label: 'Service list (purchases)', group: 'Appointments' },
  { key: 'appt_booking', label: 'Book appointments & services', group: 'Appointments' },
  { key: 'prescriptions', label: 'Prescriptions', group: 'Records' },
  { key: 'documents', label: 'Documents', group: 'Records' },
  { key: 'family_doctor', label: 'Family doctor', group: 'Care' },
  { key: 'service_chat', label: 'Service chat (messages)', group: 'Services' },
  { key: 'service_calls', label: 'Audio & video calls', group: 'Services' },
  { key: 'service_documents', label: 'Shared documents & forms', group: 'Services' },
  { key: 'spending', label: 'Spending & billing', group: 'Money' },
];

export type RoleGrant = { module: string; can_view: boolean; can_manage: boolean };

export type FamilyRole = {
  id: string;
  name: string;
  description: string;
  permissions: RoleGrant[];
};

export const familyRoles: FamilyRole[] = [
  {
    id: 'r1',
    name: 'Full caregiver',
    description: 'Can see and manage everything on my behalf.',
    permissions: patientModules.map((m) => ({ module: m.key, can_view: true, can_manage: true })),
  },
  {
    id: 'r2',
    name: 'Appointments only',
    description: 'Can book and manage appointments, nothing else.',
    permissions: [
      { module: 'appt_upcoming', can_view: true, can_manage: true },
      { module: 'appt_history', can_view: true, can_manage: false },
      { module: 'appt_booking', can_view: true, can_manage: true },
    ],
  },
  {
    id: 'r3',
    name: 'View only',
    description: 'Can see my records but change nothing.',
    permissions: [
      { module: 'health_vitals', can_view: true, can_manage: false },
      { module: 'health_records', can_view: true, can_manage: false },
      { module: 'prescriptions', can_view: true, can_manage: false },
      { module: 'documents', can_view: true, can_manage: false },
    ],
  },
];

/** `granted` = adults I linked and can assign a role to (I'm the owner). */
export const familyScopes = {
  granted: [
    { id: 'fs1', name: 'Meena Reddy', relation: 'Wife', avatar: 'https://i.pravatar.cc/150?img=5', role_id: 'r1' },
    { id: 'fs2', name: 'Lakshmi Reddy', relation: 'Mother', avatar: 'https://i.pravatar.cc/150?img=48', role_id: null as string | null },
  ],
  /**
   * `linked` = accounts someone granted ME a role on — I can open these, but
   * only within what their role allows, so each carries its `role_id`.
   */
  linked: [
    { id: 'fl1', name: 'Meena Reddy', relation: 'Wife', avatar: 'https://i.pravatar.cc/150?img=5', role_name: 'Full caregiver', role_id: 'r1' },
    { id: 'fl2', name: 'Venkat Reddy', relation: 'Father', avatar: 'https://i.pravatar.cc/150?img=51', role_name: 'Appointments only', role_id: 'r2' },
  ],
};

/** House-group link requests, with the web's status set. */
export type LinkRequest = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  direction: 'sent' | 'received';
};

export const linkRequests: LinkRequest[] = [
  { id: 'lr1', name: 'Ravi Kumar', relation: 'Brother', phone: '+91 90000 33445', status: 'PENDING', direction: 'sent' },
  { id: 'lr2', name: 'Sunita Rao', relation: 'Aunt', phone: '+91 90000 77889', status: 'ACCEPTED', direction: 'sent' },
  { id: 'lr3', name: 'Venkat Reddy', relation: 'Father', phone: '+91 90000 22110', status: 'PENDING', direction: 'received' },
];

/** Sending a request with relation X expects the receiver to pick this back. */
export const relationHints: Record<string, string> = {
  Father: 'Son or Daughter',
  Mother: 'Son or Daughter',
  Son: 'Father or Mother',
  Daughter: 'Father or Mother',
  Husband: 'Wife',
  Wife: 'Husband',
  Spouse: 'Spouse/Husband/Wife',
  Brother: 'Brother or Sister',
  Sister: 'Brother or Sister',
  Grandfather: 'Grandson or Granddaughter',
  Grandmother: 'Grandson or Granddaughter',
  Uncle: 'Nephew or Niece',
  Aunt: 'Nephew or Niece',
  Guardian: 'Ward',
};

export const relationOptions = [
  'Husband', 'Wife', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister',
  'Grandfather', 'Grandmother', 'Father-in-law', 'Mother-in-law', 'Uncle', 'Aunt',
  'Cousin', 'Guardian', 'Friend', 'Other',
];

export const permissionOptions = ['Appointments', 'Records', 'Billing', 'Prescriptions'];

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  kind: 'appointment' | 'prescription' | 'payment' | 'general';
};

export const notifications: AppNotification[] = [
  { id: 'n1', title: 'Appointment confirmed', message: 'Your video consult with Dr. Anitha Rao is confirmed for 18 Aug, 4:30 PM.', date: '2026-08-15', read: false, kind: 'appointment' },
  { id: 'n2', title: 'Payment pending', message: '₹800 is pending for your consultation with Dr. Karthik Menon.', date: '2026-08-14', read: false, kind: 'payment' },
  { id: 'n3', title: 'New prescription', message: 'Dr. Anitha Rao has issued a new prescription. Tap to view.', date: '2026-07-30', read: true, kind: 'prescription' },
  { id: 'n4', title: 'Lab report ready', message: 'Your Lipid Profile report is now available under Documents.', date: '2026-07-28', read: true, kind: 'general' },
  { id: 'n5', title: 'Welcome to Larazen Health', message: 'Complete your health profile to get better doctor matches.', date: '2026-05-02', read: true, kind: 'general' },
];

export type WalletTransaction = {
  id: string;
  description: string;
  date: string;
  method: string;
  amount: number; // negative = debit
  balance_after: number;
};

export const wallet = {
  balance: 1250,
  transactions: [
    { id: 'w1', description: 'Consultation — Dr. Priya Sharma', date: '2026-07-30', method: 'Wallet', amount: -600, balance_after: 1250 },
    { id: 'w2', description: 'Added money', date: '2026-07-25', method: 'UPI', amount: 1000, balance_after: 1850 },
    { id: 'w3', description: 'Refund — Dr. Suresh Iyer', date: '2026-07-16', method: 'Wallet', amount: 700, balance_after: 850 },
    { id: 'w4', description: 'Consultation — Dr. Suresh Iyer', date: '2026-07-15', method: 'Wallet', amount: -700, balance_after: 150 },
    { id: 'w5', description: 'Added money', date: '2026-07-01', method: 'Net Banking', amount: 500, balance_after: 850 },
  ] as WalletTransaction[],
};

export const topUpPresets = [500, 1000, 2000, 5000];

export const paymentMethods = [
  { label: 'UPI', value: 'upi' },
  { label: 'Debit / Credit Card', value: 'card' },
  { label: 'Net Banking', value: 'netbanking' },
];

/* ────────────────────────────────────────────────────────────────────────
 * PRODUCT CATALOGUE — three categories a patient can buy.
 *
 *   1. Quick Consults          one-time consultations  (was "Appointments")
 *   2. Illness Recovery Plans  short condition plans   (was "Services")
 *   3. Advanced Healing        surgical / chronic care (was "Group Services")
 *
 * Every product carries BOTH names: `name` is the warm, full product name for
 * detail screens, and `short_name` is the compact label for cards, chips and
 * sliders where a long name would truncate.
 * ──────────────────────────────────────────────────────────────────────── */

/** CATEGORY 1 — Quick Consults. Keys match the web app's CONSULTATION_TYPES. */
export type ConsultationTypeKey = 'video' | 'complete' | 'home_visit' | 'camp' | 'audio' | 'chat';

export const consultationTypes: {
  key: ConsultationTypeKey;
  name: string;
  short_name: string;
  description: string;
  price: number;
  icon: 'videocam-outline' | 'business-outline' | 'home-outline' | 'people-circle-outline' | 'call-outline' | 'chatbubbles-outline';
}[] = [
  { key: 'video', name: 'Video Consultation', short_name: 'Video Consult', description: 'Talk to a doctor over secure video, from anywhere.', price: 500, icon: 'videocam-outline' },
  { key: 'complete', name: 'Doctor Clinic Visit', short_name: 'Clinic Visit', description: 'See your doctor in person at the clinic.', price: 700, icon: 'business-outline' },
  { key: 'home_visit', name: 'Doctor Home Visit', short_name: 'Home Visit', description: 'A doctor comes to you, at home.', price: 1200, icon: 'home-outline' },
  { key: 'camp', name: 'Community Health Camp', short_name: 'Health Camp', description: 'Reserve a place at an organised health camp.', price: 0, icon: 'people-circle-outline' },
  { key: 'audio', name: 'Voice Consultation', short_name: 'Voice Consult', description: 'A voice-only call with your doctor.', price: 300, icon: 'call-outline' },
  { key: 'chat', name: 'Chat Consultation', short_name: 'Chat Consult', description: 'Message your doctor, reply within 24 hours.', price: 200, icon: 'chatbubbles-outline' },
];

/**
 * CATEGORY 2 — Illness Recovery Plans.
 * Strict pattern: [Condition] Recovery Plan – [Duration].
 */
export type RecoveryPlan = {
  id: string;
  name: string;
  short_name: string;
  condition: string;
  duration_label: string;
  duration_days: number;
  description: string;
  price: number;
  includes: string[];
};

export const recoveryPlans: RecoveryPlan[] = [
  {
    id: 'rp1',
    name: 'Malaria Recovery Plan – 10 Days',
    short_name: 'Malaria Care (10d)',
    condition: 'Malaria',
    duration_label: '10 Days',
    duration_days: 10,
    description: 'Guided recovery from diagnosis to clearance, with daily symptom checks.',
    price: 2499,
    includes: ['Daily symptom monitoring', 'Blood smear follow-ups', 'Medication schedule', 'Doctor review on day 3 & 10'],
  },
  {
    id: 'rp2',
    name: 'Viral Fever Recovery Plan – 7 Days',
    short_name: 'Viral Fever Care (7d)',
    condition: 'Viral Fever',
    duration_label: '7 Days',
    duration_days: 7,
    description: 'Short, supportive plan to get you through a viral fever safely at home.',
    price: 1299,
    includes: ['Daily temperature tracking', 'Hydration & diet guidance', 'Escalation if fever persists', 'Doctor review on day 4'],
  },
  {
    id: 'rp3',
    name: 'Dengue Recovery Plan – 10 Days',
    short_name: 'Dengue Care (10d)',
    condition: 'Dengue',
    duration_label: '10 Days',
    duration_days: 10,
    description: 'Close platelet monitoring and warning-sign checks through the critical phase.',
    price: 3999,
    includes: ['Daily platelet tracking', 'Warning-sign checklist', 'Home sample collection', 'Doctor review every 48 hrs'],
  },
  {
    id: 'rp4',
    name: 'Typhoid Recovery Plan – 14 Days',
    short_name: 'Typhoid Care (14d)',
    condition: 'Typhoid',
    duration_label: '14 Days',
    duration_days: 14,
    description: 'Full antibiotic course supervision with diet support and relapse checks.',
    price: 2999,
    includes: ['Antibiotic course supervision', 'Diet plan', 'Relapse screening', 'Doctor review on day 7 & 14'],
  },
];

export type PlanOrder = {
  id: string;
  plan_name: string;
  ordered_on: string;
  /** When it actually finished. Only set once the plan is over. */
  completed_on?: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'in_process' | 'completed' | 'cancelled' | 'rejected';
  category: string;
};

export const recoveryPlanOrders: PlanOrder[] = [
  { id: 'ro1', plan_name: 'Viral Fever Recovery Plan – 7 Days', ordered_on: '2026-08-14', amount: 1299, status: 'in_process', category: 'recovery' },
  { id: 'ro2', plan_name: 'Typhoid Recovery Plan – 14 Days', ordered_on: '2026-05-02', completed_on: '2026-05-16', amount: 2999, status: 'completed', category: 'recovery' },
  { id: 'ro3', plan_name: 'Post-Dengue Strength Plan – 21 Days', ordered_on: '2026-08-09', amount: 3499, status: 'in_process', category: 'recovery' },
  { id: 'ro4', plan_name: 'Diabetes Reversal Plan – 90 Days', ordered_on: '2026-07-28', amount: 8999, status: 'in_process', category: 'recovery' },
  { id: 'ro5', plan_name: 'Chikungunya Recovery Plan – 14 Days', ordered_on: '2026-06-11', amount: 2799, status: 'cancelled', category: 'recovery' },
  { id: 'ro6', plan_name: 'Malaria Recovery Plan – 10 Days', ordered_on: '2026-08-16', amount: 2499, status: 'pending', category: 'recovery' },
  { id: 'ro7', plan_name: 'Post-COVID Recovery Plan – 21 Days', ordered_on: '2026-08-15', amount: 3299, status: 'confirmed', category: 'recovery' },
  { id: 'ro8', plan_name: 'Fracture Rehabilitation – 45 Days', ordered_on: '2026-08-13', amount: 5999, status: 'rejected', category: 'recovery' },
  { id: 'ro9', plan_name: 'Post-Viral Fatigue Plan – 14 Days', ordered_on: '2026-07-29', completed_on: '2026-08-12', amount: 2699, status: 'completed', category: 'recovery' },
];

export type ChatMessage = {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
};

export const consultChat: ChatMessage[] = [
  { id: 'c1', from: 'them', text: 'Hello Rohit, good to see you. How have your sugar readings been?', time: '16:31' },
  { id: 'c2', from: 'me', text: 'Mostly around 95–110 fasting this month.', time: '16:32' },
  { id: 'c3', from: 'them', text: "That's a good range. Any dizziness or fatigue?", time: '16:32' },
  { id: 'c4', from: 'me', text: 'No dizziness. Slight fatigue in the evenings.', time: '16:33' },
];

export const countryCodes = [
  { label: '🇮🇳 +91  India', value: '+91' },
  { label: '🇺🇸 +1  United States', value: '+1', disabled: true },
  { label: '🇬🇧 +44  United Kingdom', value: '+44', disabled: true },
  { label: '🇦🇪 +971  United Arab Emirates', value: '+971', disabled: true },
  { label: '🇸🇬 +65  Singapore', value: '+65', disabled: true },
];

export const accountStatus = {
  state: 'Active' as const,
  flags: ['Profile 80% complete', 'Email verified', 'ID under review'],
};

export const onboardingSlides = [
  {
    key: 'o1',
    icon: 'medkit-outline' as const,
    title: 'Care without the commute',
    body: 'Consult trusted doctors from home — no waiting rooms, no travel.',
  },
  {
    key: 'o2',
    icon: 'videocam-outline' as const,
    title: 'Video, audio or chat',
    body: 'Pick the consultation that fits your day, starting at ₹200.',
  },
  {
    key: 'o3',
    icon: 'folder-open-outline' as const,
    title: 'Everything in one place',
    body: 'Prescriptions, lab reports and your whole family, on one account.',
  },
];

export const symptoms = [
  'Fever', 'Cough', 'Headache', 'Skin Rash', 'Joint Pain', 'Chest Pain', 'Fatigue', 'Diabetes Follow-up',
];
