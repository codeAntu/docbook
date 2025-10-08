import { Hono } from "hono";
import auth from "./auth";
import profile from "./profile";

const doctorsRoute = new Hono();

doctorsRoute.route("/", auth);
doctorsRoute.route("/profile", profile);

export default doctorsRoute;
