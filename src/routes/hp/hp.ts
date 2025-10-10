import { Hono } from "hono";
import auth from "./auth";

const hpRouter = new Hono();

hpRouter.route("/auth", auth);


export default hpRouter;