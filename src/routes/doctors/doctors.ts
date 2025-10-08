import { Hono } from "hono";
import auth from "./auth";

const doctorsRoute = new Hono();

doctorsRoute.route("/", auth);

export default doctorsRoute;
