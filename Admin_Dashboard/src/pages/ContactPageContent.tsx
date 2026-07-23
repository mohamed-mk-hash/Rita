import { WebsitePageContentEditor } from "../components/content/WebsitePageContentEditor";

const sectionDescriptions = {
  hero: {
    ar: "تحكّم في العنوان والوصف وأزرار القسم الرئيسي لصفحة التواصل.",
    en: "Manage the Contact-page hero heading, description, and buttons.",
  },
  section: {
    ar: "عدّل مقدمة القسم الذي يحتوي على معلومات التواصل والنموذج.",
    en: "Edit the introduction above the contact information and form.",
  },
  info: {
    ar: "حدّث البريد والهاتف والعنوان وساعات العمل والتسميات المرتبطة بها.",
    en: "Update email, phone, address, business hours, and their labels.",
  },
  form: {
    ar: "عدّل عناوين حقول النموذج والأمثلة ورسائل النجاح والخطأ. إرسال الرسائل نفسه يبقى مرتبطًا بالنظام الحالي.",
    en: "Edit form labels, placeholders, and status messages. Message submission remains connected to the existing contact API.",
  },
  cards: {
    ar: "أدر بطاقات المميزات التي تظهر أسفل نموذج التواصل.",
    en: "Manage the benefit cards shown below the contact form.",
  },
  cta: {
    ar: "عدّل الدعوة الأخيرة لاتخاذ إجراء في أسفل الصفحة.",
    en: "Edit the final call-to-action at the bottom of the page.",
  },
};

export function ContactPageContent() {
  return (
    <WebsitePageContentEditor
      pageKey="contact"
      badge={{
        ar: "محتوى صفحة التواصل",
        en: "Contact-page content",
      }}
      title={{
        ar: "تعديل صفحة التواصل",
        en: "Edit Contact Page",
      }}
      description={{
        ar: "عدّل محتوى صفحة التواصل ومعلومات الشركة ونصوص النموذج، مع بقاء إرسال الرسائل يعمل عبر الـ API الحالي.",
        en: "Edit the Contact page, company details, and form copy while keeping the existing message-submission API unchanged.",
      }}
      sectionDescriptions={sectionDescriptions}
    />
  );
}
