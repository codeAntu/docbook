import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import {
  createDoctor,
  deleteDoctor,
  getAllDoctorsByHp,
  getDoctorById,
  updateDoctor,
} from "../../services/doctors/doctors";
import { Responses } from "../../utils/responses";
import { HpVariables } from "./hp";

const createDoctorSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  specialization: z.string().min(2).max(100),
  contactNumber: z.string().min(10).max(15).optional(),
});

const hpDoctorsRouter = new Hono<{ Variables: HpVariables }>();

hpDoctorsRouter.get("/", async (c) => {
  try {
    const user = c.get("user");
    const doctors = await getAllDoctorsByHp(user.id);
    return c.json(Responses.success("Doctors retrieved successfully", doctors));
  } catch (error) {
    console.error("Error retrieving doctors:", error);
    return c.json(
      Responses.serverError("Failed to retrieve doctors", error),
      500
    );
  }
});

// create a new doctor
hpDoctorsRouter.post("/", zValidator("json", createDoctorSchema), async (c) => {
  try {
    const user = c.get("user");

    const { name, email, specialization, contactNumber } = c.req.valid("json");

    const newDoctor = {
      name,
      email,
      specialization,
      contactNumber,
      hpId: user.id,
    };

    const createdDoctor = await createDoctor(newDoctor);

    return c.json(
      Responses.success("Doctor created successfully", createdDoctor),
      201
    );
  } catch (error) {
    console.error("Error creating doctor:", error);
    return c.json(Responses.serverError("Failed to create doctor"), 500);
  }
});

hpDoctorsRouter.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const doctorId = c.req.param("id");

    const doctor = await getDoctorById(doctorId, user.id);

    if (!doctor) {
      return c.json(
        Responses.badRequest("Doctor not found or not authorized"),
        404
      );
    }

    return c.json(
      Responses.success("Doctor retrieved successfully", doctor),
      200
    );
  } catch (error) {
    console.error("Error retrieving doctor:", error);
    return c.json(
      Responses.serverError("Failed to retrieve doctor", error),
      500
    );
  }
});

hpDoctorsRouter.post(
  "/:id",
  zValidator("json", createDoctorSchema.partial()),
  async (c) => {
    try {
      const user = c.get("user");
      const doctorId = c.req.param("id");
      const updateData = c.req.valid("json");

      const updatedDoctor = await updateDoctor(doctorId, updateData, user.id);

      return c.json(
        Responses.success("Doctor updated successfully", updatedDoctor),
        200
      );
    } catch (error) {
      console.error("Error updating doctor:", error);

      if (
        error instanceof Error &&
        error.message === "Doctor not found or not authorized"
      ) {
        return c.json(Responses.badRequest(error.message), 404);
      }

      return c.json(
        Responses.serverError("Failed to update doctor", error),
        500
      );
    }
  }
);

hpDoctorsRouter.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const doctorId = c.req.param("id");

    await deleteDoctor(doctorId, user.id);

    return c.json(Responses.success("Doctor deleted successfully"), 200);
  } catch (error) {
    console.error("Error deleting doctor:", error);

    if (
      error instanceof Error &&
      error.message === "Doctor not found or not authorized"
    ) {
      return c.json(Responses.badRequest(error.message), 404);
    }

    return c.json(Responses.serverError("Failed to delete doctor", error), 500);
  }
});

export default hpDoctorsRouter;
