import { and, eq } from "drizzle-orm";
import { db } from "../db/db";
import {
  doctors,
  doctorSchedules,
  monthlyScheduleDays,
  weeklyScheduleDays,
} from "../db/schema";
import { DoctorScheduleInput } from "../routes/hp/hp_doctorSchedules";

export async function createSchedule(
  hpId: string,
  doctorId: string,
  scheduleData: DoctorScheduleInput
) {
  // check if the doctor exists and belongs to the healthcare provider

  const doctor = await db
    .select()
    .from(doctors)
    .where(and(eq(doctors.id, doctorId), eq(doctors.hpId, hpId)))
    .limit(1)
    .execute();

  if (!doctor) {
    throw new Error(
      "Doctor not found or does not belong to the healthcare provider"
    );
  }

  const weekDaysMask = scheduleData.weekDays
    ? scheduleData.weekDays.reduce((mask, day) => mask | (1 << day), 0)
    : 0;
  const monthDaysMask = scheduleData.monthDays
    ? scheduleData.monthDays.reduce((mask, day) => mask | (1 << (day - 1)), 0)
    : 0;

  // add schedule entry
  const scheduleInsert = await db
    .insert(doctorSchedules)
    .values({
      doctorId,
      hpId,
      scheduleType: scheduleData.scheduleType,
      weekDaysMask,
      monthDaysMask,
    })
    .returning();

  const newSchedule = scheduleInsert[0];

  let weeklyInserts = [];
  if (weekDaysMask) {
    // add weekly schedule days
    weeklyInserts = scheduleData.timeSlots
      .filter((slot) => slot.dayOfWeek !== undefined)
      .map((slot) => ({
        scheduleId: newSchedule.id,
        dayOfWeek: slot.dayOfWeek!,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxBookings: slot.maxBookings,
      }));
    if (weeklyInserts.length) {
      await db.insert(weeklyScheduleDays).values(weeklyInserts).execute();
    }
  }

  let monthlyInserts = [];
  if (monthDaysMask) {
    // add monthly schedule days
    monthlyInserts = scheduleData.timeSlots
      .filter((slot) => slot.dayOfMonth !== undefined)
      .map((slot) => ({
        scheduleId: newSchedule.id,
        dayOfMonth: slot.dayOfMonth!,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxBookings: slot.maxBookings,
      }));
    if (monthlyInserts.length) {
      await db.insert(monthlyScheduleDays).values(monthlyInserts).execute();
    }
  }

  return newSchedule;
}

export async function deleteSchedule(hpId: string, scheduleId: string) {
  // Set scheduleStatus to 'cancelled' for the doctor schedule
  const result = await db
    .update(doctorSchedules)
    .set({ scheduleStatus: "deleted" })
    .where(
      and(eq(doctorSchedules.id, scheduleId), eq(doctorSchedules.hpId, hpId))
    )
    .execute();

  if (result.rowCount === 0) {
    throw new Error(
      "Schedule not found or does not belong to the healthcare provider"
    );
  }
}
