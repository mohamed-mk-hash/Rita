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
  ChevronUp,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Trash2,
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

const FIELD_LABELS: Record<
  string,
  { ar: string; en: string }
> = {
  meta: {
    ar: "إعدادات محركات البحث",
    en: "SEO settings",
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

  pricing: {
    ar: "الأسعار",
    en: "Pricing",
  },

  suiteBanner: {
    ar: "باقة Rita One",
    en: "Rita One banner",
  },

  benefits: {
    ar: "المميزات",
    en: "Benefits",
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

  links: {
    ar: "الروابط",
    en: "Links",
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

  primaryButton: {
    ar: "الزر الرئيسي",
    en: "Primary button",
  },

  secondaryButton: {
    ar: "الزر الثانوي",
    en: "Secondary button",
  },

  button: {
    ar: "الزر",
    en: "Button",
  },

  items: {
    ar: "العناصر",
    en: "Items",
  },

  plans: {
    ar: "الباقات",
    en: "Plans",
  },

  features: {
    ar: "المميزات",
    en: "Features",
  },

  partnerLogos: {
    ar: "شعارات الشركاء",
    en: "Partner logos",
  },

  statistics: {
    ar: "الإحصائيات",
    en: "Statistics",
  },

  columns: {
    ar: "أعمدة التذييل",
    en: "Footer columns",
  },

  price: {
    ar: "السعر",
    en: "Price",
  },

  currency: {
    ar: "العملة",
    en: "Currency",
  },

  featured: {
    ar: "الباقة الأكثر اختيارًا",
    en: "Featured plan",
  },

  visuals: { ar: "النصوص التوضيحية", en: "Visual labels" },
  companySetup: { ar: "إعداد الشركة", en: "Company setup" },
  einRequest: { ar: "طلب EIN", en: "EIN request" },
  bankingGuide: { ar: "الإرشاد البنكي", en: "Banking guide" },
  borderless: { ar: "بلا حدود", en: "Borderless" },
  businessAccess: { ar: "الوصول للأعمال الأمريكية", en: "U.S. business access" },
  introStats: { ar: "الإحصائيات الافتتاحية", en: "Intro statistics" },
  mission: { ar: "المهمة", en: "Mission" },
  vision: { ar: "الرؤية", en: "Vision" },
  story: { ar: "القصة", en: "Story" },
  expertise: { ar: "الخبرات", en: "Expertise" },
  members: { ar: "أعضاء الفريق", en: "Team members" },
  testimonials: { ar: "آراء العملاء", en: "Testimonials" },
  faq: { ar: "الأسئلة الشائعة", en: "FAQ" },
  groups: { ar: "مجموعات الأسئلة", en: "Question groups" },
  q: { ar: "السؤال", en: "Question" },
  a: { ar: "الإجابة", en: "Answer" },
  initials: { ar: "الأحرف المختصرة", en: "Initials" },
  role: { ar: "المنصب", en: "Role" },
  text: { ar: "النص", en: "Text" },
  name: { ar: "الاسم", en: "Name" },
  company: { ar: "الشركة", en: "Company" },
  subtitle: { ar: "العنوان الفرعي", en: "Subtitle" },
  eyebrow: { ar: "النص العلوي", en: "Eyebrow" },
  primary: { ar: "نص الزر الرئيسي", en: "Primary button text" },
  secondary: { ar: "نص الزر الثانوي", en: "Secondary button text" },
  value: { ar: "القيمة", en: "Value" },
  section: { ar: "مقدمة قسم التواصل", en: "Contact introduction" },
  info: { ar: "معلومات التواصل", en: "Contact information" },
  form: { ar: "نموذج التواصل", en: "Contact form" },
  cards: { ar: "بطاقات الدعم", en: "Support cards" },
  cta: { ar: "الدعوة لاتخاذ إجراء", en: "Call to action" },
  emailLabel: { ar: "تسمية البريد", en: "Email label" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  phoneLabel: { ar: "تسمية الهاتف", en: "Phone label" },
  phone: { ar: "رقم الهاتف", en: "Phone" },
  addressLabel: { ar: "تسمية العنوان", en: "Address label" },
  address: { ar: "العنوان", en: "Address" },
  hoursLabel: { ar: "تسمية ساعات العمل", en: "Hours label" },
  hours: { ar: "ساعات العمل", en: "Business hours" },
  fullName: { ar: "الاسم الكامل", en: "Full name" },
  fullNamePlaceholder: { ar: "مثال الاسم الكامل", en: "Full-name placeholder" },
  emailPlaceholder: { ar: "مثال البريد", en: "Email placeholder" },
  phonePlaceholder: { ar: "مثال الهاتف", en: "Phone placeholder" },
  subject: { ar: "الموضوع", en: "Subject" },
  subjectPlaceholder: { ar: "مثال الموضوع", en: "Subject placeholder" },
  message: { ar: "الرسالة", en: "Message" },
  messagePlaceholder: { ar: "مثال الرسالة", en: "Message placeholder" },
  loading: { ar: "نص التحميل", en: "Loading text" },
  success: { ar: "رسالة النجاح", en: "Success message" },
  error: { ar: "رسالة الخطأ", en: "Error message" },
  icon: { ar: "رمز الأيقونة", en: "Icon key" },
  nav: { ar: "شريط التنقل", en: "Navigation" },

  id: {
    ar: "المعرّف",
    en: "Identifier",
  },
};

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
    "quote",
    "copyright",
  ];

  return (
    multilineKeys.includes(key) ||
    value.length > 90
  );
}


const DEFAULT_SECTION_DESCRIPTIONS: Record<
  string,
  { ar: string; en: string }
> = {
  meta: {
    ar: "إعدادات عنوان الصفحة ووصفها لمحركات البحث والمشاركة.",
    en: "Manage the page title and description used by search engines and social sharing.",
  },
  hero: {
    ar: "تحكّم في أول قسم يراه الزائر في الصفحة الرئيسية.",
    en: "Control the first section visitors see on the home page.",
  },
  journey: {
    ar: "عدّل خطوات الرحلة والمحتوى التوضيحي المرتبط بها.",
    en: "Edit the journey steps and their supporting content.",
  },
  services: {
    ar: "أدر عناوين الخدمات وبطاقاتها وروابطها.",
    en: "Manage service headings, cards, descriptions, and links.",
  },
  pricing: {
    ar: "حدّث الباقات والأسعار والمميزات المرتبطة بها.",
    en: "Update plans, prices, and their included features.",
  },
  suiteBanner: {
    ar: "عدّل محتوى البانر التعريفي بباقة Rita One.",
    en: "Edit the promotional banner for the Rita One suite.",
  },
  benefits: {
    ar: "أدر المميزات والفوائد التي تظهر للزوار.",
    en: "Manage the benefits and value points shown to visitors.",
  },
  tools: {
    ar: "عدّل أدوات الأعمال والروابط المرتبطة بها.",
    en: "Edit business tools and their related links.",
  },
  about: {
    ar: "حدّث محتوى التعريف بالشركة والإحصائيات.",
    en: "Update company information and supporting statistics.",
  },
  finalCta: {
    ar: "عدّل الدعوة الأخيرة لاتخاذ إجراء في نهاية الصفحة.",
    en: "Edit the final call-to-action shown near the end of the page.",
  },
};

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
    ? "عدّل الحقول العربية والإنجليزية الخاصة بهذا القسم."
    : "Edit the Arabic and English fields for this section.";
}

function getItemTitle(
  item: JsonValue,
  index: number,
  isArabic: boolean
) {
  if (isJsonObject(item)) {
    const candidate =
      item.title ??
      item.label ??
      item.name ??
      item.question;

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }

    if (candidate && isLocalizedText(candidate)) {
      const localized = isArabic
        ? candidate.ar
        : candidate.en;

      if (localized.trim()) {
        return localized;
      }
    }
  }

  return isArabic
    ? `العنصر ${index + 1}`
    : `Item ${index + 1}`;
}

function isImageField(key: string) {
  const normalized = key.toLowerCase();

  return (
    normalized.includes("image") ||
    normalized.includes("logo") ||
    normalized.includes("thumbnail") ||
    normalized.includes("photo")
  );
}

function canPreviewImage(value: string) {
  const normalized = value.trim();

  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/") ||
    normalized.startsWith("data:image/")
  );
}

interface WebsitePageContentEditorProps {
  pageKey: WebsitePageKey;
  badge: { ar: string; en: string };
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  sectionDescriptions?: Record<
    string,
    { ar: string; en: string }
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
  const { isArabic } = useLanguage();

  const [page, setPage] =
    useState<AdminWebsitePage | null>(null);

  const [content, setContent] =
    useState<JsonObject>({});

  const [savedDraft, setSavedDraft] =
    useState<JsonObject>({});

  const [activeSection, setActiveSection] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const [restoring, setRestoring] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await getAdminPage(pageKey);
      const draft = stripGlobalLayoutContent(
        data.page.draftContent
      );
      const keys = Object.keys(draft);

      setPage(data.page);
      setContent(draft);
      setSavedDraft(cloneJson(draft));
      setActiveSection((current) =>
        current && keys.includes(current)
          ? current
          : keys[0] || ""
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر تحميل محتوى الصفحة."
            : "Could not load page content."
      );
    } finally {
      setLoading(false);
    }
  }, [isArabic, pageKey]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const sectionKeys = useMemo(
    () => Object.keys(content),
    [content]
  );

  useEffect(() => {
    if (
      activeSection &&
      !sectionKeys.includes(activeSection)
    ) {
      setActiveSection(sectionKeys[0] || "");
    }
  }, [activeSection, sectionKeys]);

  const isDirty = useMemo(
    () =>
      JSON.stringify(content) !==
      JSON.stringify(savedDraft),
    [content, savedDraft]
  );

  const busy =
    saving || publishing || restoring;

  function updateSection(value: JsonValue) {
    if (!activeSection) {
      return;
    }

    setContent((current) => ({
      ...current,
      [activeSection]: value,
    }));

    setSuccess("");
  }

  async function handleSave() {
    if (!page || saving || publishing) {
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

      const nextDraft = cloneJson(
        data.page.draftContent
      );

      setPage(data.page);
      setContent(nextDraft);
      setSavedDraft(cloneJson(nextDraft));

      setSuccess(
        isArabic
          ? "تم حفظ المسودة بنجاح."
          : "Draft saved successfully."
      );

      return data.page;
    } catch (requestError) {
      setError(
        requestError instanceof Error
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

  async function handlePublish() {
    if (!page || publishing || saving) {
      return;
    }

    setPublishing(true);
    setError("");
    setSuccess("");

    try {
      let currentPage = page;

      if (isDirty) {
        const saved =
          await saveAdminPageDraft(
            pageKey,
            content,
            currentPage.version
          );

        currentPage = saved.page;

        const nextDraft = cloneJson(
          saved.page.draftContent
        );

        setPage(saved.page);
        setContent(nextDraft);
        setSavedDraft(cloneJson(nextDraft));
      }

      const published =
        await publishAdminPage(
          pageKey,
          currentPage.version
        );

      const nextDraft = cloneJson(
        published.page.draftContent
      );

      setPage(published.page);
      setContent(nextDraft);
      setSavedDraft(cloneJson(nextDraft));

      setSuccess(
        isArabic
          ? "تم نشر التغييرات على الموقع."
          : "Changes published successfully."
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر نشر التغييرات."
            : "Could not publish the changes."
      );
    } finally {
      setPublishing(false);
    }
  }

  async function handleRestore() {
    if (!page || restoring || saving || publishing) {
      return;
    }

    const confirmed = window.confirm(
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

      const nextDraft = cloneJson(
        data.page.draftContent
      );

      setPage(data.page);
      setContent(nextDraft);
      setSavedDraft(cloneJson(nextDraft));

      setSuccess(
        isArabic
          ? "تم استرجاع النسخة المنشورة."
          : "Published content restored."
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر استرجاع النسخة المنشورة."
            : "Could not restore published content."
      );
    } finally {
      setRestoring(false);
    }
  }

  if (loading) {
    return (
      <div
        className="space-y-6"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div>
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-10 w-28 shrink-0 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 pb-6"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {isArabic ? badge.ar : badge.en}
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

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {isArabic ? title.ar : title.en}
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            {isArabic ? description.ar : description.en}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadPage()}
            disabled={busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            {isArabic ? "تحديث" : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={!page || busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw
              className={`h-4 w-4 ${
                restoring ? "animate-spin" : ""
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

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isArabic
                  ? "أقسام الصفحة"
                  : "Page sections"}
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {isArabic
                  ? "اختر قسمًا لتعديل محتواه."
                  : "Choose a section to edit its content."}
              </p>
            </div>

            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
              {isArabic
                ? `${sectionKeys.length} أقسام`
                : `${sectionKeys.length} sections`}
            </span>
          </div>

          <nav className="-mb-px flex gap-2 overflow-x-auto pb-4 [scrollbar-width:thin]">
            {sectionKeys.map((sectionKey) => {
              const selected =
                sectionKey === activeSection;

              return (
                <button
                  key={sectionKey}
                  type="button"
                  onClick={() =>
                    setActiveSection(sectionKey)
                  }
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                    selected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  {getFieldLabel(
                    sectionKey,
                    isArabic
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="bg-slate-50 p-4 sm:p-6">
          {activeSection &&
          content[activeSection] !== undefined ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6 border-b border-slate-200 pb-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                      {isArabic
                        ? "القسم المحدد"
                        : "Selected section"}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">
                      {getFieldLabel(
                        activeSection,
                        isArabic
                      )}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                      {getSectionDescription(
                        activeSection,
                        isArabic,
                        sectionDescriptions
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <JsonValueEditor
                label={getFieldLabel(
                  activeSection,
                  isArabic
                )}
                fieldKey={activeSection}
                value={content[activeSection]}
                onChange={updateSection}
                isArabic={isArabic}
                depth={0}
              />
            </section>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
              <p className="font-semibold text-slate-400">
                {isArabic
                  ? "لا يوجد قسم محدد."
                  : "No section selected."}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="sticky bottom-4 z-30 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_14px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">
              {isDirty
                ? isArabic
                  ? "لديك تغييرات لم يتم حفظها بعد."
                  : "You have changes that have not been saved yet."
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
              onClick={() => void handleSave()}
              disabled={
                !page || busy || !isDirty
              }
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
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
              onClick={() => void handlePublish()}
              disabled={!page || busy}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
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

interface JsonValueEditorProps {
  label: string;
  fieldKey: string;
  value: JsonValue;
  onChange: (value: JsonValue) => void;
  isArabic: boolean;
  depth: number;
}

function JsonValueEditor({
  label,
  fieldKey,
  value,
  onChange,
  isArabic,
  depth,
}: JsonValueEditorProps) {
  const [expanded, setExpanded] =
    useState(true);

  if (isLocalizedText(value)) {
    const multiline =
      shouldUseTextarea(fieldKey, value.ar) ||
      shouldUseTextarea(fieldKey, value.en);

    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white p-4 ${
          multiline ? "lg:col-span-2" : ""
        }`}
      >
        <h3 className="mb-4 text-sm font-bold text-slate-900">
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
            label={isArabic ? "الإنجليزية" : "English"}
            value={value.en}
            multiline={multiline}
            direction="ltr"
            onChange={(nextValue) =>
              onChange({
                ...value,
                en: nextValue,
              })
            }
          />

          <EditorTextField
            label={isArabic ? "العربية" : "Arabic"}
            value={value.ar}
            multiline={multiline}
            direction="rtl"
            onChange={(nextValue) =>
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

  if (Array.isArray(value)) {
    return (
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
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
                value.length > 0
                  ? createEmptyLike(value[0])
                  : "";

              onChange([...value, template]);
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {isArabic
              ? "إضافة عنصر"
              : "Add item"}
          </button>
        </div>

        {value.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm font-semibold text-slate-400">
            {isArabic
              ? "لا توجد عناصر في هذه القائمة."
              : "There are no items in this list."}
          </div>
        ) : (
          <div className="space-y-4">
            {value.map((item, index) => (
              <ArrayItemEditor
                key={index}
                index={index}
                total={value.length}
                title={getItemTitle(
                  item,
                  index,
                  isArabic
                )}
                item={item}
                fieldKey={fieldKey}
                isArabic={isArabic}
                depth={depth + 1}
                onChange={(nextItem) => {
                  const next = [...value];
                  next[index] = nextItem;
                  onChange(next);
                }}
                onRemove={() => {
                  onChange(
                    value.filter(
                      (_item, itemIndex) =>
                        itemIndex !== index
                    )
                  );
                }}
                onMoveUp={() => {
                  if (index === 0) {
                    return;
                  }

                  const next = [...value];

                  [next[index - 1], next[index]] = [
                    next[index],
                    next[index - 1],
                  ];

                  onChange(next);
                }}
                onMoveDown={() => {
                  if (index === value.length - 1) {
                    return;
                  }

                  const next = [...value];

                  [next[index], next[index + 1]] = [
                    next[index + 1],
                    next[index],
                  ];

                  onChange(next);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isJsonObject(value)) {
    const entries = Object.entries(value);

    if (depth === 0) {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {entries.map(
            ([childKey, childValue]) => (
              <JsonValueEditor
                key={childKey}
                label={getFieldLabel(
                  childKey,
                  isArabic
                )}
                fieldKey={childKey}
                value={childValue}
                onChange={(nextValue) =>
                  onChange({
                    ...value,
                    [childKey]: nextValue,
                  })
                }
                isArabic={isArabic}
                depth={depth + 1}
              />
            )
          )}
        </div>
      );
    }

    return (
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 lg:col-span-2">
        <button
          type="button"
          onClick={() =>
            setExpanded((current) => !current)
          }
          className="flex min-h-12 w-full items-center justify-between gap-4 bg-white px-4 text-start"
        >
          <span>
            <span className="block text-sm font-bold text-slate-900">
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
          <div className="grid gap-4 border-t border-slate-200 p-4 lg:grid-cols-2">
            {entries.map(
              ([childKey, childValue]) => (
                <JsonValueEditor
                  key={childKey}
                  label={getFieldLabel(
                    childKey,
                    isArabic
                  )}
                  fieldKey={childKey}
                  value={childValue}
                  onChange={(nextValue) =>
                    onChange({
                      ...value,
                      [childKey]: nextValue,
                    })
                  }
                  isArabic={isArabic}
                  depth={depth + 1}
                />
              )
            )}
          </div>
        )}
      </section>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex min-h-20 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <span>
          <span className="block text-sm font-bold text-slate-900">
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
            checked={value}
            onChange={(event) =>
              onChange(event.target.checked)
            }
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-blue-600" />
          <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
        </span>
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <EditorPrimitiveField
        label={label}
        type="number"
        value={String(value)}
        onChange={(nextValue) =>
          onChange(Number(nextValue))
        }
      />
    );
  }

  if (value === null) {
    return (
      <EditorPrimitiveField
        label={label}
        value=""
        onChange={(nextValue) =>
          onChange(nextValue)
        }
      />
    );
  }

  const stringValue = String(value);
  const multiline = shouldUseTextarea(
    fieldKey,
    stringValue
  );
  const showImagePreview =
    isImageField(fieldKey) &&
    canPreviewImage(stringValue);

  return (
    <EditorPrimitiveField
      label={label}
      value={stringValue}
      multiline={multiline}
      direction={
        fieldKey.toLowerCase().includes("url") ||
        fieldKey.toLowerCase().includes("href")
          ? "ltr"
          : undefined
      }
      wide={multiline || showImagePreview}
      onChange={(nextValue) =>
        onChange(nextValue)
      }
      preview={
        showImagePreview ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <img
              src={stringValue}
              alt={label}
              className="h-48 w-full object-cover"
              onError={(event) => {
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

interface EditorTextFieldProps {
  label: string;
  value: string;
  type?: "text" | "number";
  multiline?: boolean;
  direction?: "ltr" | "rtl";
  onChange: (value: string) => void;
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
      <span className="mb-2 block text-xs font-semibold text-slate-500">
        {label}
      </span>

      {multiline ? (
        <textarea
          value={value}
          rows={5}
          dir={direction}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      ) : (
        <input
          type={type}
          value={value}
          dir={direction}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      )}
    </label>
  );
}

interface EditorPrimitiveFieldProps {
  label: string;
  value: string;
  type?: "text" | "number";
  multiline?: boolean;
  direction?: "ltr" | "rtl";
  wide?: boolean;
  preview?: React.ReactNode;
  onChange: (value: string) => void;
}

function EditorPrimitiveField({
  label,
  value,
  type = "text",
  multiline = false,
  direction,
  wide = false,
  preview,
  onChange,
}: EditorPrimitiveFieldProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <EditorTextField
        label={label}
        value={value}
        type={type}
        multiline={multiline}
        direction={direction}
        onChange={onChange}
      />


      {preview}
    </div>
  );
}

interface ArrayItemEditorProps {
  index: number;
  total: number;
  title: string;
  item: JsonValue;
  fieldKey: string;
  isArabic: boolean;
  depth: number;
  onChange: (value: JsonValue) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ArrayItemEditor({
  index,
  total,
  title,
  item,
  fieldKey,
  isArabic,
  depth,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ArrayItemEditorProps) {
  const [expanded, setExpanded] =
    useState(index === 0);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <button
          type="button"
          onClick={() =>
            setExpanded((current) => !current)
          }
          className="flex min-w-0 items-center gap-2 text-start"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          )}

          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900">
              {title}
            </span>
            <span className="mt-0.5 block text-xs font-medium text-slate-500">
              {isArabic
                ? `العنصر ${index + 1} من ${total}`
                : `Item ${index + 1} of ${total}`}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={
              isArabic
                ? "تحريك للأعلى"
                : "Move up"
            }
          >
            <ArrowUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={
              isArabic
                ? "تحريك للأسفل"
                : "Move down"
            }
          >
            <ArrowDown className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"
            aria-label={
              isArabic ? "حذف" : "Delete"
            }
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {expanded && (
        <div className="p-4">
          <JsonValueEditor
            label={title}
            fieldKey={fieldKey}
            value={item}
            onChange={onChange}
            isArabic={isArabic}
            depth={depth}
          />
        </div>
      )}
    </article>
  );
}