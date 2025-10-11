import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { createSchedule, deleteSchedule } from "../../services/schedules";
import { Responses } from "../../utils/responses";
import { HpVariables } from "./hp";

const createScheduleSchema = z
  .object({
    doctorId: z.string().uuid(),
    scheduleType: z.enum(["daily", "weekly", "monthly"]),
    weekDays: z.array(z.number().min(0).max(6)).optional(),
    monthDays: z.array(z.number().min(1).max(31)).optional(),
    timeSlots: z
      .array(
        z.object({
          dayOfWeek: z.number().min(0).max(6).optional(), // For weekly schedules
          dayOfMonth: z.number().min(1).max(31).optional(), // For monthly schedules
          startTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
          endTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
          maxBookings: z.number().min(1),
        })
      )
      .min(1),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.scheduleType === "weekly") {
        if (!data.weekDays || data.weekDays.length === 0) return false;
        if (
          data.weekDays &&
          data.timeSlots.some(
            (slot) =>
              slot.dayOfWeek !== undefined &&
              data.weekDays !== undefined &&
              !data.weekDays.includes(slot.dayOfWeek)
          )
        ) {
          return false;
        }
      }
      if (data.scheduleType === "monthly") {
        if (!data.monthDays || data.monthDays.length === 0) return false;
        if (
          data.monthDays &&
          data.timeSlots.some(
            (slot) =>
              slot.dayOfMonth !== undefined &&
              data.monthDays !== undefined &&
              !data.monthDays.includes(slot.dayOfMonth)
          )
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "weekDays required for Weekly schedules, monthDays required for Monthly schedules, and all timeSlots must match the selected days",
    }
  );

export type DoctorScheduleInput = z.infer<typeof createScheduleSchema>;

const hpDoctorSchedulesRouter = new Hono<{ Variables: HpVariables }>();

hpDoctorSchedulesRouter.get("/", async (c) => {
  return c.json({ message: "Doctor schedules route is under construction." });
});

hpDoctorSchedulesRouter.post(
  "/",
  zValidator("json", createScheduleSchema),
  async (c) => {
    try {
      const user = c.get("user");
      const scheduleData = c.req.valid("json");

      const newSchedule = await createSchedule(
        user.id,
        scheduleData.doctorId,
        scheduleData
      );
      return c.json(
        Responses.success("Doctor schedule created", newSchedule),
        201
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "Doctor not found or does not belong to the healthcare provider"
      ) {
        return c.json(Responses.badRequest(error.message), 404);
      }
      return c.json(
        Responses.serverError("Failed to create doctor schedule", error),
        500
      );
    }
  }
);

hpDoctorSchedulesRouter.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const scheduleId = c.req.param("id");
    await deleteSchedule(user.id, scheduleId);
    return c.json(Responses.success("Doctor schedule deleted"), 200);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "Schedule not found or does not belong to the healthcare provider"
    ) {
      return c.json(Responses.badRequest(error.message), 404);
    }
    return c.json(
      Responses.serverError("Failed to delete doctor schedule", error),
      500
    );
  }
});

export default hpDoctorSchedulesRouter;
