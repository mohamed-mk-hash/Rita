import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings2,
  UserRound,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getAdminApplication,
  updateAdminApplication,
  type AdminApplication,
  type AdminApplicationStatus,
  type ApplicationDocumentStatus,
} from "../api/adminApplicationsApi";

import { useLanguage } from "../i18n/LanguageContext";

const applicationStatuses: AdminApplicationStatus[] = [
  "submitted",
  "in_review",
  "waiting_documents",
  "processing",
  "completed",
  "rejected",
];

const workflowSteps = [
  { value: "intake_submitted", en: "Request submitted", ar: "تم إرسال الطلب" },
  { value: "document_review", en: "Reviewing documents", ar: "مراجعة الوثائق" },
  { value: "waiting_required_documents", en: "Waiting for required documents", ar: "بانتظار الوثائق المطلوبة" },
  { value: "document_corrections_required", en: "Document corrections required", ar: "مطلوب تصحيح الوثائق" },
  { value: "documents_approved", en: "Documents approved", ar: "تم قبول الوثائق" },
  { value: "preparing_filing", en: "Preparing the filing", ar: "تجهيز ملف التأسيس" },
  { value: "filing_submitted", en: "Filing submitted", ar: "تم إرسال ملف التأسيس" },
  { value: "ein_processing", en: "EIN processing", ar: "معالجة EIN" },
  { value: "banking_setup", en: "Banking setup", ar: "إعداد الحسابات البنكية" },
  { value: "compliance_review", en: "Compliance review", ar: "مراجعة الامتثال" },
  { value: "completed", en: "Service completed", ar: "اكتملت الخدمة" },
];

function formatDate(value: string | null, isArabic: boolean) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(
    isArabic ? "ar-DZ" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
}

function formatFileSize(value: number | null) {
  if (!value) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function serviceLabel(
  serviceType: AdminApplication["serviceType"],
  isArabic: boolean
) {
  const labels = {
    us_llc: { en: "US LLC Formation", ar: "تأسيس LLC أمريكية" },
    ein_assistance: { en: "EIN Assistance", ar: "مساعدة EIN" },
    banking_payment_setup: { en: "Banking & Payment Setup", ar: "الحسابات والمدفوعات" },
    compliance_support: { en: "Compliance Support", ar: "دعم الامتثال" },
  };

  return isArabic ? labels[serviceType].ar : labels[serviceType].en;
}

function applicationStatusLabel(
  status: AdminApplicationStatus,
  isArabic: boolean
) {
  const labels: Record<AdminApplicationStatus, { en: string; ar: string }> = {
    draft: { en: "Draft", ar: "مسودة" },
    submitted: { en: "Submitted", ar: "تم الإرسال" },
    in_review: { en: "In review", ar: "قيد المراجعة" },
    waiting_documents: { en: "Waiting for documents", ar: "بانتظار الوثائق" },
    processing: { en: "Processing", ar: "قيد المعالجة" },
    completed: { en: "Completed", ar: "مكتمل" },
    rejected: { en: "Rejected", ar: "مرفوض" },
  };

  return isArabic ? labels[status].ar : labels[status].en;
}

function documentStatusLabel(
  status: ApplicationDocumentStatus,
  isArabic: boolean
) {
  const labels: Record<ApplicationDocumentStatus, { en: string; ar: string }> = {
    missing: { en: "Missing", ar: "غير مرفوعة" },
    uploaded: { en: "Uploaded", ar: "تم الرفع" },
    in_review: { en: "Under review", ar: "قيد المراجعة" },
    approved: { en: "Approved", ar: "مقبولة" },
    rejected: { en: "Rejected", ar: "مرفوضة" },
  };

  return isArabic ? labels[status].ar : labels[status].en;
}

function statusClasses(status: string) {
  const classes: Record<string, string> = {
    missing: "bg-slate-100 text-slate-600",
    draft: "bg-slate-100 text-slate-700",
    uploaded: "bg-blue-100 text-blue-700",
    submitted: "bg-indigo-100 text-indigo-700",
    in_review: "bg-amber-100 text-amber-800",
    waiting_documents: "bg-orange-100 text-orange-700",
    processing: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };

  return classes[status] || "bg-slate-100 text-slate-700";
}

export function ApplicationDetails() {
  const { id } = useParams();
  const applicationId = Number(id);
  const { isArabic } = useLanguage();

  const [application, setApplication] = useState<AdminApplication | null>(null);
  const [status, setStatus] = useState<AdminApplicationStatus>("submitted");
  const [progress, setProgress] = useState(10);
  const [currentStep, setCurrentStep] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadApplication() {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      setError(isArabic ? "رقم الطلب غير صحيح." : "Invalid application ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getAdminApplication(applicationId);
      const loaded = response.application;

      setApplication(loaded);
      setStatus(loaded.status);
      setProgress(loaded.progress);
      setCurrentStep(loaded.currentStep || "");
      setNotes(loaded.notes || "");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر تحميل تفاصيل الطلب."
            : "Could not load application details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplication();
  }, [applicationId]);

  const selectedNeeds = useMemo(() => {
    if (!application?.intake) return [];

    const needs = [
      ["EIN", application.intake.needsEin],
      ["Stripe", application.intake.needsStripe],
      ["PayPal", application.intake.needsPaypal],
      ["Wise", application.intake.needsWise],
      ["Mercury", application.intake.needsMercury],
      ["Relay", application.intake.needsRelay],
      ["Payoneer", application.intake.needsPayoneer],
      ["Shopify Payments", application.intake.needsShopify],
    ] as const;

    return needs
      .filter(([, selected]) => selected)
      .map(([label]) => label);
  }, [application]);

  const rejectedDocuments =
    application?.documents?.filter((document) => document.status === "rejected").length || 0;

  const missingDocuments =
    application?.documents?.filter(
      (document) => document.isRequired && document.status === "missing"
    ).length || 0;

  async function handleSave() {
    if (!application) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateAdminApplication(application.id, {
        status,
        progress,
        currentStep,
        notes,
      });

      setMessage(
        isArabic
          ? "تم حفظ تحديثات الطلب."
          : "Application changes were saved."
      );

      await loadApplication();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر حفظ التحديثات."
            : "Could not save the changes."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[65vh] place-items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#df3341]" />
      </div>
    );
  }

  if (!application) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-bold text-rose-600">
          {error || (isArabic ? "الطلب غير موجود." : "Application not found.")}
        </p>

        <Link
          to="/applications"
          className="mt-5 inline-flex rounded-xl bg-[#173e56] px-4 py-3 text-sm font-black text-white"
        >
          {isArabic ? "العودة إلى الطلبات" : "Back to applications"}
        </Link>
      </section>
    );
  }

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)] md:p-6">
        <Link
          to="/applications"
          className="inline-flex items-center gap-2 text-sm font-black text-blue-600"
        >
          <BackIcon className="h-4 w-4" />
          {isArabic ? "العودة إلى الطلبات" : "Back to applications"}
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                #{application.id}
              </span>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-black ${statusClasses(
                  application.status
                )}`}
              >
                {applicationStatusLabel(application.status, isArabic)}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-black text-[#061629] md:text-3xl">
              {serviceLabel(application.serviceType, isArabic)}
            </h1>

            <p className="mt-2 font-semibold text-slate-500">
              {application.client.fullName}
              {" · "}
              {formatDate(application.createdAt, isArabic)}
            </p>
          </div>

          <div className="w-full max-w-lg rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-black text-[#0e3149]">
                {isArabic ? "تقدم الطلب" : "Application progress"}
              </span>

              <strong className="text-xl font-black text-blue-600">
                {application.progress}%
              </strong>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${application.progress}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-500">
              <span>
                {isArabic ? "مطلوبة" : "Required"}:{" "}
                {application.documentProgress.required}
              </span>
              <span>
                {isArabic ? "مرفوعة" : "Uploaded"}:{" "}
                {application.documentProgress.uploaded}
              </span>
              <span>
                {isArabic ? "مقبولة" : "Approved"}:{" "}
                {application.documentProgress.approved}
              </span>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}

      {(rejectedDocuments > 0 || missingDocuments > 0) && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <strong className="text-sm font-black">
              {isArabic
                ? "هذا الطلب يحتاج إلى متابعة"
                : "This application needs attention"}
            </strong>

            <p className="mt-1 text-sm font-semibold leading-6">
              {rejectedDocuments > 0 &&
                (isArabic
                  ? `${rejectedDocuments} وثيقة مرفوضة. `
                  : `${rejectedDocuments} rejected document(s). `)}

              {missingDocuments > 0 &&
                (isArabic
                  ? `${missingDocuments} وثيقة مطلوبة لم تُرفع بعد.`
                  : `${missingDocuments} required document(s) are still missing.`)}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)] md:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#0e3149]">
                  {isArabic
                    ? "ملخص العميل والطلب"
                    : "Client and request summary"}
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {isArabic
                    ? "المعلومات الأساسية اللازمة لمعالجة الملف."
                    : "The essential information needed to process this file."}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <SummaryItem
                icon={UserRound}
                label={isArabic ? "العميل" : "Client"}
                value={application.client.fullName}
              />

              <SummaryItem
                icon={Mail}
                label={isArabic ? "البريد الإلكتروني" : "Email"}
                value={application.client.email}
                ltr
              />

              <SummaryItem
                icon={Phone}
                label={isArabic ? "الهاتف / واتساب" : "Phone / WhatsApp"}
                value={application.intake?.phone || "—"}
                ltr
              />

              <SummaryItem
                icon={MapPin}
                label={isArabic ? "الدولة" : "Country"}
                value={application.intake?.country || "—"}
              />

              <SummaryItem
                icon={Building2}
                label={isArabic ? "اسم الشركة المقترح" : "Desired company name"}
                value={application.intake?.desiredCompanyName || "—"}
              />

              <SummaryItem
                icon={CheckCircle2}
                label={isArabic ? "الخدمات الإضافية" : "Requested solutions"}
                value={
                  selectedNeeds.join(", ") ||
                  (isArabic
                    ? "لا توجد خدمات إضافية"
                    : "No additional solutions")
                }
              />
            </div>

            <details className="group mt-4 rounded-2xl border border-slate-200 bg-slate-50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-black text-[#0e3149]">
                <span>
                  {isArabic
                    ? "عرض تفاصيل النشاط وملاحظات العميل"
                    : "View business details and client notes"}
                </span>

                <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
              </summary>

              <div className="grid gap-3 border-t border-slate-200 p-4">
                <TextBlock
                  label={isArabic ? "نشاط العمل" : "Business activity"}
                  value={application.intake?.businessActivity || "—"}
                />

                <TextBlock
                  label={isArabic ? "ملاحظات العميل" : "Client notes"}
                  value={application.intake?.extraNotes || "—"}
                />
              </div>
            </details>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)] md:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-black text-[#0e3149]">
                    {isArabic ? "وثائق الطلب" : "Application documents"}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {isArabic
                      ? "ملخص سريع لحالة كل وثيقة."
                      : "A quick summary of every required document."}
                  </p>
                </div>
              </div>

              <Link
                to="/documents"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#173e56] px-4 text-sm font-black text-white transition hover:bg-[#0e3149]"
              >
                <FileCheck2 className="h-4 w-4" />
                {isArabic ? "مراجعة الوثائق" : "Review documents"}
              </Link>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {(application.documents || []).map((document) => (
                <article
                  key={document.requirementId}
                  className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_150px_170px] md:items-center"
                >
                  <div className="min-w-0">
                    <strong className="block text-sm font-black text-[#0e3149]">
                      {isArabic ? document.titleAr : document.titleEn}
                    </strong>

                    <span
                      className="mt-1 block truncate text-xs font-semibold text-slate-500"
                      title={document.originalName || ""}
                    >
                      {document.originalName ||
                        (isArabic
                          ? "لم يتم رفع ملف"
                          : "No file uploaded")}
                    </span>

                    {document.reviewNote && (
                      <p className="mt-2 text-xs font-bold leading-5 text-rose-600">
                        {document.reviewNote}
                      </p>
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClasses(
                        document.status
                      )}`}
                    >
                      {documentStatusLabel(document.status, isArabic)}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-500 md:text-end">
                    <span className="block">
                      {formatFileSize(document.fileSize)}
                    </span>

                    <span className="mt-1 block text-xs">
                      {formatDate(document.uploadedAt, isArabic)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.09)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-[#df3341]">
                <Settings2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#0e3149]">
                  {isArabic ? "إدارة مسار الطلب" : "Manage workflow"}
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {isArabic
                    ? "حدّث المرحلة والحالة ثم احفظ."
                    : "Update the phase and status, then save."}
                </p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-[#0e3149]">
                {isArabic ? "حالة الطلب" : "Application status"}
              </span>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as AdminApplicationStatus
                  )
                }
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none focus:border-blue-500"
              >
                {applicationStatuses.map((item) => (
                  <option key={item} value={item}>
                    {applicationStatusLabel(item, isArabic)}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-black text-[#0e3149]">
                {isArabic ? "المرحلة الحالية" : "Current phase"}
              </span>

              <select
                value={currentStep}
                onChange={(event) =>
                  setCurrentStep(event.target.value)
                }
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none focus:border-blue-500"
              >
                <option value="">
                  {isArabic ? "اختر المرحلة" : "Choose a phase"}
                </option>

                {workflowSteps.map((step) => (
                  <option key={step.value} value={step.value}>
                    {isArabic ? step.ar : step.en}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-black text-[#0e3149]">
                {isArabic ? "ملاحظات الإدارة" : "Internal notes"}
              </span>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={5}
                placeholder={
                  isArabic
                    ? "اكتب ملاحظة داخلية مختصرة..."
                    : "Write a short internal note..."
                }
                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <details className="group mt-4 rounded-2xl border border-slate-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-slate-600">
                <span>
                  {isArabic ? "إعدادات متقدمة" : "Advanced settings"}
                </span>

                <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
              </summary>

              <div className="border-t border-slate-200 p-4">
                <label>
                  <span className="flex items-center justify-between text-xs font-black text-slate-500">
                    <span>
                      {isArabic ? "تعديل التقدم يدوياً" : "Manual progress"}
                    </span>
                    <span>{progress}%</span>
                  </span>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(event) =>
                      setProgress(Number(event.target.value))
                    }
                    className="mt-4 w-full accent-blue-600"
                  />
                </label>

                <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">
                  {isArabic
                    ? "استخدم هذا الخيار فقط عندما تكون هناك مرحلة عمل لا تعتمد على الوثائق."
                    : "Use this only for work stages that are not calculated from documents."}
                </p>
              </div>
            </details>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#df3341] px-5 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition hover:bg-[#c92b38] disabled:opacity-60"
            >
              <Save className="h-5 w-5" />

              {saving
                ? isArabic
                  ? "جاري الحفظ..."
                  : "Saving..."
                : isArabic
                  ? "حفظ التحديث"
                  : "Save update"}
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                {isArabic
                  ? "سيظهر تغيير الحالة والتقدم في لوحة العميل بعد الحفظ."
                  : "The updated status and progress will appear in the client dashboard after saving."}
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  ltr = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-600">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <span className="block text-xs font-black text-slate-400">
          {label}
        </span>

        <strong
          className="mt-1 block break-words text-sm font-bold leading-6 text-[#0e3149]"
          dir={ltr ? "ltr" : "auto"}
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

function TextBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <span className="text-xs font-black text-slate-400">
        {label}
      </span>

      <p
        className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-7 text-[#0e3149]"
        dir="auto"
      >
        {value}
      </p>
    </div>
  );
}