import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../firebase";

import type {
  AdminWebsitePage,
  JsonObject,
} from "../types/pageContent";

export type WebsitePageKey =
  | "home"
  | "about"
  | "contact"
  | "pricing"
  | "services";

interface PageResponse {
  message?: string;
  page: AdminWebsitePage;
}

function parseContent(
  value: unknown
): JsonObject {
  if (!value) {
    return {};
  }

  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as JsonObject;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(
        value
      ) as JsonObject;
    } catch (error) {
      console.error(
        "PAGE_CONTENT_PARSE_ERROR:",
        error
      );

      return {};
    }
  }

  return {};
}

function stringifyContent(
  value: JsonObject
) {
  return JSON.stringify(
    value
  );
}

function toIsoString(
  value: unknown
): string | null {
  if (!value) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate: () => Date;
      }
    ).toDate === "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    )
      .toDate()
      .toISOString();
  }

  return null;
}

function mapPage(
  pageKey: WebsitePageKey,
  data: Record<
    string,
    unknown
  >
): AdminWebsitePage {
  return {
    id:
      Number(
        data.id || 0
      ),

    pageKey,

    draftContent:
      parseContent(
        data.draft_content
      ),

    publishedContent:
      parseContent(
        data.published_content
      ),

    version:
      Number(
        data.version || 1
      ),

    updatedBy:
      data.updated_by
        ? String(
            data.updated_by
          )
        : null,

    publishedBy:
      data.published_by
        ? String(
            data.published_by
          )
        : null,

    publishedAt:
      toIsoString(
        data.published_at
      ),

    createdAt:
      toIsoString(
        data.created_at
      ),

    updatedAt:
      toIsoString(
        data.updated_at
      ),
  };
}

export async function getAdminPage(
  pageKey: WebsitePageKey
): Promise<PageResponse> {
  const reference =
    doc(
      db,
      "website_pages",
      pageKey
    );

  const snapshot =
    await getDoc(
      reference
    );

  if (!snapshot.exists()) {
    throw new Error(
      `Page "${pageKey}" was not found.`
    );
  }

  return {
    page:
      mapPage(
        pageKey,
        snapshot.data()
      ),
  };
}

export async function saveAdminPageDraft(
  pageKey: WebsitePageKey,
  content: JsonObject,
  version: number
): Promise<PageResponse> {
  const reference =
    doc(
      db,
      "website_pages",
      pageKey
    );

  const snapshot =
    await getDoc(
      reference
    );

  if (!snapshot.exists()) {
    throw new Error(
      `Page "${pageKey}" was not found.`
    );
  }

  const userId =
    auth.currentUser?.uid ||
    null;

  const nextVersion =
    Number(
      version || 1
    ) + 1;

  await updateDoc(
    reference,
    {
      draft_content:
        stringifyContent(
          content
        ),

      version:
        nextVersion,

      updated_by:
        userId,

      updated_at:
        serverTimestamp(),
    }
  );

  const updatedSnapshot =
    await getDoc(
      reference
    );

  return {
    message:
      "Draft saved successfully.",

    page:
      mapPage(
        pageKey,
        updatedSnapshot.data()!
      ),
  };
}

export async function publishAdminPage(
  pageKey: WebsitePageKey,
  version: number
): Promise<PageResponse> {
  const reference =
    doc(
      db,
      "website_pages",
      pageKey
    );

  const snapshot =
    await getDoc(
      reference
    );

  if (!snapshot.exists()) {
    throw new Error(
      `Page "${pageKey}" was not found.`
    );
  }

  const data =
    snapshot.data();

  const draft =
    parseContent(
      data.draft_content
    );

  const userId =
    auth.currentUser?.uid ||
    null;

  await updateDoc(
    reference,
    {
      published_content:
        stringifyContent(
          draft
        ),

      published_by:
        userId,

      published_at:
        serverTimestamp(),

      updated_by:
        userId,

      updated_at:
        serverTimestamp(),

      version:
        Number(
          version ||
          data.version ||
          1
        ),
    }
  );

  const updatedSnapshot =
    await getDoc(
      reference
    );

  return {
    message:
      "Page published successfully.",

    page:
      mapPage(
        pageKey,
        updatedSnapshot.data()!
      ),
  };
}

export async function restoreAdminPageDraft(
  pageKey: WebsitePageKey,
  version: number
): Promise<PageResponse> {
  const reference =
    doc(
      db,
      "website_pages",
      pageKey
    );

  const snapshot =
    await getDoc(
      reference
    );

  if (!snapshot.exists()) {
    throw new Error(
      `Page "${pageKey}" was not found.`
    );
  }

  const data =
    snapshot.data();

  const published =
    parseContent(
      data.published_content
    );

  const userId =
    auth.currentUser?.uid ||
    null;

  await updateDoc(
    reference,
    {
      draft_content:
        stringifyContent(
          published
        ),

      updated_by:
        userId,

      updated_at:
        serverTimestamp(),

      version:
        Number(
          version ||
          data.version ||
          1
        ),
    }
  );

  const updatedSnapshot =
    await getDoc(
      reference
    );

  return {
    message:
      "Draft restored from published content.",

    page:
      mapPage(
        pageKey,
        updatedSnapshot.data()!
      ),
  };
}

/*
  Backward-compatible helpers
*/

export function getAdminHomePage() {
  return getAdminPage(
    "home"
  );
}

export function saveAdminHomePageDraft(
  content: JsonObject,
  version: number
) {
  return saveAdminPageDraft(
    "home",
    content,
    version
  );
}

export function publishAdminHomePage(
  version: number
) {
  return publishAdminPage(
    "home",
    version
  );
}

export function restoreAdminHomePageDraft(
  version: number
) {
  return restoreAdminPageDraft(
    "home",
    version
  );
}