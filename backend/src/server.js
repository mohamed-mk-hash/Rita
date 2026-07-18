import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { pool } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import documentRoutes from "./routes/document.routes.js";

import adminAuthRoutes from "./routes/admin.auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin(origin, callback) {
      // يسمح بطلبات مثل Postman أو Server-to-Server
      // التي لا تحتوي على Origin
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

    // ضروري لإرسال واستقبال Cookies
    credentials: true,
  })
);

/* =========================
   Global middleware
========================= */

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   Basic route
========================= */

app.get("/", (req, res) => {
  return res.json({
    message: "Rita backend API is running",
  });
});

/* =========================
   Database health check
========================= */

app.get("/api/health", async (req, res) => {
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

/* =========================
   Client routes
========================= */

app.use("/api/auth", authRoutes);

app.use(
  "/api/applications",
  applicationRoutes
);

app.use(
  "/api/documents",
  documentRoutes
);

/* =========================
   Admin authentication
========================= */

app.use(
  "/api/admin/auth",
  adminAuthRoutes
);

/* =========================
   Protected admin routes
========================= */

app.use(
  "/api/admin",
  adminRoutes
);

/* =========================
   404 route
========================= */

app.use((req, res) => {
  return res.status(404).json({
    message: "Route not found",
  });
});

/* =========================
   Error handler
========================= */

app.use((error, req, res, next) => {
  console.error("SERVER_ERROR:", error);

  if (res.headersSent) {
    return next(error);
  }

  // خطأ CORS
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

/* =========================
   Start server
========================= */

const port = Number(
  process.env.PORT || 5000
);

app.listen(port, () => {
  console.log(
    `Rita backend running on port ${port}`
  );

  console.log(
    "Allowed origins:",
    allowedOrigins
  );
});