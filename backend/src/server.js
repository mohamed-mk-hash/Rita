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
import adminPagesRoutes from "./routes/admin.pages.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import pageRoutes from "./routes/pages.routes.js";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Allow requests without an Origin header,
       * such as Postman or server-to-server requests.
       */
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

/*
|--------------------------------------------------------------------------
| Request middleware
|--------------------------------------------------------------------------
*/

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Basic routes
|--------------------------------------------------------------------------
*/

app.get("/", (_req, res) => {
  return res.json({
    message: "Rita backend API is running",
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query(
      "SELECT NOW() AS now"
    );

    return res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error(
      "DB_HEALTH_ERROR:",
      error
    );

    return res.status(500).json({
      status: "error",
      database: "not connected",
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Client routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use(
  "/api/applications",
  applicationRoutes
);

app.use(
  "/api/documents",
  documentRoutes
);

app.use(
  "/api/contact",
  contactRoutes
);

/*
|--------------------------------------------------------------------------
| Public website content
|--------------------------------------------------------------------------
*/

app.use(
  "/api/pages",
  pageRoutes
);

/*
|--------------------------------------------------------------------------
| Admin routes
|--------------------------------------------------------------------------
|
| Specific admin routes must be mounted before the general /api/admin
| router.
|
*/

app.use(
  "/api/admin/auth",
  adminAuthRoutes
);

app.use(
  "/api/admin/pages",
  adminPagesRoutes
);

app.use(
  "/api/admin/documents",
  adminDocumentsRoutes
);

app.use(
  "/api/admin/contact-messages",
  adminContactRoutes
);

/*
 * Keep the general admin router last.
 */
app.use(
  "/api/admin",
  adminRoutes
);

/*
|--------------------------------------------------------------------------
| 404 handler
|--------------------------------------------------------------------------
*/

app.use((_req, res) => {
  return res.status(404).json({
    message: "Route not found",
  });
});

/*
|--------------------------------------------------------------------------
| Global error handler
|--------------------------------------------------------------------------
*/

app.use(
  (error, _req, res, next) => {
    console.error(
      "SERVER_ERROR:",
      error
    );

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
      message:
        "Unexpected server error",
    });
  }
);

/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/

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