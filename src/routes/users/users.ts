import { Hono } from "hono";
import auth from "./auth";

const userRoutes = new Hono();

userRoutes.route("/", auth);

export default userRoutes;
