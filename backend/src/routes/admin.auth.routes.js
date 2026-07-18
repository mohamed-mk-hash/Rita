import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { pool } from "../config/db.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

const ADMIN_COOKIE_NAME =
  process.env.ADMIN_COOKIE_NAME || "rita_admin_token";

function getAdminCookieOptions() {
  const isProduction =
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure:
      process.env.COOKIE_SECURE === "true" ||
      isProduction,
    sameSite:
      process.env.COOKIE_SAME_SITE || "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  };
}

function cleanAdmin(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    companyName: user.company_name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

/* =========================
   Admin login
========================= */

router.post("/login", async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const [users] = await pool.execute(
      `
      SELECT
        id,
        full_name,
        company_name,
        email,
        password_hash,
        role,
        status
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    if (!["admin", "staff"].includes(user.role)) {
      return res.status(403).json({
        message:
          "This account cannot access the admin dashboard",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "This account is blocked",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        purpose: "admin-dashboard",
      },
      process.env.JWT_SECRET,
      {
        expiresIn:
          process.env.ADMIN_TOKEN_EXPIRES_IN || "8h",
      }
    );

    res.cookie(
      ADMIN_COOKIE_NAME,
      token,
      getAdminCookieOptions()
    );

    return res.json({
      message: "Login successful",
      admin: cleanAdmin(user),
    });
  } catch (error) {
    console.error("ADMIN_LOGIN_ERROR:", error);

    return res.status(500).json({
      message: "Server error while signing in",
    });
  }
});

/* =========================
   Current admin information
========================= */

router.get("/me", requireAdmin, async (req, res) => {
  return res.json({
    admin: req.admin,
  });
});

/* =========================
   Admin logout
========================= */

router.post("/logout", (req, res) => {
  const cookieOptions = getAdminCookieOptions();

  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
  });

  return res.json({
    message: "Logout successful",
  });
});

export default router;