import { eq } from "drizzle-orm";
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
