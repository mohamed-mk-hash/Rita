import { WebsitePageContentEditor } from "../components/content/WebsitePageContentEditor";

const sectionDescriptions = {
  hero: {
    ar: "تحكّم في العنوان الرئيسي والوصف وأزرار بداية الصفحة.",
    en: "Manage the main heading, description, and hero buttons.",
  },
  visuals: {
    ar: "عدّل النصوص القصيرة داخل الرسومات التوضيحية لقسمي المهمة والرؤية.",
    en: "Edit the short labels inside the mission and vision illustrations.",
  },
  introStats: {
    ar: "عدّل الإحصائيات المختصرة التي تظهر مباشرة بعد القسم الرئيسي.",
    en: "Edit the short statistics shown below the hero section.",
  },
  mission: {
    ar: "حدّث رسالة الشركة وعنوانها ووصفها.",
    en: "Update the company mission heading and description.",
  },
  vision: {
    ar: "حدّث رؤية الشركة وعنوانها ووصفها.",
    en: "Update the company vision heading and description.",
  },
  story: {
    ar: "حرّر قصة تأسيس Rita والخلفية التي تريد مشاركتها مع الزوار.",
    en: "Edit Rita's founding story and the background shared with visitors.",
  },
  expertise: {
    ar: "أدر قسم الخبرات وأعضاء الفريق وأدوارهم ونبذهم التعريفية.",
    en: "Manage the expertise section, team members, roles, and biographies.",
  },
  testimonials: {
    ar: "أضف أو عدّل آراء العملاء وأسماءهم وشركاتهم.",
    en: "Add or edit client testimonials, names, and companies.",
  },
  faq: {
    ar: "أدر مجموعات الأسئلة الشائعة والأسئلة والإجابات داخل كل مجموعة.",
    en: "Manage FAQ groups and the questions and answers in each group.",
  },
};

export function AboutPageContent() {
  return (
    <WebsitePageContentEditor
      pageKey="about"
      badge={{
        ar: "محتوى صفحة من نحن",
        en: "About-page content",
      }}
      title={{
        ar: "تعديل صفحة من نحن",
        en: "Edit About Page",
      }}
      description={{
        ar: "عدّل المهمة والرؤية والقصة والفريق وآراء العملاء والأسئلة الشائعة بنفس تصميم محرر الصفحة الرئيسية.",
        en: "Edit the mission, vision, story, team, testimonials, and FAQ with the same editor used for the home page.",
      }}
      sectionDescriptions={sectionDescriptions}
    />
  );
}
