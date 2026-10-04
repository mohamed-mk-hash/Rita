import {

  useEffect,

  useMemo,

  useState,

} from "react";



import {

  ArrowLeft,

  ArrowRight,

  Building2,

  Check,

  CheckCircle2,

  ChevronDown,

  CircleAlert,

  Clock3,

  Download,

  ExternalLink,

  FileText,

  Mail,

  MapPin,

  Phone,

  Save,

  Settings2,

  UserRound,

  X,

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

  type AdminApplicationDocument,

  type ApplicationDocumentStatus,

} from "../api/adminApplicationsApi";



import {

  downloadAdminDocument,

  openAdminDocument,

  reviewAdminDocument,

} from "../api/adminDocumentsApi";

import { sendWorkflowEmailRequest } from "../api/sendWorkflowEmail";



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

  {

    value: "intake_submitted",

    en: "Request submitted",

    ar: "تم إرسال الطلب",

  },

  {

    value: "document_review",

    en: "Reviewing documents",

    ar: "مراجعة الوثائق",

  },

  {

    value: "waiting_required_documents",

    en: "Waiting for required documents",

    ar: "بانتظار الوثائق المطلوبة",

  },

  {

    value: "document_corrections_required",

    en: "Document corrections required",

    ar: "مطلوب تصحيح الوثائق",

  },

  {

    value: "documents_approved",

    en: "Documents approved",

    ar: "تم قبول الوثائق",

  },

  {

    value: "preparing_filing",

    en: "Preparing the filing",

    ar: "تجهيز ملف التأسيس",

  },

  {

    value: "filing_submitted",

    en: "Filing submitted",

    ar: "تم إرسال ملف التأسيس",

  },

  {

    value: "ein_processing",

    en: "EIN processing",

    ar: "معالجة EIN",

  },

  {

    value: "banking_setup",

    en: "Banking setup",

    ar: "إعداد الحسابات البنكية",

  },

  {

    value: "compliance_review",

    en: "Compliance review",

    ar: "مراجعة الامتثال",

  },

  {

    value: "completed",

    en: "Service completed",

    ar: "اكتملت الخدمة",

  },

];



function workflowStepLabel(
  value: string | null | undefined,
  isArabic: boolean
) {
  if (!value) return "—";

  const step = workflowSteps.find(
    (item) => item.value === value
  );

  if (!step) {
    return String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return isArabic ? step.ar : step.en;
}



function formatDate(

  value: string | null,

  isArabic: boolean

) {

  if (!value) return "—";



  const date = new Date(value);



  if (

    Number.isNaN(date.getTime())

  ) {

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

  ).format(date);

}



function formatFileSize(

  value: number | null

) {

  if (!value) return "—";



  if (value < 1024) {

    return `${value} B`;

  }



  if (value < 1024 * 1024) {

    return `${(

      value / 1024

    ).toFixed(1)} KB`;

  }



  return `${(

    value /

    (1024 * 1024)

  ).toFixed(1)} MB`;

}



function serviceLabel(

  serviceType: AdminApplication["serviceType"],

  isArabic: boolean

) {

  const labels = {

    us_llc: {

      en: "US LLC Formation",

      ar: "تأسيس LLC أمريكية",

    },

    ein_assistance: {

      en: "EIN Assistance",

      ar: "مساعدة EIN",

    },

    banking_payment_setup: {

      en: "Banking & Payment Setup",

      ar: "الحسابات والمدفوعات",

    },

    compliance_support: {

      en: "Compliance Support",

      ar: "دعم الامتثال",

    },

  };



  return isArabic

    ? labels[serviceType].ar

    : labels[serviceType].en;

}



function applicationStatusLabel(

  status: AdminApplicationStatus,

  isArabic: boolean

) {

  const labels: Record<

    AdminApplicationStatus,

    { en: string; ar: string }

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



function documentStatusLabel(

  status: ApplicationDocumentStatus,

  isArabic: boolean

) {

  const labels: Record<

    ApplicationDocumentStatus,

    { en: string; ar: string }

  > = {

    missing: {

      en: "Missing",

      ar: "غير مرفوعة",

    },

    uploaded: {

      en: "Uploaded",

      ar: "تم الرفع",

    },

    in_review: {

      en: "Under review",

      ar: "قيد المراجعة",

    },

    approved: {

      en: "Approved",

      ar: "مقبولة",

    },

    rejected: {

      en: "Rejected",

      ar: "مرفوضة",

    },

  };



  return isArabic

    ? labels[status].ar

    : labels[status].en;

}



function statusClasses(

  status: string

) {

  const classes: Record<

    string,

    string

  > = {

    missing:

      "bg-slate-100 text-slate-600",

    draft:

      "bg-slate-100 text-slate-700",

    uploaded:

      "bg-blue-100 text-blue-700",

    submitted:

      "bg-indigo-100 text-indigo-700",

    in_review:

      "bg-amber-100 text-amber-800",

    waiting_documents:

      "bg-orange-100 text-orange-700",

    processing:

      "bg-blue-100 text-blue-700",

    approved:

      "bg-emerald-100 text-emerald-700",

    completed:

      "bg-emerald-100 text-emerald-700",

    rejected:

      "bg-rose-100 text-rose-700",

  };



  return (

    classes[status] ||

    "bg-slate-100 text-slate-700"

  );

}



function getDocumentActionId(

  document: AdminApplicationDocument

): number | string | null {

  return (

    document.firestoreId ||

    document.id

  );

}



export function ApplicationDetails() {

  const { id } = useParams();

  const applicationId = Number(id);

  const { isArabic } = useLanguage();



  const [

    application,

    setApplication,

  ] =

    useState<AdminApplication | null>(

      null

    );



  const [status, setStatus] =

    useState<AdminApplicationStatus>(

      "submitted"

    );



  const [progress, setProgress] =

    useState(10);



  const [

    currentStep,

    setCurrentStep,

  ] = useState("");



  const [notes, setNotes] =

    useState("");



  const [loading, setLoading] =

    useState(true);



  const [saving, setSaving] =

    useState(false);



  const [error, setError] =

    useState("");



  const [message, setMessage] =

    useState("");



  const [

    documentActionId,

    setDocumentActionId,

  ] = useState<string | null>(null);



  const [

    reviewDocument,

    setReviewDocument,

  ] =

    useState<AdminApplicationDocument | null>(

      null

    );



  const [

    reviewAction,

    setReviewAction,

  ] = useState<

    "approved" | "rejected"

  >("approved");



  const [

    reviewNote,

    setReviewNote,

  ] = useState("");



  async function loadApplication(

    silent = false

  ) {

    if (

      !Number.isInteger(

        applicationId

      ) ||

      applicationId <= 0

    ) {

      setError(

        isArabic

          ? "رقم الطلب غير صحيح."

          : "Invalid application ID."

      );



      setLoading(false);

      return;

    }



    if (!silent) {

      setLoading(true);

    }



    setError("");



    try {

      const response =

        await getAdminApplication(

          applicationId

        );



      const loaded =

        response.application;



      setApplication(loaded);

      setStatus(loaded.status);

      setProgress(loaded.progress);



      setCurrentStep(

        loaded.currentStep || ""

      );



      setNotes(

        loaded.notes || ""

      );

    } catch (requestError) {

      setError(

        requestError instanceof Error

          ? requestError.message

          : isArabic

            ? "تعذر تحميل تفاصيل الطلب."

            : "Could not load application details."

      );

    } finally {

      if (!silent) {

        setLoading(false);

      }

    }

  }



  useEffect(() => {

    void loadApplication();

  }, [applicationId]);



  const selectedNeeds =

    useMemo(() => {

      if (!application?.intake) {

        return [];

      }



      const needs = [

        [

          "EIN",

          application.intake.needsEin,

        ],

        [

          "Stripe",

          application.intake

            .needsStripe,

        ],

        [

          "PayPal",

          application.intake

            .needsPaypal,

        ],

        [

          "Wise",

          application.intake.needsWise,

        ],

        [

          "Mercury",

          application.intake

            .needsMercury,

        ],

        [

          "Relay",

          application.intake.needsRelay,

        ],

        [

          "Payoneer",

          application.intake

            .needsPayoneer,

        ],

        [

          "Shopify Payments",

          application.intake

            .needsShopify,

        ],

      ] as const;



      return needs

        .filter(

          ([, selected]) =>

            selected

        )

        .map(

          ([label]) => label

        );

    }, [application]);



  const rejectedDocuments =

    application?.documents.filter(

      (document) =>

        document.status ===

        "rejected"

    ).length || 0;



  const missingDocuments =

    application?.documents.filter(

      (document) =>

        document.isRequired &&

        document.status ===

          "missing"

    ).length || 0;



  async function handleSave() {
    if (!application) return;

    setSaving(true);
    setError("");
    setMessage("");

    const previousStatus = application.status;
    const previousStep = application.currentStep || "";

    try {
      const response =
        await updateAdminApplication(
          application.id,
          {
            status,
            progress,
            currentStep,
            notes,
          }
        );

      const updated =
        response.application;

      setApplication(updated);
      setStatus(updated.status);
      setProgress(
        updated.progress
      );

      setCurrentStep(
        updated.currentStep || ""
      );

      setNotes(
        updated.notes || ""
      );

      const statusChanged =
        String(previousStatus || "") !==
        String(updated.status || "");

      const phaseChanged =
        String(previousStep || "") !==
        String(updated.currentStep || "");

      if (statusChanged || phaseChanged) {
        const notificationEmail =
  updated.client?.email ||
  application.client?.email ||
  "";

        if (!notificationEmail) {
          setMessage(
            isArabic
              ? "تم حفظ تحديثات الطلب، لكن لا يوجد بريد إشعارات لهذا العميل."
              : "Application changes were saved, but no notification email is available for this client."
          );

          return;
        }

        try {
          await sendWorkflowEmailRequest({
            to: notificationEmail,
            userName:
              updated.client?.fullName ||
              application.client?.fullName ||
              "",
            applicationId: updated.id,
            serviceName: serviceLabel(
              updated.serviceType,
              false
            ),
            oldPhase: workflowStepLabel(
              previousStep,
              false
            ),
            newPhase: workflowStepLabel(
              updated.currentStep,
              false
            ),
            oldStatus: applicationStatusLabel(
              previousStatus,
              false
            ),
            newStatus: applicationStatusLabel(
              updated.status,
              false
            ),
          });

          setMessage(
            isArabic
              ? `تم حفظ تحديثات الطلب وإرسال إشعار بالبريد إلى ${notificationEmail}.`
              : `Application changes were saved and an email notification was sent to ${notificationEmail}.`
          );
        } catch (emailError) {
          console.error(
            "WORKFLOW_EMAIL_ERROR:",
            emailError
          );

          setMessage(
            isArabic
              ? "تم حفظ تحديثات الطلب، لكن تعذر إرسال إشعار البريد."
              : "Application changes were saved, but the email notification could not be sent."
          );

          setError(
            emailError instanceof Error
              ? emailError.message
              : isArabic
                ? "تعذر إرسال البريد."
                : "Could not send the email."
          );
        }

        return;
      }

      setMessage(
        isArabic
          ? "تم حفظ تحديثات الطلب. لم تتغير الحالة أو المرحلة، لذلك لم يتم إرسال بريد."
          : "Application changes were saved. Status and phase did not change, so no email was sent."
      );
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



  async function handleOpenDocument(

    document: AdminApplicationDocument

  ) {

    const actionId =

      getDocumentActionId(

        document

      );



    if (!actionId) {

      setError(

        isArabic

          ? "لا يوجد ملف مرفوع لهذه الوثيقة."

          : "No uploaded file exists for this document."

      );

      return;

    }



    const key = `open-${actionId}`;

    setDocumentActionId(key);

    setError("");



    try {

      await openAdminDocument(

        actionId

      );

    } catch (requestError) {

      setError(

        requestError instanceof Error

          ? requestError.message

          : isArabic

            ? "تعذر فتح الوثيقة."

            : "Could not open the document."

      );

    } finally {

      setDocumentActionId(null);

    }

  }



  async function handleDownloadDocument(

    document: AdminApplicationDocument

  ) {

    const actionId =

      getDocumentActionId(

        document

      );



    if (!actionId) {

      setError(

        isArabic

          ? "لا يوجد ملف مرفوع لهذه الوثيقة."

          : "No uploaded file exists for this document."

      );

      return;

    }



    const key =

      `download-${actionId}`;



    setDocumentActionId(key);

    setError("");



    try {

      await downloadAdminDocument(

        actionId,

        document.originalName ||

          "document"

      );

    } catch (requestError) {

      setError(

        requestError instanceof Error

          ? requestError.message

          : isArabic

            ? "تعذر تحميل الوثيقة."

            : "Could not download the document."

      );

    } finally {

      setDocumentActionId(null);

    }

  }



  function startReview(

    document: AdminApplicationDocument,

    action:

      | "approved"

      | "rejected"

  ) {

    if (

      !getDocumentActionId(document)

    ) {

      return;

    }



    setReviewDocument(document);

    setReviewAction(action);



    setReviewNote(

      action === "rejected"

        ? document.reviewNote || ""

        : ""

    );



    setError("");

    setMessage("");

  }



  async function submitReview() {

    if (!reviewDocument) return;



    const actionId =

      getDocumentActionId(

        reviewDocument

      );



    if (!actionId) return;



    if (

      reviewAction ===

        "rejected" &&

      !reviewNote.trim()

    ) {

      setError(

        isArabic

          ? "اكتب سبب الرفض حتى يعرف العميل ما الذي يجب تصحيحه."

          : "Write a rejection reason so the client knows what to correct."

      );

      return;

    }



    const key =

      `review-${actionId}`;



    setDocumentActionId(key);

    setError("");

    setMessage("");



    try {

      await reviewAdminDocument(

        actionId,

        reviewAction,

        reviewNote

      );



      setMessage(

        reviewAction ===

          "approved"

          ? isArabic

            ? "تم قبول الوثيقة بنجاح."

            : "The document was approved."

          : isArabic

            ? "تم رفض الوثيقة وحفظ الملاحظة."

            : "The document was rejected and the note was saved."

      );



      setReviewDocument(null);

      setReviewNote("");



      await loadApplication(true);

    } catch (requestError) {

      setError(

        requestError instanceof Error

          ? requestError.message

          : isArabic

            ? "تعذر حفظ مراجعة الوثيقة."

            : "Could not save the document review."

      );

    } finally {

      setDocumentActionId(null);

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

          {error ||

            (isArabic

              ? "الطلب غير موجود."

              : "Application not found.")}

        </p>



        <Link

          to="/applications"

          className="mt-5 inline-flex rounded-xl bg-[#173e56] px-4 py-3 text-sm font-black text-white"

        >

          {isArabic

            ? "العودة إلى الطلبات"

            : "Back to applications"}

        </Link>

      </section>

    );

  }



  const BackIcon =

    isArabic

      ? ArrowRight

      : ArrowLeft;



  return (

    <div className="space-y-6">

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)] md:p-6">

        <Link

          to="/applications"

          className="inline-flex items-center gap-2 text-sm font-black text-blue-600"

        >

          <BackIcon className="h-4 w-4" />



          {isArabic

            ? "العودة إلى الطلبات"

            : "Back to applications"}

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

                {applicationStatusLabel(

                  application.status,

                  isArabic

                )}

              </span>

            </div>



            <h1 className="mt-4 text-2xl font-black text-[#061629] md:text-3xl">

              {serviceLabel(

                application.serviceType,

                isArabic

              )}

            </h1>



            <p className="mt-2 font-semibold text-slate-500">

              {

                application.client

                  .fullName

              }

              {" · "}

              {formatDate(

                application.createdAt,

                isArabic

              )}

            </p>

          </div>



          <div className="w-full max-w-lg rounded-2xl bg-slate-50 p-4">

            <div className="flex items-center justify-between gap-4">

              <span className="text-sm font-black text-[#0e3149]">

                {isArabic

                  ? "تقدم الطلب"

                  : "Application progress"}

              </span>



              <strong className="text-xl font-black text-blue-600">

                {

                  application.progress

                }

                %

              </strong>

            </div>



            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">

              <div

                className="h-full rounded-full bg-blue-600"

                style={{

                  width: `${application.progress}%`,

                }}

              />

            </div>



            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-500">

              <span>

                {isArabic

                  ? "مطلوبة"

                  : "Required"}

                :{" "}

                {

                  application

                    .documentProgress

                    .required

                }

              </span>



              <span>

                {isArabic

                  ? "مرفوعة"

                  : "Uploaded"}

                :{" "}

                {

                  application

                    .documentProgress

                    .uploaded

                }

              </span>



              <span>

                {isArabic

                  ? "مقبولة"

                  : "Approved"}

                :{" "}

                {

                  application

                    .documentProgress

                    .approved

                }

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



      {(

        rejectedDocuments > 0 ||

        missingDocuments > 0

      ) && (

        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">

          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />



          <div>

            <strong className="text-sm font-black">

              {isArabic

                ? "هذا الطلب يحتاج إلى متابعة"

                : "This application needs attention"}

            </strong>



            <p className="mt-1 text-sm font-semibold leading-6">

              {rejectedDocuments >

                0 &&

                (isArabic

                  ? `${rejectedDocuments} وثيقة مرفوضة. `

                  : `${rejectedDocuments} rejected document(s). `)}



              {missingDocuments >

                0 &&

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

                label={

                  isArabic

                    ? "العميل"

                    : "Client"

                }

                value={

                  application.client

                    .fullName

                }

              />



              <SummaryItem

                icon={Mail}

                label={

                  isArabic

                    ? "البريد الإلكتروني"

                    : "Email"

                }

                value={

                  application.client

                    .email

                }

                ltr

              />



              <SummaryItem

                icon={Phone}

                label={

                  isArabic

                    ? "الهاتف / واتساب"

                    : "Phone / WhatsApp"

                }

                value={

                  application.intake

                    ?.phone || "—"

                }

                ltr

              />



              <SummaryItem

                icon={MapPin}

                label={

                  isArabic

                    ? "الدولة"

                    : "Country"

                }

                value={

                  application.intake

                    ?.country || "—"

                }

              />



              <SummaryItem

                icon={Building2}

                label={

                  isArabic

                    ? "اسم الشركة المقترح"

                    : "Desired company name"

                }

                value={

                  application.intake

                    ?.desiredCompanyName ||

                  "—"

                }

              />



              <SummaryItem

                icon={CheckCircle2}

                label={

                  isArabic

                    ? "الخدمات الإضافية"

                    : "Requested solutions"

                }

                value={

                  selectedNeeds.join(

                    ", "

                  ) ||

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

                  label={

                    isArabic

                      ? "نشاط العمل"

                      : "Business activity"

                  }

                  value={

                    application.intake

                      ?.businessActivity ||

                    "—"

                  }

                />



                <TextBlock

                  label={

                    isArabic

                      ? "ملاحظات العميل"

                      : "Client notes"

                  }

                  value={

                    application.intake

                      ?.extraNotes || "—"

                  }

                />

              </div>

            </details>

          </section>



          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(18,48,72,0.07)] md:p-6">

            <div className="flex items-center gap-3">

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">

                <FileText className="h-5 w-5" />

              </div>



              <div>

                <h2 className="text-lg font-black text-[#0e3149]">

                  {isArabic

                    ? "وثائق الطلب"

                    : "Application documents"}

                </h2>



                <p className="mt-1 text-sm font-semibold text-slate-500">

                  {isArabic

                    ? "افتح وحمّل وراجع وثائق هذا الطلب مباشرة من هنا."

                    : "Open, download, approve, or reject this application's documents directly here."}

                </p>

              </div>

            </div>



            {application.documents.length ===

            0 ? (

              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

                <FileText className="mx-auto h-9 w-9 text-slate-300" />



                <p className="mt-3 text-sm font-bold text-slate-500">

                  {isArabic

                    ? "لا توجد متطلبات وثائق لهذه الخدمة."

                    : "No document requirements exist for this service."}

                </p>

              </div>

            ) : (

              <div className="mt-5 grid gap-4">

                {application.documents.map(

                  (document) => {

                    const actionId =

                      getDocumentActionId(

                        document

                      );



                    const hasFile =

                      Boolean(

                        actionId &&

                          document.originalName &&

                          document.status !==

                            "missing"

                      );



                    const busy =

                      actionId

                        ? documentActionId?.includes(

                            String(

                              actionId

                            )

                          )

                        : false;



                    return (

                      <article

                        key={`${document.requirementId}-${document.firestoreId || "missing"}`}

                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"

                      >

                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <strong className="text-sm font-black text-[#0e3149]">

                                {isArabic

                                  ? document.titleAr

                                  : document.titleEn}

                              </strong>



                              {document.isRequired && (

                                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-600">

                                  {isArabic

                                    ? "مطلوبة"

                                    : "Required"}

                                </span>

                              )}

                            </div>



                            {(isArabic

                              ? document.descriptionAr

                              : document.descriptionEn) && (

                              <p className="mt-2 text-xs font-semibold leading-6 text-slate-500">

                                {isArabic

                                  ? document.descriptionAr

                                  : document.descriptionEn}

                              </p>

                            )}



                            <div className="mt-3 flex flex-wrap items-center gap-2">

                              <span

                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClasses(

                                  document.status

                                )}`}

                              >

                                {documentStatusLabel(

                                  document.status,

                                  isArabic

                                )}

                              </span>



                              {hasFile && (

                                <>

                                  <span

                                    className="max-w-[300px] truncate text-xs font-bold text-slate-600"

                                    title={

                                      document.originalName ||

                                      ""

                                    }

                                  >

                                    {

                                      document.originalName

                                    }

                                  </span>



                                  <span className="text-xs font-semibold text-slate-400">

                                    {formatFileSize(

                                      document.fileSize

                                    )}

                                  </span>



                                  <span className="text-xs font-semibold text-slate-400">

                                    {formatDate(

                                      document.uploadedAt,

                                      isArabic

                                    )}

                                  </span>

                                </>

                              )}

                            </div>

                          </div>



                          {hasFile && (

                            <div className="flex shrink-0 flex-wrap gap-2">

                              <button

                                type="button"

                                disabled={

                                  busy

                                }

                                onClick={() =>

                                  void handleOpenDocument(

                                    document

                                  )

                                }

                                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#173e56] transition hover:bg-slate-100 disabled:opacity-50"

                              >

                                <ExternalLink className="h-4 w-4" />



                                {isArabic

                                  ? "فتح"

                                  : "Open"}

                              </button>



                              <button

                                type="button"

                                disabled={

                                  busy

                                }

                                onClick={() =>

                                  void handleDownloadDocument(

                                    document

                                  )

                                }

                                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#173e56] transition hover:bg-slate-100 disabled:opacity-50"

                              >

                                <Download className="h-4 w-4" />



                                {isArabic

                                  ? "تحميل"

                                  : "Download"}

                              </button>



                              <button

                                type="button"

                                disabled={

                                  busy ||

                                  document.status ===

                                    "approved"

                                }

                                onClick={() =>

                                  startReview(

                                    document,

                                    "approved"

                                  )

                                }

                                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"

                              >

                                <Check className="h-4 w-4" />



                                {isArabic

                                  ? "قبول"

                                  : "Approve"}

                              </button>



                              <button

                                type="button"

                                disabled={

                                  busy

                                }

                                onClick={() =>

                                  startReview(

                                    document,

                                    "rejected"

                                  )

                                }

                                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-black text-white transition hover:bg-rose-700 disabled:opacity-50"

                              >

                                <X className="h-4 w-4" />



                                {isArabic

                                  ? "رفض"

                                  : "Reject"}

                              </button>

                            </div>

                          )}

                        </div>



                        {!hasFile && (

                          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-400">

                            {isArabic

                              ? "لم يرفع العميل ملفًا لهذا المتطلب بعد."

                              : "The client has not uploaded a file for this requirement yet."}

                          </div>

                        )}



                        {document.reviewNote && (

                          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">

                            <strong className="text-xs font-black text-rose-700">

                              {isArabic

                                ? "ملاحظة المراجعة"

                                : "Review note"}

                            </strong>



                            <p

                              className="mt-1 text-xs font-semibold leading-6 text-rose-700"

                              dir="auto"

                            >

                              {

                                document.reviewNote

                              }

                            </p>

                          </div>

                        )}

                      </article>

                    );

                  }

                )}

              </div>

            )}

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

                  {isArabic

                    ? "إدارة مسار الطلب"

                    : "Manage workflow"}

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

                {isArabic

                  ? "حالة الطلب"

                  : "Application status"}

              </span>



              <select

                value={status}

                onChange={(event) =>

                  setStatus(

                    event.target

                      .value as AdminApplicationStatus

                  )

                }

                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none focus:border-blue-500"

              >

                {applicationStatuses.map(

                  (item) => (

                    <option

                      key={item}

                      value={item}

                    >

                      {applicationStatusLabel(

                        item,

                        isArabic

                      )}

                    </option>

                  )

                )}

              </select>

            </label>



            <label className="mt-4 block">

              <span className="mb-2 block text-sm font-black text-[#0e3149]">

                {isArabic

                  ? "المرحلة الحالية"

                  : "Current phase"}

              </span>



              <select

                value={currentStep}

                onChange={(event) =>

                  setCurrentStep(

                    event.target.value

                  )

                }

                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none focus:border-blue-500"

              >

                <option value="">

                  {isArabic

                    ? "اختر المرحلة"

                    : "Choose a phase"}

                </option>



                {workflowSteps.map(

                  (step) => (

                    <option

                      key={step.value}

                      value={step.value}

                    >

                      {isArabic

                        ? step.ar

                        : step.en}

                    </option>

                  )

                )}

              </select>

            </label>



            <label className="mt-4 block">

              <span className="mb-2 block text-sm font-black text-[#0e3149]">

                {isArabic

                  ? "ملاحظات الإدارة"

                  : "Internal notes"}

              </span>



              <textarea

                value={notes}

                onChange={(event) =>

                  setNotes(

                    event.target.value

                  )

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

                  {isArabic

                    ? "إعدادات متقدمة"

                    : "Advanced settings"}

                </span>



                <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />

              </summary>



              <div className="border-t border-slate-200 p-4">

                <label>

                  <span className="flex items-center justify-between text-xs font-black text-slate-500">

                    <span>

                      {isArabic

                        ? "تعديل التقدم يدوياً"

                        : "Manual progress"}

                    </span>



                    <span>

                      {progress}%

                    </span>

                  </span>



                  <input

                    type="range"

                    min="0"

                    max="100"

                    step="5"

                    value={progress}

                    onChange={(event) =>

                      setProgress(

                        Number(

                          event

                            .target

                            .value

                        )

                      )

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

              onClick={() =>

                void handleSave()

              }

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



      {reviewDocument && (

        <div

          className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4"

          role="dialog"

          aria-modal="true"

        >

          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <span

                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${

                    reviewAction ===

                    "approved"

                      ? "bg-emerald-100 text-emerald-700"

                      : "bg-rose-100 text-rose-700"

                  }`}

                >

                  {reviewAction ===

                  "approved"

                    ? isArabic

                      ? "قبول الوثيقة"

                      : "Approve document"

                    : isArabic

                      ? "رفض الوثيقة"

                      : "Reject document"}

                </span>



                <h3 className="mt-3 text-xl font-black text-[#0e3149]">

                  {isArabic

                    ? reviewDocument.titleAr

                    : reviewDocument.titleEn}

                </h3>

              </div>



              <button

                type="button"

                onClick={() => {

                  setReviewDocument(

                    null

                  );

                  setReviewNote("");

                }}

                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"

              >

                <X className="h-5 w-5" />

              </button>

            </div>



            <label className="mt-5 block">

              <span className="mb-2 block text-sm font-black text-[#0e3149]">

                {isArabic

                  ? "ملاحظة المراجعة"

                  : "Review note"}

              </span>



              <textarea

                rows={5}

                value={reviewNote}

                onChange={(event) =>

                  setReviewNote(

                    event.target.value

                  )

                }

                placeholder={

                  reviewAction ===

                  "rejected"

                    ? isArabic

                      ? "اشرح للعميل ما الذي يجب تصحيحه..."

                      : "Explain what the client must correct..."

                    : isArabic

                      ? "ملاحظة اختيارية..."

                      : "Optional note..."

                }

                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-semibold outline-none focus:border-blue-500"

              />

            </label>



            <div className="mt-5 flex justify-end gap-3">

              <button

                type="button"

                onClick={() => {

                  setReviewDocument(

                    null

                  );

                  setReviewNote("");

                }}

                className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600"

              >

                {isArabic

                  ? "إلغاء"

                  : "Cancel"}

              </button>



              <button

                type="button"

                disabled={Boolean(

                  documentActionId

                )}

                onClick={() =>

                  void submitReview()

                }

                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:opacity-50 ${

                  reviewAction ===

                  "approved"

                    ? "bg-emerald-600 hover:bg-emerald-700"

                    : "bg-rose-600 hover:bg-rose-700"

                }`}

              >

                {reviewAction ===

                "approved" ? (

                  <Check className="h-4 w-4" />

                ) : (

                  <X className="h-4 w-4" />

                )}



                {documentActionId

                  ? isArabic

                    ? "جاري الحفظ..."

                    : "Saving..."

                  : isArabic

                    ? "تأكيد"

                    : "Confirm"}

              </button>

            </div>

          </div>

        </div>

      )}

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
