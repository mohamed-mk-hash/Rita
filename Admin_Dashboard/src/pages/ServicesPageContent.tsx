import { WebsitePageContentEditor } from "../components/content/WebsitePageContentEditor";

const sectionDescriptions = {
  homeSection: {
    ar: "هذه العناوين تظهر فوق قسم الخدمات داخل الصفحة الرئيسية.",
    en: "These headings are shown above the services section on the home page.",
  },
  hero: {
    ar: "عدّل مقدمة صفحة الخدمات وعنوانها وأزرارها.",
    en: "Edit the Services-page hero, heading, and actions.",
  },
  services: {
    ar: "أدر الخدمات ووصفها المختصر والطويل والمميزات. نفس الخدمات تظهر تلقائيًا في الصفحة الرئيسية.",
    en: "Manage services, summaries, full descriptions, and features. The same services automatically appear on the home page.",
  },
  process: {
    ar: "عدّل خطوات العمل من فهم الاحتياج إلى التشغيل.",
    en: "Edit the workflow from discovery through operation.",
  },
  advantages: {
    ar: "عدّل قسم لماذا Rita ومميزات طريقة العمل.",
    en: "Edit the Why Rita section and its advantages.",
  },
  finalCta: {
    ar: "عدّل الدعوة الأخيرة أسفل صفحة الخدمات.",
    en: "Edit the final call-to-action on the Services page.",
  },
};

export function ServicesPageContent() {
  return (
    <WebsitePageContentEditor
      pageKey="services"
      badge={{ ar: "محتوى الخدمات", en: "Services content" }}
      title={{ ar: "تعديل صفحة الخدمات", en: "Edit Services Page" }}
      description={{
        ar: "عدّل الخدمات مرة واحدة. ستستخدم صفحة الخدمات والصفحة الرئيسية نفس البيانات المنشورة.",
        en: "Edit services once. The Services page and home page use the same published data.",
      }}
      sectionDescriptions={sectionDescriptions}
    />
  );
}
