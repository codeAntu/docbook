import { Hono } from "hono";
import adminRoute from "./routes/admin/admin";
import doctorsRoute from "./routes/doctors/doctors";
import userRoutes from "./routes/users/users";

const app = new Hono().basePath("/api");

app.route("/users", userRoutes);
app.route("/doctors", doctorsRoute);
app.route("/admin", adminRoute);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
