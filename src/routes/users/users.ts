import { Hono } from "hono";
import { UserAuthToken } from "../../utils/token";
import auth from "./auth";
import profile from "./profile";

export type UserVariables = {
  user: UserAuthToken;
};

const userRoutes = new Hono<{ Variables: UserVariables }>();

userRoutes.route("/", auth);
userRoutes.route("/profile", profile);

export default userRoutes;
