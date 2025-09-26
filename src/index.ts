import { Hono } from "hono";
import admin from "./routes/admin/admin";

const app = new Hono().basePath("/api");

app.route("/admin", admin);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
