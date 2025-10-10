import { Hono } from "hono";
import adminRoute from "./routes/admin/admin";
import doctorsRoute from "./routes/doctors/doctors";
import userRoutes from "./routes/users/users";
import hpRouter from "./routes/hp/hp";

const app = new Hono().basePath("/api");

app.route("/users", userRoutes);
app.route("/hp", hpRouter);
app.route("/doctors", doctorsRoute);
app.route("/admin", adminRoute);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export type appType = typeof app;
export default app;
