import { Hono } from "hono";
import admin from "./routes/admin/admin";
import users from "./routes/users/users";

const app = new Hono().basePath("/api");

app.route("/users", users);
app.route("/admin", admin);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
