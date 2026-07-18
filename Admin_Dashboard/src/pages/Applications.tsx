import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  Search,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  getAdminApplications,
  type AdminApplication,
} from "../api/adminApplicationsApi";

import { useLanguage } from "../i18n/LanguageContext";

function getServiceLabel(
  serviceType: AdminApplication["serviceType"],
  isArabic: boolean
) {
  const services = {
    us_llc: {
      en: "US LLC Formation",
      ar: "تأسيس شركة LLC أمريكية",
    },

    ein_assistance: {
      en: "EIN Assistance",
      ar: "مساعدة EIN",
    },

    banking_payment_setup: {
      en: "Banking & Payment Setup",
      ar: "إعداد الحسابات والمدفوعات",
    },

    compliance_support: {
      en: "Compliance Support",
      ar: "دعم الامتثال",
    },
  };

  return isArabic
    ? services[serviceType].ar
    : services[serviceType].en;
}

function getStatusLabel(
  status: AdminApplication["status"],
  isArabic: boolean
) {
  const statuses = {
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
      en: "Waiting documents",
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
    ? statuses[status].ar
    : statuses[status].en;
}

function getStatusClasses(
  status: AdminApplication["status"]
) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";

    case "processing":
      return "bg-blue-100 text-blue-700";

    case "in_review":
      return "bg-amber-100 text-amber-800";

    case "waiting_documents":
      return "bg-orange-100 text-orange-700";

    case "rejected":
      return "bg-rose-100 text-rose-700";

    case "submitted":
      return "bg-indigo-100 text-indigo-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(
  value: string,
  isArabic: boolean
) {
  return new Intl.DateTimeFormat(
    isArabic ? "ar-DZ" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(new Date(value));
}

export const Applications: React.FC = () => {
  const { isArabic } = useLanguage();

  const [applications, setApplications] =
    useState<AdminApplication[]>([]);

  const [search, setSearch] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const data =
        await getAdminApplications();

      setApplications(
        data.applications
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر تحميل الطلبات."
            : "Could not load applications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  const filteredApplications =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return applications.filter(
        (application) => {
          const matchesSearch =
            !normalizedSearch ||
            application.client.fullName
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            application.client.email
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            String(
              application.id
            ).includes(
              normalizedSearch
            );

          const matchesStatus =
            !statusFilter ||
            application.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      applications,
      search,
      statusFilter,
    ]);

  const activeCount =
    applications.filter(
      (application) =>
        ![
          "completed",
          "rejected",
        ].includes(
          application.status
        )
    ).length;

  const completedCount =
    applications.filter(
      (application) =>
        application.status ===
        "completed"
    ).length;

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#df3341]" />

          <p className="mt-4 font-bold text-slate-500">
            {isArabic
              ? "جاري تحميل الطلبات..."
              : "Loading applications..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-600">
          {isArabic
            ? "إدارة طلبات العملاء"
            : "Client application management"}
        </span>

        <h1 className="mt-4 text-3xl font-black text-[#061629]">
          {isArabic
            ? "طلبات الخدمات"
            : "Service Applications"}
        </h1>

        <p className="mt-2 font-semibold text-slate-500">
          {isArabic
            ? "عرض ومتابعة جميع الطلبات المسجلة في المنصة."
            : "View and manage all client applications."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={
            isArabic
              ? "إجمالي الطلبات"
              : "Total applications"
          }
          value={applications.length}
          icon={BriefcaseBusiness}
          iconClasses="bg-blue-50 text-blue-600"
        />

        <StatCard
          title={
            isArabic
              ? "الطلبات النشطة"
              : "Active applications"
          }
          value={activeCount}
          icon={Clock3}
          iconClasses="bg-amber-50 text-amber-600"
        />

        <StatCard
          title={
            isArabic
              ? "الطلبات المكتملة"
              : "Completed applications"
          }
          value={completedCount}
          icon={CheckCircle2}
          iconClasses="bg-emerald-50 text-emerald-600"
        />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)]">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-500 focus-within:bg-white">
            <Search className="h-5 w-5 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={
                isArabic
                  ? "ابحث بالاسم أو البريد أو رقم الطلب..."
                  : "Search name, email, or application ID..."
              }
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#0e3149] outline-none"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[#0e3149] outline-none focus:border-blue-500"
          >
            <option value="">
              {isArabic
                ? "كل الحالات"
                : "All statuses"}
            </option>

            <option value="submitted">
              {isArabic
                ? "تم الإرسال"
                : "Submitted"}
            </option>

            <option value="in_review">
              {isArabic
                ? "قيد المراجعة"
                : "In review"}
            </option>

            <option value="waiting_documents">
              {isArabic
                ? "بانتظار الوثائق"
                : "Waiting documents"}
            </option>

            <option value="processing">
              {isArabic
                ? "قيد المعالجة"
                : "Processing"}
            </option>

            <option value="completed">
              {isArabic
                ? "مكتمل"
                : "Completed"}
            </option>

            <option value="rejected">
              {isArabic
                ? "مرفوض"
                : "Rejected"}
            </option>
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}

          <button
            type="button"
            onClick={() =>
              void loadApplications()
            }
            className="mx-3 underline"
          >
            {isArabic
              ? "إعادة المحاولة"
              : "Try again"}
          </button>
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)]">
        {filteredApplications.length ===
        0 ? (
          <div className="py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-12 w-12 text-slate-300" />

            <p className="mt-4 font-bold text-slate-500">
              {isArabic
                ? "لا توجد طلبات مطابقة."
                : "No matching applications."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "الطلب"
                      : "Application"}
                  </th>

                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "العميل"
                      : "Client"}
                  </th>

                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "الخدمة"
                      : "Service"}
                  </th>

                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "الحالة"
                      : "Status"}
                  </th>

                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "التقدم"
                      : "Progress"}
                  </th>

                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "التاريخ"
                      : "Date"}
                  </th>

                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "الإجراء"
                      : "Action"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map(
                  (application) => (
                    <tr
                      key={application.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-3 py-4 text-sm font-black text-[#0e3149]">
                        #{application.id}
                      </td>

                      <td className="px-3 py-4">
                        <strong className="block text-sm font-black text-[#0e3149]">
                          {
                            application
                              .client
                              .fullName
                          }
                        </strong>

                        <span className="mt-1 block text-xs text-slate-500">
                          {
                            application
                              .client.email
                          }
                        </span>
                      </td>

                      <td className="px-3 py-4 text-sm font-bold text-slate-600">
                        {getServiceLabel(
                          application.serviceType,
                          isArabic
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                            application.status
                          )}`}
                        >
                          {getStatusLabel(
                            application.status,
                            isArabic
                          )}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <div className="w-32">
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width: `${application.progress}%`,
                              }}
                            />
                          </div>

                          <span className="mt-1 block text-xs font-black text-slate-500">
                            {
                              application.progress
                            }
                            %
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-slate-500">
                        {formatDate(
                          application.createdAt,
                          isArabic
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <Link
                          to={`/applications/${application.id}`}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173e56] px-4 text-xs font-black text-white transition hover:bg-[#0e3149]"
                        >
                          <Eye className="h-4 w-4" />

                          {isArabic
                            ? "عرض"
                            : "View"}
                        </Link>
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

function StatCard({
  title,
  value,
  icon: Icon,
  iconClasses,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconClasses: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-slate-500">
            {title}
          </p>

          <strong className="mt-3 block text-3xl font-black text-[#0e3149]">
            {value}
          </strong>
        </div>

        <div
          className={`grid h-12 w-12 place-items-center rounded-2xl ${iconClasses}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </article>
  );
}
