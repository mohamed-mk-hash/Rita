import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const ADMIN_COOKIE_NAME =
  process.env.ADMIN_COOKIE_NAME || "rita_admin_token";

export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[ADMIN_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        message: "Admin authentication is required",
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      !payload?.id ||
      payload.purpose !== "admin-dashboard"
    ) {
      return res.status(401).json({
        message: "Invalid admin session",
      });
    }

    const [users] = await pool.execute(
      `
      SELECT
        id,
        full_name,
        company_name,
        email,
        role,
        status
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [payload.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Admin account was not found",
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        message: "This account is blocked",
      });
    }

    if (!["admin", "staff"].includes(user.role)) {
      return res.status(403).json({
        message:
          "You do not have access to the admin dashboard",
      });
    }

    req.admin = {
      id: user.id,
      fullName: user.full_name,
      companyName: user.company_name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Your admin session has expired",
      });
    }

    console.error("REQUIRE_ADMIN_ERROR:", error);

    return res.status(500).json({
      message:
        "Server error while checking admin access",
    });
  }
}