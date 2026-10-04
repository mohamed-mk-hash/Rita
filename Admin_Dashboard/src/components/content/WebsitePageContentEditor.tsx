import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  DollarSign,
  Eye,
  FileText,
  Languages,
  ListFilter,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Tag,
  Trash2,
  Type,
  X,
} from "lucide-react";

import {
  getAdminPage,
  publishAdminPage,
  restoreAdminPageDraft,
  saveAdminPageDraft,
  type WebsitePageKey,
} from "../../api/adminPagesApi";

import type {
  AdminWebsitePage,
  JsonObject,
  JsonValue,
} from "../../types/pageContent";

import { useLanguage } from "../../i18n/LanguageContext";

/* =========================================================
   TYPES
========================================================= */

type ContentLanguage = "en" | "ar";

type SearchFilter =
  | "all"
  | "price"
  | "button"
  | "title";

interface SearchResult {
  sectionKey: string;
  path: string;
  fieldKey: string;
  label: string;
  value: string;
  itemTitle?: string;
  category:
    | "price"
    | "button"
    | "title"
    | "text";
}

/* =========================================================
   FIELD LABELS
========================================================= */

const FIELD_LABELS: Record<
  string,
  { ar: string; en: string }
> = {
  meta: {
    ar: "إعدادات محركات البحث",
    en: "SEO settings",
  },

  homeSection: {
    ar: "قسم الصفحة الرئيسية",
    en: "Home section",
  },

  hero: {
    ar: "القسم الرئيسي",
    en: "Hero section",
  },

  journey: {
    ar: "مسار التأسيس",
    en: "Formation journey",
  },

  services: {
    ar: "الخدمات",
    en: "Services",
  },

  process: {
    ar: "طريقة العمل",
    en: "Process",
  },

  advantages: {
    ar: "المميزات",
    en: "Advantages",
  },

  pricing: {
    ar: "الأسعار",
    en: "Pricing",
  },

  packages: {
    ar: "الباقات",
    en: "Packages",
  },

  highlights: {
    ar: "المميزات",
    en: "Highlights",
  },

  comparison: {
    ar: "مقارنة الباقات",
    en: "Package comparison",
  },

  suiteBanner: {
    ar: "باقة Rita One",
    en: "Rita One banner",
  },

  benefits: {
    ar: "المميزات",
    en: "Benefits",
  },

  partners: {
    ar: "الشركاء",
    en: "Partners",
  },

  trust: {
    ar: "الثقة والإحصائيات",
    en: "Trust & metrics",
  },

  tools: {
    ar: "أدوات الأعمال",
    en: "Business tools",
  },

  about: {
    ar: "عن Rita",
    en: "About Rita",
  },

  finalCta: {
    ar: "الدعوة الأخيرة",
    en: "Final call to action",
  },

  title: {
    ar: "العنوان",
    en: "Title",
  },

  description: {
    ar: "الوصف",
    en: "Description",
  },

  label: {
    ar: "التسمية",
    en: "Label",
  },

  text: {
    ar: "النص",
    en: "Text",
  },

  subtitle: {
    ar: "العنوان الفرعي",
    en: "Subtitle",
  },

  eyebrow: {
    ar: "النص العلوي",
    en: "Eyebrow",
  },

  primary: {
    ar: "نص الزر الرئيسي",
    en: "Primary button text",
  },

  secondary: {
    ar: "نص الزر الثانوي",
    en: "Secondary button text",
  },

  primaryButton: {
    ar: "الزر الرئيسي",
    en: "Primary button",
  },

  secondaryButton: {
    ar: "الزر الثانوي",
    en: "Secondary button",
  },

  button: {
    ar: "نص الزر",
    en: "Button text",
  },

  learnMore: {
    ar: "نص اعرف أكثر",
    en: "Learn more text",
  },

  name: {
    ar: "الاسم",
    en: "Name",
  },

  slug: {
    ar: "المعرّف",
    en: "Slug",
  },

  number: {
    ar: "الرقم",
    en: "Number",
  },

  price: {
    ar: "السعر",
    en: "Price",
  },

  currency: {
    ar: "العملة",
    en: "Currency",
  },

  period: {
    ar: "فترة الدفع",
    en: "Payment period",
  },

  recommended: {
    ar: "الباقة الموصى بها",
    en: "Recommended",
  },

  badge: {
    ar: "الشارة",
    en: "Badge",
  },

  features: {
    ar: "المميزات",
    en: "Features",
  },

  summary: {
    ar: "الوصف المختصر",
    en: "Summary",
  },

  icon: {
    ar: "رمز الأيقونة",
    en: "Icon key",
  },

  items: {
    ar: "العناصر",
    en: "Items",
  },

  rows: {
    ar: "صفوف المقارنة",
    en: "Comparison rows",
  },

  cards: {
    ar: "البطاقات",
    en: "Cards",
  },

  steps: {
    ar: "الخطوات",
    en: "Steps",
  },

  tabs: {
    ar: "التبويبات",
    en: "Tabs",
  },

  visual: {
    ar: "المحتوى المرئي",
    en: "Visual content",
  },

  bundle: {
    ar: "باقة Rita One",
    en: "Rita One bundle",
  },

  contact: {
    ar: "التواصل",
    en: "Contact",
  },

  section: {
    ar: "مقدمة القسم",
    en: "Section introduction",
  },

  info: {
    ar: "معلومات التواصل",
    en: "Contact information",
  },

  form: {
    ar: "نموذج التواصل",
    en: "Contact form",
  },

  cta: {
    ar: "الدعوة لاتخاذ إجراء",
    en: "Call to action",
  },

  emailLabel: {
    ar: "تسمية البريد",
    en: "Email label",
  },

  email: {
    ar: "البريد الإلكتروني",
    en: "Email",
  },

  phoneLabel: {
    ar: "تسمية الهاتف",
    en: "Phone label",
  },

  phone: {
    ar: "رقم الهاتف",
    en: "Phone",
  },

  addressLabel: {
    ar: "تسمية العنوان",
    en: "Address label",
  },

  address: {
    ar: "العنوان",
    en: "Address",
  },

  hoursLabel: {
    ar: "تسمية ساعات العمل",
    en: "Hours label",
  },

  hours: {
    ar: "ساعات العمل",
    en: "Business hours",
  },

  fullName: {
    ar: "الاسم الكامل",
    en: "Full name",
  },

  fullNamePlaceholder: {
    ar: "مثال الاسم",
    en: "Full-name placeholder",
  },

  emailPlaceholder: {
    ar: "مثال البريد",
    en: "Email placeholder",
  },

  phonePlaceholder: {
    ar: "مثال الهاتف",
    en: "Phone placeholder",
  },

  subject: {
    ar: "الموضوع",
    en: "Subject",
  },

  subjectPlaceholder: {
    ar: "مثال الموضوع",
    en: "Subject placeholder",
  },

  message: {
    ar: "الرسالة",
    en: "Message",
  },

  messagePlaceholder: {
    ar: "مثال الرسالة",
    en: "Message placeholder",
  },

  loading: {
    ar: "نص التحميل",
    en: "Loading text",
  },

  success: {
    ar: "رسالة النجاح",
    en: "Success message",
  },

  error: {
    ar: "رسالة الخطأ",
    en: "Error message",
  },

  visuals: {
    ar: "النصوص التوضيحية",
    en: "Visual labels",
  },

  introStats: {
    ar: "الإحصائيات",
    en: "Intro statistics",
  },

  mission: {
    ar: "المهمة",
    en: "Mission",
  },

  vision: {
    ar: "الرؤية",
    en: "Vision",
  },

  story: {
    ar: "القصة",
    en: "Story",
  },

  expertise: {
    ar: "الخبرات",
    en: "Expertise",
  },

  members: {
    ar: "أعضاء الفريق",
    en: "Team members",
  },

  testimonials: {
    ar: "آراء العملاء",
    en: "Testimonials",
  },

  faq: {
    ar: "الأسئلة الشائعة",
    en: "FAQ",
  },

  groups: {
    ar: "مجموعات الأسئلة",
    en: "Question groups",
  },

  q: {
    ar: "السؤال",
    en: "Question",
  },

  a: {
    ar: "الإجابة",
    en: "Answer",
  },

  question: {
    ar: "السؤال",
    en: "Question",
  },

  answer: {
    ar: "الإجابة",
    en: "Answer",
  },

  initials: {
    ar: "الأحرف المختصرة",
    en: "Initials",
  },

  role: {
    ar: "المنصب",
    en: "Role",
  },

  company: {
    ar: "الشركة",
    en: "Company",
  },

  value: {
    ar: "القيمة",
    en: "Value",
  },

  href: {
    ar: "الرابط",
    en: "Link",
  },

  logoUrl: {
    ar: "رابط الشعار",
    en: "Logo URL",
  },

  imageUrl: {
    ar: "رابط الصورة",
    en: "Image URL",
  },

  id: {
    ar: "المعرّف",
    en: "Identifier",
  },
};

/* =========================================================
   DEFAULT SECTION DESCRIPTIONS
========================================================= */

const DEFAULT_SECTION_DESCRIPTIONS: Record<
  string,
  { ar: string; en: string }
> = {
  homeSection: {
    ar: "المحتوى الذي يظهر في الصفحة الرئيسية لهذا القسم.",
    en: "Content from this section that also appears on the home page.",
  },

  hero: {
    ar: "تحكّم في أول قسم يراه الزائر.",
    en: "Control the first section visitors see on the page.",
  },

  packages: {
    ar: "عدّل أسماء الباقات والأسعار والمميزات.",
    en: "Edit package names, prices, buttons, and included features.",
  },

  services: {
    ar: "عدّل الخدمات والوصف والمميزات.",
    en: "Edit services, summaries, descriptions, and features.",
  },

  process: {
    ar: "عدّل خطوات العمل.",
    en: "Edit the workflow and process steps.",
  },

  advantages: {
    ar: "عدّل مميزات Rita.",
    en: "Edit the Why Rita advantages.",
  },

  highlights: {
    ar: "عدّل بطاقات المميزات.",
    en: "Edit the highlight cards.",
  },

  comparison: {
    ar: "عدّل جدول مقارنة الباقات.",
    en: "Edit the package comparison table.",
  },

  finalCta: {
    ar: "عدّل الدعوة الأخيرة لاتخاذ إجراء.",
    en: "Edit the final call-to-action.",
  },

  contact: {
    ar: "عدّل بيانات التواصل.",
    en: "Edit contact information.",
  },

  form: {
    ar: "عدّل نصوص نموذج التواصل.",
    en: "Edit contact-form labels and messages.",
  },

  mission: {
    ar: "عدّل رسالة الشركة.",
    en: "Edit the company mission.",
  },

  vision: {
    ar: "عدّل رؤية الشركة.",
    en: "Edit the company vision.",
  },

  story: {
    ar: "عدّل قصة الشركة.",
    en: "Edit the company story.",
  },

  testimonials: {
    ar: "عدّل آراء العملاء.",
    en: "Edit client testimonials.",
  },

  faq: {
    ar: "عدّل الأسئلة الشائعة.",
    en: "Edit frequently asked questions.",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function cloneJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value)
  ) as T;
}

function stripGlobalLayoutContent(
  value: JsonObject
): JsonObject {
  const content = cloneJson(value);

  delete content.navigation;
  delete content.footer;

  for (const language of ["en", "ar"]) {
    const languageContent =
      content[language];

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

function isJsonObject(
  value: JsonValue
): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isLocalizedText(
  value: JsonValue
): value is JsonObject & {
  ar: string;
  en: string;
} {
  if (!isJsonObject(value)) {
    return false;
  }

  return (
    typeof value.ar === "string" &&
    typeof value.en === "string" &&
    Object.keys(value).every(
      (key) =>
        key === "ar" ||
        key === "en"
    )
  );
}

function getFieldLabel(
  key: string,
  isArabic: boolean
) {
  const translated =
    FIELD_LABELS[key];

  if (translated) {
    return isArabic
      ? translated.ar
      : translated.en;
  }

  return key
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    )
    .replace(/_/g, " ")
    .replace(/^./, (character) =>
      character.toUpperCase()
    );
}

function getSectionDescription(
  key: string,
  isArabic: boolean,
  sectionDescriptions: Record<
    string,
    { ar: string; en: string }
  >
) {
  const description =
    sectionDescriptions[key] ||
    DEFAULT_SECTION_DESCRIPTIONS[key];

  if (description) {
    return isArabic
      ? description.ar
      : description.en;
  }

  return isArabic
    ? "عدّل محتوى هذا القسم."
    : "Edit the content in this section.";
}

function createEmptyLike(
  value: JsonValue,
  key?: string
): JsonValue {
  if (key === "id") {
    return `item-${Date.now()}`;
  }

  if (typeof value === "string") {
    return "";
  }

  if (typeof value === "number") {
    return 0;
  }

  if (typeof value === "boolean") {
    return false;
  }

  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return [];
  }

  const result: JsonObject = {};

  Object.entries(value).forEach(
    ([childKey, childValue]) => {
      result[childKey] =
        createEmptyLike(
          childValue,
          childKey
        );
    }
  );

  return result;
}

function shouldUseTextarea(
  key: string,
  value: string
) {
  const multilineKeys = [
    "description",
    "text",
    "quote",
    "copyright",
    "subtitle",
    "message",
    "answer",
    "a",
  ];

  return (
    multilineKeys.includes(key) ||
    value.length > 100
  );
}

function isImageField(key: string) {
  const normalized =
    key.toLowerCase();

  return (
    normalized.includes("image") ||
    normalized.includes("logo") ||
    normalized.includes("thumbnail") ||
    normalized.includes("photo")
  );
}

function canPreviewImage(value: string) {
  const normalized =
    value.trim();

  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/") ||
    normalized.startsWith("data:image/")
  );
}

function hasLanguageRoot(
  content: JsonObject
) {
  return (
    isJsonObject(
      content.en as JsonValue
    ) ||
    isJsonObject(
      content.ar as JsonValue
    )
  );
}

function getLanguageContent(
  content: JsonObject,
  language: ContentLanguage
): JsonObject {
  if (
    hasLanguageRoot(content) &&
    isJsonObject(
      content[language] as JsonValue
    )
  ) {
    return content[
      language
    ] as JsonObject;
  }

  return content;
}

function sanitizePath(
  value: string
) {
  return value.replace(
    /[^a-zA-Z0-9_-]/g,
    "-"
  );
}

function fieldElementId(
  path: string
) {
  return `content-field-${sanitizePath(
    path
  )}`;
}

function getItemTitle(
  item: JsonValue,
  index: number,
  isArabic: boolean
) {
  if (
    typeof item === "string" &&
    item.trim()
  ) {
    return item;
  }

  if (isJsonObject(item)) {
    const candidate =
      item.name ??
      item.title ??
      item.label ??
      item.question ??
      item.slug;

    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate;
    }

    if (
      candidate !== undefined &&
      candidate !== null &&
      isLocalizedText(
        candidate as JsonValue
      )
    ) {
      const localizedCandidate =
        candidate as JsonObject & {
          ar: string;
          en: string;
        };

      const localized =
        isArabic
          ? localizedCandidate.ar
          : localizedCandidate.en;

      if (localized.trim()) {
        return localized;
      }
    }
  }

  return isArabic
    ? `العنصر ${index + 1}`
    : `Item ${index + 1}`;
}

function getItemSubtitle(
  item: JsonValue
) {
  if (!isJsonObject(item)) {
    return "";
  }

  if (
    item.price !== undefined
  ) {
    const currency =
      typeof item.currency ===
      "string"
        ? item.currency
        : "$";

    return `${currency}${String(
      item.price
    )}`;
  }

  if (
    typeof item.summary ===
    "string"
  ) {
    return item.summary;
  }

  if (
    typeof item.description ===
    "string"
  ) {
    return item.description;
  }

  return "";
}

function classifyField(
  key: string,
  path: string
): SearchResult["category"] {
  const normalized =
    `${key} ${path}`.toLowerCase();

  if (
    normalized.includes("price") ||
    normalized.includes("currency") ||
    normalized.includes("period")
  ) {
    return "price";
  }

  if (
    normalized.includes("button") ||
    normalized.includes("primary") ||
    normalized.includes("secondary") ||
    normalized.includes("cta") ||
    normalized.includes("learnmore")
  ) {
    return "button";
  }

  if (
    normalized.includes("title") ||
    normalized.includes("heading") ||
    normalized.includes("eyebrow") ||
    normalized.includes("label") ||
    normalized.includes("name")
  ) {
    return "title";
  }

  return "text";
}

function flattenSearchResults(
  value: JsonValue,
  sectionKey: string,
  path: string,
  isArabic: boolean,
  results: SearchResult[],
  parentTitle?: string
) {
  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    const parts =
      path.split(".");

    const fieldKey =
      parts[
        parts.length - 1
      ] || "";

    results.push({
      sectionKey,
      path,
      fieldKey,
      label:
        getFieldLabel(
          fieldKey,
          isArabic
        ),
      value:
        String(value),
      itemTitle:
        parentTitle,
      category:
        classifyField(
          fieldKey,
          path
        ),
    });

    return;
  }

  if (value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(
      (item, index) => {
        const title =
          getItemTitle(
            item,
            index,
            isArabic
          );

        flattenSearchResults(
          item,
          sectionKey,
          `${path}.${index}`,
          isArabic,
          results,
          title
        );
      }
    );

    return;
  }

  Object.entries(value).forEach(
    ([key, childValue]) => {
      flattenSearchResults(
        childValue,
        sectionKey,
        `${path}.${key}`,
        isArabic,
        results,
        parentTitle
      );
    }
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

interface WebsitePageContentEditorProps {
  pageKey: WebsitePageKey;

  badge: {
    ar: string;
    en: string;
  };

  title: {
    ar: string;
    en: string;
  };

  description: {
    ar: string;
    en: string;
  };

  sectionDescriptions?: Record<
    string,
    {
      ar: string;
      en: string;
    }
  >;
}

export const WebsitePageContentEditor: React.FC<
  WebsitePageContentEditorProps
> = ({
  pageKey,
  badge,
  title,
  description,
  sectionDescriptions = {},
}) => {
  const { isArabic } =
    useLanguage();

  const [page, setPage] =
    useState<AdminWebsitePage | null>(
      null
    );

  const [content, setContent] =
    useState<JsonObject>({});

  const [
    savedDraft,
    setSavedDraft,
  ] =
    useState<JsonObject>({});

  const [
    editingLanguage,
    setEditingLanguage,
  ] =
    useState<ContentLanguage>(
      "en"
    );

  const [
    activeSection,
    setActiveSection,
  ] =
    useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState("");

  const [
    searchFilter,
    setSearchFilter,
  ] =
    useState<SearchFilter>(
      "all"
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    publishing,
    setPublishing,
  ] =
    useState(false);

  const [
    restoring,
    setRestoring,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* -----------------------------
     LOAD PAGE
  ----------------------------- */

  const loadPage =
    useCallback(async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const data =
          await getAdminPage(
            pageKey
          );

        const draft =
          stripGlobalLayoutContent(
            data.page
              .draftContent
          );

        setPage(data.page);

        setContent(draft);

        setSavedDraft(
          cloneJson(draft)
        );

        const initialLanguage =
          isJsonObject(
            draft.en as JsonValue
          )
            ? "en"
            : isJsonObject(
                  draft.ar as JsonValue
                )
              ? "ar"
              : "en";

        setEditingLanguage(
          initialLanguage
        );

        const languageContent =
          getLanguageContent(
            draft,
            initialLanguage
          );

        const keys =
          Object.keys(
            languageContent
          );

        setActiveSection(
          keys[0] || ""
        );
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : isArabic
              ? "تعذر تحميل محتوى الصفحة."
              : "Could not load page content."
        );
      } finally {
        setLoading(false);
      }
    }, [
      isArabic,
      pageKey,
    ]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  /* -----------------------------
     LANGUAGE CONTENT
  ----------------------------- */

  const localizedRoot =
    useMemo(
      () =>
        hasLanguageRoot(
          content
        ),
      [content]
    );

  const languageContent =
    useMemo(
      () =>
        getLanguageContent(
          content,
          editingLanguage
        ),
      [
        content,
        editingLanguage,
      ]
    );

  const sectionKeys =
    useMemo(
      () =>
        Object.keys(
          languageContent
        ),
      [languageContent]
    );

  useEffect(() => {
    if (
      !sectionKeys.length
    ) {
      setActiveSection("");
      return;
    }

    if (
      !sectionKeys.includes(
        activeSection
      )
    ) {
      setActiveSection(
        sectionKeys[0]
      );
    }
  }, [
    activeSection,
    sectionKeys,
  ]);

  /* -----------------------------
     DIRTY
  ----------------------------- */

  const isDirty =
    useMemo(
      () =>
        JSON.stringify(
          content
        ) !==
        JSON.stringify(
          savedDraft
        ),
      [
        content,
        savedDraft,
      ]
    );

  const busy =
    saving ||
    publishing ||
    restoring;

  /* -----------------------------
     UPDATE SECTION
  ----------------------------- */

  function updateSection(
    value: JsonValue
  ) {
    if (!activeSection) {
      return;
    }

    setContent(
      (current) => {
        /*
          Most Rita pages have:
          {
            en: {...},
            ar: {...}
          }

          So update the selected language
          without touching the other one.
        */
        if (
          hasLanguageRoot(
            current
          )
        ) {
          const currentLanguage =
            isJsonObject(
              current[
                editingLanguage
              ] as JsonValue
            )
              ? (current[
                  editingLanguage
                ] as JsonObject)
              : {};

          return {
            ...current,

            [editingLanguage]:
              {
                ...currentLanguage,

                [activeSection]:
                  value,
              },
          };
        }

        return {
          ...current,

          [activeSection]:
            value,
        };
      }
    );

    setSuccess("");
  }

  /* -----------------------------
     SAVE
  ----------------------------- */

  async function handleSave() {
    if (
      !page ||
      saving ||
      publishing
    ) {
      return null;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data =
        await saveAdminPageDraft(
          pageKey,
          content,
          page.version
        );

      const nextDraft =
        stripGlobalLayoutContent(
          cloneJson(
            data.page
              .draftContent
          )
        );

      setPage(data.page);

      setContent(
        nextDraft
      );

      setSavedDraft(
        cloneJson(
          nextDraft
        )
      );

      setSuccess(
        isArabic
          ? "تم حفظ المسودة بنجاح."
          : "Draft saved successfully."
      );

      return data.page;
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : isArabic
            ? "تعذر حفظ المسودة."
            : "Could not save the draft."
      );

      return null;
    } finally {
      setSaving(false);
    }
  }

  /* -----------------------------
     PUBLISH
  ----------------------------- */

  async function handlePublish() {
    if (
      !page ||
      publishing ||
      saving
    ) {
      return;
    }

    setPublishing(true);
    setError("");
    setSuccess("");

    try {
      let currentPage =
        page;

      if (isDirty) {
        const saved =
          await saveAdminPageDraft(
            pageKey,
            content,
            currentPage.version
          );

        currentPage =
          saved.page;

        const nextDraft =
          stripGlobalLayoutContent(
            cloneJson(
              saved.page
                .draftContent
            )
          );

        setPage(
          saved.page
        );

        setContent(
          nextDraft
        );

        setSavedDraft(
          cloneJson(
            nextDraft
          )
        );
      }

      const published =
        await publishAdminPage(
          pageKey,
          currentPage.version
        );

      const nextDraft =
        stripGlobalLayoutContent(
          cloneJson(
            published.page
              .draftContent
          )
        );

      setPage(
        published.page
      );

      setContent(
        nextDraft
      );

      setSavedDraft(
        cloneJson(
          nextDraft
        )
      );

      setSuccess(
        isArabic
          ? "تم نشر التغييرات على الموقع."
          : "Changes published successfully."
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : isArabic
            ? "تعذر نشر التغييرات."
            : "Could not publish the changes."
      );
    } finally {
      setPublishing(
        false
      );
    }
  }

  /* -----------------------------
     RESTORE
  ----------------------------- */

  async function handleRestore() {
    if (
      !page ||
      restoring ||
      saving ||
      publishing
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        isArabic
          ? "سيتم حذف تعديلات المسودة الحالية واسترجاع آخر نسخة منشورة. هل تريد المتابعة؟"
          : "Current draft changes will be removed and replaced with the published version. Continue?"
      );

    if (!confirmed) {
      return;
    }

    setRestoring(true);
    setError("");
    setSuccess("");

    try {
      const data =
        await restoreAdminPageDraft(
          pageKey,
          page.version
        );

      const nextDraft =
        stripGlobalLayoutContent(
          cloneJson(
            data.page
              .draftContent
          )
        );

      setPage(data.page);

      setContent(
        nextDraft
      );

      setSavedDraft(
        cloneJson(
          nextDraft
        )
      );

      setSuccess(
        isArabic
          ? "تم استرجاع النسخة المنشورة."
          : "Published content restored."
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : isArabic
            ? "تعذر استرجاع النسخة المنشورة."
            : "Could not restore published content."
      );
    } finally {
      setRestoring(
        false
      );
    }
  }

  /* -----------------------------
     SEARCH
  ----------------------------- */

  const allSearchResults =
    useMemo(() => {
      const results:
        SearchResult[] = [];

      Object.entries(
        languageContent
      ).forEach(
        ([
          sectionKey,
          sectionValue,
        ]) => {
          flattenSearchResults(
            sectionValue,
            sectionKey,
            sectionKey,
            isArabic,
            results
          );
        }
      );

      return results;
    }, [
      languageContent,
      isArabic,
    ]);

  const searchResults =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return [];
      }

      return allSearchResults
        .filter(
          (result) => {
            if (
              searchFilter !==
                "all" &&
              result.category !==
                searchFilter
            ) {
              return false;
            }

            const haystack =
              [
                result.label,
                result.value,
                result.path,
                result.itemTitle,
                getFieldLabel(
                  result.sectionKey,
                  isArabic
                ),
              ]
                .filter(
                  Boolean
                )
                .join(" ")
                .toLowerCase();

            return haystack.includes(
              search
            );
          }
        )
        .slice(0, 50);
    }, [
      allSearchResults,
      searchTerm,
      searchFilter,
      isArabic,
    ]);

  function goToSearchResult(
    result: SearchResult
  ) {
    setActiveSection(
      result.sectionKey
    );

    setSearchTerm("");

    window.setTimeout(
      () => {
        const element =
          window.document.getElementById(
            fieldElementId(
              result.path
            )
          );

        if (element) {
          element.scrollIntoView({
            behavior:
              "smooth",
            block: "center",
          });

          element.classList.add(
            "ring-2",
            "ring-blue-500",
            "ring-offset-2"
          );

          window.setTimeout(
            () => {
              element.classList.remove(
                "ring-2",
                "ring-blue-500",
                "ring-offset-2"
              );
            },
            1800
          );
        }
      },
      100
    );
  }

  /* -----------------------------
     LOADING
  ----------------------------- */

  if (loading) {
    return (
      <div
        className="space-y-6"
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
      >
        <div>
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="h-[500px] animate-pulse rounded-2xl bg-slate-100" />

          <div className="h-[600px] animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="space-y-6 pb-8"
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {isArabic
                ? badge.ar
                : badge.en}
            </span>

            {page && (
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                {isArabic
                  ? `الإصدار ${page.version}`
                  : `Version ${page.version}`}
              </span>
            )}

            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                isDirty
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isDirty
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />

              {isDirty
                ? isArabic
                  ? "تغييرات غير محفوظة"
                  : "Unsaved changes"
                : isArabic
                  ? "المسودة محفوظة"
                  : "Draft saved"}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {isArabic
              ? title.ar
              : title.en}
          </h1>

          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            {isArabic
              ? description.ar
              : description.en}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void loadPage()
            }
            disabled={busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />

            {isArabic
              ? "تحديث"
              : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() =>
              void handleRestore()
            }
            disabled={
              !page || busy
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw
              className={`h-4 w-4 ${
                restoring
                  ? "animate-spin"
                  : ""
              }`}
            />

            {restoring
              ? isArabic
                ? "جاري الاسترجاع..."
                : "Restoring..."
              : isArabic
                ? "استرجاع المنشور"
                : "Restore published"}
          </button>
        </div>
      </header>

      {/* =====================================================
          HOME SHARED CONTENT NOTE
      ===================================================== */}

      {pageKey ===
        "home" && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

            <div>
              <p className="font-black text-blue-950">
                {isArabic
                  ? "الأسعار والخدمات ليست داخل محتوى الصفحة الرئيسية"
                  : "Pricing and services are managed separately"}
              </p>

              <p className="mt-1 text-sm font-medium leading-6 text-blue-700">
                {isArabic
                  ? "لتغيير السعر الظاهر في الصفحة الرئيسية، افتح Pricing content من القائمة الجانبية ثم Packages ثم اختر الباقة."
                  : "To change a price shown on the home page, open Pricing content from the sidebar → Packages → choose the package."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          STATUS MESSAGES
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <span>
            {error}
          </span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />

          <span>
            {success}
          </span>
        </div>
      )}

      {/* =====================================================
          LANGUAGE + SEARCH
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          {/* Language */}

          {localizedRoot && (
            <div className="flex shrink-0 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() =>
                  setEditingLanguage(
                    "en"
                  )
                }
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition ${
                  editingLanguage ===
                  "en"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <Languages className="h-4 w-4" />
                English
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditingLanguage(
                    "ar"
                  )
                }
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition ${
                  editingLanguage ===
                  "ar"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <Languages className="h-4 w-4" />
                العربية
              </button>
            </div>
          )}

          {/* Search */}

          <div className="relative min-w-0 flex-1">
            <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target
                    .value
                )
              }
              placeholder={
                isArabic
                  ? "ابحث عن أي نص، سعر، زر، عنوان..."
                  : "Search any text, price, button, title..."
              }
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-12 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() =>
                  setSearchTerm(
                    ""
                  )
                }
                className="absolute end-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick filters */}

        <div className="mt-4 flex flex-wrap gap-2">
          <SearchFilterButton
            active={
              searchFilter ===
              "all"
            }
            onClick={() =>
              setSearchFilter(
                "all"
              )
            }
            icon={
              <ListFilter className="h-4 w-4" />
            }
            label={
              isArabic
                ? "الكل"
                : "All"
            }
          />

          <SearchFilterButton
            active={
              searchFilter ===
              "price"
            }
            onClick={() =>
              setSearchFilter(
                "price"
              )
            }
            icon={
              <DollarSign className="h-4 w-4" />
            }
            label={
              isArabic
                ? "الأسعار"
                : "Prices"
            }
          />

          <SearchFilterButton
            active={
              searchFilter ===
              "button"
            }
            onClick={() =>
              setSearchFilter(
                "button"
              )
            }
            icon={
              <Tag className="h-4 w-4" />
            }
            label={
              isArabic
                ? "الأزرار"
                : "Buttons"
            }
          />

          <SearchFilterButton
            active={
              searchFilter ===
              "title"
            }
            onClick={() =>
              setSearchFilter(
                "title"
              )
            }
            icon={
              <Type className="h-4 w-4" />
            }
            label={
              isArabic
                ? "العناوين"
                : "Titles"
            }
          />
        </div>

        {/* Search results */}

        {searchTerm && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-black text-slate-800">
                {isArabic
                  ? "نتائج البحث"
                  : "Search results"}
              </span>

              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                {
                  searchResults.length
                }
              </span>
            </div>

            {searchResults.length >
            0 ? (
              <div className="max-h-80 overflow-y-auto p-2">
                {searchResults.map(
                  (
                    result,
                    index
                  ) => (
                    <button
                      key={`${result.path}-${index}`}
                      type="button"
                      onClick={() =>
                        goToSearchResult(
                          result
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-3 text-start transition hover:bg-blue-50"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {result.itemTitle ||
                              result.label}
                          </span>

                          {result.itemTitle && (
                            <span className="text-xs font-semibold text-slate-400">
                              {
                                result.label
                              }
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs font-medium text-slate-500">
                          {getFieldLabel(
                            result.sectionKey,
                            isArabic
                          )}
                          {" → "}
                          {
                            result.value
                          }
                        </p>
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 rtl:rotate-180" />
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm font-semibold text-slate-400">
                {isArabic
                  ? "لا توجد نتائج."
                  : "No matching content found."}
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          MAIN EDITOR GRID
      ===================================================== */}

      <div className="grid items-start gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-4">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-black text-slate-900">
                  {isArabic
                    ? "أقسام الصفحة"
                    : "Page sections"}
                </h2>

                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {
                    sectionKeys.length
                  }{" "}
                  {isArabic
                    ? "قسم"
                    : "sections"}
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1.5 p-3">
            {sectionKeys.map(
              (
                sectionKey
              ) => {
                const selected =
                  sectionKey ===
                  activeSection;

                return (
                  <button
                    key={
                      sectionKey
                    }
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        sectionKey
                      )
                    }
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-start transition ${
                      selected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/15"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                  >
                    <span className="min-w-0 truncate text-sm font-bold">
                      {getFieldLabel(
                        sectionKey,
                        isArabic
                      )}
                    </span>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 rtl:rotate-180 ${
                        selected
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    />
                  </button>
                );
              }
            )}
          </nav>
        </aside>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <main className="min-w-0 space-y-4">
          {activeSection &&
          languageContent[
            activeSection
          ] !== undefined ? (
            <>
              {/* Breadcrumb */}

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                <span>
                  {isArabic
                    ? title.ar
                    : title.en}
                </span>

                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />

                {localizedRoot && (
                  <>
                    <span>
                      {editingLanguage ===
                      "ar"
                        ? "العربية"
                        : "English"}
                    </span>

                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </>
                )}

                <span className="text-blue-600">
                  {getFieldLabel(
                    activeSection,
                    isArabic
                  )}
                </span>
              </div>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Section header */}

                <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    {isArabic
                      ? "القسم المحدد"
                      : "Selected section"}
                  </span>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {getFieldLabel(
                      activeSection,
                      isArabic
                    )}
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                    {getSectionDescription(
                      activeSection,
                      isArabic,
                      sectionDescriptions
                    )}
                  </p>
                </div>

                {/* Editor */}

                <div className="bg-slate-50 p-4 sm:p-6">
                  <JsonValueEditor
                    label={getFieldLabel(
                      activeSection,
                      isArabic
                    )}
                    fieldKey={
                      activeSection
                    }
                    value={
                      languageContent[
                        activeSection
                      ]
                    }
                    onChange={
                      updateSection
                    }
                    isArabic={
                      isArabic
                    }
                    depth={0}
                    path={
                      activeSection
                    }
                  />
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
              <p className="font-semibold text-slate-400">
                {isArabic
                  ? "لا يوجد قسم محدد."
                  : "No section selected."}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================
          SAVE BAR
      ===================================================== */}

      <div className="sticky bottom-4 z-30 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_14px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800">
              {isDirty
                ? isArabic
                  ? "لديك تغييرات لم يتم حفظها بعد."
                  : "You have unsaved changes."
                : isArabic
                  ? "كل التغييرات محفوظة في المسودة."
                  : "All changes are saved in the draft."}
            </p>

            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {isArabic
                ? "النشر يجعل التغييرات متاحة على الموقع مباشرة."
                : "Publishing makes the changes live on the website."}
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={
                !page ||
                busy ||
                !isDirty
              }
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <Save className="h-4 w-4" />

              {saving
                ? isArabic
                  ? "جاري الحفظ..."
                  : "Saving..."
                : isArabic
                  ? "حفظ المسودة"
                  : "Save draft"}
            </button>

            <button
              type="button"
              onClick={() =>
                void handlePublish()
              }
              disabled={
                !page || busy
              }
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-md shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <Send className="h-4 w-4" />

              {publishing
                ? isArabic
                  ? "جاري النشر..."
                  : "Publishing..."
                : isArabic
                  ? "نشر التغييرات"
                  : "Publish changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SEARCH FILTER BUTTON
========================================================= */

function SearchFilterButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-black transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* =========================================================
   RECURSIVE JSON EDITOR
========================================================= */

interface JsonValueEditorProps {
  label: string;

  fieldKey: string;

  value: JsonValue;

  onChange: (
    value: JsonValue
  ) => void;

  isArabic: boolean;

  depth: number;

  path: string;
}

function JsonValueEditor({
  label,
  fieldKey,
  value,
  onChange,
  isArabic,
  depth,
  path,
}: JsonValueEditorProps) {
  const [
    expanded,
    setExpanded,
  ] =
    useState(true);

  /* -----------------------------
     LOCALIZED TEXT
  ----------------------------- */

  if (
    isLocalizedText(value)
  ) {
    const multiline =
      shouldUseTextarea(
        fieldKey,
        value.ar
      ) ||
      shouldUseTextarea(
        fieldKey,
        value.en
      );

    return (
      <div
        id={fieldElementId(
          path
        )}
        className={`rounded-xl border border-slate-200 bg-white p-4 transition ${
          multiline
            ? "lg:col-span-2"
            : ""
        }`}
      >
        <h3 className="mb-4 text-sm font-black text-slate-900">
          {label}
        </h3>

        <div
          className={
            multiline
              ? "grid gap-4 lg:grid-cols-2"
              : "space-y-4"
          }
        >
          <EditorTextField
            label="English"
            value={
              value.en
            }
            multiline={
              multiline
            }
            direction="ltr"
            onChange={(
              nextValue
            ) =>
              onChange({
                ...value,
                en: nextValue,
              })
            }
          />

          <EditorTextField
            label="العربية"
            value={
              value.ar
            }
            multiline={
              multiline
            }
            direction="rtl"
            onChange={(
              nextValue
            ) =>
              onChange({
                ...value,
                ar: nextValue,
              })
            }
          />
        </div>
      </div>
    );
  }

  /* -----------------------------
     ARRAY
  ----------------------------- */

  if (
    Array.isArray(value)
  ) {
    return (
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {label}
            </h3>

            <p className="mt-1 text-xs font-medium text-slate-500">
              {isArabic
                ? `${value.length} عناصر`
                : `${value.length} items`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const template =
                value.length >
                0
                  ? createEmptyLike(
                      value[0]
                    )
                  : "";

              onChange([
                ...value,
                template,
              ]);
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            {isArabic
              ? "إضافة عنصر"
              : "Add item"}
          </button>
        </div>

        {value.length ===
        0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-400">
            {isArabic
              ? "لا توجد عناصر."
              : "There are no items in this list."}
          </div>
        ) : (
          <div className="space-y-3">
            {value.map(
              (
                item,
                index
              ) => (
                <ArrayItemEditor
                  key={
                    index
                  }
                  index={
                    index
                  }
                  total={
                    value.length
                  }
                  title={getItemTitle(
                    item,
                    index,
                    isArabic
                  )}
                  subtitle={getItemSubtitle(
                    item
                  )}
                  item={
                    item
                  }
                  fieldKey={
                    fieldKey
                  }
                  isArabic={
                    isArabic
                  }
                  depth={
                    depth + 1
                  }
                  path={`${path}.${index}`}
                  onChange={(
                    nextItem
                  ) => {
                    const next =
                      [
                        ...value,
                      ];

                    next[index] =
                      nextItem;

                    onChange(
                      next
                    );
                  }}
                  onRemove={() => {
                    onChange(
                      value.filter(
                        (
                          _item,
                          itemIndex
                        ) =>
                          itemIndex !==
                          index
                      )
                    );
                  }}
                  onMoveUp={() => {
                    if (
                      index === 0
                    ) {
                      return;
                    }

                    const next =
                      [
                        ...value,
                      ];

                    [
                      next[
                        index -
                          1
                      ],
                      next[
                        index
                      ],
                    ] = [
                      next[
                        index
                      ],
                      next[
                        index -
                          1
                      ],
                    ];

                    onChange(
                      next
                    );
                  }}
                  onMoveDown={() => {
                    if (
                      index ===
                      value.length -
                        1
                    ) {
                      return;
                    }

                    const next =
                      [
                        ...value,
                      ];

                    [
                      next[
                        index
                      ],
                      next[
                        index +
                          1
                      ],
                    ] = [
                      next[
                        index +
                          1
                      ],
                      next[
                        index
                      ],
                    ];

                    onChange(
                      next
                    );
                  }}
                />
              )
            )}
          </div>
        )}
      </div>
    );
  }

  /* -----------------------------
     OBJECT
  ----------------------------- */

  if (
    isJsonObject(value)
  ) {
    const entries =
      Object.entries(value);

    if (depth === 0) {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {entries.map(
            ([
              childKey,
              childValue,
            ]) => (
              <JsonValueEditor
                key={
                  childKey
                }
                label={getFieldLabel(
                  childKey,
                  isArabic
                )}
                fieldKey={
                  childKey
                }
                value={
                  childValue
                }
                onChange={(
                  nextValue
                ) =>
                  onChange({
                    ...value,
                    [childKey]:
                      nextValue,
                  })
                }
                isArabic={
                  isArabic
                }
                depth={
                  depth + 1
                }
                path={`${path}.${childKey}`}
              />
            )
          )}
        </div>
      );
    }

    return (
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2">
        <button
          type="button"
          onClick={() =>
            setExpanded(
              (current) =>
                !current
            )
          }
          className="flex min-h-14 w-full items-center justify-between gap-4 bg-white px-4 text-start transition hover:bg-slate-50"
        >
          <span>
            <span className="block text-sm font-black text-slate-900">
              {label}
            </span>

            <span className="mt-0.5 block text-xs font-medium text-slate-500">
              {isArabic
                ? `${entries.length} حقول`
                : `${entries.length} fields`}
            </span>
          </span>

          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {expanded && (
          <div className="grid gap-4 border-t border-slate-200 bg-slate-50 p-4 lg:grid-cols-2">
            {entries.map(
              ([
                childKey,
                childValue,
              ]) => (
                <JsonValueEditor
                  key={
                    childKey
                  }
                  label={getFieldLabel(
                    childKey,
                    isArabic
                  )}
                  fieldKey={
                    childKey
                  }
                  value={
                    childValue
                  }
                  onChange={(
                    nextValue
                  ) =>
                    onChange({
                      ...value,
                      [childKey]:
                        nextValue,
                    })
                  }
                  isArabic={
                    isArabic
                  }
                  depth={
                    depth + 1
                  }
                  path={`${path}.${childKey}`}
                />
              )
            )}
          </div>
        )}
      </section>
    );
  }

  /* -----------------------------
     BOOLEAN
  ----------------------------- */

  if (
    typeof value ===
    "boolean"
  ) {
    return (
      <label
        id={fieldElementId(
          path
        )}
        className="flex min-h-24 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition"
      >
        <span>
          <span className="block text-sm font-black text-slate-900">
            {label}
          </span>

          <span className="mt-1 block text-xs font-medium text-slate-500">
            {value
              ? isArabic
                ? "مفعّل"
                : "Enabled"
              : isArabic
                ? "غير مفعّل"
                : "Disabled"}
          </span>
        </span>

        <span className="relative inline-flex h-6 w-11 shrink-0">
          <input
            type="checkbox"
            checked={
              value
            }
            onChange={(
              event
            ) =>
              onChange(
                event.target
                  .checked
              )
            }
            className="peer sr-only"
          />

          <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-blue-600" />

          <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
        </span>
      </label>
    );
  }

  /* -----------------------------
     NUMBER
  ----------------------------- */

  if (
    typeof value ===
    "number"
  ) {
    return (
      <EditorPrimitiveField
        id={fieldElementId(
          path
        )}
        label={
          label
        }
        type="number"
        value={String(
          value
        )}
        emphasized={
          fieldKey ===
          "price"
        }
        onChange={(
          nextValue
        ) =>
          onChange(
            Number(
              nextValue
            )
          )
        }
      />
    );
  }

  /* -----------------------------
     NULL
  ----------------------------- */

  if (value === null) {
    return (
      <EditorPrimitiveField
        id={fieldElementId(
          path
        )}
        label={
          label
        }
        value=""
        onChange={(
          nextValue
        ) =>
          onChange(
            nextValue
          )
        }
      />
    );
  }

  /* -----------------------------
     STRING
  ----------------------------- */

  const stringValue =
    String(value);

  const multiline =
    shouldUseTextarea(
      fieldKey,
      stringValue
    );

  const showImagePreview =
    isImageField(
      fieldKey
    ) &&
    canPreviewImage(
      stringValue
    );

  return (
    <EditorPrimitiveField
      id={fieldElementId(
        path
      )}
      label={
        label
      }
      value={
        stringValue
      }
      multiline={
        multiline
      }
      emphasized={
        fieldKey ===
          "price" ||
        fieldKey ===
          "currency"
      }
      direction={
        fieldKey
          .toLowerCase()
          .includes(
            "url"
          ) ||
        fieldKey
          .toLowerCase()
          .includes(
            "href"
          )
          ? "ltr"
          : undefined
      }
      wide={
        multiline ||
        showImagePreview
      }
      onChange={(
        nextValue
      ) =>
        onChange(
          nextValue
        )
      }
      preview={
        showImagePreview ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img
              src={
                stringValue
              }
              alt={
                label
              }
              className="h-48 w-full object-cover"
              onError={(
                event
              ) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          </div>
        ) : undefined
      }
    />
  );
}

/* =========================================================
   TEXT FIELD
========================================================= */

interface EditorTextFieldProps {
  label: string;

  value: string;

  type?:
    | "text"
    | "number";

  multiline?: boolean;

  direction?:
    | "ltr"
    | "rtl";

  onChange: (
    value: string
  ) => void;
}

function EditorTextField({
  label,
  value,
  type = "text",
  multiline = false,
  direction,
  onChange,
}: EditorTextFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-500">
        {label}
      </span>

      {multiline ? (
        <textarea
          value={
            value
          }
          rows={5}
          dir={
            direction
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        />
      ) : (
        <input
          type={
            type
          }
          value={
            value
          }
          dir={
            direction
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        />
      )}
    </label>
  );
}

/* =========================================================
   PRIMITIVE FIELD CARD
========================================================= */

interface EditorPrimitiveFieldProps {
  id?: string;

  label: string;

  value: string;

  type?:
    | "text"
    | "number";

  multiline?: boolean;

  direction?:
    | "ltr"
    | "rtl";

  wide?: boolean;

  emphasized?: boolean;

  preview?:
    React.ReactNode;

  onChange: (
    value: string
  ) => void;
}

function EditorPrimitiveField({
  id,
  label,
  value,
  type = "text",
  multiline = false,
  direction,
  wide = false,
  emphasized = false,
  preview,
  onChange,
}: EditorPrimitiveFieldProps) {
  return (
    <div
      id={id}
      className={`rounded-xl border bg-white p-4 transition ${
        wide
          ? "lg:col-span-2"
          : ""
      } ${
        emphasized
          ? "border-blue-200 bg-blue-50/30"
          : "border-slate-200"
      }`}
    >
      <EditorTextField
        label={
          label
        }
        value={
          value
        }
        type={
          type
        }
        multiline={
          multiline
        }
        direction={
          direction
        }
        onChange={
          onChange
        }
      />

      {preview}
    </div>
  );
}

/* =========================================================
   ARRAY ITEM
========================================================= */

interface ArrayItemEditorProps {
  index: number;

  total: number;

  title: string;

  subtitle?: string;

  item: JsonValue;

  fieldKey: string;

  isArabic: boolean;

  depth: number;

  path: string;

  onChange: (
    value: JsonValue
  ) => void;

  onRemove: () => void;

  onMoveUp: () => void;

  onMoveDown: () => void;
}

function ArrayItemEditor({
  index,
  total,
  title,
  subtitle,
  item,
  fieldKey,
  isArabic,
  depth,
  path,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ArrayItemEditorProps) {
  const [
    expanded,
    setExpanded,
  ] =
    useState(
      index === 0
    );

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() =>
            setExpanded(
              (current) =>
                !current
            )
          }
          className="flex min-w-0 flex-1 items-center gap-3 text-start"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-slate-900">
              {title}
            </span>

            <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span>
                {isArabic
                  ? `العنصر ${index + 1} من ${total}`
                  : `Item ${index + 1} of ${total}`}
              </span>

              {subtitle && (
                <>
                  <span>
                    •
                  </span>

                  <span className="font-black text-blue-600">
                    {
                      subtitle
                    }
                  </span>
                </>
              )}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={
              index === 0
            }
            onClick={
              onMoveUp
            }
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={
              index ===
              total - 1
            }
            onClick={
              onMoveDown
            }
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
          >
            <ArrowDown className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={
              onRemove
            }
            className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <JsonValueEditor
            label={
              title
            }
            fieldKey={
              fieldKey
            }
            value={
              item
            }
            onChange={
              onChange
            }
            isArabic={
              isArabic
            }
            depth={
              depth
            }
            path={
              path
            }
          />
        </div>
      )}
    </article>
  );
}