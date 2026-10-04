import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Inbox,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase";
import { useLanguage } from "../i18n/LanguageContext";

/* =========================================================
   TYPES
========================================================= */

type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "waiting_documents"
  | "processing"
  | "completed"
  | "rejected";

interface DashboardApplication {
  id: number;
  userId: string;
  serviceType: string;
  status: ApplicationStatus;
  progress: number;
  createdAt: string;

  client: {
    fullName: string;
    companyName: string | null;
    email: string;
  };
}

interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  completedApplications: number;

  totalClients: number;

  documentsWaiting: number;
  approvedDocuments: number;

  newMessages: number;
}

interface StatusChartItem {
  key: ApplicationStatus;
  name: string;
  value: number;
}

/* =========================================================
   HELPERS
========================================================= */

function toIsoString(
  value: unknown
): string {
  if (!value) {
    return "";
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

  return "";
}

function formatDate(
  value: string,
  isArabic: boolean
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    isArabic
      ? "ar-DZ"
      : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(date);
}

function getServiceLabel(
  serviceType: string,
  isArabic: boolean
) {
  const labels: Record<
    string,
    {
      en: string;
      ar: string;
    }
  > = {
    us_llc: {
      en: "US LLC Formation",
      ar: "تأسيس شركة LLC",
    },

    ein_assistance: {
      en: "EIN Assistance",
      ar: "مساعدة EIN",
    },

    banking_payment_setup: {
      en: "Banking & Payments",
      ar: "البنوك والمدفوعات",
    },

    compliance_support: {
      en: "Compliance Support",
      ar: "دعم الامتثال",
    },
  };

  const item =
    labels[serviceType];

  if (!item) {
    return serviceType;
  }

  return isArabic
    ? item.ar
    : item.en;
}

function getStatusLabel(
  status: ApplicationStatus,
  isArabic: boolean
) {
  const labels: Record<
    ApplicationStatus,
    {
      en: string;
      ar: string;
    }
  > = {
    draft: {
      en: "Draft",
      ar: "مسودة",
    },

    submitted: {
      en: "Submitted",
      ar: "تم الإرسال",
    },

    in_review: {
      en: "In review",
      ar: "قيد المراجعة",
    },

    waiting_documents: {
      en: "Waiting for documents",
      ar: "بانتظار الوثائق",
    },

    processing: {
      en: "Processing",
      ar: "قيد المعالجة",
    },

    completed: {
      en: "Completed",
      ar: "مكتمل",
    },

    rejected: {
      en: "Rejected",
      ar: "مرفوض",
    },
  };

  return isArabic
    ? labels[status].ar
    : labels[status].en;
}

function getStatusClasses(
  status: ApplicationStatus
) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";

    case "processing":
    case "in_review":
      return "bg-blue-50 text-blue-700";

    case "waiting_documents":
      return "bg-amber-50 text-amber-700";

    case "rejected":
      return "bg-rose-50 text-rose-700";

    case "submitted":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {title}
          </p>

          <strong className="mt-3 block text-3xl font-black tracking-tight text-[#07182a]">
            {value}
          </strong>

          <p className="mt-2 text-xs font-semibold text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

export const Overview: React.FC = () => {
  const {
    isArabic,
  } = useLanguage();

  const [
    applications,
    setApplications,
  ] = useState<
    DashboardApplication[]
  >([]);

  const [stats, setStats] =
    useState<DashboardStats>({
      totalApplications: 0,
      activeApplications: 0,
      completedApplications: 0,
      totalClients: 0,
      documentsWaiting: 0,
      approvedDocuments: 0,
      newMessages: 0,
    });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD REAL FIRESTORE DATA
  ======================================================= */

  const loadDashboard =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          applicationsSnapshot,
          usersSnapshot,
          documentsSnapshot,
          messagesSnapshot,
        ] = await Promise.all([
          getDocs(
            collection(
              db,
              "applications"
            )
          ),

          getDocs(
            collection(
              db,
              "users"
            )
          ),

          getDocs(
            collection(
              db,
              "application_documents"
            )
          ),

          getDocs(
            collection(
              db,
              "contact_messages"
            )
          ),
        ]);

        /* -------------------------
           USERS MAP
        ------------------------- */

        const usersMap =
          new Map<
            string,
            Record<
              string,
              unknown
            >
          >();

        usersSnapshot.docs.forEach(
          (snapshot) => {
            usersMap.set(
              snapshot.id,
              snapshot.data()
            );
          }
        );

        /* -------------------------
           APPLICATIONS
        ------------------------- */

        const mappedApplications:
          DashboardApplication[] =
          applicationsSnapshot.docs.map(
            (snapshot) => {
              const data =
                snapshot.data();

              const userId =
                String(
                  data.user_id ||
                    ""
                );

              const user =
                usersMap.get(
                  userId
                );

              return {
                id:
                  Number(
                    data.id ||
                      snapshot.id
                  ),

                userId,

                serviceType:
                  String(
                    data.service_type ||
                      ""
                  ),

                status:
                  (
                    data.status ||
                    "draft"
                  ) as ApplicationStatus,

                progress:
                  Number(
                    data.progress ||
                      0
                  ),

                createdAt:
                  toIsoString(
                    data.created_at
                  ),

                client: {
                  fullName:
                    String(
                      user?.full_name ||
                        ""
                    ),

                  companyName:
                    user?.company_name
                      ? String(
                          user.company_name
                        )
                      : null,

                  email:
                    String(
                      user?.email ||
                        ""
                    ),
                },
              };
            }
          );

        mappedApplications.sort(
          (a, b) =>
            new Date(
              b.createdAt ||
                0
            ).getTime() -
            new Date(
              a.createdAt ||
                0
            ).getTime()
        );

        /* -------------------------
           APPLICATION COUNTS
        ------------------------- */

        const activeStatuses:
          ApplicationStatus[] = [
          "submitted",
          "in_review",
          "waiting_documents",
          "processing",
        ];

        const activeApplications =
          mappedApplications.filter(
            (application) =>
              activeStatuses.includes(
                application.status
              )
          ).length;

        const completedApplications =
          mappedApplications.filter(
            (application) =>
              application.status ===
              "completed"
          ).length;

        /* -------------------------
           CLIENTS
        ------------------------- */

        const totalClients =
          usersSnapshot.docs.filter(
            (snapshot) => {
              const data =
                snapshot.data();

              return (
                data.role ===
                  "client" ||
                !data.role
              );
            }
          ).length;

        /* -------------------------
           DOCUMENTS
        ------------------------- */

        let documentsWaiting =
          0;

        let approvedDocuments =
          0;

        documentsSnapshot.docs.forEach(
          (snapshot) => {
            const data =
              snapshot.data();

            if (
              data.status ===
                "uploaded" ||
              data.status ===
                "in_review"
            ) {
              documentsWaiting +=
                1;
            }

            if (
              data.status ===
              "approved"
            ) {
              approvedDocuments +=
                1;
            }
          }
        );

        /* -------------------------
           CONTACT MESSAGES
        ------------------------- */

        const newMessages =
          messagesSnapshot.docs.filter(
            (snapshot) =>
              snapshot.data()
                .status === "new"
          ).length;

        /* -------------------------
           SET STATE
        ------------------------- */

        setApplications(
          mappedApplications
        );

        setStats({
          totalApplications:
            mappedApplications.length,

          activeApplications,

          completedApplications,

          totalClients,

          documentsWaiting,

          approvedDocuments,

          newMessages,
        });
      } catch (
        requestError
      ) {
        console.error(
          "OVERVIEW_LOAD_ERROR:",
          requestError
        );

        setError(
          requestError instanceof
            Error
            ? requestError.message
            : isArabic
              ? "تعذر تحميل بيانات لوحة التحكم."
              : "Could not load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    }, [isArabic]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
     CHART DATA
  ======================================================= */

  const statusChartData =
    useMemo<
      StatusChartItem[]
    >(() => {
      const statuses:
        ApplicationStatus[] = [
        "submitted",
        "in_review",
        "waiting_documents",
        "processing",
        "completed",
        "rejected",
      ];

      return statuses.map(
        (status) => ({
          key: status,

          name:
            getStatusLabel(
              status,
              isArabic
            ),

          value:
            applications.filter(
              (application) =>
                application.status ===
                status
            ).length,
        })
      );
    }, [
      applications,
      isArabic,
    ]);

  const recentApplications =
    useMemo(
      () =>
        applications.slice(
          0,
          6
        ),
      [applications]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-[22px] bg-slate-100"
              />
            )
          )}
        </div>

        <div className="h-80 animate-pulse rounded-[24px] bg-slate-100" />
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="space-y-6 pb-8"
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
            {isArabic
              ? "نظرة عامة مباشرة"
              : "Live overview"}
          </span>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#07182a]">
            {isArabic
              ? "نظرة عامة"
              : "Overview"}
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            {isArabic
              ? "ملخص مباشر للطلبات والوثائق ورسائل العملاء."
              : "A live summary of applications, documents, and client messages."}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadDashboard()
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />

          {isArabic
            ? "تحديث البيانات"
            : "Refresh data"}
        </button>
      </header>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* ===================================================
          PRIMARY STATS
      =================================================== */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={
            isArabic
              ? "إجمالي الطلبات"
              : "Total applications"
          }
          value={
            stats.totalApplications
          }
          subtitle={
            isArabic
              ? "كل طلبات الخدمات"
              : "All service requests"
          }
          icon={
            <BriefcaseBusiness className="h-6 w-6" />
          }
        />

        <MetricCard
          title={
            isArabic
              ? "الطلبات النشطة"
              : "Active applications"
          }
          value={
            stats.activeApplications
          }
          subtitle={
            isArabic
              ? "تحتاج إلى متابعة"
              : "Currently being processed"
          }
          icon={
            <Clock3 className="h-6 w-6" />
          }
        />

        <MetricCard
          title={
            isArabic
              ? "وثائق تنتظر المراجعة"
              : "Documents to review"
          }
          value={
            stats.documentsWaiting
          }
          subtitle={
            isArabic
              ? "مرفوعة أو قيد المراجعة"
              : "Uploaded or under review"
          }
          icon={
            <FileCheck2 className="h-6 w-6" />
          }
        />

        <MetricCard
          title={
            isArabic
              ? "رسائل جديدة"
              : "New messages"
          }
          value={
            stats.newMessages
          }
          subtitle={
            isArabic
              ? "لم تتم قراءتها بعد"
              : "Waiting to be read"
          }
          icon={
            <MessageSquare className="h-6 w-6" />
          }
        />
      </section>

      {/* ===================================================
          SECONDARY STATS
      =================================================== */}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <strong className="text-xl font-black text-slate-950">
              {
                stats.totalClients
              }
            </strong>

            <p className="text-xs font-bold text-slate-500">
              {isArabic
                ? "العملاء"
                : "Clients"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>

          <div>
            <strong className="text-xl font-black text-slate-950">
              {
                stats.completedApplications
              }
            </strong>

            <p className="text-xs font-bold text-slate-500">
              {isArabic
                ? "طلبات مكتملة"
                : "Completed applications"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <strong className="text-xl font-black text-slate-950">
              {
                stats.approvedDocuments
              }
            </strong>

            <p className="text-xs font-bold text-slate-500">
              {isArabic
                ? "وثائق معتمدة"
                : "Approved documents"}
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          CHART + ATTENTION
      =================================================== */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Chart */}

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-950">
                {isArabic
                  ? "حالات الطلبات"
                  : "Application status"}
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {isArabic
                  ? "توزيع الطلبات حسب المرحلة الحالية."
                  : "Distribution of applications by current status."}
              </p>
            </div>
          </div>

          <div className="mt-6 h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={
                  statusChartData
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                  }}
                  interval={0}
                />

                <YAxis
                  allowDecimals={
                    false
                  }
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#2563eb"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Needs attention */}

        <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Inbox className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black text-slate-950">
                {isArabic
                  ? "يحتاج إلى انتباه"
                  : "Needs attention"}
              </h2>

              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {isArabic
                  ? "العناصر التي تحتاج إجراءً منك."
                  : "Items waiting for admin action."}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <AttentionItem
              label={
                isArabic
                  ? "وثائق تحتاج مراجعة"
                  : "Documents to review"
              }
              value={
                stats.documentsWaiting
              }
            />

            <AttentionItem
              label={
                isArabic
                  ? "رسائل جديدة"
                  : "New contact messages"
              }
              value={
                stats.newMessages
              }
            />

            <AttentionItem
              label={
                isArabic
                  ? "طلبات قيد المتابعة"
                  : "Active applications"
              }
              value={
                stats.activeApplications
              }
            />
          </div>

          {stats.documentsWaiting ===
            0 &&
            stats.newMessages ===
              0 && (
              <div className="mt-5 rounded-xl bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

                  <p className="text-sm font-bold leading-6 text-emerald-700">
                    {isArabic
                      ? "لا توجد وثائق أو رسائل جديدة تحتاج مراجعة حاليًا."
                      : "No new documents or messages need review right now."}
                  </p>
                </div>
              </div>
            )}
        </aside>
      </section>

      {/* ===================================================
          RECENT APPLICATIONS
      =================================================== */}

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              {isArabic
                ? "أحدث الطلبات"
                : "Recent applications"}
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              {isArabic
                ? "آخر الطلبات التي أنشأها العملاء."
                : "The latest service requests created by clients."}
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
            {
              applications.length
            }{" "}
            {isArabic
              ? "طلب"
              : "total"}
          </span>
        </div>

        {recentApplications.length ===
        0 ? (
          <div className="px-6 py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" />

            <p className="mt-4 font-bold text-slate-500">
              {isArabic
                ? "لا توجد طلبات حتى الآن."
                : "No applications yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-start">
                  <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-400">
                    {isArabic
                      ? "الطلب"
                      : "Application"}
                  </th>

                  <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-400">
                    {isArabic
                      ? "العميل"
                      : "Client"}
                  </th>

                  <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-400">
                    {isArabic
                      ? "الخدمة"
                      : "Service"}
                  </th>

                  <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-400">
                    {isArabic
                      ? "التقدم"
                      : "Progress"}
                  </th>

                  <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-400">
                    {isArabic
                      ? "الحالة"
                      : "Status"}
                  </th>

                  <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-400">
                    {isArabic
                      ? "التاريخ"
                      : "Date"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentApplications.map(
                  (
                    application
                  ) => (
                    <tr
                      key={
                        application.id
                      }
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <span className="font-black text-blue-600">
                          #
                          {
                            application.id
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-black text-slate-900">
                          {application
                            .client
                            .fullName ||
                            "—"}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {application
                            .client
                            .email ||
                            "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-700">
                        {getServiceLabel(
                          application.serviceType,
                          isArabic
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    application.progress
                                  )
                                )}%`,
                              }}
                            />
                          </div>

                          <span className="text-xs font-black text-slate-500">
                            {
                              application.progress
                            }
                            %
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${getStatusClasses(
                            application.status
                          )}`}
                        >
                          {getStatusLabel(
                            application.status,
                            isArabic
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                        {formatDate(
                          application.createdAt,
                          isArabic
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

/* =========================================================
   ATTENTION ITEM
========================================================= */

function AttentionItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <span className="text-sm font-bold text-slate-600">
        {label}
      </span>

      <strong
        className={`grid min-h-9 min-w-9 place-items-center rounded-xl px-2 text-sm font-black ${
          value > 0
            ? "bg-rose-100 text-rose-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {value}
      </strong>
    </div>
  );
}