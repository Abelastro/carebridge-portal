import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeEventHash } from "../src/lib/audit/hash";

const prisma = new PrismaClient();

const mailDomain = "carebridge.health";
const mail = (local: string) => `${local}@${mailDomain}`;

const date = (value: string) => new Date(value);
const seedPassphrase = process.env.SEED_PASSWORD?.trim() || "carebridge-local-only";
const adminNetwork = [203, 0, 113, 24].join(".");
const clinicNetwork = [198, 51, 100, 41].join(".");
const auditNetwork = [192, 0, 2, 77].join(".");

type SeedEncounter = {
  occurredAt: string;
  clinician: "daniel" | "priya" | "marcus";
  note: string;
  summary?: string;
  summaryModel?: string;
  summarizedAt?: string;
};

type SeedPatient = {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  status: "ACTIVE" | "DISCHARGED" | "PENDING_REVIEW";
  clinician: "daniel" | "priya" | "marcus" | null;
  createdAt: string;
  encounters: SeedEncounter[];
};

const patients: SeedPatient[] = [
  {
    mrn: "CB-100241",
    firstName: "Nadia",
    lastName: "Haddad",
    dateOfBirth: "1957-03-14",
    status: "ACTIVE",
    clinician: "daniel",
    createdAt: "2026-02-11T10:15:00Z",
    encounters: [
      {
        occurredAt: "2026-10-28T14:10:00Z",
        clinician: "daniel",
        note: "Follow-up for hypertension and type 2 diabetes. Patient reports good medication adherence over the past month. Home readings average 128/78. No dizziness or edema. A1c from last week is 7.1 percent, down from 7.6. Continue current regimen and recheck in three months. Discussed reduced sodium intake and walking four days per week.",
        summary: "Summary: Hypertension and type 2 diabetes follow-up with good medication adherence. Home blood pressure averages 128/78 and recent A1c improved to 7.1 percent. Continue the current regimen and recheck in three months.",
        summaryModel: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        summarizedAt: "2026-10-28T14:12:00Z",
      },
      {
        occurredAt: "2026-07-19T09:35:00Z",
        clinician: "daniel",
        note: "Routine diabetes review. Patient has been walking regularly and lost four pounds since April. Reports one episode of mild hypoglycemia after skipping lunch. Reviewed sick-day rules and glucose monitoring. Metformin continued, no dose change. Retinal screening scheduled for September.",
        summaryModel: undefined,
      },
    ],
  },
  {
    mrn: "CB-100388",
    firstName: "Elliot",
    lastName: "Brooks",
    dateOfBirth: "1949-11-02",
    status: "PENDING_REVIEW",
    clinician: "priya",
    createdAt: "2026-04-03T15:45:00Z",
    encounters: [
      {
        occurredAt: "2026-11-01T11:20:00Z",
        clinician: "priya",
        note: "Patient presented with two days of productive cough and low-grade fever. Lung exam with scattered crackles at the right base. Oxygen saturation 94 percent on room air. Ordered chest imaging and started a course of antibiotics. Advised hydration and return precautions. Follow-up call scheduled in 48 hours.",
      },
      {
        occurredAt: "2026-09-08T13:05:00Z",
        clinician: "priya",
        note: "Annual wellness visit. Reports fatigue but no chest pain or shortness of breath. Reviewed preventive screening; colonoscopy is due. Ordered basic metabolic panel and complete blood count. Encouraged gradual increase in activity and consistent sleep schedule.",
        summary: "Summary: Annual wellness visit with fatigue but no cardiopulmonary symptoms. Preventive screening is due and baseline labs were ordered. Activity and sleep counseling provided.",
        summaryModel: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        summarizedAt: "2026-09-08T13:07:00Z",
      },
    ],
  },
  {
    mrn: "CB-100412",
    firstName: "Sofia",
    lastName: "Marchetti",
    dateOfBirth: "1988-06-23",
    status: "ACTIVE",
    clinician: "marcus",
    createdAt: "2026-01-22T08:30:00Z",
    encounters: [
      {
        occurredAt: "2026-10-30T16:40:00Z",
        clinician: "marcus",
        note: "Prenatal visit at 28 weeks. Fundal height appropriate, fetal heart tones in the 140s. Blood pressure normal. Patient reports occasional heartburn and mild lower back discomfort. Discussed positioning and safe over-the-counter options. Glucose tolerance test results reviewed and within range. Next visit in two weeks.",
        summary: "Summary: Prenatal visit at 28 weeks with appropriate fundal height and normal fetal heart tones. Mild heartburn and back discomfort discussed with safe management options. Glucose tolerance results were within range.",
        summaryModel: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        summarizedAt: "2026-10-30T16:42:00Z",
      },
      {
        occurredAt: "2026-08-21T10:00:00Z",
        clinician: "marcus",
        note: "Initial prenatal intake. Confirmed pregnancy at 18 weeks by ultrasound. Reviewed obstetric history, medications, and allergy list. Ordered routine first-trimester labs and scheduled anatomy scan. Patient has questions about workplace accommodations and travel; provided written guidance.",
      },
    ],
  },
  {
    mrn: "CB-100577",
    firstName: "Marcus",
    lastName: "Whitfield",
    dateOfBirth: "1971-09-09",
    status: "ACTIVE",
    clinician: "daniel",
    createdAt: "2025-11-14T12:10:00Z",
    encounters: [
      {
        occurredAt: "2026-10-24T08:50:00Z",
        clinician: "daniel",
        note: "Chronic low back pain review. Patient completed six physical therapy sessions with modest improvement. Pain now 4 out of 10, down from 6. No radiating symptoms or bowel or bladder changes. Continue home exercises and avoid prolonged sitting. Discussed pacing and gradual return to recreational cycling.",
        summary: "Summary: Chronic low back pain improved after physical therapy, now rated 4 out of 10 without radiating symptoms. Continue home exercises, pacing, and a gradual return to cycling.",
        summaryModel: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        summarizedAt: "2026-10-24T08:52:00Z",
      },
    ],
  },
  {
    mrn: "CB-100604",
    firstName: "Aisha",
    lastName: "Rahman",
    dateOfBirth: "1994-02-17",
    status: "ACTIVE",
    clinician: "priya",
    createdAt: "2026-05-19T09:25:00Z",
    encounters: [
      {
        occurredAt: "2026-10-27T15:30:00Z",
        clinician: "priya",
        note: "Evaluation for recurrent migraine. Patient reports three episodes in the past month, each lasting six to eight hours, often associated with screen work and poor sleep. Neurologic exam unremarkable. Discussed trigger tracking, hydration, and sleep hygiene. Started a low-dose preventive medication and provided rescue therapy instructions.",
        summary: "Summary: Recurrent migraine evaluation with three episodes this month and an unremarkable neurologic exam. Trigger tracking, hydration, and sleep hygiene reviewed. Low-dose preventive therapy started with rescue instructions.",
        summaryModel: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        summarizedAt: "2026-10-27T15:32:00Z",
      },
      {
        occurredAt: "2026-07-02T11:15:00Z",
        clinician: "priya",
        note: "New patient visit for migraines and seasonal allergies. Reviewed headache diary and family history. No red-flag features. Recommended continued allergy management and follow-up in eight weeks. Discussed caffeine use and consistent meal timing.",
      },
    ],
  },
  {
    mrn: "CB-100731",
    firstName: "Henry",
    lastName: "Lindqvist",
    dateOfBirth: "1963-12-30",
    status: "DISCHARGED",
    clinician: "marcus",
    createdAt: "2025-09-30T14:00:00Z",
    encounters: [
      {
        occurredAt: "2026-06-12T10:45:00Z",
        clinician: "marcus",
        note: "Postoperative follow-up after uncomplicated hernia repair. Incision healing well without drainage or erythema. Pain controlled with acetaminophen and limited activity. Cleared to resume light exercise and return to desk work next week. No further surgical follow-up required.",
        summary: "Summary: Uncomplicated hernia repair follow-up with a well-healing incision and controlled pain. Cleared for light exercise and desk work next week, with no further surgical follow-up required.",
        summaryModel: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        summarizedAt: "2026-06-12T10:47:00Z",
      },
    ],
  },
  {
    mrn: "CB-100845",
    firstName: "Talia",
    lastName: "Nguyen",
    dateOfBirth: "2001-04-05",
    status: "ACTIVE",
    clinician: "priya",
    createdAt: "2026-08-06T16:20:00Z",
    encounters: [
      {
        occurredAt: "2026-11-02T09:05:00Z",
        clinician: "priya",
        note: "Visit for persistent sore throat and fatigue over five days. Exam shows mild tonsillar erythema without exudate. Rapid strep test negative. No fever at home. Recommended rest, fluids, and saline gargles. Discussed return precautions and close follow-up if symptoms worsen or last beyond another week.",
      },
    ],
  },
  {
    mrn: "CB-100902",
    firstName: "Owen",
    lastName: "Fitzgerald",
    dateOfBirth: "1955-07-18",
    status: "PENDING_REVIEW",
    clinician: "daniel",
    createdAt: "2025-12-02T10:40:00Z",
    encounters: [
      {
        occurredAt: "2026-10-29T13:15:00Z",
        clinician: "daniel",
        note: "Heart failure follow-up. Patient reports increased ankle swelling and two-pound weight gain over the week. No orthopnea or chest pain. Exam with mild bilateral edema. Reviewed fluid and sodium limits, and adjusted diuretic dosing per protocol. Daily weights emphasized. Labs ordered and follow-up in one week.",
      },
      {
        occurredAt: "2026-08-14T09:30:00Z",
        clinician: "daniel",
        note: "Stable heart failure visit. No change in exercise tolerance. Weight at baseline, no edema. Reviewed medication list and reinforced daily monitoring. Continue current therapy and routine follow-up in three months.",
        summary: "Summary: Stable heart failure visit with baseline weight, no edema, and unchanged exercise tolerance. Medication list reviewed and current therapy continued with follow-up in three months.",
        summaryModel: "local-extractive-v1",
        summarizedAt: "2026-08-14T09:31:00Z",
      },
    ],
  },
  {
    mrn: "CB-101033",
    firstName: "Camila",
    lastName: "Duarte",
    dateOfBirth: "1982-01-28",
    status: "ACTIVE",
    clinician: "marcus",
    createdAt: "2026-03-17T11:55:00Z",
    encounters: [
      {
        occurredAt: "2026-10-21T17:10:00Z",
        clinician: "marcus",
        note: "Dermatology referral for a changing mole on the left shoulder. Lesion is approximately six millimeters with irregular borders and varied pigmentation. No bleeding or itching. Photos taken for comparison and urgent dermatology referral placed. Patient counseled on sun protection and monitoring for changes.",
        summary: "Summary: Changing left shoulder mole with irregular borders and varied pigmentation, without bleeding or itching. Photos were taken and an urgent dermatology referral placed.",
        summaryModel: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        summarizedAt: "2026-10-21T17:12:00Z",
      },
    ],
  },
  {
    mrn: "CB-101174",
    firstName: "Jonah",
    lastName: "Mensah",
    dateOfBirth: "2014-10-11",
    status: "ACTIVE",
    clinician: "priya",
    createdAt: "2026-06-28T08:45:00Z",
    encounters: [
      {
        occurredAt: "2026-10-26T14:25:00Z",
        clinician: "priya",
        note: "Pediatric visit for asthma follow-up. Caregiver reports two nighttime awakenings in the past month and no emergency visits. Using inhaler before soccer practice. Exam with clear lungs and normal work of breathing. Reviewed inhaler technique and updated the action plan. Continue current controller dose.",
        summary: "Summary: Pediatric asthma follow-up with two nighttime awakenings this month, no emergency visits, and clear lungs. Inhaler technique and the action plan were reviewed while continuing the current controller dose.",
        summaryModel: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        summarizedAt: "2026-10-26T14:27:00Z",
      },
      {
        occurredAt: "2026-09-15T10:10:00Z",
        clinician: "priya",
        note: "Asthma intake and spirometry. Results consistent with mild persistent asthma. Caregiver educated on triggers, spacer use, and when to seek urgent care. Controller therapy started and school action plan provided.",
      },
    ],
  },
  {
    mrn: "CB-101209",
    firstName: "Rosa",
    lastName: "Delgado",
    dateOfBirth: "1946-05-08",
    status: "DISCHARGED",
    clinician: "daniel",
    createdAt: "2025-10-08T13:40:00Z",
    encounters: [
      {
        occurredAt: "2026-05-30T09:15:00Z",
        clinician: "daniel",
        note: "Discharge visit after community-acquired pneumonia. Patient completed antibiotics and reports return of appetite and energy. Lungs clear on exam, oxygen saturation 97 percent. No further imaging needed. Discharged from active follow-up with instructions to return if fever or shortness of breath recurs.",
        summary: "Summary: Discharge visit after pneumonia with completed antibiotics, returning appetite and energy, clear lungs, and 97 percent oxygen saturation. No further imaging needed and discharged from active follow-up.",
        summaryModel: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        summarizedAt: "2026-05-30T09:17:00Z",
      },
    ],
  },
  {
    mrn: "CB-101352",
    firstName: "Theo",
    lastName: "Kowalski",
    dateOfBirth: "1978-08-21",
    status: "ACTIVE",
    clinician: null,
    createdAt: "2026-10-18T12:30:00Z",
    encounters: [
      {
        occurredAt: "2026-10-18T12:20:00Z",
        clinician: "marcus",
        note: "New patient intake for elevated blood pressure noted at a community screening. Two home readings in the 140s over 90s. No symptoms. Reviewed diet, alcohol use, and activity. Ordered baseline labs and scheduled a follow-up in four weeks to confirm readings and discuss treatment options.",
      },
    ],
  },
];

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(seedPassphrase, 12);

  const amara = await prisma.user.create({
    data: {
      email: mail("amara.okafor"),
      name: "Amara Okafor",
      passwordHash,
      role: "ADMIN",
      createdAt: date("2024-11-18T09:00:00Z"),
    },
  });

  const daniel = await prisma.user.create({
    data: {
      email: mail("daniel.reyes"),
      name: "Daniel Reyes",
      passwordHash,
      role: "CLINICIAN",
      createdAt: date("2024-12-02T09:00:00Z"),
    },
  });

  const priya = await prisma.user.create({
    data: {
      email: mail("priya.natarajan"),
      name: "Priya Natarajan",
      passwordHash,
      role: "CLINICIAN",
      createdAt: date("2025-02-10T09:00:00Z"),
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: mail("marcus.bell"),
      name: "Marcus Bell",
      passwordHash,
      role: "CLINICIAN",
      createdAt: date("2025-06-23T09:00:00Z"),
    },
  });

  const elena = await prisma.user.create({
    data: {
      email: mail("elena.vasquez"),
      name: "Elena Vasquez",
      passwordHash,
      role: "AUDITOR",
      createdAt: date("2025-09-15T09:00:00Z"),
    },
  });

  const clinicianIds = {
    daniel: daniel.id,
    priya: priya.id,
    marcus: marcus.id,
  } as const;

  for (const record of patients) {
    const patient = await prisma.patient.create({
      data: {
        mrn: record.mrn,
        firstName: record.firstName,
        lastName: record.lastName,
        dateOfBirth: date(record.dateOfBirth),
        status: record.status,
        primaryClinicianId: record.clinician ? clinicianIds[record.clinician] : null,
        createdAt: date(record.createdAt),
      },
    });

    for (const encounter of record.encounters) {
      await prisma.encounter.create({
        data: {
          patientId: patient.id,
          clinicianId: clinicianIds[encounter.clinician],
          occurredAt: date(encounter.occurredAt),
          note: encounter.note,
          summary: encounter.summary ?? null,
          summaryModel: encounter.summaryModel ?? null,
          summarizedAt: encounter.summarizedAt ? date(encounter.summarizedAt) : null,
          createdAt: date(encounter.occurredAt),
        },
      });
    }
  }

  const auditSeed = [
    {
      actorId: amara.id,
      action: "auth.login",
      resourceType: "User",
      resourceId: amara.id,
      outcome: "SUCCESS" as const,
      ipAddress: adminNetwork,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      metadata: { role: "ADMIN" },
      createdAt: date("2026-11-02T08:12:00Z"),
    },
    {
      actorId: daniel.id,
      action: "patient.status.update",
      resourceType: "Patient",
      resourceId: "CB-100902",
      outcome: "SUCCESS" as const,
      ipAddress: clinicNetwork,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      metadata: { from: "ACTIVE", to: "PENDING_REVIEW" },
      createdAt: date("2026-11-02T09:41:00Z"),
    },
    {
      actorId: daniel.id,
      action: "llm.summarize",
      resourceType: "Encounter",
      resourceId: "seed-encounter-haddad",
      outcome: "SUCCESS" as const,
      ipAddress: clinicNetwork,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      metadata: { modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0", durationMs: 1840 },
      createdAt: date("2026-11-02T09:44:00Z"),
    },
    {
      actorId: elena.id,
      action: "audit.export",
      resourceType: "AuditEvent",
      resourceId: null,
      outcome: "SUCCESS" as const,
      ipAddress: auditNetwork,
      userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      metadata: { format: "csv", rangeDays: 30 },
      createdAt: date("2026-11-03T10:05:00Z"),
    },
    {
      actorId: amara.id,
      action: "user.role.update",
      resourceType: "User",
      resourceId: elena.id,
      outcome: "SUCCESS" as const,
      ipAddress: adminNetwork,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      metadata: { from: "CLINICIAN", to: "AUDITOR" },
      createdAt: date("2026-11-03T15:22:00Z"),
    },
  ];

  let prevHash: string | null = null;

  for (const event of auditSeed) {
    const eventHash = computeEventHash({
      actorId: event.actorId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      outcome: event.outcome,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
      prevHash,
    });

    await prisma.auditEvent.create({
      data: {
        actorId: event.actorId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        outcome: event.outcome,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        metadata: event.metadata,
        prevHash,
        eventHash,
        createdAt: event.createdAt,
      },
    });

    prevHash = eventHash;
  }

  console.log(
    `Seeded ${patients.length} patients, ${patients.reduce((total, item) => total + item.encounters.length, 0)} encounters, ${auditSeed.length} audit events.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
