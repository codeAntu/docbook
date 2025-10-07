import { Hono } from "hono";
import auth from "./auth";

const users = new Hono();

users.route("/", auth);

export default users;
