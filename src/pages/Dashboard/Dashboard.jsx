import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { getCurrentUserRequest, logoutRequest } from "../../api/authApi.js";
import {
  createApplicationRequest,
  getMyApplicationsRequest,
} from "../../api/applicationApi.js";
import {
  deleteApplicationDocumentRequest,
  downloadApplicationDocumentRequest,
  getApplicationDocumentsRequest,
  uploadApplicationDocumentRequest,
} from "../../api/documentApi.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { usePageContent } from "../../hooks/usePageContent.js";
import { pricingFallbackContent } from "../Pricing/pricingFallbackContent.js";
import { sendNewRequestEmailRequest } from "../../api/sendNewRequestEmail.js";
import "./Dashboard.css";

const copy = {
  en: {
    langButton: "العربية",
    loading: "Loading dashboard...",
    sidebar: {
      overview: "Overview",
      request: "Request Service",
      services: "My Services",
      documents: "Documents",
      updates: "Updates",
      logout: "Logout",
    },
    topbar: {
      welcome: "Welcome",
      notifications: "Notifications",
      noNotifications: "No notifications yet.",
      markAllRead: "Mark all as read",
      workflowUpdated: "Workflow updated",
      phaseChanged: "Workflow phase changed",
      statusChanged: "Application status changed",
      viewService: "View service",
    },
    overview: {
      label: "Client Portal",
      title: "Client Dashboard",
      subtitle:
        "Track your Rita application, documents, and next steps from one place.",
    },
    cards: {
      services: "Requested services",
      status: "Latest status",
      documents: "Documents",
      progress: "Progress",
      noApplication: "No application yet",
      noApplicationText:
        "Start a service request to begin your Rita process.",
      documentsText: "Your required documents will appear here.",
      progressText: "Your company formation progress will be tracked here.",
    },
    request: {
      label: "Smart Intake Form",
      title: "Request Service",
      subtitle:
        "Choose your service and package, add your details, select payment solutions, upload the required documents, then review everything before submitting.",
      progressLabel: "Request progress",
      step: "Step",
      of: "of",
      next: "Continue",
      back: "Back",
      submit: "Submit request",
      submitting: "Submitting...",
      uploadingDocuments: "Creating your request and uploading your documents...",
      success:
        "Your request has been created successfully. The Rita team can now review it.",
      error: "Could not create the request. Please try again.",
      validationError: "Please correct the highlighted fields before continuing.",
      selected: "Selected",
      selectService: "Select service",
      required: "Required",
      optional: "Optional",
      secureNote:
        "Your information is used only to review and process your service request.",
      serviceStep: "Choose your service",
      serviceStepText:
        "Select the main service you want Rita to help you with.",
      packageStep: "Choose your package",
      packageStepText:
        "Package names, prices, and included features are loaded from the published Pricing page.",
      packageRequired: "Choose a package before continuing.",
      packagePrice: "Package price",
      packageFeatures: "What is included",
      infoStep: "Tell us about your project",
      infoStepText:
        "These details help the team understand your situation and keep you updated.",
      email: "Notification email",
      emailPlaceholder: "name@example.com",
      emailNotice:
        "We will use this email for request-status and document-review notifications.",
      paymentStep: "Choose payment solutions",
      paymentStepText:
        "Choose PayPal, Stripe, Wise, or add another solution you need.",
      otherSolution: "Choose another solution",
      otherSolutionTitle: "Other payment solution",
      otherSolutionPlaceholder: "Example: Mercury, Payoneer, Airwallex...",
      removeOtherSolution: "Remove other solution",
      documentsStep: "Upload your documents",
      documentsStepText:
        "Add the required documents now so the Rita team receives a complete request.",
      documentsRequired:
        "Please upload all required documents before submitting your request.",
      selectedFile: "Selected file",
      chooseFile: "Choose file",
      changeFile: "Change file",
      removeFile: "Remove",
      documentsSummary: "Documents",
      partialUploadError:
        "Your request was created, but one or more documents could not be uploaded. You can retry from the Documents page.",
      reviewStep: "Review and submit",
      reviewStepText:
        "Check the information below. You can return to any completed step to edit it.",
      steps: {
        1: { title: "Service", short: "What you need" },
        2: { title: "Package", short: "Choose a plan" },
        3: { title: "Information", short: "Your project" },
        4: { title: "Solutions", short: "Payment needs" },
        5: { title: "Documents", short: "Upload files" },
        6: { title: "Review", short: "Confirm request" },
      },
      phone: "Phone / WhatsApp",
      phonePlaceholder: "+213 555 00 00 00",
      country: "Country",
      countryPlaceholder: "Example: Algeria",
      businessActivity: "Business activity",
      desiredCompanyName: "Desired company name",
      desiredCompanyNamePlaceholder: "Example: Atlas Digital LLC",
      businessActivityPlaceholder:
        "Describe what your business does, your customers, and what you plan to sell...",
      paymentNeeds: "Selected solutions",
      noPaymentNeeds: "No additional payment solution selected",
      extraNotes: "Additional notes",
      extraNotesPlaceholder:
        "Add deadlines, current issues, existing accounts, or anything the Rita team should know...",
      contactSummary: "Contact and company",
      packageSummary: "Selected package",
      projectSummary: "Project details",
      edit: "Edit",
      characters: "characters",
      services: {
        us_llc: {
          title: "US LLC Formation",
          text: "Create a US legal company and prepare the formation structure.",
          badge: "Most requested",
        },
        ein_assistance: {
          title: "EIN Assistance",
          text: "Prepare and track your Employer Identification Number request.",
          badge: "IRS support",
        },
        banking_payment_setup: {
          title: "Banking & Payments",
          text: "Prepare business banking and international payment solutions.",
          badge: "Global payments",
        },
        compliance_support: {
          title: "Compliance Support",
          text: "Track annual reports, registered agent, and renewal deadlines.",
          badge: "Stay compliant",
        },
      },
      needs: {
        needsEin: {
          title: "EIN",
          text: "US tax identification number for your company.",
        },
        needsStripe: {
          title: "Stripe",
          text: "Accept card payments through your business.",
        },
        needsPaypal: {
          title: "PayPal Business",
          text: "Set up a verified business payment account.",
        },
        needsWise: {
          title: "Wise Business",
          text: "Receive international transfers and local account details.",
        },
        needsMercury: {
          title: "Mercury",
          text: "Prepare an application for US business banking.",
        },
        needsRelay: {
          title: "Relay Financial",
          text: "Alternative US business banking solution.",
        },
        needsPayoneer: {
          title: "Payoneer Business",
          text: "Receive marketplace and international business payments.",
        },
        needsShopify: {
          title: "Shopify Payments",
          text: "Prepare payment settings for an e-commerce store.",
        },
      },
      errors: {
        emailRequired: "Email address is required.",
        emailInvalid: "Enter a valid email address.",
        phoneRequired: "Phone or WhatsApp number is required.",
        countryRequired: "Country is required.",
        companyNameRequired:
          "Enter a proposed company name for the LLC formation request.",
        activityRequired: "Business activity is required.",
        activityTooShort:
          "Please add a little more detail about your activity (at least 20 characters).",
        paymentRequired:
          "Choose at least one payment or banking solution for this service.",
      },
    },
    servicesPage: {
      label: "My Services",
      title: "Requested Services",
      subtitle: "Here you can see all services you requested from Rita.",
      empty: "You have not requested any service yet.",
      service: "Service",
      status: "Status",
      progress: "Progress",
      createdAt: "Created at",
      businessActivity: "Business activity",
      paymentNeeds: "Payment needs",
      package: "Package",
      price: "Price",
      notificationEmail: "Notification email",
    },
    documentsPage: {
      label: "Secure documents",
      title: "Documents",
      subtitle:
        "Upload the documents required for each service and follow their review status from one place.",
      noApplications: "Create a service request before uploading documents.",
      startRequest: "Request a service",
      chooseApplication: "Choose the service request",
      requestNumber: "Request",
      serviceStatus: "Service status",
      secureTitle: "Private and protected",
      secureText:
        "Files are available only to you and authorized Rita team members.",
      loading: "Loading required documents...",
      loadError: "Could not load the documents for this request.",
      noRequirements: "No document requirements have been assigned to this service yet.",
      required: "Required",
      optional: "Optional",
      accepted: "PDF, JPG, JPEG or PNG",
      maxSize: "Maximum size",
      completion: "Upload completion",
      requiredCount: "Required",
      uploadedCount: "Uploaded",
      approvedCount: "Approved",
      attentionCount: "Needs attention",
      dragTitle: "Drop the document here",
      dragText: "or click to choose a file",
      upload: "Upload document",
      replace: "Replace file",
      uploading: "Uploading...",
      download: "Download",
      remove: "Remove",
      removing: "Removing...",
      fileReady: "File uploaded",
      reviewNote: "Rita team note",
      confirmDelete: "Remove this uploaded document?",
      uploadSuccess: "The document was uploaded and sent for review.",
      deleteSuccess: "The uploaded document was removed.",
      status: {
        missing: "Missing",
        uploaded: "Uploaded",
        in_review: "Under review",
        approved: "Approved",
        rejected: "Needs correction",
      },
      errors: {
        invalidType: "Choose a PDF, JPG, JPEG, or PNG file.",
        tooLarge: "The selected file is larger than the allowed size.",
        uploadFailed: "Could not upload the document.",
        downloadFailed: "Could not download the document.",
        deleteFailed: "Could not remove the document.",
      },
    },
    updatesPage: {
      label: "Updates",
      title: "Updates",
      subtitle: "Your latest file updates and notifications will appear here.",
      empty: "No updates yet.",
    },
    statusLabels: {
      draft: "Draft",
      submitted: "Submitted",
      in_review: "In review",
      waiting_documents: "Waiting documents",
      processing: "Processing",
      completed: "Completed",
      rejected: "Rejected",
    },
  },

  ar: {
    langButton: "English",
    loading: "جاري تحميل لوحة التحكم...",
    sidebar: {
      overview: "نظرة عامة",
      request: "طلب خدمة",
      services: "خدماتي",
      documents: "الوثائق",
      updates: "التحديثات",
      logout: "تسجيل الخروج",
    },
    topbar: {
      welcome: "مرحباً",
      notifications: "الإشعارات",
      noNotifications: "لا توجد إشعارات حتى الآن.",
      markAllRead: "تحديد الكل كمقروء",
      workflowUpdated: "تم تحديث سير العمل",
      phaseChanged: "تم تغيير مرحلة الطلب",
      statusChanged: "تم تغيير حالة الطلب",
      viewService: "عرض الخدمة",
    },
    overview: {
      label: "بوابة العميل",
      title: "لوحة العميل",
      subtitle: "تابع طلباتك مع Rita، والوثائق، والخطوات القادمة من مكان واحد.",
    },
    cards: {
      services: "الخدمات المطلوبة",
      status: "آخر حالة",
      documents: "الوثائق",
      progress: "التقدم",
      noApplication: "لا يوجد طلب بعد",
      noApplicationText: "ابدأ طلب خدمة حتى ينطلق مسارك مع Rita.",
      documentsText: "ستظهر الوثائق المطلوبة هنا.",
      progressText: "سيتم تتبع تقدم ملفك هنا.",
    },
    request: {
      label: "نموذج الطلب الذكي",
      title: "طلب خدمة",
      subtitle:
        "اختر الخدمة والباقة، أضف معلوماتك، حدد حلول الدفع، ارفع الوثائق المطلوبة، ثم راجع كل شيء قبل الإرسال.",
      progressLabel: "تقدم الطلب",
      step: "الخطوة",
      of: "من",
      next: "متابعة",
      back: "رجوع",
      submit: "إرسال الطلب",
      submitting: "جاري الإرسال...",
      uploadingDocuments: "جاري إنشاء الطلب ورفع الوثائق...",
      success: "تم إنشاء طلبك بنجاح، ويمكن لفريق Rita الآن مراجعته.",
      error: "تعذر إنشاء الطلب. حاول مرة أخرى.",
      validationError: "صحح الحقول المحددة قبل المتابعة.",
      selected: "تم الاختيار",
      selectService: "اختيار الخدمة",
      required: "مطلوب",
      optional: "اختياري",
      secureNote:
        "تُستخدم معلوماتك فقط لمراجعة طلب الخدمة ومعالجته من طرف فريق Rita.",
      serviceStep: "اختر الخدمة المناسبة",
      serviceStepText:
        "حدد الخدمة الأساسية التي تريد مساعدة Rita فيها.",
      packageStep: "اختر الباقة",
      packageStepText:
        "أسماء الباقات والأسعار والمميزات تُقرأ مباشرة من صفحة الأسعار المنشورة.",
      packageRequired: "اختر باقة قبل المتابعة.",
      packagePrice: "سعر الباقة",
      packageFeatures: "ماذا تتضمن الباقة",
      infoStep: "أخبرنا عن مشروعك",
      infoStepText:
        "تساعد هذه المعلومات الفريق على فهم وضعك والتواصل معك وإبقائك على اطلاع.",
      email: "بريد الإشعارات",
      emailPlaceholder: "name@example.com",
      emailNotice:
        "سنستخدم هذا البريد لإشعارات حالة الطلب ومراجعة الوثائق.",
      paymentStep: "اختر حلول الدفع",
      paymentStepText:
        "اختر PayPal أو Stripe أو Wise، وإذا كنت تحتاج حلاً آخر يمكنك كتابته بنفسك.",
      otherSolution: "اختيار حل آخر",
      otherSolutionTitle: "حل دفع آخر",
      otherSolutionPlaceholder: "مثال: Mercury أو Payoneer أو Airwallex...",
      removeOtherSolution: "إزالة الحل الآخر",
      documentsStep: "ارفع الوثائق",
      documentsStepText:
        "أضف الوثائق المطلوبة الآن حتى يستلم فريق Rita طلباً كاملاً من البداية.",
      documentsRequired:
        "يجب رفع جميع الوثائق المطلوبة قبل إرسال الطلب.",
      selectedFile: "الملف المختار",
      chooseFile: "اختيار ملف",
      changeFile: "تغيير الملف",
      removeFile: "إزالة",
      documentsSummary: "الوثائق",
      partialUploadError:
        "تم إنشاء الطلب، لكن تعذر رفع وثيقة أو أكثر. يمكنك إعادة المحاولة من صفحة الوثائق.",
      reviewStep: "راجع الطلب ثم أرسله",
      reviewStepText:
        "تحقق من المعلومات أدناه، ويمكنك الرجوع إلى أي خطوة مكتملة لتعديلها.",
      steps: {
        1: { title: "الخدمة", short: "ماذا تحتاج؟" },
        2: { title: "الباقة", short: "اختر الخطة" },
        3: { title: "المعلومات", short: "تفاصيل مشروعك" },
        4: { title: "الحلول", short: "حلول الدفع" },
        5: { title: "الوثائق", short: "رفع الملفات" },
        6: { title: "المراجعة", short: "تأكيد الطلب" },
      },
      phone: "الهاتف / واتساب",
      phonePlaceholder: "+213 555 00 00 00",
      country: "الدولة",
      countryPlaceholder: "مثال: الجزائر",
      businessActivity: "نشاط العمل",
      desiredCompanyName: "اسم الشركة المقترح",
      desiredCompanyNamePlaceholder: "مثال: Atlas Digital LLC",
      businessActivityPlaceholder:
        "اشرح نشاط مشروعك، وعملاءك، والخدمات أو المنتجات التي تخطط لبيعها...",
      paymentNeeds: "الحلول المختارة",
      noPaymentNeeds: "لم يتم اختيار حل دفع إضافي",
      extraNotes: "ملاحظات إضافية",
      extraNotesPlaceholder:
        "أضف الآجال المهمة، أو المشاكل الحالية، أو الحسابات الموجودة، أو أي معلومة يجب أن يعرفها فريق Rita...",
      contactSummary: "بيانات التواصل والشركة",
      packageSummary: "الباقة المختارة",
      projectSummary: "تفاصيل المشروع",
      edit: "تعديل",
      characters: "حرفاً",
      services: {
        us_llc: {
          title: "تأسيس LLC أمريكية",
          text: "إنشاء شركة قانونية أمريكية وتجهيز هيكل التأسيس.",
          badge: "الأكثر طلباً",
        },
        ein_assistance: {
          title: "مساعدة EIN",
          text: "تجهيز ومتابعة طلب الرقم الضريبي الأمريكي للشركة.",
          badge: "دعم IRS",
        },
        banking_payment_setup: {
          title: "الحسابات والمدفوعات",
          text: "تجهيز الحسابات البنكية وحلول الدفع الدولية المناسبة.",
          badge: "مدفوعات عالمية",
        },
        compliance_support: {
          title: "دعم الامتثال",
          text: "متابعة التقارير السنوية والوكيل المسجل ومواعيد التجديد.",
          badge: "حماية الشركة",
        },
      },
      needs: {
        needsEin: {
          title: "EIN",
          text: "الرقم الضريبي الأمريكي الخاص بالشركة.",
        },
        needsStripe: {
          title: "Stripe",
          text: "استقبال المدفوعات بالبطاقات من خلال شركتك.",
        },
        needsPaypal: {
          title: "PayPal Business",
          text: "إعداد حساب دفع تجاري موثّق.",
        },
        needsWise: {
          title: "Wise Business",
          text: "استقبال التحويلات الدولية وبيانات حسابات محلية.",
        },
        needsMercury: {
          title: "Mercury",
          text: "تجهيز طلب حساب بنكي تجاري أمريكي.",
        },
        needsRelay: {
          title: "Relay Financial",
          text: "حل بديل للحسابات البنكية التجارية الأمريكية.",
        },
        needsPayoneer: {
          title: "Payoneer Business",
          text: "استقبال مدفوعات المنصات والعملاء الدوليين.",
        },
        needsShopify: {
          title: "Shopify Payments",
          text: "تجهيز إعدادات الدفع الخاصة بالمتجر الإلكتروني.",
        },
      },
      errors: {
        emailRequired: "البريد الإلكتروني مطلوب.",
        emailInvalid: "أدخل بريداً إلكترونياً صحيحاً.",
        phoneRequired: "رقم الهاتف أو واتساب مطلوب.",
        countryRequired: "الدولة مطلوبة.",
        companyNameRequired: "أدخل اسماً مقترحاً للشركة المراد تأسيسها.",
        activityRequired: "وصف نشاط العمل مطلوب.",
        activityTooShort:
          "أضف تفاصيل أكثر عن النشاط، على الأقل 20 حرفاً.",
        paymentRequired:
          "اختر حلاً واحداً على الأقل للحسابات أو المدفوعات.",
      },
    },
    servicesPage: {
      label: "خدماتي",
      title: "الخدمات المطلوبة",
      subtitle: "هنا تجد كل الخدمات التي طلبتها من Rita.",
      empty: "لم تطلب أي خدمة بعد.",
      service: "الخدمة",
      status: "الحالة",
      progress: "التقدم",
      createdAt: "تاريخ الإنشاء",
      businessActivity: "نشاط العمل",
      paymentNeeds: "احتياجات الدفع",
      package: "الباقة",
      price: "السعر",
      notificationEmail: "بريد الإشعارات",
    },
    documentsPage: {
      label: "وثائق آمنة",
      title: "الوثائق",
      subtitle:
        "ارفع الوثائق المطلوبة لكل خدمة وتابع حالة مراجعتها من مكان واحد.",
      noApplications: "أنشئ طلب خدمة أولاً حتى تتمكن من رفع الوثائق.",
      startRequest: "طلب خدمة",
      chooseApplication: "اختر طلب الخدمة",
      requestNumber: "الطلب",
      serviceStatus: "حالة الخدمة",
      secureTitle: "خصوصية وحماية",
      secureText:
        "لا يمكن الوصول إلى الملفات إلا من طرفك وأعضاء فريق Rita المصرح لهم.",
      loading: "جاري تحميل الوثائق المطلوبة...",
      loadError: "تعذر تحميل وثائق هذا الطلب.",
      noRequirements: "لم يتم تحديد وثائق مطلوبة لهذه الخدمة بعد.",
      required: "مطلوب",
      optional: "اختياري",
      accepted: "PDF أو JPG أو JPEG أو PNG",
      maxSize: "الحجم الأقصى",
      completion: "اكتمال الرفع",
      requiredCount: "المطلوبة",
      uploadedCount: "المرفوعة",
      approvedCount: "المقبولة",
      attentionCount: "تحتاج انتباهاً",
      dragTitle: "أفلت الوثيقة هنا",
      dragText: "أو اضغط لاختيار ملف",
      upload: "رفع الوثيقة",
      replace: "استبدال الملف",
      uploading: "جاري الرفع...",
      download: "تحميل",
      remove: "حذف",
      removing: "جاري الحذف...",
      fileReady: "تم رفع الملف",
      reviewNote: "ملاحظة فريق Rita",
      confirmDelete: "هل تريد حذف هذه الوثيقة المرفوعة؟",
      uploadSuccess: "تم رفع الوثيقة وإرسالها للمراجعة.",
      deleteSuccess: "تم حذف الوثيقة المرفوعة.",
      status: {
        missing: "غير مرفوعة",
        uploaded: "تم الرفع",
        in_review: "قيد المراجعة",
        approved: "تمت الموافقة",
        rejected: "تحتاج إلى تصحيح",
      },
      errors: {
        invalidType: "اختر ملفاً بصيغة PDF أو JPG أو JPEG أو PNG.",
        tooLarge: "حجم الملف المختار أكبر من الحد المسموح.",
        uploadFailed: "تعذر رفع الوثيقة.",
        downloadFailed: "تعذر تحميل الوثيقة.",
        deleteFailed: "تعذر حذف الوثيقة.",
      },
    },
    updatesPage: {
      label: "التحديثات",
      title: "التحديثات",
      subtitle: "ستظهر هنا آخر تحديثات ملفك وإشعاراتك.",
      empty: "لا توجد تحديثات بعد.",
    },
    statusLabels: {
      draft: "مسودة",
      submitted: "تم الإرسال",
      in_review: "قيد المراجعة",
      waiting_documents: "بانتظار الوثائق",
      processing: "قيد المعالجة",
      completed: "مكتمل",
      rejected: "مرفوض",
    },
  },
};

const serviceTypes = [
  "us_llc",
  "ein_assistance",
  "banking_payment_setup",
  "compliance_support",
];

const serviceIcons = {
  us_llc: "🏢",
  ein_assistance: "#",
  banking_payment_setup: "💳",
  compliance_support: "🛡",
};

const paymentNeedFields = [
  "needsPaypal",
  "needsStripe",
  "needsWise",
];

const requestDocumentRequirements = {
  us_llc: [
    {
      requirementId: 16,
      code: "us_llc_passport",
      titleEn: "Passport copy",
      titleAr: "نسخة من جواز السفر",
      descriptionEn:
        "Upload a clear copy of the passport information page.",
      descriptionAr:
        "ارفع نسخة واضحة من صفحة المعلومات في جواز السفر.",
      required: true,
      maxSizeMb: 5,
    },
    {
      requirementId: 17,
      code: "us_llc_proof_of_address",
      titleEn: "Proof of address",
      titleAr: "إثبات العنوان",
      descriptionEn:
        "Upload a recent utility bill, bank statement, or other proof of address.",
      descriptionAr:
        "ارفع فاتورة خدمات حديثة أو كشف حساب بنكي أو وثيقة تثبت العنوان.",
      required: true,
      maxSizeMb: 5,
    },
  ],
  ein_assistance: [],
  banking_payment_setup: [],
  compliance_support: [],
};

function createInitialIntakeForm(email = "") {
  return {
    serviceType: "us_llc",
    packageSlug: "",
    email,
    phone: "",
    country: "",
    businessActivity: "",
    desiredCompanyName: "",
    needsEin: true,
    needsStripe: false,
    needsPaypal: false,
    needsWise: false,
    needsMercury: false,
    needsRelay: false,
    needsPayoneer: false,
    needsShopify: false,
    otherPaymentSolution: "",
    extraNotes: "",
  };
}

function createEmptyDocumentSummary() {
  return {
    total: 0,
    required: 0,
    uploaded: 0,
    uploadedRequired: 0,
    approved: 0,
    inReview: 0,
    rejected: 0,
    missing: 0,
    progress: 0,
    approvalProgress: 0,
  };
}


function getDashboardUserKey(user) {
  return String(
    user?.id ||
      user?.uid ||
      user?.email ||
      "anonymous"
  );
}

function getNotificationsStorageKey(user) {
  return `rita-dashboard-notifications:${getDashboardUserKey(user)}`;
}

function getApplicationsSnapshotStorageKey(user) {
  return `rita-dashboard-applications-snapshot:${getDashboardUserKey(user)}`;
}

function readLocalStorageJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorageJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures. The dashboard still works without persistence.
  }
}

function createApplicationsSnapshot(applications = []) {
  return applications.reduce((snapshot, application) => {
    const id = String(application?.id ?? "");

    if (!id) {
      return snapshot;
    }

    snapshot[id] = {
      id,
      serviceType: application?.serviceType || "",
      status: application?.status || "",
      currentStep:
        application?.currentStep ??
        application?.current_step ??
        "",
      updatedAt:
        application?.updatedAt ??
        application?.updated_at ??
        "",
    };

    return snapshot;
  }, {});
}

function Dashboard() {
  const navigate = useNavigate();
  const languageContext = useLanguage();

  const lang = languageContext?.lang || "en";
  const isArabic = languageContext?.isArabic ?? lang === "ar";
  const changeLanguage = languageContext?.changeLanguage || (() => {});
  const t = copy[lang] || copy.en;

  const { content: pricingPageContent } = usePageContent(
    "pricing",
    pricingFallbackContent
  );

  const pricingContent =
    pricingPageContent?.[lang] ||
    pricingFallbackContent?.[lang] ||
    pricingFallbackContent?.en ||
    {};

  const pricingPackages = Array.isArray(pricingContent?.packages)
    ? pricingContent.packages
    : [];

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  const [activePage, setActivePage] = useState("overview");
  const [intakeStep, setIntakeStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [intakeForm, setIntakeForm] = useState(createInitialIntakeForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestDocumentFiles, setRequestDocumentFiles] = useState({});
  const [showOtherSolution, setShowOtherSolution] = useState(false);

  const [selectedDocumentApplicationId, setSelectedDocumentApplicationId] =
    useState(null);
  const [documentItems, setDocumentItems] = useState([]);
  const [documentSummary, setDocumentSummary] = useState(
    createEmptyDocumentSummary
  );
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [documentMessage, setDocumentMessage] = useState("");
  const [uploadingRequirementId, setUploadingRequirementId] = useState(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [dragRequirementId, setDragRequirementId] = useState(null);

  const currentRequestDocuments =
    requestDocumentRequirements[intakeForm.serviceType] || [];

  const selectedPackage =
    pricingPackages.find((plan) => plan.slug === intakeForm.packageSlug) || null;

  const activeApplication =
    applications.find((app) => !["completed", "rejected"].includes(app.status)) ||
    applications[0] ||
    null;

  const selectedDocumentApplication =
    applications.find(
      (application) =>
        Number(application.id) === Number(selectedDocumentApplicationId)
    ) || null;


  function persistNotifications(nextNotifications, targetUser = user) {
    const normalized = nextNotifications.slice(0, 40);
    setNotifications(normalized);

    if (targetUser) {
      writeLocalStorageJson(
        getNotificationsStorageKey(targetUser),
        normalized
      );
    }
  }

  function restoreNotifications(targetUser) {
    const stored = readLocalStorageJson(
      getNotificationsStorageKey(targetUser),
      []
    );

    setNotifications(Array.isArray(stored) ? stored : []);
  }

  function detectApplicationChanges(nextApplications, targetUser = user) {
    if (!targetUser) {
      return;
    }

    const snapshotKey = getApplicationsSnapshotStorageKey(targetUser);
    const previousSnapshot = readLocalStorageJson(snapshotKey, null);
    const nextSnapshot = createApplicationsSnapshot(nextApplications);

    // The first visit establishes a baseline. We do not create fake
    // notifications for states that already existed before this feature.
    if (!previousSnapshot || typeof previousSnapshot !== "object") {
      writeLocalStorageJson(snapshotKey, nextSnapshot);
      return;
    }

    const newNotifications = [];

    Object.values(nextSnapshot).forEach((nextApplication) => {
      const previousApplication = previousSnapshot[nextApplication.id];

      if (!previousApplication) {
        return;
      }

      const statusChanged =
        String(previousApplication.status || "") !==
        String(nextApplication.status || "");

      const phaseChanged =
        String(previousApplication.currentStep || "") !==
        String(nextApplication.currentStep || "");

      if (!statusChanged && !phaseChanged) {
        return;
      }

      const createdAt = new Date().toISOString();

      newNotifications.push({
        id: [
          nextApplication.id,
          nextApplication.updatedAt || createdAt,
          nextApplication.status || "status",
          nextApplication.currentStep || "phase",
        ].join(":"),
        applicationId: nextApplication.id,
        serviceType: nextApplication.serviceType,
        statusChanged,
        phaseChanged,
        previousStatus: previousApplication.status || "",
        status: nextApplication.status || "",
        previousStep: previousApplication.currentStep || "",
        currentStep: nextApplication.currentStep || "",
        createdAt,
        read: false,
      });
    });

    writeLocalStorageJson(snapshotKey, nextSnapshot);

    if (newNotifications.length === 0) {
      return;
    }

    setNotifications((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      const uniqueNew = newNotifications.filter(
        (item) => !existingIds.has(item.id)
      );
      const merged = [...uniqueNew, ...current].slice(0, 40);

      writeLocalStorageJson(
        getNotificationsStorageKey(targetUser),
        merged
      );

      return merged;
    });
  }

  async function refreshApplications({ silent = true } = {}) {
    try {
      const applicationsData = await getMyApplicationsRequest();
      const nextApplications = applicationsData.applications || [];

      detectApplicationChanges(nextApplications, user);
      setApplications(nextApplications);
    } catch (error) {
      if (!silent) {
        console.error("DASHBOARD_APPLICATION_REFRESH_ERROR:", error);
      }
    }
  }

  function markAllNotificationsRead() {
    setNotifications((current) => {
      if (!current.some((item) => !item.read)) {
        return current;
      }

      const next = current.map((item) => ({
        ...item,
        read: true,
      }));

      if (user) {
        writeLocalStorageJson(
          getNotificationsStorageKey(user),
          next
        );
      }

      return next;
    });
  }

  function toggleNotifications() {
    setNotificationsOpen((current) => !current);
  }

  function markNotificationRead(notificationId) {
    setNotifications((current) => {
      const next = current.map((item) =>
        item.id === notificationId
          ? { ...item, read: true }
          : item
      );

      if (user) {
        writeLocalStorageJson(
          getNotificationsStorageKey(user),
          next
        );
      }

      return next;
    });
  }

  function formatWorkflowPhase(value) {
    if (!value) {
      return isArabic ? "غير محددة" : "Not specified";
    }

    const normalized = String(value).trim().toLowerCase();

    const phaseLabels = {
      request_submitted: {
        en: "Request submitted",
        ar: "تم إرسال الطلب",
      },
      submitted: {
        en: "Request submitted",
        ar: "تم إرسال الطلب",
      },
      documents_review: {
        en: "Document review",
        ar: "مراجعة الوثائق",
      },
      document_review: {
        en: "Document review",
        ar: "مراجعة الوثائق",
      },
      waiting_documents: {
        en: "Waiting for documents",
        ar: "بانتظار الوثائق",
      },
      company_formation: {
        en: "Company formation",
        ar: "تأسيس الشركة",
      },
      formation: {
        en: "Company formation",
        ar: "تأسيس الشركة",
      },
      ein_processing: {
        en: "EIN processing",
        ar: "معالجة EIN",
      },
      banking_setup: {
        en: "Banking setup",
        ar: "إعداد الحساب البنكي",
      },
      payment_setup: {
        en: "Payment setup",
        ar: "إعداد حلول الدفع",
      },
      processing: {
        en: "Processing",
        ar: "قيد المعالجة",
      },
      completed: {
        en: "Completed",
        ar: "مكتمل",
      },
    };

    const translated = phaseLabels[normalized];

    if (translated) {
      return isArabic ? translated.ar : translated.en;
    }

    return String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getNotificationTitle(notification) {
    if (notification.phaseChanged && notification.statusChanged) {
      return t.topbar.workflowUpdated;
    }

    if (notification.phaseChanged) {
      return t.topbar.phaseChanged;
    }

    return t.topbar.statusChanged;
  }

  function getNotificationMessage(notification) {
    const serviceName =
      t.request.services[notification.serviceType]?.title ||
      notification.serviceType ||
      (isArabic ? "الطلب" : "application");

    const parts = [];

    if (notification.phaseChanged) {
      parts.push(
        isArabic
          ? `المرحلة الجديدة: ${formatWorkflowPhase(notification.currentStep)}`
          : `New phase: ${formatWorkflowPhase(notification.currentStep)}`
      );
    }

    if (notification.statusChanged) {
      const statusLabel =
        t.statusLabels[notification.status] ||
        formatWorkflowPhase(notification.status);

      parts.push(
        isArabic
          ? `الحالة الجديدة: ${statusLabel}`
          : `New status: ${statusLabel}`
      );
    }

    return `${serviceName} — ${parts.join(isArabic ? "، " : ", ")}`;
  }

  function formatNotificationTime(value) {
    if (!value) {
      return "";
    }

    try {
      return new Intl.DateTimeFormat(isArabic ? "ar-DZ" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return "";
    }
  }

  function openNotification(notification) {
    markNotificationRead(notification.id);
    setNotificationsOpen(false);
    changePage("services");
  }

  async function loadDashboard() {
    try {
      const userData = await getCurrentUserRequest();
      setUser(userData.user);

      setIntakeForm((current) => ({
        ...current,
        email: current.email || userData.user?.email || "",
      }));

      restoreNotifications(userData.user);

      const applicationsData = await getMyApplicationsRequest();
      const nextApplications = applicationsData.applications || [];

      detectApplicationChanges(nextApplications, userData.user);
      setApplications(nextApplications);
    } catch (error) {
      console.error(error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutRequest();
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  }

  function handleLanguageToggle() {
    const nextLang = isArabic ? "en" : "ar";

    try {
      changeLanguage(nextLang);
    } catch {
      changeLanguage();
    }
  }

  function changePage(page) {
    setActivePage(page);
    setRequestError("");
    setRequestMessage("");
    window.history.replaceState(null, "", `/dashboard#${page}`);
  }

  function clearFieldError(field) {
    setFieldErrors((current) => {
      if (!current[field] && !paymentNeedFields.includes(field)) return current;

      const next = { ...current };
      delete next[field];

      if (paymentNeedFields.includes(field)) {
        delete next.paymentNeeds;
      }

      return next;
    });
  }

  function updateIntakeField(field, value) {
    setIntakeForm((current) => ({
      ...current,
      [field]: value,
    }));

    clearFieldError(field);
    setRequestError("");
  }

  function handleServiceSelect(serviceType) {
    setIntakeForm((current) => ({
      ...current,
      serviceType,
      packageSlug: "",
      needsEin:
        serviceType === "us_llc" || serviceType === "ein_assistance",
      needsPaypal: false,
      needsStripe: false,
      needsWise: false,
      needsMercury: false,
      needsRelay: false,
      needsPayoneer: false,
      needsShopify: false,
      otherPaymentSolution: "",
    }));

    setShowOtherSolution(false);
    setRequestDocumentFiles({});
    setFieldErrors({});
    setRequestError("");
  }

  function getSelectedPaymentFields(form = intakeForm) {
    return paymentNeedFields.filter((field) => Boolean(form[field]));
  }

  function hasCustomPaymentSolution(form = intakeForm) {
    return Boolean(form.otherPaymentSolution?.trim());
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function formatPackagePrice(plan) {
    if (!plan) return "—";

    const currency = plan.currency || "$";
    const value = String(plan.price ?? "");
    const formatted = value.startsWith(currency)
      ? value
      : `${currency}${value}`;

    return plan.period ? `${formatted} / ${plan.period}` : formatted;
  }

  function getValidationErrors(step, form = intakeForm) {
    const errors = {};

    if (step === 2 && !form.packageSlug) {
      errors.packageSlug = t.request.packageRequired;
    }

    if (step === 3) {
      if (!form.email?.trim()) {
        errors.email = t.request.errors.emailRequired;
      } else if (!isValidEmail(form.email)) {
        errors.email = t.request.errors.emailInvalid;
      }

      if (!form.phone.trim()) {
        errors.phone = t.request.errors.phoneRequired;
      }

      if (!form.country.trim()) {
        errors.country = t.request.errors.countryRequired;
      }

      if (
        form.serviceType === "us_llc" &&
        !form.desiredCompanyName.trim()
      ) {
        errors.desiredCompanyName = t.request.errors.companyNameRequired;
      }

      if (!form.businessActivity.trim()) {
        errors.businessActivity = t.request.errors.activityRequired;
      } else if (form.businessActivity.trim().length < 20) {
        errors.businessActivity = t.request.errors.activityTooShort;
      }
    }

    if (
      step === 4 &&
      form.serviceType === "banking_payment_setup" &&
      getSelectedPaymentFields(form).length === 0 &&
      !hasCustomPaymentSolution(form)
    ) {
      errors.paymentNeeds = t.request.errors.paymentRequired;
    }

    if (step === 5) {
      const missingRequiredDocument = currentRequestDocuments.some(
        (document) =>
          document.required &&
          !requestDocumentFiles[document.requirementId]
      );

      if (missingRequiredDocument) {
        errors.documents = t.request.documentsRequired;
      }
    }

    return errors;
  }

  function validateStep(step) {
    const errors = getValidationErrors(step);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setRequestError(t.request.validationError);
      return false;
    }

    setRequestError("");
    return true;
  }

  function goToNextStep() {
    if (!validateStep(intakeStep)) return;

    const nextStep = Math.min(intakeStep + 1, 6);
    setIntakeStep(nextStep);
    setMaxStepReached((current) => Math.max(current, nextStep));
  }

  function goToPreviousStep() {
    setRequestError("");
    setFieldErrors({});
    setIntakeStep((current) => Math.max(current - 1, 1));
  }

  function goToAccessibleStep(step) {
    if (step > maxStepReached || creating) return;

    setRequestError("");
    setFieldErrors({});
    setIntakeStep(step);
  }

  function handleRequestDocumentSelect(document, file) {
    if (!file) return;

    const validationMessage = validateDocumentFile(file, {
      maxSizeMb: document.maxSizeMb,
    });

    if (validationMessage) {
      setRequestError(validationMessage);
      return;
    }

    setRequestDocumentFiles((current) => ({
      ...current,
      [document.requirementId]: file,
    }));

    setRequestError("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.documents;
      return next;
    });
  }

  function removeRequestDocument(requirementId) {
    setRequestDocumentFiles((current) => {
      const next = { ...current };
      delete next[requirementId];
      return next;
    });
  }

  async function handleCreateRequest(event) {
    event.preventDefault();

    const packageErrors = getValidationErrors(2);
    const infoErrors = getValidationErrors(3);
    const paymentErrors = getValidationErrors(4);
    const documentErrors = getValidationErrors(5);

    const allErrors = {
      ...packageErrors,
      ...infoErrors,
      ...paymentErrors,
      ...documentErrors,
    };

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setRequestError(t.request.validationError);

      if (Object.keys(packageErrors).length > 0) {
        setIntakeStep(2);
      } else if (Object.keys(infoErrors).length > 0) {
        setIntakeStep(3);
      } else if (Object.keys(paymentErrors).length > 0) {
        setIntakeStep(4);
      } else {
        setIntakeStep(5);
      }

      return;
    }

    setCreating(true);
    setRequestError("");
    setRequestMessage("");

    try {
      const customSolution = intakeForm.otherPaymentSolution?.trim() || "";
      const packageSnapshot = selectedPackage
        ? {
            slug: selectedPackage.slug,
            name: selectedPackage.name,
            price: selectedPackage.price,
            currency: selectedPackage.currency || "$",
            period: selectedPackage.period || "",
          }
        : null;

      const originalNotes = intakeForm.extraNotes.trim();

      const packageNote = packageSnapshot
        ? `${
            isArabic ? "الباقة المختارة" : "Selected package"
          }: ${packageSnapshot.name} - ${formatPackagePrice(selectedPackage)}`
        : "";

      const customSolutionNote = customSolution
        ? `${
            isArabic ? "حل دفع إضافي" : "Additional payment solution"
          }: ${customSolution}`
        : "";

      const notificationEmailNote = `${
        isArabic ? "بريد الإشعارات" : "Notification email"
      }: ${intakeForm.email.trim()}`;

      const payload = {
        ...intakeForm,
        email: intakeForm.email.trim(),
        packageSlug: packageSnapshot?.slug || "",
        packageName: packageSnapshot?.name || "",
        packagePrice: packageSnapshot?.price ?? "",
        packageCurrency: packageSnapshot?.currency || "$",
        packagePeriod: packageSnapshot?.period || "",
        extraNotes: [
          originalNotes,
          notificationEmailNote,
          packageNote,
          customSolutionNote,
        ]
          .filter(Boolean)
          .join("\n"),
      };

      const data = await createApplicationRequest(payload);
      const application = data.application;

      const documentsToUpload = currentRequestDocuments.filter((document) =>
        Boolean(requestDocumentFiles[document.requirementId])
      );

      let uploadFailed = false;

      for (const document of documentsToUpload) {
        const file = requestDocumentFiles[document.requirementId];

        try {
          await uploadApplicationDocumentRequest(
            application.id,
            document.requirementId,
            file
          );
        } catch (uploadError) {
          console.error("REQUEST_DOCUMENT_UPLOAD_ERROR:", uploadError);
          uploadFailed = true;
        }
      }

      setApplications((current) => [application, ...current]);
      setSelectedDocumentApplicationId(application.id);

      if (uploadFailed) {
        setRequestDocumentFiles({});
        setIntakeForm(createInitialIntakeForm(user?.email || ""));
        setShowOtherSolution(false);
        setIntakeStep(1);
        setMaxStepReached(1);
        setFieldErrors({});
        setDocumentError(t.request.partialUploadError);
        setActivePage("documents");
        window.history.replaceState(null, "", "/dashboard#documents");
        return;
      }

      try {
        await sendNewRequestEmailRequest({
          userName: user?.fullName || "",
          userEmail: intakeForm.email.trim(),
          phone: intakeForm.phone.trim(),
          country: intakeForm.country.trim(),
          applicationId: application.id,
          serviceName:
            t.request.services[intakeForm.serviceType]?.title ||
            intakeForm.serviceType,
          packageName: packageSnapshot?.name || "",
          packagePrice: selectedPackage
            ? formatPackagePrice(selectedPackage)
            : "",
          desiredCompanyName:
            intakeForm.desiredCompanyName.trim(),
          businessActivity:
            intakeForm.businessActivity.trim(),
          requestedSolutions:
            selectedPaymentTitles.join(", "),
          extraNotes:
            intakeForm.extraNotes.trim(),
        });
      } catch (emailError) {
        console.error(
          "NEW_REQUEST_ADMIN_EMAIL_ERROR:",
          emailError
        );
      }

      setIntakeForm(createInitialIntakeForm(user?.email || ""));
      setRequestDocumentFiles({});
      setShowOtherSolution(false);
      setIntakeStep(1);
      setMaxStepReached(1);
      setFieldErrors({});
      setRequestMessage(t.request.success);
      setActivePage("services");
      window.history.replaceState(null, "", "/dashboard#services");
    } catch (error) {
      console.error(error);
      setRequestError(error.message || t.request.error);
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    try {
      return new Intl.DateTimeFormat(isArabic ? "ar-DZ" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(dateValue));
    } catch {
      return "—";
    }
  }

  function getPaymentNeeds(application) {
    if (!application?.intake) return [];

    const result = paymentNeedFields
      .filter((field) => Boolean(application.intake[field]))
      .map((field) => t.request.needs[field]?.title || field);

    const customSolution =
      application.intake.otherPaymentSolution ||
      application.intake.other_payment_solution;

    if (customSolution?.trim()) {
      result.push(customSolution.trim());
    }

    return result;
  }

  function getApplicationExtraNotes(application) {
    const intake = application?.intake || {};

    return String(
      intake.extraNotes ||
        intake.extra_notes ||
        application?.extraNotes ||
        application?.extra_notes ||
        application?.notes ||
        ""
    );
  }

  function getPackageFromExtraNotes(application) {
    const notes = getApplicationExtraNotes(application);

    if (!notes.trim()) {
      return null;
    }

    const packageLine = notes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) =>
        /^(?:Selected package|الباقة المختارة)\s*:/i.test(line)
      );

    if (!packageLine) {
      return null;
    }

    const value = packageLine
      .replace(/^(?:Selected package|الباقة المختارة)\s*:\s*/i, "")
      .trim();

    if (!value) {
      return null;
    }

    // Example:
    // باقة البداية - $299 / دفعة واحدة
    // Starter Package - $299 / one-time
    const match = value.match(
      /^(.*?)\s*-\s*([^\d\s]?)([\d.,]+)(?:\s*\/\s*(.*))?$/
    );

    if (!match) {
      const livePlanByName = pricingPackages.find(
        (plan) => String(plan?.name || "").trim() === value
      );

      return livePlanByName || {
        slug: "",
        name: value,
        price: "",
        currency: "$",
        period: "",
      };
    }

    const [, parsedName, parsedCurrency, parsedPrice, parsedPeriod] = match;
    const cleanName = parsedName.trim();

    const livePlanByName = pricingPackages.find(
      (plan) => String(plan?.name || "").trim() === cleanName
    );

    if (livePlanByName) {
      return livePlanByName;
    }

    return {
      slug: "",
      name: cleanName || "—",
      price: String(parsedPrice || "").replace(/,/g, ""),
      currency: parsedCurrency || "$",
      period: String(parsedPeriod || "").trim(),
    };
  }

  function getApplicationPackage(application) {
    const intake = application?.intake || {};

    const slug =
      intake.packageSlug ||
      intake.package_slug ||
      application?.packageSlug ||
      application?.package_slug ||
      "";

    const livePlan = pricingPackages.find(
      (plan) => String(plan?.slug || "") === String(slug)
    );

    if (livePlan) {
      return livePlan;
    }

    const name =
      intake.packageName ||
      intake.package_name ||
      application?.packageName ||
      application?.package_name ||
      "";

    const price =
      intake.packagePrice ??
      intake.package_price ??
      application?.packagePrice ??
      application?.package_price ??
      "";

    if (name || price !== "") {
      const livePlanByName = pricingPackages.find(
        (plan) => String(plan?.name || "").trim() === String(name).trim()
      );

      if (livePlanByName) {
        return livePlanByName;
      }

      return {
        slug,
        name: name || "—",
        price,
        currency:
          intake.packageCurrency ||
          intake.package_currency ||
          application?.packageCurrency ||
          application?.package_currency ||
          "$",
        period:
          intake.packagePeriod ||
          intake.package_period ||
          application?.packagePeriod ||
          application?.package_period ||
          "",
      };
    }

    // Compatibility with requests created before package fields
    // were stored as their own Firestore fields.
    return getPackageFromExtraNotes(application);
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    try {
      return new Intl.DateTimeFormat(isArabic ? "ar-DZ" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(dateValue));
    } catch {
      return "—";
    }
  }

  function getPaymentNeeds(application) {
    if (!application?.intake) return [];

    return paymentNeedFields
      .filter((field) => Boolean(application.intake[field]))
      .map((field) => t.request.needs[field]?.title || field);
  }

  function formatFileSize(bytes) {
    const size = Number(bytes || 0);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getDocumentTitle(document) {
    return isArabic ? document.titleAr : document.titleEn;
  }

  function getDocumentDescription(document) {
    return isArabic ? document.descriptionAr : document.descriptionEn;
  }

  function getDocumentStatusLabel(status) {
    return t.documentsPage.status[status] || status;
  }

  async function loadDocumentsForApplication(applicationId, options = {}) {
    if (!applicationId) return;

    const { silent = false } = options;

    if (!silent) setDocumentsLoading(true);
    setDocumentError("");

    try {
      const data = await getApplicationDocumentsRequest(applicationId);
      setDocumentItems(data.documents || []);
      setDocumentSummary(data.summary || createEmptyDocumentSummary());
    } catch (error) {
      console.error(error);
      setDocumentItems([]);
      setDocumentSummary(createEmptyDocumentSummary());
      setDocumentError(error.message || t.documentsPage.loadError);
    } finally {
      if (!silent) setDocumentsLoading(false);
    }
  }

  function validateDocumentFile(file, document) {
    const extension = file.name.includes(".")
      ? `.${file.name.split(".").pop().toLowerCase()}`
      : "";
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    if (
      !allowedExtensions.includes(extension) ||
      (file.type && !allowedTypes.includes(file.type))
    ) {
      return t.documentsPage.errors.invalidType;
    }

    const maxBytes = Number(document.maxSizeMb || 5) * 1024 * 1024;

    if (file.size > maxBytes) {
      return t.documentsPage.errors.tooLarge;
    }

    return "";
  }

  async function handleDocumentUpload(document, file) {
    if (!file || !selectedDocumentApplicationId) return;

    const validationMessage = validateDocumentFile(file, document);

    if (validationMessage) {
      setDocumentError(validationMessage);
      setDocumentMessage("");
      return;
    }

    setUploadingRequirementId(document.requirementId);
    setDocumentError("");
    setDocumentMessage("");

    try {
      await uploadApplicationDocumentRequest(
        selectedDocumentApplicationId,
        document.requirementId,
        file
      );

      await loadDocumentsForApplication(selectedDocumentApplicationId, {
        silent: true,
      });
      setDocumentMessage(t.documentsPage.uploadSuccess);
    } catch (error) {
      console.error(error);
      setDocumentError(error.message || t.documentsPage.errors.uploadFailed);
    } finally {
      setUploadingRequirementId(null);
      setDragRequirementId(null);
    }
  }

  function handleDocumentDrop(event, document) {
    event.preventDefault();
    setDragRequirementId(null);

    if (document.status === "approved") return;

    const file = event.dataTransfer.files?.[0];
    if (file) handleDocumentUpload(document, file);
  }

  async function handleDocumentDownload(document) {
    if (!document.documentId) return;

    setDocumentError("");

    try {
      const { blob, filename } = await downloadApplicationDocumentRequest(
        document.documentId
      );
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = objectUrl;
      link.download = filename || document.originalName || "document";
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      setDocumentError(error.message || t.documentsPage.errors.downloadFailed);
    }
  }

  async function handleDocumentDelete(document) {
    if (!document.documentId) return;
    if (!window.confirm(t.documentsPage.confirmDelete)) return;

    setDeletingDocumentId(document.documentId);
    setDocumentError("");
    setDocumentMessage("");

    try {
      await deleteApplicationDocumentRequest(document.documentId);
      await loadDocumentsForApplication(selectedDocumentApplicationId, {
        silent: true,
      });
      setDocumentMessage(t.documentsPage.deleteSuccess);
    } catch (error) {
      console.error(error);
      setDocumentError(error.message || t.documentsPage.errors.deleteFailed);
    } finally {
      setDeletingDocumentId(null);
    }
  }

  useEffect(() => {
    loadDashboard();

    const hash = window.location.hash.replace("#", "");
    if (["overview", "request", "services", "documents", "updates"].includes(hash)) {
      setActivePage(hash);
    }
  }, []);


  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshApplications();
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user?.id, user?.uid, user?.email]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);


  useEffect(() => {
    if (applications.length === 0) {
      setSelectedDocumentApplicationId(null);
      setDocumentItems([]);
      setDocumentSummary(createEmptyDocumentSummary());
      return;
    }

    setSelectedDocumentApplicationId((current) => {
      const stillExists = applications.some(
        (application) => Number(application.id) === Number(current)
      );

      if (stillExists) return current;

      const preferredApplication =
        applications.find(
          (application) =>
            !["completed", "rejected"].includes(application.status)
        ) || applications[0];

      return preferredApplication?.id || null;
    });
  }, [applications]);

  useEffect(() => {
    if (activePage !== "documents" || !selectedDocumentApplicationId) {
      return;
    }

    setDocumentMessage("");

    void loadDocumentsForApplication(
      selectedDocumentApplicationId
    );

    const intervalId = window.setInterval(() => {
      void loadDocumentsForApplication(
        selectedDocumentApplicationId,
        {
          silent: true,
        }
      );
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activePage, selectedDocumentApplicationId]);

  const latestStatusTitle = activeApplication
    ? t.statusLabels[activeApplication.status] || activeApplication.status
    : t.cards.noApplication;

  const latestStatusText = activeApplication
    ? t.request.services[activeApplication.serviceType]?.title ||
      activeApplication.serviceType
    : t.cards.noApplicationText;

  const progressValue = activeApplication?.progress ?? 0;
  const requestProgress = ((intakeStep - 1) / 5) * 100;
  const selectedPaymentFields = getSelectedPaymentFields();
  const selectedPaymentTitles = [
    ...selectedPaymentFields.map(
      (field) => t.request.needs[field]?.title || field
    ),
    ...(intakeForm.otherPaymentSolution?.trim()
      ? [intakeForm.otherPaymentSolution.trim()]
      : []),
  ];

  const unreadNotifications = notifications.filter((item) => !item.read).length;

  if (loading) {
    return (
      <div className={`dashboard-page ${isArabic ? "dashboard-rtl" : "dashboard-ltr"}`}>
        <main className="dashboard-main dashboard-loading">
          <p>{t.loading}</p>
        </main>
      </div>
    );
  }

  return (
    <div className={`dashboard-page ${isArabic ? "dashboard-rtl" : "dashboard-ltr"}`}>
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo-wrap">
          <img src="/rita-logo.png" alt="Rita Digital Services" />
        </div>

        <div className="dashboard-user-mobile">
          <strong dir="auto">{user?.fullName}</strong>
          <span dir="auto">{user?.email}</span>
          <small>{user?.role}</small>
        </div>

        <nav>
          <button
            type="button"
            className={activePage === "overview" ? "active" : ""}
            onClick={() => changePage("overview")}
          >
            {t.sidebar.overview}
          </button>

          <button
            type="button"
            className={activePage === "request" ? "active" : ""}
            onClick={() => changePage("request")}
          >
            {t.sidebar.request}
          </button>

          <button
            type="button"
            className={activePage === "services" ? "active" : ""}
            onClick={() => changePage("services")}
          >
            {t.sidebar.services}
          </button>

          <button
            type="button"
            className={activePage === "documents" ? "active" : ""}
            onClick={() => changePage("documents")}
          >
            {t.sidebar.documents}
          </button>

          <button
            type="button"
            className={activePage === "updates" ? "active" : ""}
            onClick={() => changePage("updates")}
          >
            {t.sidebar.updates}
          </button>
        </nav>

        <button className="dashboard-logout" type="button" onClick={handleLogout}>
          {t.sidebar.logout}
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-welcome">
            <strong>
              {t.topbar.welcome}، <span dir="auto">{user?.fullName}</span>
            </strong>
            <small dir="auto">{user?.companyName || "Rita"}</small>
          </div>

          <div className="topbar-actions">
            <div className="topbar-email" dir="auto">
              {user?.email}
            </div>

            <div className="topbar-notifications" ref={notificationsRef}>
              <button
                className={`notification-bell ${notificationsOpen ? "active" : ""}`}
                type="button"
                aria-label={t.topbar.notifications}
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                onClick={toggleNotifications}
              >
                <Bell size={20} strokeWidth={2.2} aria-hidden="true" />

                {unreadNotifications > 0 && (
                  <span className="notification-count" aria-label={`${unreadNotifications}`}>
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="notification-panel"
                  role="dialog"
                  aria-label={t.topbar.notifications}
                >
                  <div className="notification-panel-header">
                    <div>
                      <strong>{t.topbar.notifications}</strong>
                      <span>
                        {unreadNotifications > 0
                          ? isArabic
                            ? `${unreadNotifications} غير مقروء`
                            : `${unreadNotifications} unread`
                          : isArabic
                            ? "كل الإشعارات مقروءة"
                            : "You're all caught up"}
                      </span>
                    </div>

                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className="notification-read-all"
                        onClick={markAllNotificationsRead}
                      >
                        <CheckCheck size={16} aria-hidden="true" />
                        <span>{t.topbar.markAllRead}</span>
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <span className="notification-empty-icon">
                          <Bell size={23} aria-hidden="true" />
                        </span>
                        <strong>{t.topbar.noNotifications}</strong>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={`notification-item ${notification.read ? "" : "unread"}`}
                          onClick={() => openNotification(notification)}
                        >
                          <span className="notification-item-icon">
                            <Bell size={17} aria-hidden="true" />
                          </span>

                          <span className="notification-item-copy">
                            <strong>{getNotificationTitle(notification)}</strong>
                            <span>{getNotificationMessage(notification)}</span>
                            <small>{formatNotificationTime(notification.createdAt)}</small>
                          </span>

                          {!notification.read && (
                            <span className="notification-unread-dot" aria-hidden="true" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              className="dashboard-lang-btn"
              type="button"
              onClick={handleLanguageToggle}
            >
              {isArabic ? "EN" : "AR"}
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          {activePage === "overview" && (
            <>
              <div className="dashboard-kicker">
                <span>◎</span>
                <span>{t.overview.label}</span>
              </div>

              <div className="dashboard-heading">
                <h1>{t.overview.title}</h1>
                <p>{t.overview.subtitle}</p>
              </div>

              <section className="dashboard-grid">
                <article className="dashboard-card">
                  <span>{t.cards.services}</span>
                  <h2>{applications.length}</h2>
                  <p>{applications.length > 0 ? latestStatusText : t.cards.noApplicationText}</p>
                </article>

                <article className="dashboard-card">
                  <span>{t.cards.status}</span>
                  <h2>{latestStatusTitle}</h2>
                  <p>{latestStatusText}</p>
                </article>

                <article className="dashboard-card">
                  <span>{t.cards.documents}</span>
                  <h2>0</h2>
                  <p>{t.cards.documentsText}</p>
                </article>

                <article className="dashboard-card">
                  <span>{t.cards.progress}</span>
                  <h2>{progressValue}%</h2>
                  <p>{t.cards.progressText}</p>
                </article>
              </section>
            </>
          )}

          {activePage === "request" && (
            <>
              <div className="dashboard-kicker">
                <span>◎</span>
                <span>{t.request.label}</span>
              </div>

              <div className="dashboard-heading request-heading">
                <h1>{t.request.title}</h1>
                <p>{t.request.subtitle}</p>
              </div>

              <section className="request-panel">
                <div className="request-progress-head">
                  <div>
                    <span>{t.request.progressLabel}</span>
                    <strong>
                      {t.request.step} {intakeStep} {t.request.of} 6
                    </strong>
                  </div>

                  <div className="request-progress-track" aria-hidden="true">
                    <span style={{ width: `${requestProgress}%` }} />
                  </div>
                </div>

                <div className="intake-steps" aria-label={t.request.progressLabel}>
                  {[1, 2, 3, 4, 5, 6].map((step) => {
                    const completed = step < intakeStep;
                    const accessible = step <= maxStepReached;

                    return (
                      <button
                        key={step}
                        type="button"
                        className={`${intakeStep === step ? "active" : ""} ${
                          completed ? "completed" : ""
                        }`}
                        disabled={!accessible || creating}
                        onClick={() => goToAccessibleStep(step)}
                        aria-current={intakeStep === step ? "step" : undefined}
                      >
                        <span className="step-number">{completed ? "✓" : step}</span>
                        <span className="step-text">
                          <strong>{t.request.steps[step].title}</strong>
                          <small>{t.request.steps[step].short}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {requestError && (
                  <p className="request-message error" role="alert">
                    {requestError}
                  </p>
                )}

                <form onSubmit={handleCreateRequest} noValidate>
                  {intakeStep === 1 && (
                    <div className="intake-step">
                      <div className="intake-step-heading">
                        <span className="intake-step-icon">01</span>
                        <div>
                          <h2>{t.request.serviceStep}</h2>
                          <p>{t.request.serviceStepText}</p>
                        </div>
                      </div>

                      <div className="service-options">
                        {serviceTypes.map((serviceType) => {
                          const selected = intakeForm.serviceType === serviceType;
                          const service = t.request.services[serviceType];

                          return (
                            <label
                              key={serviceType}
                              className={`service-option ${selected ? "selected" : ""}`}
                            >
                              <input
                                className="visually-hidden"
                                type="radio"
                                name="serviceType"
                                value={serviceType}
                                checked={selected}
                                onChange={() => handleServiceSelect(serviceType)}
                              />

                              <span className="service-option-top">
                                <span className="service-option-icon" aria-hidden="true">
                                  {serviceIcons[serviceType]}
                                </span>
                                <span className="service-option-check" aria-hidden="true">
                                  {selected ? "✓" : ""}
                                </span>
                              </span>

                              <span className="service-option-badge">{service.badge}</span>
                              <strong>{service.title}</strong>
                              <small>{service.text}</small>
                              <span className="service-option-action">
                                {selected ? t.request.selected : t.request.selectService}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="form-footer">
                        <p className="form-security-note">🔒 {t.request.secureNote}</p>
                        <div className="form-actions single-action">
                          <button type="button" className="request-submit" onClick={goToNextStep}>
                            {t.request.next}
                            <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {intakeStep === 2 && (
                    <div className="intake-step">
                      <div className="intake-step-heading">
                        <span className="intake-step-icon">02</span>
                        <div>
                          <h2>{t.request.packageStep}</h2>
                          <p>{t.request.packageStepText}</p>
                        </div>
                      </div>

                      <div className="package-options">
                        {pricingPackages.map((plan) => {
                          const selected = intakeForm.packageSlug === plan.slug;

                          return (
                            <label
                              key={plan.slug}
                              className={`package-option ${selected ? "selected" : ""}`}
                            >
                              <input
                                className="visually-hidden"
                                type="radio"
                                name="packageSlug"
                                value={plan.slug}
                                checked={selected}
                                onChange={() => {
                                  updateIntakeField("packageSlug", plan.slug);
                                  clearFieldError("packageSlug");
                                }}
                              />

                              {plan.recommended && (
                                <span className="package-recommended">
                                  {plan.badge || pricingContent?.homeSection?.recommended || "★"}
                                </span>
                              )}

                              <div className="package-option-head">
                                <div>
                                  <small>{plan.number}</small>
                                  <h3>{plan.name}</h3>
                                </div>
                                <span className="package-check">{selected ? "✓" : ""}</span>
                              </div>

                              <p>{plan.description}</p>

                              <div className="package-price">
                                <strong>
                                  {(plan.currency || "$")}
                                  {String(plan.price ?? "").replace(plan.currency || "$", "")}
                                </strong>
                                <span>{plan.period ? `/ ${plan.period}` : ""}</span>
                              </div>

                              <ul>
                                {(plan.features || []).map((feature) => (
                                  <li key={feature}>✓ {feature}</li>
                                ))}
                              </ul>
                            </label>
                          );
                        })}
                      </div>

                      {fieldErrors.packageSlug && (
                        <p className="request-message error package-error" role="alert">
                          {fieldErrors.packageSlug}
                        </p>
                      )}

                      <div className="form-footer">
                        <p className="form-security-note">🔒 {t.request.secureNote}</p>
                        <div className="form-actions">
                          <button type="button" className="secondary-btn" onClick={goToPreviousStep}>
                            {t.request.back}
                          </button>
                          <button type="button" className="request-submit" onClick={goToNextStep}>
                            {t.request.next}
                            <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {intakeStep === 3 && (
                    <div className="intake-step">
                      <div className="intake-step-heading">
                        <span className="intake-step-icon">03</span>
                        <div>
                          <h2>{t.request.infoStep}</h2>
                          <p>{t.request.infoStepText}</p>
                        </div>
                      </div>

                      <div className="intake-grid">
                        <label className={`form-field full ${fieldErrors.email ? "has-error" : ""}`}>
                          <span className="field-label">
                            {t.request.email}
                            <small>{t.request.required}</small>
                          </span>
                          <input
                            type="email"
                            autoComplete="email"
                            value={intakeForm.email}
                            placeholder={t.request.emailPlaceholder}
                            aria-invalid={Boolean(fieldErrors.email)}
                            onChange={(event) => updateIntakeField("email", event.target.value)}
                          />
                          {fieldErrors.email && (
                            <span className="field-error">{fieldErrors.email}</span>
                          )}
                          <span className="email-notice">
                            ✉ {t.request.emailNotice}
                          </span>
                        </label>

                        <label className={`form-field ${fieldErrors.phone ? "has-error" : ""}`}>
                          <span className="field-label">
                            {t.request.phone}
                            <small>{t.request.required}</small>
                          </span>
                          <input
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={intakeForm.phone}
                            placeholder={t.request.phonePlaceholder}
                            aria-invalid={Boolean(fieldErrors.phone)}
                            onChange={(event) => updateIntakeField("phone", event.target.value)}
                          />
                          {fieldErrors.phone && (
                            <span className="field-error">{fieldErrors.phone}</span>
                          )}
                        </label>

                        <label className={`form-field ${fieldErrors.country ? "has-error" : ""}`}>
                          <span className="field-label">
                            {t.request.country}
                            <small>{t.request.required}</small>
                          </span>
                          <input
                            type="text"
                            autoComplete="country-name"
                            value={intakeForm.country}
                            placeholder={t.request.countryPlaceholder}
                            aria-invalid={Boolean(fieldErrors.country)}
                            onChange={(event) => updateIntakeField("country", event.target.value)}
                          />
                          {fieldErrors.country && (
                            <span className="field-error">{fieldErrors.country}</span>
                          )}
                        </label>

                        <label
                          className={`form-field full ${
                            fieldErrors.desiredCompanyName ? "has-error" : ""
                          }`}
                        >
                          <span className="field-label">
                            {t.request.desiredCompanyName}
                            <small>
                              {intakeForm.serviceType === "us_llc"
                                ? t.request.required
                                : t.request.optional}
                            </small>
                          </span>
                          <input
                            type="text"
                            value={intakeForm.desiredCompanyName}
                            placeholder={t.request.desiredCompanyNamePlaceholder}
                            aria-invalid={Boolean(fieldErrors.desiredCompanyName)}
                            onChange={(event) =>
                              updateIntakeField("desiredCompanyName", event.target.value)
                            }
                          />
                          {fieldErrors.desiredCompanyName && (
                            <span className="field-error">
                              {fieldErrors.desiredCompanyName}
                            </span>
                          )}
                        </label>

                        <label
                          className={`form-field full ${
                            fieldErrors.businessActivity ? "has-error" : ""
                          }`}
                        >
                          <span className="field-label">
                            {t.request.businessActivity}
                            <small>{t.request.required}</small>
                          </span>
                          <textarea
                            value={intakeForm.businessActivity}
                            maxLength={1200}
                            placeholder={t.request.businessActivityPlaceholder}
                            aria-invalid={Boolean(fieldErrors.businessActivity)}
                            onChange={(event) =>
                              updateIntakeField("businessActivity", event.target.value)
                            }
                          />
                          <span className="field-meta">
                            <span>
                              {intakeForm.businessActivity.length}/1200 {t.request.characters}
                            </span>
                            {fieldErrors.businessActivity && (
                              <span className="field-error">
                                {fieldErrors.businessActivity}
                              </span>
                            )}
                          </span>
                        </label>
                      </div>

                      <div className="form-footer">
                        <p className="form-security-note">🔒 {t.request.secureNote}</p>
                        <div className="form-actions">
                          <button type="button" className="secondary-btn" onClick={goToPreviousStep}>
                            {t.request.back}
                          </button>
                          <button type="button" className="request-submit" onClick={goToNextStep}>
                            {t.request.next}
                            <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {intakeStep === 4 && (
                    <div className="intake-step">
                      <div className="intake-step-heading">
                        <span className="intake-step-icon">04</span>
                        <div>
                          <h2>{t.request.paymentStep}</h2>
                          <p>{t.request.paymentStepText}</p>
                        </div>
                      </div>

                      <div className="payment-selection-summary">
                        <span>{t.request.paymentNeeds}</span>
                        <strong>
                          {selectedPaymentFields.length +
                            (intakeForm.otherPaymentSolution?.trim() ? 1 : 0)}
                        </strong>
                      </div>

                      <div className="needs-grid">
                        {paymentNeedFields.map((field) => {
                          const need = t.request.needs[field];
                          const selected = Boolean(intakeForm[field]);

                          return (
                            <label
                              key={field}
                              className={`need-option ${selected ? "selected" : ""}`}
                            >
                              <input
                                className="visually-hidden"
                                type="checkbox"
                                checked={selected}
                                onChange={(event) =>
                                  updateIntakeField(field, event.target.checked)
                                }
                              />
                              <span className="need-check" aria-hidden="true">
                                {selected ? "✓" : ""}
                              </span>
                              <span className="need-copy">
                                <strong>{need.title}</strong>
                                <small>{need.text}</small>
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {!showOtherSolution && !intakeForm.otherPaymentSolution && (
                        <button
                          type="button"
                          className="other-solution-button"
                          onClick={() => setShowOtherSolution(true)}
                        >
                          <span>+</span>
                          {t.request.otherSolution}
                        </button>
                      )}

                      {(showOtherSolution || intakeForm.otherPaymentSolution) && (
                        <div className="other-solution-box">
                          <label className="form-field full">
                            <span className="field-label">
                              {t.request.otherSolutionTitle}
                              <small>{t.request.optional}</small>
                            </span>
                            <input
                              type="text"
                              value={intakeForm.otherPaymentSolution}
                              placeholder={t.request.otherSolutionPlaceholder}
                              onChange={(event) =>
                                updateIntakeField(
                                  "otherPaymentSolution",
                                  event.target.value
                                )
                              }
                            />
                          </label>

                          <button
                            type="button"
                            className="remove-other-solution"
                            onClick={() => {
                              updateIntakeField("otherPaymentSolution", "");
                              setShowOtherSolution(false);
                            }}
                          >
                            {t.request.removeOtherSolution}
                          </button>
                        </div>
                      )}

                      {fieldErrors.paymentNeeds && (
                        <p className="field-error payment-error" role="alert">
                          {fieldErrors.paymentNeeds}
                        </p>
                      )}

                      <div className="form-footer">
                        <p className="form-security-note">🔒 {t.request.secureNote}</p>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={goToPreviousStep}
                          >
                            {t.request.back}
                          </button>
                          <button
                            type="button"
                            className="request-submit"
                            onClick={goToNextStep}
                          >
                            {t.request.next}
                            <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {intakeStep === 5 && (
                    <div className="intake-step">
                      <div className="intake-step-heading">
                        <span className="intake-step-icon">05</span>
                        <div>
                          <h2>{t.request.documentsStep}</h2>
                          <p>{t.request.documentsStepText}</p>
                        </div>
                      </div>

                      {currentRequestDocuments.length === 0 ? (
                        <div className="request-no-documents">
                          <span aria-hidden="true">✓</span>
                          <div>
                            <strong>
                              {isArabic
                                ? "لا توجد وثائق مطلوبة لهذه الخدمة حالياً"
                                : "No documents are currently required for this service"}
                            </strong>
                            <p>
                              {isArabic
                                ? "يمكنك المتابعة إلى مراجعة الطلب."
                                : "You can continue to review your request."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="request-documents-list">
                          {currentRequestDocuments.map((document) => {
                            const file =
                              requestDocumentFiles[document.requirementId];
                            const fileInputId =
                              `request-document-${document.requirementId}`;

                            return (
                              <article
                                key={document.requirementId}
                                className={`request-document-card ${
                                  file ? "has-file" : ""
                                }`}
                              >
                                <header>
                                  <div className="request-document-title">
                                    <span className="request-document-icon">
                                      {file ? "✓" : "⇧"}
                                    </span>
                                    <div>
                                      <h3>
                                        {isArabic
                                          ? document.titleAr
                                          : document.titleEn}
                                      </h3>
                                      <span className="document-required-pill required">
                                        {t.request.required}
                                      </span>
                                    </div>
                                  </div>
                                  <p>
                                    {isArabic
                                      ? document.descriptionAr
                                      : document.descriptionEn}
                                  </p>
                                </header>

                                {file ? (
                                  <div className="request-selected-file">
                                    <span className="request-selected-file-icon">
                                      {file.type === "application/pdf" ? "PDF" : "IMG"}
                                    </span>
                                    <div>
                                      <small>{t.request.selectedFile}</small>
                                      <strong dir="auto">{file.name}</strong>
                                      <span>{formatFileSize(file.size)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <label
                                    htmlFor={fileInputId}
                                    className="request-document-drop"
                                  >
                                    <span>⇧</span>
                                    <strong>{t.request.chooseFile}</strong>
                                    <small>
                                      PDF, JPG, JPEG, PNG · {document.maxSizeMb} MB
                                    </small>
                                  </label>
                                )}

                                <input
                                  id={fileInputId}
                                  type="file"
                                  className="document-file-input"
                                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                  onChange={(event) => {
                                    const selectedFile = event.target.files?.[0];

                                    if (selectedFile) {
                                      handleRequestDocumentSelect(
                                        document,
                                        selectedFile
                                      );
                                    }

                                    event.target.value = "";
                                  }}
                                />

                                <div className="request-document-actions">
                                  <label
                                    htmlFor={fileInputId}
                                    className="document-action primary"
                                  >
                                    {file
                                      ? t.request.changeFile
                                      : t.request.chooseFile}
                                  </label>

                                  {file && (
                                    <button
                                      type="button"
                                      className="document-action danger"
                                      onClick={() =>
                                        removeRequestDocument(
                                          document.requirementId
                                        )
                                      }
                                    >
                                      {t.request.removeFile}
                                    </button>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}

                      {fieldErrors.documents && (
                        <p className="request-message error" role="alert">
                          {fieldErrors.documents}
                        </p>
                      )}

                      <div className="form-footer">
                        <p className="form-security-note">🔒 {t.request.secureNote}</p>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={goToPreviousStep}
                          >
                            {t.request.back}
                          </button>
                          <button
                            type="button"
                            className="request-submit"
                            onClick={goToNextStep}
                          >
                            {t.request.next}
                            <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {intakeStep === 6 && (
                    <div className="intake-step">
                      <div className="intake-step-heading">
                        <span className="intake-step-icon">06</span>
                        <div>
                          <h2>{t.request.reviewStep}</h2>
                          <p>{t.request.reviewStepText}</p>
                        </div>
                      </div>

                      <div className="review-service-card">
                        <span className="review-service-icon" aria-hidden="true">
                          {serviceIcons[intakeForm.serviceType]}
                        </span>
                        <div>
                          <small>{t.servicesPage.service}</small>
                          <strong>{t.request.services[intakeForm.serviceType].title}</strong>
                          <p>{t.request.services[intakeForm.serviceType].text}</p>
                        </div>
                        <button type="button" onClick={() => goToAccessibleStep(1)}>
                          {t.request.edit}
                        </button>
                      </div>

                      <div className="review-grid">
                        <article className="review-section-card">
                          <header>
                            <div>
                              <span>02</span>
                              <strong>{t.request.packageSummary}</strong>
                            </div>
                            <button type="button" onClick={() => goToAccessibleStep(2)}>
                              {t.request.edit}
                            </button>
                          </header>

                          {selectedPackage ? (
                            <div className="review-package">
                              <strong>{selectedPackage.name}</strong>
                              <span>{formatPackagePrice(selectedPackage)}</span>
                            </div>
                          ) : (
                            <p className="review-activity">—</p>
                          )}
                        </article>

                        <article className="review-section-card">
                          <header>
                            <div>
                              <span>03</span>
                              <strong>{t.request.contactSummary}</strong>
                            </div>
                            <button type="button" onClick={() => goToAccessibleStep(3)}>
                              {t.request.edit}
                            </button>
                          </header>

                          <dl>
                            <div>
                              <dt>{t.request.email}</dt>
                              <dd dir="auto">{intakeForm.email || "—"}</dd>
                            </div>
                            <div>
                              <dt>{t.request.phone}</dt>
                              <dd dir="auto">{intakeForm.phone || "—"}</dd>
                            </div>
                            <div>
                              <dt>{t.request.country}</dt>
                              <dd dir="auto">{intakeForm.country || "—"}</dd>
                            </div>
                            <div>
                              <dt>{t.request.desiredCompanyName}</dt>
                              <dd dir="auto">{intakeForm.desiredCompanyName || "—"}</dd>
                            </div>
                          </dl>

                          <div className="review-email-note">
                            ✉ {t.request.emailNotice}
                          </div>
                        </article>

                        <article className="review-section-card">
                          <header>
                            <div>
                              <span>04</span>
                              <strong>{t.request.paymentNeeds}</strong>
                            </div>
                            <button type="button" onClick={() => goToAccessibleStep(4)}>
                              {t.request.edit}
                            </button>
                          </header>

                          <div className="review-tags">
                            {selectedPaymentTitles.length > 0 ? (
                              selectedPaymentTitles.map((title) => (
                                <span key={title}>{title}</span>
                              ))
                            ) : (
                              <p>{t.request.noPaymentNeeds}</p>
                            )}
                          </div>
                        </article>

                        <article className="review-section-card">
                          <header>
                            <div>
                              <span>05</span>
                              <strong>{t.request.documentsSummary}</strong>
                            </div>
                            <button type="button" onClick={() => goToAccessibleStep(5)}>
                              {t.request.edit}
                            </button>
                          </header>

                          {currentRequestDocuments.length === 0 ? (
                            <p className="review-activity">
                              {isArabic
                                ? "لا توجد وثائق مطلوبة لهذه الخدمة."
                                : "No documents are required for this service."}
                            </p>
                          ) : (
                            <div className="review-documents">
                              {currentRequestDocuments.map((document) => {
                                const file =
                                  requestDocumentFiles[document.requirementId];

                                return (
                                  <div
                                    key={document.requirementId}
                                    className="review-document-row"
                                  >
                                    <span>✓</span>
                                    <div>
                                      <strong>
                                        {isArabic
                                          ? document.titleAr
                                          : document.titleEn}
                                      </strong>
                                      <small dir="auto">{file?.name || "—"}</small>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </article>

                        <article className="review-section-card full">
                          <header>
                            <div>
                              <span>03</span>
                              <strong>{t.request.projectSummary}</strong>
                            </div>
                            <button type="button" onClick={() => goToAccessibleStep(3)}>
                              {t.request.edit}
                            </button>
                          </header>

                          <p className="review-activity" dir="auto">
                            {intakeForm.businessActivity || "—"}
                          </p>
                        </article>
                      </div>

                      <label className="request-notes">
                        <span className="field-label">
                          {t.request.extraNotes}
                          <small>{t.request.optional}</small>
                        </span>
                        <textarea
                          value={intakeForm.extraNotes}
                          maxLength={1500}
                          onChange={(event) => updateIntakeField("extraNotes", event.target.value)}
                          placeholder={t.request.extraNotesPlaceholder}
                        />
                        <span className="field-meta">
                          {intakeForm.extraNotes.length}/1500 {t.request.characters}
                        </span>
                      </label>

                      <div className="submit-assurance">
                        <span aria-hidden="true">✓</span>
                        <p>{t.request.secureNote}</p>
                      </div>

                      <div className="form-footer review-footer">
                        <div className="form-actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={goToPreviousStep}
                            disabled={creating}
                          >
                            {t.request.back}
                          </button>
                          <button className="request-submit submit-final" type="submit" disabled={creating}>
                            {creating
                              ? currentRequestDocuments.length > 0
                                ? t.request.uploadingDocuments
                                : t.request.submitting
                              : t.request.submit}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </section>
            </>
          )}

          {activePage === "services" && (
            <>
              <div className="dashboard-kicker">
                <span>◎</span>
                <span>{t.servicesPage.label}</span>
              </div>

              <div className="dashboard-heading">
                <h1>{t.servicesPage.title}</h1>
                <p>{t.servicesPage.subtitle}</p>
              </div>

              {requestMessage && (
                <p className="request-message success service-success-message" role="status">
                  {requestMessage}
                </p>
              )}

              {applications.length === 0 ? (
                <section className="empty-panel">
                  <p>{t.servicesPage.empty}</p>
                </section>
              ) : (
                <section className="services-list">
                  {applications.map((application) => (
                    <article key={application.id} className="service-card">
                      <header>
                        <div>
                          <span>{t.servicesPage.service}</span>
                          <h2>
                            {t.request.services[application.serviceType]?.title ||
                              application.serviceType}
                          </h2>
                        </div>

                        <strong className="service-status">
                          {t.statusLabels[application.status] || application.status}
                        </strong>
                      </header>

                      <div className="service-details">
                        <div>
                          <span>{t.servicesPage.progress}</span>
                          <strong>{application.progress}%</strong>
                        </div>

                        <div>
                          <span>{t.servicesPage.createdAt}</span>
                          <strong>{formatDate(application.createdAt)}</strong>
                        </div>

                        <div>
                          <span>{t.servicesPage.package}</span>
                          <strong>
                            {getApplicationPackage(application)?.name || "—"}
                          </strong>
                        </div>

                        <div>
                          <span>{t.servicesPage.price}</span>
                          <strong>
                            {getApplicationPackage(application)
                              ? formatPackagePrice(getApplicationPackage(application))
                              : "—"}
                          </strong>
                        </div>

                        <div>
                          <span>{t.servicesPage.notificationEmail}</span>
                          <strong dir="auto">
                            {application.intake?.email || user?.email || "—"}
                          </strong>
                        </div>

                        <div>
                          <span>{t.servicesPage.businessActivity}</span>
                          <strong dir="auto">
                            {application.intake?.businessActivity || "—"}
                          </strong>
                        </div>

                        <div>
                          <span>{t.servicesPage.paymentNeeds}</span>
                          <strong>{getPaymentNeeds(application).join(", ") || "—"}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}

          {activePage === "documents" && (
            <>
              <div className="dashboard-kicker">
                <span>▣</span>
                <span>{t.documentsPage.label}</span>
              </div>

              <div className="dashboard-heading documents-heading">
                <h1>{t.documentsPage.title}</h1>
                <p>{t.documentsPage.subtitle}</p>
              </div>

              {applications.length === 0 ? (
                <section className="documents-empty-state">
                  <div className="documents-empty-icon" aria-hidden="true">
                    ⇧
                  </div>
                  <h2>{t.documentsPage.noApplications}</h2>
                  <button
                    type="button"
                    className="request-submit"
                    onClick={() => changePage("request")}
                  >
                    {t.documentsPage.startRequest}
                  </button>
                </section>
              ) : (
                <section className="documents-workspace">
                  <div className="documents-toolbar">
                    <div className="documents-toolbar-copy">
                      <span className="documents-lock" aria-hidden="true">
                        🔒
                      </span>
                      <div>
                        <strong>{t.documentsPage.secureTitle}</strong>
                        <p>{t.documentsPage.secureText}</p>
                      </div>
                    </div>

                    <label className="document-application-picker">
                      <span>{t.documentsPage.chooseApplication}</span>
                      <select
                        value={selectedDocumentApplicationId || ""}
                        onChange={(event) => {
                          setSelectedDocumentApplicationId(
                            Number(event.target.value)
                          );
                          setDocumentError("");
                          setDocumentMessage("");
                        }}
                      >
                        {applications.map((application) => (
                          <option key={application.id} value={application.id}>
                            {t.request.services[application.serviceType]?.title ||
                              application.serviceType}{" "}
                            — {t.documentsPage.requestNumber} #{application.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {selectedDocumentApplication && (
                    <div className="document-application-banner">
                      <div>
                        <span>{t.servicesPage.service}</span>
                        <strong>
                          {t.request.services[
                            selectedDocumentApplication.serviceType
                          ]?.title || selectedDocumentApplication.serviceType}
                        </strong>
                      </div>
                      <div>
                        <span>{t.documentsPage.serviceStatus}</span>
                        <strong>
                          {t.statusLabels[selectedDocumentApplication.status] ||
                            selectedDocumentApplication.status}
                        </strong>
                      </div>
                    </div>
                  )}

                  {documentError && (
                    <p className="request-message error document-feedback" role="alert">
                      {documentError}
                    </p>
                  )}

                  {documentMessage && (
                    <p className="request-message success document-feedback" role="status">
                      {documentMessage}
                    </p>
                  )}

                  <div className="document-summary-grid">
                    <article className="document-summary-card">
                      <span className="document-summary-icon required">▤</span>
                      <div>
                        <small>{t.documentsPage.requiredCount}</small>
                        <strong>{documentSummary.required}</strong>
                      </div>
                    </article>

                    <article className="document-summary-card">
                      <span className="document-summary-icon uploaded">⇧</span>
                      <div>
                        <small>{t.documentsPage.uploadedCount}</small>
                        <strong>{documentSummary.uploaded}</strong>
                      </div>
                    </article>

                    <article className="document-summary-card">
                      <span className="document-summary-icon approved">✓</span>
                      <div>
                        <small>{t.documentsPage.approvedCount}</small>
                        <strong>{documentSummary.approved}</strong>
                      </div>
                    </article>

                    <article className="document-summary-card">
                      <span className="document-summary-icon attention">!</span>
                      <div>
                        <small>{t.documentsPage.attentionCount}</small>
                        <strong>{documentSummary.rejected}</strong>
                      </div>
                    </article>
                  </div>

                  <div className="documents-progress-card">
                    <div className="documents-progress-head">
                      <div>
                        <strong>{t.documentsPage.completion}</strong>
                        <span>
                          {documentSummary.uploadedRequired || 0}/
                          {documentSummary.required || 0}
                        </span>
                      </div>
                      <b>{documentSummary.progress}%</b>
                    </div>
                    <div className="documents-progress-track">
                      <span
                        style={{
                          width: `${Math.min(documentSummary.progress, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {documentsLoading ? (
                    <div className="documents-loading-panel">
                      <span className="documents-loader" aria-hidden="true" />
                      <p>{t.documentsPage.loading}</p>
                    </div>
                  ) : documentItems.length === 0 ? (
                    <div className="documents-empty-requirements">
                      <span aria-hidden="true">▱</span>
                      <p>{t.documentsPage.noRequirements}</p>
                    </div>
                  ) : (
                    <div className="documents-list">
                      {documentItems.map((document) => {
                        const isUploading =
                          Number(uploadingRequirementId) ===
                          Number(document.requirementId);
                        const isDeleting =
                          Number(deletingDocumentId) ===
                          Number(document.documentId);
                        const isApproved = document.status === "approved";
                        const hasFile = Boolean(document.documentId);
                        const isDragActive =
                          Number(dragRequirementId) ===
                          Number(document.requirementId);
                        const fileInputId = `document-file-${document.requirementId}`;

                        return (
                          <article
                            key={document.requirementId}
                            className={`document-card status-${document.status} ${
                              isDragActive ? "drag-active" : ""
                            }`}
                            onDragOver={(event) => {
                              if (isApproved) return;
                              event.preventDefault();
                              setDragRequirementId(document.requirementId);
                            }}
                            onDragLeave={(event) => {
                              if (!event.currentTarget.contains(event.relatedTarget)) {
                                setDragRequirementId(null);
                              }
                            }}
                            onDrop={(event) => handleDocumentDrop(event, document)}
                          >
                            <header className="document-card-header">
                              <div className="document-title-wrap">
                                <span
                                  className={`document-status-icon status-${document.status}`}
                                  aria-hidden="true"
                                >
                                  {document.status === "approved"
                                    ? "✓"
                                    : document.status === "rejected"
                                      ? "!"
                                      : document.status === "missing"
                                        ? "⇧"
                                        : "◷"}
                                </span>
                                <div>
                                  <div className="document-title-line">
                                    <h2>{getDocumentTitle(document)}</h2>
                                    <span
                                      className={`document-required-pill ${
                                        document.required ? "required" : "optional"
                                      }`}
                                    >
                                      {document.required
                                        ? t.documentsPage.required
                                        : t.documentsPage.optional}
                                    </span>
                                  </div>
                                  <p>{getDocumentDescription(document)}</p>
                                </div>
                              </div>

                              <span className={`document-status-badge status-${document.status}`}>
                                {getDocumentStatusLabel(document.status)}
                              </span>
                            </header>

                            {document.status === "rejected" && document.reviewNote && (
                              <div className="document-review-note">
                                <strong>{t.documentsPage.reviewNote}</strong>
                                <p dir="auto">{document.reviewNote}</p>
                              </div>
                            )}

                            {hasFile ? (
                              <div className="document-file-row">
                                <span className="document-file-icon" aria-hidden="true">
                                  {document.mimeType === "application/pdf" ? "PDF" : "IMG"}
                                </span>
                                <div className="document-file-info">
                                  <strong dir="auto">{document.originalName}</strong>
                                  <span>
                                    {formatFileSize(document.fileSize)} · {t.documentsPage.fileReady}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <label
                                className={`document-drop-zone ${
                                  isDragActive ? "active" : ""
                                }`}
                                htmlFor={fileInputId}
                              >
                                <span className="document-upload-symbol" aria-hidden="true">
                                  ⇧
                                </span>
                                <strong>{t.documentsPage.dragTitle}</strong>
                                <p>{t.documentsPage.dragText}</p>
                              </label>
                            )}

                            <div className="document-card-footer">
                              <div className="document-file-rules">
                                <span>{t.documentsPage.accepted}</span>
                                <span>
                                  {t.documentsPage.maxSize}: {document.maxSizeMb || 5} MB
                                </span>
                              </div>

                              <div className="document-actions">
                                {!isApproved && (
                                  <>
                                    <input
                                      id={fileInputId}
                                      className="document-file-input"
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                      disabled={isUploading}
                                      onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) handleDocumentUpload(document, file);
                                        event.target.value = "";
                                      }}
                                    />
                                    <label
                                      className={`document-action primary ${
                                        isUploading ? "disabled" : ""
                                      }`}
                                      htmlFor={fileInputId}
                                    >
                                      {isUploading
                                        ? t.documentsPage.uploading
                                        : hasFile
                                          ? t.documentsPage.replace
                                          : t.documentsPage.upload}
                                    </label>
                                  </>
                                )}

                                {hasFile && (
                                  <button
                                    type="button"
                                    className="document-action"
                                    onClick={() => handleDocumentDownload(document)}
                                  >
                                    {t.documentsPage.download}
                                  </button>
                                )}

                                {hasFile && !isApproved && (
                                  <button
                                    type="button"
                                    className="document-action danger"
                                    disabled={isDeleting}
                                    onClick={() => handleDocumentDelete(document)}
                                  >
                                    {isDeleting
                                      ? t.documentsPage.removing
                                      : t.documentsPage.remove}
                                  </button>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {activePage === "updates" && (
            <>
              <div className="dashboard-kicker">
                <span>◎</span>
                <span>{t.updatesPage.label}</span>
              </div>

              <div className="dashboard-heading">
                <h1>{t.updatesPage.title}</h1>
                <p>{t.updatesPage.subtitle}</p>
              </div>

              <section className="empty-panel">
                <p>{t.updatesPage.empty}</p>
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
