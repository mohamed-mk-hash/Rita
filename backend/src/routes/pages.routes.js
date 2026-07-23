import { Router } from "express";
import { getPublicPage } from "../controllers/pages.controller.js";

const router = Router();

router.get("/:pageKey", getPublicPage);

export default router;
