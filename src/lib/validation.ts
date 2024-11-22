import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid work email").max(254),
  passphrase: z.string().min(8, "Passphrase must be at least 8 characters").max(128),
});

export const patientSearchSchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(["ACTIVE", "DISCHARGED", "PENDING_REVIEW"]).optional(),
});

export const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["CLINICIAN", "ADMIN", "AUDITOR"]),
});

export const toggleUserSchema = z.object({
  userId: z.string().min(1),
  nextState: z.enum(["active", "inactive"]),
});

export const summarizeSchema = z.object({
  note: z.string().trim().min(20, "Note is too short to summarize").max(12000),
});

export const updatePatientStatusSchema = z.object({
  patientId: z.string().min(1),
  status: z.enum(["ACTIVE", "DISCHARGED", "PENDING_REVIEW"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
