import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, CircleDollarSign, Clock3, FileText, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { getAdminApplications, type AdminApplication, type AdminApplicationStatus } from "../api/adminApplicationsApi";
import { useLanguage } from "../i18n/LanguageContext";

type Filter = "all" | "attention" | AdminApplicationStatus;
const statuses: { value: AdminApplicationStatus; en: string; ar: string; color: string }[] = [
  { value: "draft", en: "Draft", ar: "مسودة", color: "bg-slate-100 text-slate-700" },
  { value: "submitted", en: "Submitted", ar: "تم الإرسال", color: "bg-indigo-50 text-indigo-700" },
  { value: "in_review", en: "In review", ar: "قيد المراجعة", color: "bg-sky-50 text-sky-700" },
  { value: "waiting_documents", en: "Waiting for documents", ar: "بانتظار الوثائق", color: "bg-orange-50 text-orange-700" },
  { value: "waiting_payment", en: "Waiting for payment", ar: "بانتظار الدفع", color: "bg-amber-50 text-amber-800" },
  { value: "paid", en: "Paid", ar: "تم الدفع", color: "bg-emerald-50 text-emerald-700" },
  { value: "processing", en: "In progress", ar: "قيد التنفيذ", color: "bg-blue-50 text-blue-700" },
  { value: "completed", en: "Completed", ar: "مكتمل", color: "bg-green-50 text-green-700" },
  { value: "rejected", en: "Rejected", ar: "مرفوض", color: "bg-rose-50 text-rose-700" },
];
const serviceNames: Record<string, { ar: string; en: string }> = {
  us_llc: { ar: "تأسيس LLC أمريكية", en: "US LLC Formation" },
  ein_assistance: { ar: "استخراج EIN", en: "EIN Assistance" },
  banking_payment_setup: { ar: "الحسابات والمدفوعات", en: "Banking & Payments" },
  compliance_support: { ar: "دعم الامتثال", en: "Compliance Support" },
};
function dateLabel(value: string, ar: boolean) {
  const d = new Date(value);
  return !value || Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat(ar ? "ar-DZ" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}
function Status({ status, ar }: { status: AdminApplicationStatus; ar: boolean }) {
  const item = statuses.find(x => x.value === status);
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold ${item?.color || "bg-slate-100"}`}>{ar ? item?.ar : item?.en}</span>;
}
function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof FileText; accent: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-slate-500">{label}</p><strong className="mt-2 block text-3xl font-black text-slate-900">{value}</strong></div><span className={`rounded-xl p-3 ${accent}`}><Icon size={21}/></span></div></div>;
}
export function Applications() {
  const { isArabic } = useLanguage();
  const [items, setItems] = useState<AdminApplication[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setItems((await getAdminApplications()).applications); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load applications"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const t = (ar: string, en: string) => isArabic ? ar : en;
  const stats = {
    all: items.length,
    attention: items.filter(a => ["submitted", "in_review", "paid"].includes(a.status)).length,
    waiting: items.filter(a => a.status === "waiting_payment").length,
    completed: items.filter(a => a.status === "completed").length,
  };
  const visible = useMemo(() => items.filter(a => {
    const q = search.trim().toLowerCase();
    const matches = !q || [a.id, a.client?.fullName, a.client?.email, a.client?.companyName, a.intake?.desiredCompanyName, a.serviceType].some(v => String(v ?? "").toLowerCase().includes(q));
    return matches && (filter === "all" || (filter === "attention" ? ["submitted", "in_review", "paid"].includes(a.status) : a.status === filter));
  }).sort((a,b) => (sort === "newest" ? -1 : 1) * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())), [items, search, filter, sort]);
  return <div className="space-y-6 pb-10" dir={isArabic ? "rtl" : "ltr"}>
    <header className="flex flex-wrap items-end justify-between gap-4"><div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">{t("إدارة العمليات", "Operations hub")}</span><h1 className="mt-3 text-3xl font-black text-[#0e3149]">{t("طلبات الخدمات", "Service applications")}</h1><p className="mt-2 text-sm font-medium text-slate-500">{t("راجع الطلبات، تابع المدفوعات، وابدأ تنفيذ الخدمات من مكان واحد.", "Review requests, track payment, and manage delivery from one place.")}</p></div><button onClick={() => void load()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={16}/>{t("تحديث", "Refresh")}</button></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label={t("جميع الطلبات", "All applications")} value={stats.all} icon={FileText} accent="bg-blue-50 text-blue-600"/><Stat label={t("تحتاج إجراءً", "Needs action")} value={stats.attention} icon={Clock3} accent="bg-violet-50 text-violet-600"/><Stat label={t("بانتظار الدفع", "Awaiting payment")} value={stats.waiting} icon={CircleDollarSign} accent="bg-amber-50 text-amber-600"/><Stat label={t("مكتملة", "Completed")} value={stats.completed} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600"/></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black text-slate-900">{t("قائمة الطلبات", "Application queue")}</h2><span className="text-xs font-bold text-slate-500">{visible.length} {t("نتيجة", "results")}</span></div><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_210px_160px]"><label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search size={18} className="text-slate-400"/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("ابحث بالاسم أو رقم الطلب أو البريد...", "Search name, email, or request #...")} className="w-full bg-transparent text-sm outline-none"/></label><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><SlidersHorizontal size={17} className="text-slate-400"/><select className="w-full bg-transparent py-3 text-sm font-semibold outline-none" value={filter} onChange={e=>setFilter(e.target.value as Filter)}><option value="all">{t("كل الحالات", "All statuses")}</option><option value="attention">{t("تحتاج إجراءً", "Needs action")}</option>{statuses.map(s=><option value={s.value} key={s.value}>{isArabic ? s.ar : s.en}</option>)}</select></label><select value={sort} onChange={e=>setSort(e.target.value as "newest"|"oldest")} className="rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"><option value="newest">{t("الأحدث أولًا", "Newest first")}</option><option value="oldest">{t("الأقدم أولًا", "Oldest first")}</option></select></div></div>
    {error && <div role="alert" className="m-5 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}<button onClick={()=>void load()} className="mx-3 underline">{t("إعادة المحاولة", "Retry")}</button></div>}
    {loading ? <div className="p-14 text-center text-slate-500">{t("جاري تحميل الطلبات...", "Loading applications...")}</div> : visible.length === 0 ? <div className="p-16 text-center"><FileText size={36} className="mx-auto text-slate-300"/><p className="mt-3 font-bold text-slate-500">{t("لا توجد طلبات مطابقة", "No matching applications")}</p></div> : <div className="divide-y divide-slate-100">{visible.map(a=><article key={a.id} className="grid gap-4 px-5 py-5 transition hover:bg-slate-50/80 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_170px_120px] lg:items-center"><div className="min-w-0"><Link to={`/applications/${a.id}`} className="font-black text-[#173e56] hover:text-blue-700">{t("طلب", "Request")} #{a.id}</Link><p className="mt-1 truncate text-base font-bold text-slate-900">{a.client?.fullName || "—"}</p><p className="mt-1 truncate text-xs text-slate-500" dir="auto">{a.client?.email || "—"}</p></div><div><p className="text-sm font-bold text-slate-700">{(serviceNames[a.serviceType]?.[isArabic ? "ar":"en"]) || a.serviceType}</p><p className="mt-1 text-xs text-slate-500">{dateLabel(a.createdAt,isArabic)}</p></div><div className="space-y-2"><Status status={a.status} ar={isArabic}/><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${Math.min(100,Math.max(0,a.progress || 0))}%`}}/></div><span className="text-xs font-bold text-slate-400">{a.progress || 0}%</span></div></div><Link to={`/applications/${a.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#173e56] px-4 text-xs font-black text-white hover:bg-[#0e3149]">{t("فتح الطلب", "Open") }<ArrowUpRight size={16}/></Link></article>)}</div>}
    </section>
  </div>;
}
