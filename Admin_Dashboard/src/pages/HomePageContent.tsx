import { WebsitePageContentEditor } from "../components/content/WebsitePageContentEditor";

const sectionDescriptions = {
  hero: {
    ar: "تحكّم في أول قسم يراه الزائر في الصفحة الرئيسية.",
    en: "Control the first section visitors see on the home page.",
  },
  product: {
    ar: "عدّل محتوى عرض بوابة العميل والتقدم المباشر.",
    en: "Edit the client-portal and live-progress presentation.",
  },
  startGrow: {
    ar: "عدّل تبويبات البداية والنمو والنصوص داخل العرض التوضيحي.",
    en: "Edit the start-and-grow tabs and their visual content.",
  },
  bundle: {
    ar: "عدّل محتوى باقة Rita One ومميزاتها.",
    en: "Edit the Rita One bundle and its included features.",
  },
  benefits: {
    ar: "أدر المميزات والفوائد التي تظهر للزوار.",
    en: "Manage the benefits and value points shown to visitors.",
  },
  partners: {
    ar: "عدّل بطاقات الوصول المالي وأدوات الأعمال.",
    en: "Edit financial-access and business-tool cards.",
  },
  trust: {
    ar: "حدّث عبارة الثقة والإحصائيات المختصرة.",
    en: "Update the trust statement and supporting metrics.",
  },
  finalCta: {
    ar: "عدّل الدعوة الأخيرة لاتخاذ إجراء في نهاية الصفحة.",
    en: "Edit the final call-to-action shown near the end of the page.",
  },
};

export function HomePageContent() {
  return (
    <WebsitePageContentEditor
      pageKey="home"
      badge={{ ar: "محتوى الموقع", en: "Website content" }}
      title={{ ar: "تعديل الصفحة الرئيسية", en: "Edit Home Page" }}
      description={{
        ar: "عدّل محتوى الصفحة الرئيسية. الأسعار والخدمات تُدار الآن من صفحتي الأسعار والخدمات وتظهر هنا تلقائيًا.",
        en: "Edit the home page. Pricing and services are now managed from their own pages and appear here automatically.",
      }}
      sectionDescriptions={sectionDescriptions}
    />
  );
}
