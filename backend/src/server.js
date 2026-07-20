import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { pool } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import documentRoutes from "./routes/document.routes.js";
import contactRoutes from "./routes/contact.routes.js";

import adminAuthRoutes from "./routes/admin.auth.routes.js";
import adminContactRoutes from "./routes/admin.contact.routes.js";
import adminDocumentsRoutes from "./routes/admin.documents.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `Origin ${origin} is not allowed by CORS`
        )
      );
    },

    credentials: true,

    exposedHeaders: [
      "Content-Disposition",
      "Content-Length",
      "Content-Type",
    ],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  return res.json({
    message: "Rita backend API is running",
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT NOW() AS now");

    return res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("DB_HEALTH_ERROR:", error);

    return res.status(500).json({
      status: "error",
      database: "not connected",
      message: error.message,
    });
  }
});

/* Client routes */
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/contact", contactRoutes);

/* Admin authentication */
app.use("/api/admin/auth", adminAuthRoutes);

/*
  Must be mounted before /api/admin.
  It replaces the old local-disk admin document handlers.
*/
app.use(
  "/api/admin/documents",
  adminDocumentsRoutes
);

app.use(
  "/api/admin/contact-messages",
  adminContactRoutes
);

/* Remaining protected admin routes */
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
  return res.status(404).json({
    message: "Route not found",
  });
});

app.use((error, _req, res, next) => {
  console.error("SERVER_ERROR:", error);

  if (res.headersSent) {
    return next(error);
  }

  if (
    error.message?.includes(
      "is not allowed by CORS"
    )
  ) {
    return res.status(403).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: "Unexpected server error",
  });
});

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(
    `Rita backend running on port ${port}`
  );

  console.log(
    "Allowed origins:",
    allowedOrigins
  );
});
