import { useEffect, useState } from "react";
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
      password: "Password",
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
        "Tell us what you need through a clear four-step process. You can review everything before submitting.",
      progressLabel: "Request progress",
      step: "Step",
      of: "of",
      next: "Continue",
      back: "Back",
      submit: "Submit request",
      submitting: "Submitting...",
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
        "Select the main service you want Rita to help you with. You can add payment solutions later.",
      infoStep: "Tell us about your project",
      infoStepText:
        "These details help the team understand your situation before contacting you.",
      paymentStep: "Choose payment solutions",
      paymentStepText:
        "Select every solution you want to prepare. For banking requests, choose at least one option.",
      reviewStep: "Review and submit",
      reviewStepText:
        "Check the information below. You can return to any completed step to edit it.",
      steps: {
        1: { title: "Service", short: "What you need" },
        2: { title: "Information", short: "Your project" },
        3: { title: "Solutions", short: "Payment needs" },
        4: { title: "Review", short: "Confirm request" },
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
      password: "كلمة المرور",
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
        "أخبرنا بما تحتاجه عبر أربع خطوات واضحة، ثم راجع جميع المعلومات قبل الإرسال.",
      progressLabel: "تقدم الطلب",
      step: "الخطوة",
      of: "من",
      next: "متابعة",
      back: "رجوع",
      submit: "إرسال الطلب",
      submitting: "جاري الإرسال...",
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
        "حدد الخدمة الأساسية التي تريد مساعدة Rita فيها، ويمكنك إضافة حلول الدفع في الخطوة الثالثة.",
      infoStep: "أخبرنا عن مشروعك",
      infoStepText:
        "تساعد هذه المعلومات الفريق على فهم وضعك وتجهيز التواصل معك بصورة أفضل.",
      paymentStep: "اختر حلول الدفع",
      paymentStepText:
        "حدد كل الحلول التي تحتاجها. عند اختيار خدمة الحسابات والمدفوعات يجب تحديد حل واحد على الأقل.",
      reviewStep: "راجع الطلب ثم أرسله",
      reviewStepText:
        "تحقق من المعلومات أدناه، ويمكنك الرجوع إلى أي خطوة مكتملة لتعديلها.",
      steps: {
        1: { title: "الخدمة", short: "ماذا تحتاج؟" },
        2: { title: "المعلومات", short: "تفاصيل مشروعك" },
        3: { title: "الحلول", short: "احتياجات الدفع" },
        4: { title: "المراجعة", short: "تأكيد الطلب" },
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
  "needsEin",
  "needsStripe",
  "needsPaypal",
  "needsWise",
  "needsMercury",
  "needsRelay",
  "needsPayoneer",
  "needsShopify",
];

function createInitialIntakeForm() {
  return {
    serviceType: "us_llc",
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

function Dashboard() {
  const navigate = useNavigate();
  const languageContext = useLanguage();

  const lang = languageContext?.lang || "en";
  const isArabic = languageContext?.isArabic ?? lang === "ar";
  const changeLanguage = languageContext?.changeLanguage || (() => {});
  const t = copy[lang] || copy.en;

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activePage, setActivePage] = useState("overview");
  const [intakeStep, setIntakeStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [intakeForm, setIntakeForm] = useState(createInitialIntakeForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

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

  const activeApplication =
    applications.find((app) => !["completed", "rejected"].includes(app.status)) ||
    applications[0] ||
    null;

  const selectedDocumentApplication =
    applications.find(
      (application) =>
        Number(application.id) === Number(selectedDocumentApplicationId)
    ) || null;

  async function loadDashboard() {
    try {
      const userData = await getCurrentUserRequest();
      setUser(userData.user);

      const applicationsData = await getMyApplicationsRequest();
      setApplications(applicationsData.applications || []);
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
    const defaultNeeds = paymentNeedFields.reduce((result, field) => {
      result[field] = false;
      return result;
    }, {});

    if (serviceType === "us_llc" || serviceType === "ein_assistance") {
      defaultNeeds.needsEin = true;
    }

    setIntakeForm((current) => ({
      ...current,
      serviceType,
      ...defaultNeeds,
    }));

    setFieldErrors({});
    setRequestError("");
  }

  function getSelectedPaymentFields(form = intakeForm) {
    return paymentNeedFields.filter((field) => Boolean(form[field]));
  }

  function getValidationErrors(step, form = intakeForm) {
    const errors = {};

    if (step === 2) {
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
      step === 3 &&
      form.serviceType === "banking_payment_setup" &&
      getSelectedPaymentFields(form).length === 0
    ) {
      errors.paymentNeeds = t.request.errors.paymentRequired;
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

    const nextStep = Math.min(intakeStep + 1, 4);
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

  async function handleCreateRequest(event) {
    event.preventDefault();

    const infoErrors = getValidationErrors(2);
    const paymentErrors = getValidationErrors(3);
    const allErrors = { ...infoErrors, ...paymentErrors };

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setRequestError(t.request.validationError);

      if (Object.keys(infoErrors).length > 0) {
        setIntakeStep(2);
      } else {
        setIntakeStep(3);
      }

      return;
    }

    setCreating(true);
    setRequestError("");
    setRequestMessage("");

    try {
      const data = await createApplicationRequest(intakeForm);

      setApplications((current) => [data.application, ...current]);
      setIntakeForm(createInitialIntakeForm());
      setIntakeStep(1);
      setMaxStepReached(1);
      setFieldErrors({});
      setRequestMessage(t.request.success);
      setSelectedDocumentApplicationId(data.application.id);
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
  const requestProgress = ((intakeStep - 1) / 3) * 100;
  const selectedPaymentFields = getSelectedPaymentFields();
  const selectedPaymentTitles = selectedPaymentFields.map(
    (field) => t.request.needs[field]?.title || field
  );

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

            <button className="topbar-icon" type="button" aria-label="Profile">
              ◎
            </button>

            <button className="topbar-icon" type="button" aria-label="Notifications">
              ♡
            </button>

            <button className="topbar-password" type="button">
              🔑 {t.topbar.password}
            </button>

            <button className="dashboard-lang-btn" type="button" onClick={handleLanguageToggle}>
              ↔ {t.langButton}
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
                      {t.request.step} {intakeStep} {t.request.of} 4
                    </strong>
                  </div>

                  <div className="request-progress-track" aria-hidden="true">
                    <span style={{ width: `${requestProgress}%` }} />
                  </div>
                </div>

                <div className="intake-steps" aria-label={t.request.progressLabel}>
                  {[1, 2, 3, 4].map((step) => {
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
                          <h2>{t.request.infoStep}</h2>
                          <p>{t.request.infoStepText}</p>
                        </div>
                      </div>

                      <div className="intake-grid">
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

                  {intakeStep === 3 && (
                    <div className="intake-step">
                      <div className="intake-step-heading">
                        <span className="intake-step-icon">03</span>
                        <div>
                          <h2>{t.request.paymentStep}</h2>
                          <p>{t.request.paymentStepText}</p>
                        </div>
                      </div>

                      <div className="payment-selection-summary">
                        <span>{t.request.paymentNeeds}</span>
                        <strong>{selectedPaymentFields.length}</strong>
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

                      {fieldErrors.paymentNeeds && (
                        <p className="field-error payment-error" role="alert">
                          {fieldErrors.paymentNeeds}
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

                  {intakeStep === 4 && (
                    <div className="intake-step">
                      <div className="intake-step-heading">
                        <span className="intake-step-icon">04</span>
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
                              <strong>{t.request.contactSummary}</strong>
                            </div>
                            <button type="button" onClick={() => goToAccessibleStep(2)}>
                              {t.request.edit}
                            </button>
                          </header>

                          <dl>
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
                        </article>

                        <article className="review-section-card">
                          <header>
                            <div>
                              <span>03</span>
                              <strong>{t.request.paymentNeeds}</strong>
                            </div>
                            <button type="button" onClick={() => goToAccessibleStep(3)}>
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

                        <article className="review-section-card full">
                          <header>
                            <div>
                              <span>02</span>
                              <strong>{t.request.projectSummary}</strong>
                            </div>
                            <button type="button" onClick={() => goToAccessibleStep(2)}>
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
                            {creating ? t.request.submitting : t.request.submit}
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
