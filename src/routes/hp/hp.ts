import { Hono } from "hono";
import auth from "./auth";
import hpDoctorsRouter from "./hp_doctor";

const hpRouter = new Hono();

hpRouter.route("/auth", auth);
hpRouter.route("/doctors", hpDoctorsRouter);

export default hpRouter;
