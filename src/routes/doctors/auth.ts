import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { doctors } from "../../db/schema/doctor";
import { TempUser } from "../../db/schema/tempUser";
import { findDoctorByNumber } from "../../helpers/doctors/doctors";
import { checkPhoneExists } from "../../helpers/phoneValidator";
import { sendVerificationCode } from "../../sms/sms";
import { Responses } from "../../utils/responses";
import { getToken } from "../../utils/token";

const auth = new Hono();

const zSendCode = z.object({
  phone: z.string().min(10).max(15),
});

const zVerifyCode = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

auth.post("/send-code", zValidator("json", zSendCode), async (c) => {
  try {
    const { phone } = c.req.valid("json");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000;

    // TODO: Use Redis here with TTL and Rate limiting
    await db
      .insert(TempUser)
      .values({
        phone,
        verificationCode: code,
        verificationExpiry: new Date(expirationTime),
      })
      .onConflictDoUpdate({
        target: TempUser.phone,
        set: {
          verificationCode: code,
          verificationExpiry: new Date(expirationTime),
        },
      });

    // Send SMS with verification code
    await sendVerificationCode(phone, code);

    return c.json(
      Responses.success(`Verification code sent to ${phone}`, {
        phone,
      }),
      200
    );
  } catch (error) {
    return c.json(
      Responses.serverError("Failed to send verification code", error),
      500
    );
  }
});

auth.post("/verify-code", zValidator("json", zVerifyCode), async (c) => {
  try {
    const { phone, code } = c.req.valid("json");

    const tempUser = await db
      .select()
      .from(TempUser)
      .where(eq(TempUser.phone, phone))
      .limit(1);

    if (!tempUser.length) {
      return c.json(
        Responses.badRequest("No verification code found for this number"),
        400
      );
    }

    const temp = tempUser[0];

    if (temp.verificationExpiry && temp.verificationExpiry < new Date()) {
      return c.json(
        Responses.badRequest(
          "Verification code has expired, Request a new code"
        ),
        400
      );
    }

    if (temp.verificationCode !== code) {
      return c.json(Responses.badRequest("Invalid verification code"), 400);
    }

    const existingDoctor = await findDoctorByNumber(phone);
    await db.delete(TempUser).where(eq(TempUser.phone, phone));

    if (existingDoctor) {
      const token = getToken({
        id: existingDoctor.id,
        phone: existingDoctor.phone,
      });
      return c.json(
        Responses.success("Login successful", {
          token,
          doctor: existingDoctor,
          isNewDoctor: false,
        }),
        200
      );
    }

    // Check if phone exists in any user type before creating new doctor
    const phoneCheck = await checkPhoneExists(phone);
    if (phoneCheck.exists) {
      return c.json(
        Responses.badRequest(
          phoneCheck.message || "Phone number already registered"
        ),
        400
      );
    }

    const newDoctor = await db.insert(doctors).values({ phone }).returning({
      id: doctors.id,
      name: doctors.name,
      phone: doctors.phone,
      email: doctors.email,
      about: doctors.about,
      gender: doctors.gender,
      profilePicture: doctors.profilePicture,
      qualifications: doctors.qualifications,
      specialty: doctors.specialty,
      department: doctors.department,
      departmentId: doctors.departmentId,
    });
    const token = getToken(newDoctor[0]);
    return c.json(
      Responses.success("Registration successful", {
        token,
        doctor: newDoctor[0],
        isNewDoctor: true,
      }),
      201
    );
  } catch (error) {
    return c.json(Responses.serverError("Verification failed", error), 500);
  }
});

export default auth;
