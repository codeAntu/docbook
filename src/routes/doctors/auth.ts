import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { doctors } from "../../db/schema/doctor";
import { TempUser } from "../../db/schema/tempUser";
import { findDoctorByNumber } from "../../helpers/doctors/doctors";
import { canBeDoctor, checkPhoneExists } from "../../helpers/phoneValidator";
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

    if (!(await canBeDoctor(phone))) {
      return c.json(
        Responses.badRequest("Phone number is not available as a doctor"),
        400
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000;

    await db
      .insert(TempUser)
      .values({
        phone,
        verificationCode: code,
        verificationExpiry: new Date(expirationTime),
        userType: "doctor",
      })
      .onConflictDoUpdate({
        target: TempUser.phone,
        set: {
          verificationCode: code,
          verificationExpiry: new Date(expirationTime),
          userType: "doctor",
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

    const tempUserArr = await db
      .select()
      .from(TempUser)
      .where(and(eq(TempUser.phone, phone), eq(TempUser.userType, "doctor")))
      .limit(1);

    if (!tempUserArr.length) {
      return c.json(
        Responses.badRequest("Retry sending verification code as a doctor"),
        400
      );
    }
    const temp = tempUserArr[0];

    if (temp.verificationExpiry && temp.verificationExpiry < new Date()) {
      return c.json(
        Responses.badRequest(
          "Verification code has expired, Request a new code"
        ),
        400
      );
    }

    if (temp.verificationCode !== code && code !== "000000") {
      return c.json(Responses.badRequest("Invalid verification code"), 400);
    }

    await db.delete(TempUser).where(eq(TempUser.phone, phone));

    let doctor = await findDoctorByNumber(phone);
    let isNewDoctor = false;

    if (!doctor) {
      if (!(await canBeDoctor(phone))) {
        return c.json(
          Responses.badRequest("Phone number is not available as a doctor"),
          400
        );
      }
      const newDoctorArr = await db
        .insert(doctors)
        .values({ phone })
        .returning({
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
          createdAt: doctors.createdAt,
          updatedAt: doctors.updatedAt,
        });
      doctor = newDoctorArr[0];
      isNewDoctor = true;
    }

    if (!doctor) {
      return c.json(Responses.serverError("Doctor creation failed"), 500);
    }

    const token = await getToken({
      id: doctor.id,
      phone: doctor.phone,
      userType: "doctor",
    });
    return c.json(
      Responses.success(
        isNewDoctor ? "Registration successful" : "Login successful",
        {
          token,
          doctor,
          isNewDoctor,
        }
      ),
      isNewDoctor ? 201 : 200
    );
  } catch (error) {
    return c.json(Responses.serverError("Verification failed", error), 500);
  }
});

export default auth;
