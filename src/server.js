import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import usersRouter from "./routes/users.routes.js";
import swaggerSpec from "./swagger.js";
import profilesRoutes from './routes/profiles.routes.js';
import familyRoutes from './routes/family.routes.js';
import remindersRoutes from './routes/reminders.routes.js';
import notificationsRoutes from './routes/notifications.routes.js'

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

app.use('/api', profilesRoutes);
app.use('/api', familyRoutes);
app.use('/api', remindersRoutes);
app.use('/api', notificationsRoutes);
app.use("/api", usersRouter);

/* ======================================================
   Server
====================================================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
