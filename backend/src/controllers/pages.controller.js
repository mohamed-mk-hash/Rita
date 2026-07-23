import { pool } from "../config/db.js";
import { getPageDefault } from "../content/pageDefaults.js";

function parseJsonColumn(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

/* Navbar and Footer are global UI, never page CMS content. */
function stripGlobalLayoutContent(value) {
  const content = clone(value);

  delete content.navigation;
  delete content.footer;

  for (const language of ["en", "ar"]) {
    const languageContent = content[language];

    if (
      languageContent &&
      typeof languageContent === "object" &&
      !Array.isArray(languageContent)
    ) {
      delete languageContent.nav;
      delete languageContent.navigation;
      delete languageContent.footer;
    }
  }

  return content;
}

/* Pricing and Services belong to their own pages. */
function sanitizePageContent(pageKey, value) {
  const content = stripGlobalLayoutContent(value);

  if (pageKey === "home") {
    for (const language of ["en", "ar"]) {
      const languageContent = content[language];

      if (
        languageContent &&
        typeof languageContent === "object" &&
        !Array.isArray(languageContent)
      ) {
        delete languageContent.pricing;
        delete languageContent.explore;
        delete languageContent.services;
      }
    }
  }

  return content;
}

function normalizePageKey(value) {
  return String(value || "").trim().toLowerCase();
}

function getPageConfiguration(req, res) {
  const pageKey = normalizePageKey(req.params.pageKey);
  const defaultContent = getPageDefault(pageKey);

  if (!defaultContent) {
    res.status(404).json({ message: "Website page was not found" });
    return null;
  }

  return {
    pageKey,
    defaultContent: sanitizePageContent(pageKey, defaultContent),
  };
}

function mapAdminPage(row) {
  const pageKey = row.page_key;

  return {
    id: Number(row.id),
    key: pageKey,
    draftContent: sanitizePageContent(
      pageKey,
      parseJsonColumn(row.draft_content) || {}
    ),
    publishedContent: sanitizePageContent(
      pageKey,
      parseJsonColumn(row.published_content) || {}
    ),
    version: Number(row.version),
    updatedBy: row.updated_by === null ? null : Number(row.updated_by),
    publishedBy: row.published_by === null ? null : Number(row.published_by),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePageContent(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return "Page content must be an object";
  }

  if (
    !content.en ||
    typeof content.en !== "object" ||
    Array.isArray(content.en) ||
    !content.ar ||
    typeof content.ar !== "object" ||
    Array.isArray(content.ar)
  ) {
    return "The content must contain en and ar objects";
  }

  if (JSON.stringify(content).length > 900_000) {
    return "Page content is too large";
  }

  return null;
}

async function ensurePage(executor, pageKey, defaultContent) {
  const cleanDefault = sanitizePageContent(pageKey, defaultContent);
  const serializedDefault = JSON.stringify(cleanDefault);

  await executor.execute(
    `
      INSERT IGNORE INTO website_pages (
        page_key,
        draft_content,
        published_content,
        version
      ) VALUES (?, ?, ?, 1)
    `,
    [pageKey, serializedDefault, serializedDefault]
  );

  const [rows] = await executor.execute(
    `
      SELECT id, page_key, draft_content, published_content, version,
             updated_by, published_by, published_at, created_at, updated_at
      FROM website_pages
      WHERE page_key = ?
      LIMIT 1
    `,
    [pageKey]
  );

  return rows[0];
}

export async function getPublicPage(req, res) {
  const configuration = getPageConfiguration(req, res);
  if (!configuration) return;

  const { pageKey, defaultContent } = configuration;

  try {
    const row = await ensurePage(pool, pageKey, defaultContent);
    const content = sanitizePageContent(
      pageKey,
      parseJsonColumn(row.published_content) || defaultContent
    );

    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.json({
      page: {
        key: pageKey,
        content,
        publishedAt: row.published_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error(`GET_PUBLIC_${pageKey.toUpperCase()}_PAGE_ERROR:`, error);
    return res.status(500).json({
      message: `Could not load the ${pageKey} page content`,
    });
  }
}

export async function getAdminPage(req, res) {
  const configuration = getPageConfiguration(req, res);
  if (!configuration) return;

  const { pageKey, defaultContent } = configuration;

  try {
    const row = await ensurePage(pool, pageKey, defaultContent);
    return res.json({ page: mapAdminPage(row) });
  } catch (error) {
    console.error(`GET_ADMIN_${pageKey.toUpperCase()}_PAGE_ERROR:`, error);
    return res.status(500).json({
      message: `Could not load the ${pageKey} page editor`,
    });
  }
}

export async function saveAdminPageDraft(req, res) {
  const configuration = getPageConfiguration(req, res);
  if (!configuration) return;

  const { pageKey, defaultContent } = configuration;
  const content = sanitizePageContent(pageKey, req.body?.content);
  const expectedVersion = Number(req.body?.version);
  const validationError = validatePageContent(content);

  if (validationError) {
    return res.status(422).json({ message: validationError });
  }

  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return res.status(422).json({ message: "A valid page version is required" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensurePage(connection, pageKey, defaultContent);

    const [rows] = await connection.execute(
      `SELECT id, version FROM website_pages WHERE page_key = ? LIMIT 1 FOR UPDATE`,
      [pageKey]
    );

    if (Number(rows[0].version) !== expectedVersion) {
      await connection.rollback();
      return res.status(409).json({
        message: "The page was changed by another administrator. Reload it before saving.",
      });
    }

    await connection.execute(
      `
        UPDATE website_pages
        SET draft_content = ?, updated_by = ?, version = version + 1
        WHERE page_key = ?
      `,
      [JSON.stringify(content), req.admin.id, pageKey]
    );

    const row = await ensurePage(connection, pageKey, defaultContent);
    await connection.commit();

    return res.json({ message: "Draft saved successfully", page: mapAdminPage(row) });
  } catch (error) {
    await connection.rollback();
    console.error(`SAVE_${pageKey.toUpperCase()}_PAGE_DRAFT_ERROR:`, error);
    return res.status(500).json({
      message: `Could not save the ${pageKey} page draft`,
    });
  } finally {
    connection.release();
  }
}

export async function publishAdminPage(req, res) {
  const configuration = getPageConfiguration(req, res);
  if (!configuration) return;

  const { pageKey, defaultContent } = configuration;
  const expectedVersion = Number(req.body?.version);

  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return res.status(422).json({ message: "A valid page version is required" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensurePage(connection, pageKey, defaultContent);

    const [rows] = await connection.execute(
      `
        SELECT version, draft_content
        FROM website_pages
        WHERE page_key = ?
        LIMIT 1
        FOR UPDATE
      `,
      [pageKey]
    );

    if (Number(rows[0].version) !== expectedVersion) {
      await connection.rollback();
      return res.status(409).json({
        message: "The page was changed by another administrator. Reload it before publishing.",
      });
    }

    const cleanDraft = sanitizePageContent(
      pageKey,
      parseJsonColumn(rows[0].draft_content) || defaultContent
    );

    await connection.execute(
      `
        UPDATE website_pages
        SET published_content = ?, published_by = ?, published_at = NOW(),
            version = version + 1
        WHERE page_key = ?
      `,
      [JSON.stringify(cleanDraft), req.admin.id, pageKey]
    );

    const row = await ensurePage(connection, pageKey, defaultContent);
    await connection.commit();

    return res.json({ message: "Page published successfully", page: mapAdminPage(row) });
  } catch (error) {
    await connection.rollback();
    console.error(`PUBLISH_${pageKey.toUpperCase()}_PAGE_ERROR:`, error);
    return res.status(500).json({ message: `Could not publish the ${pageKey} page` });
  } finally {
    connection.release();
  }
}

export async function restoreAdminPageDraft(req, res) {
  const configuration = getPageConfiguration(req, res);
  if (!configuration) return;

  const { pageKey, defaultContent } = configuration;
  const expectedVersion = Number(req.body?.version);

  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return res.status(422).json({ message: "A valid page version is required" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensurePage(connection, pageKey, defaultContent);

    const [rows] = await connection.execute(
      `
        SELECT version, published_content
        FROM website_pages
        WHERE page_key = ?
        LIMIT 1
        FOR UPDATE
      `,
      [pageKey]
    );

    if (Number(rows[0].version) !== expectedVersion) {
      await connection.rollback();
      return res.status(409).json({
        message: "The page was changed by another administrator. Reload it first.",
      });
    }

    const cleanPublished = sanitizePageContent(
      pageKey,
      parseJsonColumn(rows[0].published_content) || defaultContent
    );

    await connection.execute(
      `
        UPDATE website_pages
        SET draft_content = ?, updated_by = ?, version = version + 1
        WHERE page_key = ?
      `,
      [JSON.stringify(cleanPublished), req.admin.id, pageKey]
    );

    const row = await ensurePage(connection, pageKey, defaultContent);
    await connection.commit();

    return res.json({
      message: "Draft restored from published content",
      page: mapAdminPage(row),
    });
  } catch (error) {
    await connection.rollback();
    console.error(`RESTORE_${pageKey.toUpperCase()}_PAGE_DRAFT_ERROR:`, error);
    return res.status(500).json({ message: "Could not restore the published content" });
  } finally {
    connection.release();
  }
}
