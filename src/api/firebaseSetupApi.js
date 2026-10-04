import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase.js";

import { homeFallbackContent } from "../pages/Home/homeFallbackContent.js";
import { aboutFallbackContent } from "../pages/HowitWorks/aboutFallbackContent.js";
import { contactFallbackContent } from "../pages/Contact/contactFallbackContent.js";
import { servicesFallbackContent } from "../pages/Services/servicesFallbackContent.js";
import { pricingFallbackContent } from "../pages/Pricing/pricingFallbackContent.js";

const websitePages = [
  {
    documentId: "home",
    id: 1,
    page_key: "home",
    content: homeFallbackContent,
    version: 1,
  },

  {
    documentId: "about",
    id: 17,
    page_key: "about",
    content: aboutFallbackContent,
    version: 1,
  },

  {
    documentId: "contact",
    id: 20,
    page_key: "contact",
    content: contactFallbackContent,
    version: 1,
  },

  {
    documentId: "services",
    id: 109,
    page_key: "services",
    content: servicesFallbackContent,
    version: 1,
  },

  {
    documentId: "pricing",
    id: 113,
    page_key: "pricing",
    content: pricingFallbackContent,
    version: 1,
  },
];

const documentRequirements = [
  {
    documentId: "16",

    id: 16,

    service_type: "us_llc",

    document_code:
      "us_llc_passport",

    title_en:
      "Passport copy",

    title_ar:
      "نسخة من جواز السفر",

    description_en:
      "Upload a clear copy of the passport information page.",

    description_ar:
      "ارفع نسخة واضحة من صفحة المعلومات في جواز السفر.",

    is_required: 1,

    sort_order: 1,

    accepted_types:
      "application/pdf,image/jpeg,image/png",

    max_size_mb: 5,

    is_active: 1,
  },

  {
    documentId: "17",

    id: 17,

    service_type:
      "us_llc",

    document_code:
      "us_llc_proof_of_address",

    title_en:
      "Proof of address",

    title_ar:
      "إثبات العنوان",

    description_en:
      "Upload a recent utility bill, bank statement, or other proof of address.",

    description_ar:
      "ارفع فاتورة خدمات حديثة أو كشف حساب بنكي أو وثيقة إثبات عنوان.",

    is_required: 1,

    sort_order: 2,

    accepted_types:
      "application/pdf,image/jpeg,image/png",

    max_size_mb: 5,

    is_active: 1,
  },
];

async function saveWebsitePage(
  page,
  userId
) {
  const now =
    serverTimestamp();

  /*
    IMPORTANT:

    We save the whole page content as JSON text.

    This avoids Firestore's nested-array limitation
    and keeps exactly the same structure that
    your React pages already use.
  */
  const contentJson =
    JSON.stringify(
      page.content
    );

  await setDoc(
    doc(
      db,
      "website_pages",
      page.documentId
    ),

    {
      id:
        page.id,

      page_key:
        page.page_key,

      draft_content:
        contentJson,

      published_content:
        contentJson,

      version:
        page.version,

      updated_by:
        userId,

      published_by:
        userId,

      published_at:
        now,

      created_at:
        now,

      updated_at:
        now,
    },

    {
      merge: true,
    }
  );
}

async function saveDocumentRequirement(
  requirement
) {
  const now =
    serverTimestamp();

  await setDoc(
    doc(
      db,
      "document_requirements",
      requirement.documentId
    ),

    {
      id:
        requirement.id,

      service_type:
        requirement.service_type,

      document_code:
        requirement.document_code,

      title_en:
        requirement.title_en,

      title_ar:
        requirement.title_ar,

      description_en:
        requirement.description_en,

      description_ar:
        requirement.description_ar,

      is_required:
        requirement.is_required,

      sort_order:
        requirement.sort_order,

      accepted_types:
        requirement.accepted_types,

      max_size_mb:
        requirement.max_size_mb,

      is_active:
        requirement.is_active,

      created_at:
        now,

      updated_at:
        now,
    },

    {
      merge: true,
    }
  );
}

export async function initializeFirebaseContent() {
  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "Please sign in first."
    );
  }

  console.log(
    "Starting Firebase setup..."
  );

  for (
    const page
    of websitePages
  ) {
    console.log(
      `Saving page: ${page.page_key}`
    );

    await saveWebsitePage(
      page,
      user.uid
    );
  }

  for (
    const requirement
    of documentRequirements
  ) {
    console.log(
      `Saving document requirement: ${requirement.id}`
    );

    await saveDocumentRequirement(
      requirement
    );
  }

  console.log(
    "Firebase setup completed."
  );

  return {
    success: true,

    pages:
      websitePages.length,

    requirements:
      documentRequirements.length,
  };
}