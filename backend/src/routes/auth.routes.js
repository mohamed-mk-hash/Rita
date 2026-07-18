import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function setAuthCookie(res, token) {
  res.cookie("rita_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function cleanUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    companyName: user.company_name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
  };
}

router.post("/signup", async (req, res) => {
  try {
    const { fullName, companyName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Full name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [insertResult] = await pool.query(
      `
      INSERT INTO users (
        full_name,
        company_name,
        email,
        password_hash,
        role,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        fullName.trim(),
        companyName?.trim() || null,
        normalizedEmail,
        passwordHash,
        "client",
        "active",
      ]
    );

    const [users] = await pool.query(
      `
      SELECT id, full_name, company_name, email, role, status, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [insertResult.insertId]
    );

    const user = users[0];
    const token = createToken(user);

    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Account created successfully",
      user: cleanUser(user),
    });
  } catch (error) {
    console.error("SIGNUP_ERROR:", error);

    return res.status(500).json({
      message: "Server error while creating account",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.query(
      `
      SELECT id, full_name, company_name, email, password_hash, role, status, created_at
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        message: "This account is not active",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(user);

    setAuthCookie(res, token);

    return res.json({
      message: "Logged in successfully",
      user: cleanUser(user),
    });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return res.status(500).json({
      message: "Server error while logging in",
    });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      `
      SELECT id, full_name, company_name, email, role, status, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user: cleanUser(users[0]),
    });
  } catch (error) {
    console.error("ME_ERROR:", error);

    return res.status(500).json({
      message: "Server error while loading user",
    });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("rita_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.json({
    message: "Logged out successfully",
  });
});

export default router;