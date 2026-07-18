import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Check,
  CheckCircle2,
  Download,
  FileCheck2,
  FileClock,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  downloadAdminDocument,
  getAdminDocuments,
  reviewAdminDocument,
  type AdminDocument,
  type AdminDocumentStatus,
} from "../api/adminDocumentsApi";

import { useLanguage } from "../i18n/LanguageContext";

const copy = {
  en: {
    badge: "Document review workspace",
    title: "Client Documents",
    subtitle:
      "Review uploaded files, download them securely, and return clear feedback to the client.",

    total: "Total documents",
    waiting: "Needs review",
    approved: "Approved",
    rejected: "Rejected",

    search:
      "Search client, email, file, or application ID...",
    allStatuses: "All statuses",

    uploaded: "Uploaded",
    in_review: "Under review",
    approvedStatus: "Approved",
    rejectedStatus: "Rejected",

    required: "Required",
    optional: "Optional",

    application: "Application",
    client: "Client",
    service: "Service",
    fileSize: "File size",
    uploadedAt: "Uploaded at",
    reviewedAt: "Reviewed at",

    download: "Download",
    approve: "Approve",
    reject: "Reject",
    review: "Review document",
    reviewNote: "Review note",
    approveHelp:
      "The note is optional when approving the file.",
    rejectHelp:
      "Explain clearly what the client must correct before uploading again.",
    notePlaceholder:
      "Write a clear note for the client...",
    cancel: "Cancel",
    confirm: "Confirm review",
    saving: "Saving...",

    loading: "Loading documents...",
    empty: "No documents match the current filters.",
    retry: "Try again",

    previous: "Previous",
    next: "Next",
    page: "Page",

    approvedMessage:
      "The document was approved successfully.",
    rejectedMessage:
      "The document was rejected and the client can now see your note.",

    services: {
      us_llc: "US LLC Formation",
      ein_assistance: "EIN Assistance",
      banking_payment_setup:
        "Banking & Payment Setup",
      compliance_support: "Compliance Support",
    },
  },

  ar: {
    badge: "مساحة مراجعة الوثائق",
    title: "وثائق العملاء",
    subtitle:
      "راجع الملفات المرفوعة، نزّلها بشكل آمن، وأرسل ملاحظات واضحة للعميل.",

    total: "إجمالي الوثائق",
    waiting: "تحتاج مراجعة",
    approved: "المقبولة",
    rejected: "المرفوضة",

    search:
      "ابحث بالعميل أو البريد أو الملف أو رقم الطلب...",
    allStatuses: "كل الحالات",

    uploaded: "تم الرفع",
    in_review: "قيد المراجعة",
    approvedStatus: "مقبولة",
    rejectedStatus: "مرفوضة",

    required: "إلزامية",
    optional: "اختيارية",

    application: "الطلب",
    client: "العميل",
    service: "الخدمة",
    fileSize: "حجم الملف",
    uploadedAt: "تاريخ الرفع",
    reviewedAt: "تاريخ المراجعة",

    download: "تنزيل",
    approve: "قبول",
    reject: "رفض",
    review: "مراجعة الوثيقة",
    reviewNote: "ملاحظة المراجعة",
    approveHelp:
      "الملاحظة اختيارية عند قبول الملف.",
    rejectHelp:
      "اشرح بوضوح ما الذي يجب على العميل تصحيحه قبل إعادة الرفع.",
    notePlaceholder:
      "اكتب ملاحظة واضحة للعميل...",
    cancel: "إلغاء",
    confirm: "تأكيد المراجعة",
    saving: "جاري الحفظ...",

    loading: "جاري تحميل الوثائق...",
    empty:
      "لا توجد وثائق مطابقة للفلاتر الحالية.",
    retry: "إعادة المحاولة",

    previous: "السابق",
    next: "التالي",
    page: "الصفحة",

    approvedMessage:
      "تم قبول الوثيقة بنجاح.",
    rejectedMessage:
      "تم رفض الوثيقة ويمكن للعميل الآن رؤية ملاحظتك.",

    services: {
      us_llc: "تأسيس LLC أمريكية",
      ein_assistance: "مساعدة EIN",
      banking_payment_setup:
        "الحسابات والمدفوعات",
      compliance_support: "دعم الامتثال",
    },
  },
} as const;

function formatDate(
  value: string | null,
  isArabic: boolean
) {
  if (!value) {
    return "—";
  }

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

function formatFileSize(value: number) {
  if (!value) {
    return "—";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(
    value /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function statusClasses(
  status: AdminDocumentStatus
) {
  const classes: Record<
    AdminDocumentStatus,
    string
  > = {
    uploaded:
      "bg-blue-100 text-blue-700",
    in_review:
      "bg-amber-100 text-amber-800",
    approved:
      "bg-emerald-100 text-emerald-700",
    rejected:
      "bg-rose-100 text-rose-700",
  };

  return classes[status];
}

export function Documents() {
  const { isArabic } = useLanguage();
  const t = isArabic ? copy.ar : copy.en;

  const [documents, setDocuments] =
    useState<AdminDocument[]>([]);

  const [stats, setStats] = useState({
    total: 0,
    uploaded: 0,
    inReview: 0,
    approved: 0,
    rejected: 0,
  });

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1,
    });

  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState("in_review");
  const [page, setPage] = useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] =
    useState("");

  const [downloadingId, setDownloadingId] =
    useState<number | null>(null);

  const [selectedDocument, setSelectedDocument] =
    useState<AdminDocument | null>(null);

  const [reviewAction, setReviewAction] =
    useState<"approved" | "rejected">(
      "approved"
    );

  const [reviewNote, setReviewNote] =
    useState("");

  const [savingReview, setSavingReview] =
    useState(false);

  const waitingCount = useMemo(
    () => stats.uploaded + stats.inReview,
    [stats.uploaded, stats.inReview]
  );

  async function loadDocuments() {
    setLoading(true);
    setError("");

    try {
      const response =
        await getAdminDocuments({
          search,
          status,
          page,
          limit: 12,
        });

      setDocuments(response.documents);
      setStats(response.stats);
      setPagination(response.pagination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load documents"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        void loadDocuments();
      },
      250
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search, status, page]);

  function openReview(
    document: AdminDocument,
    action: "approved" | "rejected"
  ) {
    setSelectedDocument(document);
    setReviewAction(action);

    setReviewNote(
      action === "rejected"
        ? document.reviewNote || ""
        : ""
    );

    setError("");
    setMessage("");
  }

  function closeReview() {
    if (savingReview) {
      return;
    }

    setSelectedDocument(null);
    setReviewNote("");
  }

  async function handleReview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedDocument) {
      return;
    }

    if (
      reviewAction === "rejected" &&
      !reviewNote.trim()
    ) {
      setError(t.rejectHelp);
      return;
    }

    setSavingReview(true);
    setError("");
    setMessage("");

    try {
      await reviewAdminDocument(
        selectedDocument.id,
        reviewAction,
        reviewNote
      );

      setMessage(
        reviewAction === "approved"
          ? t.approvedMessage
          : t.rejectedMessage
      );

      setSelectedDocument(null);
      setReviewNote("");

      await loadDocuments();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save the review"
      );
    } finally {
      setSavingReview(false);
    }
  }

  async function handleDownload(
    document: AdminDocument
  ) {
    setDownloadingId(document.id);
    setError("");

    try {
      await downloadAdminDocument(
        document.id,
        document.originalName
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not download the document"
      );
    } finally {
      setDownloadingId(null);
    }
  }

  const statCards = [
    {
      label: t.total,
      value: stats.total,
      icon: FileText,
      classes:
        "bg-blue-50 text-blue-600",
    },
    {
      label: t.waiting,
      value: waitingCount,
      icon: FileClock,
      classes:
        "bg-amber-50 text-amber-600",
    },
    {
      label: t.approved,
      value: stats.approved,
      icon: CheckCircle2,
      classes:
        "bg-emerald-50 text-emerald-600",
    },
    {
      label: t.rejected,
      value: stats.rejected,
      icon: XCircle,
      classes:
        "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-600">
          <ShieldCheck className="h-4 w-4" />
          {t.badge}
        </span>

        <h1 className="mt-4 text-3xl font-black text-[#061629] md:text-4xl">
          {t.title}
        </h1>

        <p className="mt-2 max-w-3xl font-semibold leading-7 text-slate-500">
          {t.subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold text-slate-500">
                    {card.label}
                  </p>

                  <strong className="mt-3 block text-3xl font-black text-[#0e3149]">
                    {card.value}
                  </strong>
                </div>

                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${card.classes}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)]">
        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-500 focus-within:bg-white">
            <Search className="h-5 w-5 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t.search}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#0e3149] outline-none"
            />
          </label>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[#0e3149] outline-none focus:border-blue-500"
          >
            <option value="">
              {t.allStatuses}
            </option>

            <option value="uploaded">
              {t.uploaded}
            </option>

            <option value="in_review">
              {t.in_review}
            </option>

            <option value="approved">
              {t.approvedStatus}
            </option>

            <option value="rejected">
              {t.rejectedStatus}
            </option>
          </select>

          <button
            type="button"
            onClick={() =>
              void loadDocuments()
            }
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#173e56] px-4 text-sm font-black text-white transition hover:bg-[#0e3149]"
          >
            <RefreshCw className="h-4 w-4" />
            {t.retry}
          </button>
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

      {loading ? (
        <section className="grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#df3341]" />

            <p className="mt-4 font-bold text-slate-500">
              {t.loading}
            </p>
          </div>
        </section>
      ) : documents.length === 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-[0_18px_45px_rgba(18,48,72,0.07)]">
          <FileCheck2 className="mx-auto h-14 w-14 text-slate-300" />

          <p className="mt-4 font-bold text-slate-500">
            {t.empty}
          </p>
        </section>
      ) : (
       <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(18,48,72,0.07)]">
  {/* Table header - يظهر فقط في الشاشات الكبيرة */}
  <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_minmax(150px,1fr)_130px_150px_250px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-400 lg:grid">
    <span>
      {isArabic ? "الوثيقة" : "Document"}
    </span>

    <span>
      {t.client}
    </span>

    <span>
      {t.service}
    </span>

    <span>
      {isArabic ? "الحالة" : "Status"}
    </span>

    <span>
      {t.uploadedAt}
    </span>

    <span>
      {isArabic ? "الإجراءات" : "Actions"}
    </span>
  </div>

  <div>
    {documents.map((item) => (
      <article
        key={item.id}
        className="border-b border-slate-200 px-5 py-5 transition-colors last:border-b-0 hover:bg-slate-50/70"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_minmax(150px,1fr)_130px_150px_320px] lg:items-center">
          {/* Document */}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 lg:hidden">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${statusClasses(
                  item.status
                )}`}
              >
                {item.status === "approved"
                  ? t.approvedStatus
                  : item.status === "rejected"
                    ? t.rejectedStatus
                    : item.status === "uploaded"
                      ? t.uploaded
                      : t.in_review}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {item.isRequired
                  ? t.required
                  : t.optional}
              </span>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                #{item.applicationId}
              </span>
            </div>

            <h2 className="truncate text-sm font-black text-[#0e3149]">
              {isArabic
                ? item.titleAr
                : item.titleEn}
            </h2>

            <p
              className="mt-1 truncate text-xs font-semibold text-slate-500"
              dir="auto"
              title={item.originalName}
            >
              {item.originalName}
            </p>

            <span className="mt-2 block text-xs font-bold text-slate-400">
              {formatFileSize(item.fileSize)}
            </span>
          </div>

          {/* Client */}
          <div>
            <span className="mb-1 block text-xs font-black text-slate-400 lg:hidden">
              {t.client}
            </span>

            <strong
              className="block text-sm font-black text-[#0e3149]"
              dir="auto"
            >
              {item.client.fullName}
            </strong>

            <span
              className="mt-1 block truncate text-xs text-slate-500"
              dir="ltr"
            >
              {item.client.email}
            </span>

            <span className="mt-1 block text-xs font-black text-blue-600">
              #{item.applicationId}
            </span>
          </div>

          {/* Service */}
          <div>
            <span className="mb-1 block text-xs font-black text-slate-400 lg:hidden">
              {t.service}
            </span>

            <strong className="text-sm font-bold text-[#0e3149]">
              {t.services[item.serviceType]}
            </strong>
          </div>

          {/* Status */}
          <div>
            <span className="mb-1 block text-xs font-black text-slate-400 lg:hidden">
              {isArabic ? "الحالة" : "Status"}
            </span>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${statusClasses(
                  item.status
                )}`}
              >
                {item.status === "approved"
                  ? t.approvedStatus
                  : item.status === "rejected"
                    ? t.rejectedStatus
                    : item.status === "uploaded"
                      ? t.uploaded
                      : t.in_review}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 lg:hidden">
                {item.isRequired
                  ? t.required
                  : t.optional}
              </span>
            </div>
          </div>

          {/* Upload date */}
          <div>
            <span className="mb-1 block text-xs font-black text-slate-400 lg:hidden">
              {t.uploadedAt}
            </span>

            <span className="text-sm font-bold text-slate-600">
              {formatDate(
                item.uploadedAt,
                isArabic
              )}
            </span>
          </div>

          {/* Actions */}
       <div className="grid grid-cols-3 gap-2">
  <button
    type="button"
    disabled={downloadingId === item.id}
    onClick={() => void handleDownload(item)}
    className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2 text-xs font-black text-[#173e56] transition hover:bg-slate-100 disabled:opacity-50"
  >
    <Download className="h-4 w-4 shrink-0" />
    <span>{t.download}</span>
  </button>

  <button
    type="button"
    onClick={() =>
      openReview(item, "approved")
    }
    className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-2 text-xs font-black text-white transition hover:bg-emerald-700"
  >
    <Check className="h-4 w-4 shrink-0" />
    <span>{t.approve}</span>
  </button>

  <button
    type="button"
    onClick={() =>
      openReview(item, "rejected")
    }
    className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#df3341] px-2 text-xs font-black text-white transition hover:bg-[#c92b38]"
  >
    <X className="h-4 w-4 shrink-0" />
    <span>{t.reject}</span>
  </button>
</div>
        </div>

        {/* Review note */}
        {item.reviewNote && (
          <div className="mt-4 rounded-xl border-s-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-semibold leading-7 text-amber-800">
            <strong className="me-2">
              {t.reviewNote}:
            </strong>

            {item.reviewNote}
          </div>
        )}
      </article>
    ))}
  </div>
</section>
      )}

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <span className="text-sm font-bold text-slate-500">
          {t.page} {pagination.page} /{" "}
          {pagination.totalPages}
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage(
                (current) => current - 1
              )
            }
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#173e56] disabled:opacity-40"
          >
            {t.previous}
          </button>

          <button
            type="button"
            disabled={
              page >=
              pagination.totalPages
            }
            onClick={() =>
              setPage(
                (current) => current + 1
              )
            }
            className="min-h-10 rounded-xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-40"
          >
            {t.next}
          </button>
        </div>
      </div>

      {selectedDocument && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleReview}
            className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    reviewAction === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {reviewAction === "approved"
                    ? t.approve
                    : t.reject}
                </span>

                <h2 className="mt-4 text-xl font-black text-[#0e3149]">
                  {t.review}
                </h2>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {isArabic
                    ? selectedDocument.titleAr
                    : selectedDocument.titleEn}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReview}
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className={`mt-5 rounded-2xl p-4 text-sm font-semibold leading-7 ${
                reviewAction === "approved"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800"
              }`}
            >
              {reviewAction === "approved"
                ? t.approveHelp
                : t.rejectHelp}
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-[#0e3149]">
                {t.reviewNote}
              </span>

              <textarea
                value={reviewNote}
                onChange={(event) =>
                  setReviewNote(
                    event.target.value
                  )
                }
                placeholder={
                  t.notePlaceholder
                }
                rows={5}
                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeReview}
                className="min-h-12 rounded-2xl border border-slate-200 px-5 text-sm font-black text-[#173e56]"
              >
                {t.cancel}
              </button>

              <button
                type="submit"
                disabled={savingReview}
                className={`min-h-12 rounded-2xl px-5 text-sm font-black text-white disabled:opacity-60 ${
                  reviewAction === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#df3341] hover:bg-[#c92b38]"
                }`}
              >
                {savingReview
                  ? t.saving
                  : t.confirm}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="text-xs font-black text-slate-400">
        {label}
      </span>

      <strong
        className="mt-1 block break-words text-sm text-[#0e3149]"
        dir="auto"
      >
        {value}
      </strong>
    </div>
  );
}
