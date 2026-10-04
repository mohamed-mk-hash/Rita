import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase.js";

function parseContent(value) {
  if (!value) {
    return {};
  }

  /*
    If Firestore already contains
    an object for some reason,
    just return it.
  */
  if (
    typeof value === "object"
  ) {
    return value;
  }

  /*
    website_pages content is stored
    as JSON text.
  */
  if (
    typeof value === "string"
  ) {
    try {
      return JSON.parse(
        value
      );
    } catch (error) {
      console.error(
        "Could not parse website page content:",
        error
      );

      return {};
    }
  }

  return {};
}

export async function getPublicPage(
  pageKey
) {
  const pageQuery = query(
    collection(
      db,
      "website_pages"
    ),

    where(
      "page_key",
      "==",
      pageKey
    ),

    limit(1)
  );

  const snapshot =
    await getDocs(
      pageQuery
    );

  if (snapshot.empty) {
    throw new Error(
      `Page "${pageKey}" was not found`
    );
  }

  const row =
    snapshot.docs[0]
      .data();

  const draftContent =
    parseContent(
      row.draft_content
    );

  const publishedContent =
    parseContent(
      row.published_content
    );

  return {
    page: {
      id:
        row.id,

      pageKey:
        row.page_key,

      /*
        Website always prefers
        published content.

        Draft is used only if
        published content is empty.
      */
      content:
        Object.keys(
          publishedContent
        ).length > 0
          ? publishedContent
          : draftContent,

      draftContent,

      publishedContent,

      version:
        Number(
          row.version || 1
        ),

      updatedBy:
        row.updated_by ||
        null,

      publishedBy:
        row.published_by ||
        null,

      publishedAt:
        row.published_at ||
        null,

      createdAt:
        row.created_at ||
        null,

      updatedAt:
        row.updated_at ||
        null,
    },
  };
}

export function getPublicHomePage() {
  return getPublicPage(
    "home"
  );
}

export function getPublicAboutPage() {
  return getPublicPage(
    "about"
  );
}

export function getPublicContactPage() {
  return getPublicPage(
    "contact"
  );
}

export function getPublicPricingPage() {
  return getPublicPage(
    "pricing"
  );
}

export function getPublicServicesPage() {
  return getPublicPage(
    "services"
  );
}