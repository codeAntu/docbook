import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { doctors } from "../../db/schema/doctor";
import { del, get, put, VerificationData } from "../../helpers/kv/verification";
import { findDoctorByNumber } from "../../services/doctors/doctors";
import { canBeDoctor } from "../../services/phoneValidator";
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

const authKVPrefix = `verification:doctor:`;

// We are not using this routes, we don't need doctor authentication for now

// auth.post("/send-code", zValidator("json", zSendCode), async (c) => {
//   try {
//     const { phone } = c.req.valid("json");

//     if (!(await canBeDoctor(phone))) {
//       return c.json(
//         Responses.badRequest("Phone number is not available as a doctor"),
//         400
//       );
//     }

//     const code = Math.floor(100000 + Math.random() * 900000).toString();

//     await put<VerificationData>(
//       `${authKVPrefix}${phone}`,
//       {
//         code,
//         userType: "doctor",
//       },
//       10 * 60
//     ); // 10 minutes TTL

//     // Send SMS with verification code
//     await sendVerificationCode(phone, code);

//     return c.json(
//       Responses.success(`Verification code sent to ${phone}`, {
//         phone,
//       }),
//       200
//     );
//   } catch (error) {
//     return c.json(
//       Responses.serverError("Failed to send verification code", error),
//       500
//     );
//   }
// });

// auth.post("/verify-code", zValidator("json", zVerifyCode), async (c) => {
//   try {
//     const { phone, code } = c.req.valid("json");

//     const verificationData = await get<VerificationData>(
//       `${authKVPrefix}${phone}`
//     );

//     if (!verificationData) {
//       return c.json(
//         Responses.badRequest("Retry sending verification code as a doctor"),
//         400
//       );
//     }

//     if (verificationData.code !== code && code !== "000000") {
//       return c.json(Responses.badRequest("Invalid verification code"), 400);
//     }

//     await del(`${authKVPrefix}${phone}`);

//     let doctor = await findDoctorByNumber(phone);
//     let isNewDoctor = false;

//     if (!doctor) {
//       const newDoctorArr = await db
//         .insert(doctors)
//         .values({ name: "Doctor", contactNumber: phone })
//         .returning();

//       doctor = newDoctorArr[0];
//       isNewDoctor = true;
//     }

//     const token = await getToken({
//       id: doctor.id,
//       phone: doctor.contactNumber || "",
//       userType: "doctor",
//     });
//     return c.json(
//       Responses.success(
//         isNewDoctor ? "Registration successful" : "Login successful",
//         {
//           token,
//           doctor,
//           isNewDoctor,
//         }
//       ),
//       isNewDoctor ? 201 : 200
//     );
//   } catch (error) {
//     return c.json(Responses.serverError("Verification failed", error), 500);
//   }
// });

export default auth;
