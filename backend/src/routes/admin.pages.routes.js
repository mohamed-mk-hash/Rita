import { Router } from "express";
import { requireAdmin } from "../middleware/admin.middleware.js";
import {
  getAdminPage,
  publishAdminPage,
  restoreAdminPageDraft,
  saveAdminPageDraft,
} from "../controllers/pages.controller.js";

const router = Router();

router.use(requireAdmin);

router.get("/:pageKey", getAdminPage);
router.put("/:pageKey/draft", saveAdminPageDraft);
router.post("/:pageKey/publish", publishAdminPage);
router.post("/:pageKey/restore", restoreAdminPageDraft);

export default router;
