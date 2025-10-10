import { and, eq } from "drizzle-orm";
import { db } from "../../db/db";
import { doctors } from "../../db/schema/doctor";

export async function findDoctorByNumber(phone: string) {
  const doctor = await db
    .select()
    .from(doctors)
    .where(eq(doctors.contactNumber, phone))
    .limit(1);

  return doctor.length ? doctor[0] : null;
}

export async function createDoctor({
  name,
  email,
  specialization,
  contactNumber,
  hpId,
}: {
  name: string;
  email?: string;
  specialization: string;
  contactNumber?: string;
  hpId: string;
}) {
  const result = await db
    .insert(doctors)
    .values({
      name,
      email,
      specialization,
      contactNumber,
      hpId,
    })
    .returning();
  return result[0];
}

export async function updateDoctor(
  doctorId: string,
  updateData: {
    name?: string;
    email?: string;
    specialization?: string;
    contactNumber?: string;
  },
  hpId: string
) {
  const existingDoctor = await db
    .select()
    .from(doctors)
    .where(and(eq(doctors.id, doctorId), eq(doctors.hpId, hpId)))
    .limit(1);

  if (existingDoctor.length === 0) {
    throw new Error("Doctor not found or not authorized");
  }

  const result = await db
    .update(doctors)
    .set(updateData)
    .where(eq(doctors.id, doctorId))
    .returning();

  return result[0];
}

export async function deleteDoctor(
  doctorId: string,
  hpId: string
): Promise<void> {
  const existingDoctor = await db
    .select()
    .from(doctors)
    .where(and(eq(doctors.id, doctorId), eq(doctors.hpId, hpId)))
    .limit(1);

  if (existingDoctor.length === 0) {
    throw new Error("Doctor not found or not authorized");
  }

  await db.delete(doctors).where(eq(doctors.id, doctorId));
}

export async function getAllDoctorsByHp(hpId: string) {
  return db.select().from(doctors).where(eq(doctors.hpId, hpId));
}

export async function getDoctorById(doctorId: string, hpId: string) {
  const doctor = await db
    .select()
    .from(doctors)
    .where(and(eq(doctors.id, doctorId), eq(doctors.hpId, hpId)))
    .limit(1);

  return doctor.length ? doctor[0] : null;
}

