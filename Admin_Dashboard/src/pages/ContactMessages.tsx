import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Eye,
  Inbox,
  Mail,
  MailOpen,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  getAdminContactMessage,
  getAdminContactMessages,
  updateAdminContactMessageStatus,
  type AdminContactMessage,
  type AdminContactMessageSummary,
  type ContactMessageStatus,
} from "../api/adminContactMessagesApi";

import { useLanguage } from "../i18n/LanguageContext";

function getStatusLabel(
  status: ContactMessageStatus,
  isArabic: boolean
) {
  const statuses: Record<
    ContactMessageStatus,
    {
      en: string;
      ar: string;
    }
  > = {
    new: {
      en: "New",
      ar: "جديدة",
    },

    read: {
      en: "Read",
      ar: "مقروءة",
    },

    replied: {
      en: "Replied",
      ar: "تم الرد",
    },

    archived: {
      en: "Archived",
      ar: "مؤرشفة",
    },
  };

  return isArabic
    ? statuses[status].ar
    : statuses[status].en;
}

function getStatusClasses(
  status: ContactMessageStatus
) {
  switch (status) {
    case "new":
      return "bg-rose-100 text-rose-700";

    case "read":
      return "bg-blue-100 text-blue-700";

    case "replied":
      return "bg-emerald-100 text-emerald-700";

    case "archived":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDateTime(
  value: string,
  isArabic: boolean
) {
  return new Intl.DateTimeFormat(
    isArabic ? "ar-DZ" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date(value));
}

export const ContactMessages: React.FC = () => {
  const { isArabic } = useLanguage();

  const [messages, setMessages] = useState<
    AdminContactMessageSummary[]
  >([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<ContactMessageStatus | "">("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [selectedMessageId, setSelectedMessageId] =
    useState<number | null>(null);

  const [selectedMessage, setSelectedMessage] =
    useState<AdminContactMessage | null>(
      null
    );

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [detailError, setDetailError] =
    useState("");

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  async function loadMessages() {
    setLoading(true);
    setError("");

    try {
      const data =
        await getAdminContactMessages();

      setMessages(data.messages);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر تحميل الرسائل."
            : "Could not load messages."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesSearch =
        !normalizedSearch ||
        String(message.id).includes(
          normalizedSearch
        ) ||
        message.fullName
          .toLowerCase()
          .includes(normalizedSearch) ||
        message.email
          .toLowerCase()
          .includes(normalizedSearch) ||
        message.subject
          .toLowerCase()
          .includes(normalizedSearch) ||
        message.phone
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        !statusFilter ||
        message.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    messages,
    search,
    statusFilter,
  ]);

  const newCount = messages.filter(
    (message) => message.status === "new"
  ).length;

  const repliedCount = messages.filter(
    (message) =>
      message.status === "replied"
  ).length;

  async function openMessage(
    messageId: number
  ) {
    setSelectedMessageId(messageId);
    setSelectedMessage(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const data =
        await getAdminContactMessage(
          messageId
        );

      let loadedMessage = data.message;

      /*
        عندما يفتح المسؤول رسالة جديدة،
        تتحول تلقائياً إلى مقروءة.
      */
      if (
        loadedMessage.status === "new"
      ) {
        const updated =
          await updateAdminContactMessageStatus(
            messageId,
            "read"
          );

        loadedMessage = updated.message;

        setMessages((current) =>
          current.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  status: "read",
                  updatedAt:
                    updated.message.updatedAt,
                }
              : message
          )
        );
      }

      setSelectedMessage(
        loadedMessage
      );
    } catch (requestError) {
      setDetailError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر تحميل الرسالة."
            : "Could not load the message."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function closeMessage() {
    setSelectedMessageId(null);
    setSelectedMessage(null);
    setDetailError("");
  }

  async function handleStatusChange(
    nextStatus: ContactMessageStatus
  ) {
    if (
      !selectedMessage ||
      updatingStatus
    ) {
      return;
    }

    setUpdatingStatus(true);
    setDetailError("");

    try {
      const data =
        await updateAdminContactMessageStatus(
          selectedMessage.id,
          nextStatus
        );

      setSelectedMessage(data.message);

      setMessages((current) =>
        current.map((message) =>
          message.id ===
          data.message.id
            ? {
                ...message,
                status:
                  data.message.status,
                updatedAt:
                  data.message.updatedAt,
              }
            : message
        )
      );
    } catch (requestError) {
      setDetailError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر تحديث حالة الرسالة."
            : "Could not update the message status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#df3341]" />

          <p className="mt-4 font-bold text-slate-500">
            {isArabic
              ? "جاري تحميل الرسائل..."
              : "Loading messages..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Page heading */}

      <div>
        <span className="inline-flex rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-[#df3341]">
          {isArabic
            ? "إدارة تواصل العملاء"
            : "Customer communication"}
        </span>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#061629]">
              {isArabic
                ? "رسائل التواصل"
                : "Contact Messages"}
            </h1>

            <p className="mt-2 font-semibold text-slate-500">
              {isArabic
                ? "عرض رسائل نموذج التواصل ومتابعة حالتها."
                : "View and manage messages submitted through the contact form."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadMessages()
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#173e56] shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />

            {isArabic
              ? "تحديث"
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* Statistics */}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={
            isArabic
              ? "إجمالي الرسائل"
              : "Total messages"
          }
          value={messages.length}
          icon={MessageSquareText}
          iconClasses="bg-blue-50 text-blue-600"
        />

        <StatCard
          title={
            isArabic
              ? "الرسائل الجديدة"
              : "New messages"
          }
          value={newCount}
          icon={Inbox}
          iconClasses="bg-rose-50 text-[#df3341]"
        />

        <StatCard
          title={
            isArabic
              ? "تم الرد عليها"
              : "Replied messages"
          }
          value={repliedCount}
          icon={CheckCircle2}
          iconClasses="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Filters */}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)]">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-500 focus-within:bg-white">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />

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
                  ? "ابحث بالاسم أو البريد أو الموضوع أو رقم الرسالة..."
                  : "Search name, email, subject, or message ID..."
              }
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#0e3149] outline-none"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as
                  | ContactMessageStatus
                  | ""
              )
            }
            className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[#0e3149] outline-none focus:border-blue-500"
          >
            <option value="">
              {isArabic
                ? "كل الحالات"
                : "All statuses"}
            </option>

            <option value="new">
              {isArabic
                ? "جديدة"
                : "New"}
            </option>

            <option value="read">
              {isArabic
                ? "مقروءة"
                : "Read"}
            </option>

            <option value="replied">
              {isArabic
                ? "تم الرد"
                : "Replied"}
            </option>

            <option value="archived">
              {isArabic
                ? "مؤرشفة"
                : "Archived"}
            </option>
          </select>
        </div>
      </section>

      {/* Request error */}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}

          <button
            type="button"
            onClick={() =>
              void loadMessages()
            }
            className="mx-3 underline"
          >
            {isArabic
              ? "إعادة المحاولة"
              : "Try again"}
          </button>
        </div>
      )}

      {/* Messages table */}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)]">
        {filteredMessages.length === 0 ? (
          <div className="py-16 text-center">
            <MailOpen className="mx-auto h-12 w-12 text-slate-300" />

            <p className="mt-4 font-bold text-slate-500">
              {isArabic
                ? "لا توجد رسائل مطابقة."
                : "No matching messages."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "الرسالة"
                      : "Message"}
                  </th>

                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "المرسل"
                      : "Sender"}
                  </th>

                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "الموضوع"
                      : "Subject"}
                  </th>

                  <th className="px-3 py-4 text-start font-black">
                    {isArabic
                      ? "الحالة"
                      : "Status"}
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
                {filteredMessages.map(
                  (message) => (
                    <tr
                      key={message.id}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/70 ${
                        message.status ===
                        "new"
                          ? "bg-rose-50/30"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-4 text-sm font-black text-[#0e3149]">
                        #{message.id}
                      </td>

                      <td className="px-3 py-4">
                        <strong className="block text-sm font-black text-[#0e3149]">
                          {message.fullName}
                        </strong>

                        <span
                          className="mt-1 block text-xs text-slate-500"
                          dir="ltr"
                        >
                          {message.email}
                        </span>

                        {message.phone && (
                          <span
                            className="mt-1 block text-xs text-slate-400"
                            dir="ltr"
                          >
                            {message.phone}
                          </span>
                        )}
                      </td>

                      <td className="max-w-[360px] px-3 py-4">
                        <strong className="block truncate text-sm font-black text-[#0e3149]">
                          {message.subject}
                        </strong>

                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {
                            message.messagePreview
                          }
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                            message.status
                          )}`}
                        >
                          {getStatusLabel(
                            message.status,
                            isArabic
                          )}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-slate-500">
                        {formatDateTime(
                          message.createdAt,
                          isArabic
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            void openMessage(
                              message.id
                            )
                          }
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173e56] px-4 text-xs font-black text-white transition hover:bg-[#0e3149]"
                        >
                          <Eye className="h-4 w-4" />

                          {isArabic
                            ? "عرض"
                            : "View"}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Message details modal */}

      {selectedMessageId !== null && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeMessage();
            }
          }}
        >
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#df3341]">
                  {isArabic
                    ? `الرسالة رقم ${selectedMessageId}`
                    : `Message #${selectedMessageId}`}
                </p>

                <h2 className="mt-1 text-xl font-black text-[#061629]">
                  {isArabic
                    ? "تفاصيل رسالة التواصل"
                    : "Contact message details"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeMessage}
                aria-label={
                  isArabic
                    ? "إغلاق"
                    : "Close"
                }
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {detailLoading ? (
                <div className="grid min-h-72 place-items-center">
                  <div className="text-center">
                    <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#df3341]" />

                    <p className="mt-4 font-bold text-slate-500">
                      {isArabic
                        ? "جاري تحميل الرسالة..."
                        : "Loading message..."}
                    </p>
                  </div>
                </div>
              ) : detailError &&
                !selectedMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-700">
                  {detailError}
                </div>
              ) : selectedMessage ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-[#061629]">
                        {
                          selectedMessage.subject
                        }
                      </h3>

                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        {formatDateTime(
                          selectedMessage.createdAt,
                          isArabic
                        )}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-2 text-xs font-black ${getStatusClasses(
                        selectedMessage.status
                      )}`}
                    >
                      {getStatusLabel(
                        selectedMessage.status,
                        isArabic
                      )}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
                          <Mail className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-500">
                            {isArabic
                              ? "المرسل"
                              : "Sender"}
                          </span>

                          <strong className="mt-1 block text-sm font-black text-[#0e3149]">
                            {
                              selectedMessage.fullName
                            }
                          </strong>

                          <a
                            href={`mailto:${selectedMessage.email}`}
                            className="mt-1 block break-all text-sm font-bold text-blue-600 hover:underline"
                            dir="ltr"
                          >
                            {
                              selectedMessage.email
                            }
                          </a>
                        </div>
                      </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                          <Phone className="h-5 w-5" />
                        </div>

                        <div>
                          <span className="text-xs font-black text-slate-500">
                            {isArabic
                              ? "رقم الهاتف"
                              : "Phone number"}
                          </span>

                          {selectedMessage.phone ? (
                            <a
                              href={`tel:${selectedMessage.phone}`}
                              className="mt-1 block text-sm font-black text-[#0e3149] hover:underline"
                              dir="ltr"
                            >
                              {
                                selectedMessage.phone
                              }
                            </a>
                          ) : (
                            <span className="mt-1 block text-sm font-bold text-slate-400">
                              {isArabic
                                ? "غير متوفر"
                                : "Not provided"}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600">
                          <CalendarDays className="h-5 w-5" />
                        </div>

                        <div>
                          <span className="text-xs font-black text-slate-500">
                            {isArabic
                              ? "تاريخ الإرسال"
                              : "Submitted at"}
                          </span>

                          <strong className="mt-1 block text-sm font-black text-[#0e3149]">
                            {formatDateTime(
                              selectedMessage.createdAt,
                              isArabic
                            )}
                          </strong>
                        </div>
                      </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <label className="block">
                        <span className="text-xs font-black text-slate-500">
                          {isArabic
                            ? "حالة الرسالة"
                            : "Message status"}
                        </span>

                        <select
                          value={
                            selectedMessage.status
                          }
                          disabled={
                            updatingStatus
                          }
                          onChange={(event) =>
                            void handleStatusChange(
                              event.target
                                .value as ContactMessageStatus
                            )
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-[#0e3149] outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="new">
                            {isArabic
                              ? "جديدة"
                              : "New"}
                          </option>

                          <option value="read">
                            {isArabic
                              ? "مقروءة"
                              : "Read"}
                          </option>

                          <option value="replied">
                            {isArabic
                              ? "تم الرد"
                              : "Replied"}
                          </option>

                          <option value="archived">
                            {isArabic
                              ? "مؤرشفة"
                              : "Archived"}
                          </option>
                        </select>
                      </label>
                    </article>
                  </div>

                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-sm font-black text-[#0e3149]">
                      <MessageSquareText className="h-5 w-5 text-[#df3341]" />

                      {isArabic
                        ? "نص الرسالة"
                        : "Message"}
                    </h4>

                    <p className="mt-4 whitespace-pre-wrap break-words text-[15px] font-semibold leading-8 text-slate-600">
                      {
                        selectedMessage.message
                      }
                    </p>
                  </article>

                  {detailError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                      {detailError}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                        `Re: ${selectedMessage.subject}`
                      )}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#173e56] px-5 text-sm font-black text-white transition hover:bg-[#0e3149]"
                    >
                      <Mail className="h-4 w-4" />

                      {isArabic
                        ? "الرد عبر البريد"
                        : "Reply by email"}
                    </a>

                    <button
                      type="button"
                      disabled={
                        updatingStatus ||
                        selectedMessage.status ===
                          "archived"
                      }
                      onClick={() =>
                        void handleStatusChange(
                          "archived"
                        )
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Archive className="h-4 w-4" />

                      {isArabic
                        ? "أرشفة الرسالة"
                        : "Archive message"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}
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