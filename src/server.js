import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import usersRouter from "./routes/users.routes.js";
import swaggerSpec from "./swagger.js";

dotenv.config();
const app = express();

/* ======================================================
   Middleware
====================================================== */

app.use(cors());
app.use(express.json());


/* ======================================================
   Routes
====================================================== */

app.get("/", (req, res) => {
  res.send("Smart Reminder API");
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

import jwt from "jsonwebtoken";

const token = jwt.sign(
  { userId: "1234", email: "test@example.com" }, // payload
  process.env.JWT_SECRET,                          // secret
  { expiresIn: "1h" }                              // optional expiration
);

console.log("token:", token);

app.use("/api", usersRouter);

/* ======================================================
   Server
====================================================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
