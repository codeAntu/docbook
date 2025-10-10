import { Hono } from "hono";
import { authMiddleware, requireUserType } from "../../utils/authMiddleware";
import { HpAuthToken } from "../../utils/token";
import auth from "./auth";
import hpDoctorsRouter from "./hp_doctors";
import hpDoctorSchedulesRouter from "./hp_doctorSchedules";

export type HpVariables = {
  user: HpAuthToken;
};

const hpRouter = new Hono<{ Variables: HpVariables }>();

// Auth routes don't need authentication
hpRouter.route("/auth", auth);

// Apply authentication middleware to all other routes
hpRouter.use("*", authMiddleware, requireUserType("hp"));

hpRouter.route("/doctors", hpDoctorsRouter);
hpRouter.route("/doctor-schedules", hpDoctorSchedulesRouter);

export default hpRouter;
