import { Hono } from "hono";
import auth from "./auth";
import profile from "./profile";

const userRoutes = new Hono();

userRoutes.route("/", auth);
userRoutes.route("/profile", profile);

export default userRoutes;
