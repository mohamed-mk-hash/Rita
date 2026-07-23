import { WebsitePageContentEditor } from "../components/content/WebsitePageContentEditor";

const sectionDescriptions = {
  homeSection: {
    ar: "هذه العناوين تظهر فوق قسم الأسعار داخل الصفحة الرئيسية.",
    en: "These headings are shown above the pricing section on the home page.",
  },
  hero: {
    ar: "عدّل مقدمة صفحة الأسعار وعنوانها وأزرارها.",
    en: "Edit the Pricing-page hero, heading, and actions.",
  },
  packages: {
    ar: "أدر الباقات والأسعار والمميزات. نفس الباقات تظهر تلقائيًا في الصفحة الرئيسية.",
    en: "Manage packages, prices, and features. The same packages automatically appear on the home page.",
  },
  highlights: {
    ar: "عدّل بطاقات مميزات الأسعار والدعم.",
    en: "Edit pricing and support highlight cards.",
  },
  comparison: {
    ar: "عدّل عنوان وجدول مقارنة الباقات.",
    en: "Edit the package comparison heading and rows.",
  },
  finalCta: {
    ar: "عدّل الدعوة الأخيرة أسفل صفحة الأسعار.",
    en: "Edit the final call-to-action on the Pricing page.",
  },
};

export function PricingPageContent() {
  return (
    <WebsitePageContentEditor
      pageKey="pricing"
      badge={{ ar: "محتوى الأسعار", en: "Pricing content" }}
      title={{ ar: "تعديل صفحة الأسعار", en: "Edit Pricing Page" }}
      description={{
        ar: "عدّل الباقات والأسعار مرة واحدة. ستستخدم صفحة الأسعار والصفحة الرئيسية نفس البيانات المنشورة.",
        en: "Edit packages and prices once. The Pricing page and home page use the same published data.",
      }}
      sectionDescriptions={sectionDescriptions}
    />
  );
}
