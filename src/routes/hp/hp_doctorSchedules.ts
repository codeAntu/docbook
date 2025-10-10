import { Hono } from "hono";
import { HpVariables } from "./hp";

const hpDoctorSchedulesRouter = new Hono<{ Variables: HpVariables }>();

export default hpDoctorSchedulesRouter;
