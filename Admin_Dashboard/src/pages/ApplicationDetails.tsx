import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, CircleAlert, CircleDollarSign, Download, ExternalLink, FileText, Mail, RefreshCw, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { getAdminApplication, updateAdminApplication, type AdminApplication, type AdminApplicationStatus, type AdminApplicationDocument } from "../api/adminApplicationsApi";
import { openAdminDocument, downloadAdminDocument, reviewAdminDocument } from "../api/adminDocumentsApi";
import { sendWorkflowEmailRequest } from "../api/sendWorkflowEmail";
import { sendPaymentRequestEmail } from "../api/sendPaymentRequestEmail";
import { useLanguage } from "../i18n/LanguageContext";

const labels: Record<string, {ar:string; en:string}> = {
  draft:{ar:"مسودة",en:"Draft"},submitted:{ar:"طلب جديد",en:"New request"},in_review:{ar:"قيد المراجعة",en:"Under review"},
  waiting_documents:{ar:"بانتظار الوثائق",en:"Awaiting documents"}, waiting_payment:{ar:"بانتظار الدفع",en:"Awaiting payment"},
  paid:{ar:"تم الدفع",en:"Paid"},processing:{ar:"قيد التنفيذ",en:"In progress"},completed:{ar:"مكتمل",en:"Completed"},rejected:{ar:"مرفوض",en:"Rejected"},
};
const serviceNames: Record<string,{ar:string;en:string}> = {
  us_llc:{ar:"تأسيس شركة LLC",en:"US LLC Formation"},ein_assistance:{ar:"مساعدة EIN",en:"EIN Assistance"},
  banking_payment_setup:{ar:"الحسابات والمدفوعات",en:"Banking & Payments"},compliance_support:{ar:"دعم الامتثال",en:"Compliance Support"},
};
const phases = [
  {value:"intake_submitted",ar:"تم استقبال الطلب",en:"Request received"},
  {value:"document_review",ar:"مراجعة بيانات ووثائق العميل",en:"Reviewing client documents"},
  {value:"waiting_required_documents",ar:"بانتظار وثائق إضافية",en:"Waiting for documents"},
  {value:"document_corrections_required",ar:"طلب تصحيح الوثائق",en:"Document corrections needed"},
  {value:"documents_approved",ar:"تم قبول ملف العميل",en:"Client file approved"},
  {value:"payment_requested",ar:"بانتظار الدفع",en:"Payment requested"},
  {value:"payment_received",ar:"تم تأكيد الدفع",en:"Payment verified"},
  {value:"preparing_filing",ar:"التحضير للخدمة",en:"Preparing service"},
  {value:"filing_submitted",ar:"تم إيداع ملف التأسيس",en:"Filing submitted"},
  {value:"ein_processing",ar:"معالجة EIN",en:"EIN processing"},
  {value:"banking_setup",ar:"إعداد الحسابات البنكية",en:"Banking setup"},
  {value:"compliance_review",ar:"مراجعة الامتثال",en:"Compliance review"},
  {value:"completed",ar:"الخدمة مكتملة",en:"Service completed"},
];
const docStatuses: Record<string,{ar:string;en:string;color:string}> = {
  missing:{ar:"غير مرفوعة",en:"Missing",color:"bg-slate-100 text-slate-600"},
  uploaded:{ar:"تم الرفع",en:"Uploaded",color:"bg-blue-50 text-blue-700"},
  in_review:{ar:"قيد المراجعة",en:"In review",color:"bg-amber-50 text-amber-700"},
  approved:{ar:"مقبولة",en:"Approved",color:"bg-emerald-50 text-emerald-700"},
  rejected:{ar:"تحتاج تصحيحًا",en:"Needs correction",color:"bg-rose-50 text-rose-700"},
};
function fmt(value:string|null|undefined,ar:boolean) {
  if (!value) return "—";const d=new Date(value);return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(ar?"ar-DZ":"en-GB",{day:"numeric",month:"short",year:"numeric"}).format(d);
}
function Info({label,value}:{label:string;value:string|null|undefined}) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><span className="block text-xs font-bold text-slate-500">{label}</span><p className="mt-1 break-words text-sm font-extrabold text-[#173e56]" dir="auto">{value || "—"}</p></div>;
}
export function ApplicationDetails() {
  const { id } = useParams();const applicationId=Number(id);const {isArabic}=useLanguage();
  const t=(ar:string,en:string)=>isArabic?ar:en;
  const [app,setApp]=useState<AdminApplication|null>(null);
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");const [notice,setNotice]=useState("");
  const [notes,setNotes]=useState("");const [phase,setPhase]=useState("");const [progress,setProgress]=useState(0);
  const [action,setAction]=useState<string|null>(null);
  const [review,setReview]=useState<{document:AdminApplicationDocument;status:"approved"|"rejected"}|null>(null);
  const [reviewNote,setReviewNote]=useState("");
  const [confirm,setConfirm]=useState<AdminApplicationStatus|null>(null);
  const load=useCallback(async (silent=false)=>{
    if(!Number.isSafeInteger(applicationId)||applicationId<=0){setError("Invalid application ID");setLoading(false);return;}
    if(!silent)setLoading(true);
    try {const a=(await getAdminApplication(applicationId)).application;setApp(a);setNotes(a.notes||"");setPhase(a.currentStep||"");setProgress(a.progress||0);setError("");}
    catch(e){setError(e instanceof Error?e.message:"Failed to load application");}
    finally{setLoading(false);}
  },[applicationId]);
  useEffect(()=>{void load();},[load]);
  const missing=app?.documents.filter(d=>d.isRequired&&d.status==="missing").length||0;
  const rejected=app?.documents.filter(d=>d.isRequired&&d.status==="rejected").length||0;
  const approved=app?.documents.filter(d=>d.isRequired&&d.status==="approved").length||0;
  const requirements=app?.documents.filter(d=>d.isRequired).length||0;
  const paymentReady=app?.status==="paid";
  const actions=useMemo(()=>{
    if(!app)return [] as {status:AdminApplicationStatus;ar:string;en:string;primary?:boolean}[];
    if(["submitted","in_review","waiting_documents"].includes(app.status)) return [
      {status:"in_review" as const,ar:"بدء مراجعة الطلب",en:"Start review"},
      {status:"waiting_documents" as const,ar:"طلب استكمال الوثائق",en:"Request documents"},
      {status:"waiting_payment" as const,ar:"قبول الطلب وطلب الدفع",en:"Approve & request payment",primary:true},
      {status:"rejected" as const,ar:"رفض الطلب",en:"Reject request"},
    ];
    if(app.status==="paid")return [{status:"processing" as const,ar:"بدء تنفيذ الخدمة",en:"Start service",primary:true}];
    if(app.status==="processing")return [{status:"completed" as const,ar:"إنهاء الخدمة",en:"Complete service",primary:true}];
    return [];
  },[app]);
  async function save(next?:AdminApplicationStatus){
    if(!app)return;
    const target=next||app.status;
    if(target==="waiting_payment"&&!app.notificationEmail){setError(t("لا يوجد بريد للعميل. أضف بريدًا صحيحًا قبل قبول الطلب.","Client email is missing. Add an email before approval."));return;}
    if(target==="waiting_payment"&&(missing>0||rejected>0)){setError(t("يجب استكمال الوثائق المطلوبة وتصحيح المرفوضة قبل طلب الدفع.","Resolve missing or rejected required documents before requesting payment."));return;}
    if(target==="processing"&&!paymentReady){setError(t("الدفع لم يُؤكد بعد.","Payment has not been verified."));return;}
    setSaving(true);setError("");setNotice("");
    const old=app;
    const selectedPhase=next==="waiting_payment"?"payment_requested":next==="processing"?"preparing_filing":next==="completed"?"completed":phase;
    const selectedProgress=next==="waiting_payment"?Math.max(progress,35):next==="processing"?Math.max(progress,50):next==="completed"?100:progress;
    try{
      const updated=(await updateAdminApplication(app.id,{status:target,currentStep:selectedPhase,progress:selectedProgress,notes})).application;
      setApp(updated);setPhase(updated.currentStep||"");setProgress(updated.progress);setNotes(updated.notes||"");setConfirm(null);
      if(old.status!==updated.status||old.currentStep!==updated.currentStep){
        if(!updated.notificationEmail){setNotice(t("تم الحفظ، لكن ليس لدى العميل بريد إلكتروني.","Saved, but client email is missing."));return;}
        try{
          if (updated.status === "waiting_payment" && old.status !== "waiting_payment") {
            const result = await sendPaymentRequestEmail(updated.id, updated.notificationEmail, updated.client.fullName || "", serviceNames[updated.serviceType]?.en || updated.serviceType);
            setNotice(result.skipped
              ? t("تم حفظ الطلب، وقد قبل خادم البريد إشعار الدفع مؤخراً.", "Saved; email server recently accepted a payment notification.")
              : t("تم حفظ الطلب وقَبِل خادم SMTP رسالة قبول الطلب وطلب الدفع. تحقق من صندوق البريد.", "Saved; SMTP accepted the payment request email. Check the recipient inbox."));
            return;
          }
          await sendWorkflowEmailRequest({to:updated.notificationEmail,userName:updated.client.fullName||"",applicationId:updated.id,serviceName:serviceNames[updated.serviceType]?.en||updated.serviceType,oldPhase:phases.find(p=>p.value===old.currentStep)?.en||old.currentStep||"",newPhase:phases.find(p=>p.value===updated.currentStep)?.en||updated.currentStep||"",oldStatus:labels[old.status]?.en||old.status,newStatus:labels[updated.status]?.en||updated.status});setNotice(t("تم حفظ القرار وإرسال إشعار للعميل.","Changes saved and the client was emailed."));}
        catch(e){setError(t("تم حفظ الطلب، لكن إرسال البريد فشل. استخدم زر إعادة إرسال إشعار الدفع أدناه.","Application saved, but email sending failed. Use the resend button below.") + " " + (e instanceof Error ? e.message : ""));console.error("WORKFLOW_EMAIL_ERROR",e);}
      }else setNotice(t("تم حفظ الملاحظات والتقدم.","Notes and progress saved."));
    }catch(e){setError(e instanceof Error?e.message:t("فشل حفظ الطلب.","Could not save."));}
    finally{setSaving(false);}
  }
  async function documentAction(d:AdminApplicationDocument,operation:"open"|"download"){
    const docId=d.firestoreId||d.id;if(!docId)return;
    setAction(`${operation}-${docId}`);setError("");
    try {if(operation==="open")await openAdminDocument(docId);else await downloadAdminDocument(docId,d.originalName||"document");}
    catch(e){setError(e instanceof Error?e.message:"Document action failed");}finally{setAction(null);}
  }
  async function submitReview(){if(!review)return;const docId=review.document.firestoreId||review.document.id;if(!docId)return;
    if(review.status==="rejected"&&!reviewNote.trim()){setError(t("أدخل سبب الرفض.","Enter a rejection reason."));return;}
    setAction(String(docId));setError("");
    try{await reviewAdminDocument(docId,review.status,reviewNote);setReview(null);setReviewNote("");await load(true);setNotice(t("تم تحديث حالة الوثيقة.","Document reviewed."));}
    catch(e){setError(e instanceof Error?e.message:"Review failed");}finally{setAction(null);}
  }
  if(loading)return <div className="grid min-h-[65vh] place-items-center text-slate-500">{t("جاري تحميل تفاصيل الطلب...","Loading application...")}</div>;
  if(!app)return <div className="rounded-2xl bg-white p-8"><p className="text-rose-600">{error||"Application not found"}</p><Link to="/applications" className="mt-4 inline-block text-blue-600">{t("العودة للطلبات","Back")}</Link></div>;
  const service=serviceNames[app.serviceType]?.[isArabic?"ar":"en"]||app.serviceType;
  const Back=isArabic?ArrowRight:ArrowLeft;
  const selectedSolutions=["needsEin","needsStripe","needsPaypal","needsWise","needsMercury","needsRelay","needsPayoneer","needsShopify"].filter(k=>Boolean(app.intake?.[k as keyof NonNullable<AdminApplication["intake"]>])).map(k=>k.replace(/^needs/,""));
  return <div className="space-y-5 pb-12" dir={isArabic?"rtl":"ltr"}>
    <Link to="/applications" className="inline-flex items-center gap-2 text-sm font-extrabold text-blue-700"><Back size={16}/>{t("العودة إلى الطلبات","Back to applications")}</Link>
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">#{app.id}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-[#173e56]">{labels[app.status]?.[isArabic?"ar":"en"]||app.status}</span></div><h1 className="mt-3 text-2xl font-black text-[#0e3149] md:text-3xl">{service}</h1><p className="mt-2 text-sm font-semibold text-slate-500">{app.client.fullName||"—"} · {fmt(app.createdAt,isArabic)}</p></div><button onClick={()=>void load()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"><RefreshCw size={16}/>{t("تحديث","Refresh")}</button></div><div className="mt-6 flex items-center gap-3"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${Math.max(0,Math.min(100,app.progress||0))}%`}}/></div><strong className="text-sm text-blue-700">{app.progress||0}%</strong></div></header>
    {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
    {notice&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{notice}</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"><main className="min-w-0 space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><UserRound className="text-blue-600"/><div><h2 className="font-black text-slate-900">{t("معلومات العميل والشركة","Client & company")}</h2><p className="text-xs text-slate-500">{t("راجع البيانات قبل قبول تقديم الخدمة.","Verify details before accepting the service.")}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Info label={t("اسم العميل","Client name")} value={app.client.fullName}/><Info label={t("البريد الإلكتروني","Email")} value={app.notificationEmail}/><Info label={t("الهاتف","Phone")} value={app.intake?.phone}/><Info label={t("الدولة","Country")} value={app.intake?.country}/><Info label={t("الشركة المقترحة","Company name")} value={app.intake?.desiredCompanyName||app.client.companyName}/><Info label={t("الحلول المطلوبة","Requested solutions")} value={selectedSolutions.join(", ")}/></div><details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-black text-[#173e56]">{t("النشاط التجاري والملاحظات","Business activity & notes")}</summary><div className="mt-4 space-y-3 text-sm"><p className="whitespace-pre-wrap text-slate-700">{app.intake?.businessActivity||"—"}</p><div className="border-t border-slate-200 pt-3 whitespace-pre-wrap text-slate-600">{app.intake?.extraNotes||"—"}</div></div></details></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><FileText className="text-blue-600"/><div><h2 className="font-black text-slate-900">{t("وثائق العميل","Client documents")}</h2><p className="text-xs text-slate-500">{t("فتح وتحميل وقبول أو رفض الملفات","Open, download, approve or reject files")}</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black">{approved}/{requirements} {t("مقبولة","approved")}</span></div>
      {(missing>0||rejected>0)&&<div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800"><CircleAlert className="shrink-0" size={18}/>{t(`هناك ${missing} وثائق مطلوبة ناقصة و${rejected} مرفوضة.`,`There are ${missing} missing and ${rejected} rejected required documents.`)}</div>}
      <div className="mt-4 space-y-3">{app.documents.length===0?<div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">{t("لا توجد متطلبات وثائق","No document requirements")}</div>:app.documents.map(d=>{const hasFile=!!(d.originalName&&d.status!=="missing"&&(d.id||d.firestoreId));const s=docStatuses[d.status];return <article key={`${d.requirementId}-${d.firestoreId||"none"}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-extrabold text-slate-900">{(isArabic?d.titleAr:d.titleEn)||d.originalName}</p><p className="mt-1 break-all text-xs text-slate-500">{d.originalName||t("لم يرفع الملف بعد","Not uploaded")}</p><div className="mt-2 flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s?.color||"bg-slate-100"}`}>{isArabic?s?.ar:s?.en}</span>{d.isRequired&&<span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">{t("مطلوبة","Required")}</span>}</div></div>{hasFile&&<div className="flex flex-wrap gap-2"><button disabled={!!action} onClick={()=>void documentAction(d,"open")} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700" title={t("فتح","Open")}><ExternalLink size={17}/></button><button disabled={!!action} onClick={()=>void documentAction(d,"download")} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700" title={t("تحميل","Download")}><Download size={17}/></button><button disabled={!!action||d.status==="approved"} onClick={()=>{setReview({document:d,status:"approved"});setReviewNote("");}} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><Check size={15}/>{t("قبول","Approve")}</button><button disabled={!!action} onClick={()=>{setReview({document:d,status:"rejected"});setReviewNote(d.reviewNote||"");}} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white"><X size={15}/>{t("رفض","Reject")}</button></div>}</div>{d.reviewNote&&<p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{d.reviewNote}</p>}</article>;})}</div></section>
    </main><aside className="space-y-4 xl:sticky xl:top-24 xl:self-start"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><ShieldCheck className="text-blue-600"/><h2 className="text-lg font-black text-slate-900">{t("قرار الإدارة","Admin decision")}</h2></div><p className="mt-2 text-xs leading-6 text-slate-500">{t("تسلسل العمل: مراجعة ← طلب الدفع ← تأكيد آلي ← تنفيذ ← اكتمال.","Review → payment request → verified payment → processing → completion.")}</p>
    {app.status==="waiting_payment"&&<button type="button" disabled={saving} onClick={async()=>{
      setSaving(true);setError("");setNotice("");
      try { const result=await sendPaymentRequestEmail(app.id, app.notificationEmail, app.client.fullName || "", serviceNames[app.serviceType]?.en || app.serviceType);setNotice(result.skipped?t("تم قبول البريد مؤخراً، يرجى الانتظار دقيقة قبل الإعادة.","Email accepted recently; wait a minute before resending."):t("قبل خادم SMTP البريد مجددًا. تحقق من بريد العميل.","SMTP accepted the resent email. Check the client's inbox.")); }
      catch(e){setError(e instanceof Error?e.message:t("فشل إعادة إرسال البريد.","Email retry failed."));}
      finally{setSaving(false);}
    }} className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800 disabled:opacity-50">{t("إعادة إرسال بريد قبول الطلب وطلب الدفع", "Resend acceptance & payment email")}</button>}
    {app.status==="waiting_payment"&&<div className="mt-4 rounded-xl bg-amber-50 p-4"><div className="flex items-center gap-2 font-black text-amber-800"><CircleDollarSign size={19}/>{t("بانتظار دفع العميل","Awaiting client payment")}</div><p className="mt-2 text-xs leading-5 text-amber-800">{t("لا يتم تعيين تم الدفع من لوحة الإدارة. سيأتي التأكيد من Webhook بوابة الدفع لاحقًا.","Paid status must come from a verified payment webhook, not the admin UI.")}</p></div>}
    {app.status==="paid"&&<div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><BadgeCheck size={19} className="mb-2"/>{t("الدفع مؤكد. يمكنك بدء التنفيذ.","Payment verified. You may start processing.")}</div>}
    <div className="mt-5 grid gap-2">{actions.filter(a=>!(a.status===app.status)).map(a=><button key={a.status} disabled={saving||(a.status==="waiting_payment"&&(missing>0||rejected>0))} onClick={()=>{setError("");setConfirm(a.status);}} className={`min-h-11 rounded-xl px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 ${a.primary?"bg-[#df3341] text-white hover:bg-[#c92b38]":"border border-slate-200 bg-slate-50 text-[#173e56] hover:bg-slate-100"}`}>{isArabic?a.ar:a.en}</button>)}</div>
    <label className="mt-5 block text-xs font-black text-slate-600">{t("المرحلة الحالية","Current phase")}<select value={phase} onChange={e=>setPhase(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold"><option value="">{t("غير محددة","Not specified")}</option>{phase&&!phases.some(p=>p.value===phase)&&<option value={phase}>{phase.replace(/_/g," ")}</option>}{phases.map(p=><option key={p.value} value={p.value}>{isArabic?p.ar:p.en}</option>)}</select></label>
    <label className="mt-4 block text-xs font-black text-slate-600">{t("ملاحظات داخلية","Internal notes")}<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium" placeholder={t("ملاحظات تخص فريق الإدارة فقط...","Private team notes...")}/></label>
    <details className="mt-4 rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-xs font-black text-slate-600">{t("إعدادات التقدم","Progress options")}</summary><label className="mt-3 flex justify-between text-xs font-bold"><span>{t("التقدم","Progress")}</span><span>{progress}%</span></label><input type="range" min={0} max={100} step={5} value={progress} onChange={e=>setProgress(Number(e.target.value))} className="mt-2 w-full accent-blue-600"/></details>
    <button onClick={()=>void save()} disabled={saving} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173e56] px-4 text-sm font-black text-white disabled:opacity-50"><Save size={17}/>{saving?t("جاري الحفظ...","Saving..."):t("حفظ الملاحظات والمرحلة","Save notes & phase")}</button></section>
    {app.status==="completed"&&<Link to="/company-documents" className="block rounded-xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">{t("الخدمة مكتملة — انتقل لرفع وثائق الشركة ←","Service complete — publish company documents →")}</Link>}
    <div className="flex gap-2 rounded-xl bg-blue-50 p-4 text-xs leading-6 text-blue-800"><Mail className="shrink-0" size={18}/>{t("يُرسل بريد عند تغيير الحالة في هذه الصفحة، لكن يجب تجهيز رابط الدفع ورسالة الدفع المخصصة في المرحلة التالية.","Status-change email uses your existing mail service. Checkout links and payment confirmation will be added next.")}</div>
    </aside></div>
    {confirm&&<div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h3 className="text-lg font-black text-slate-900">{t("تأكيد تغيير الحالة","Confirm status change")}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{t("سيُحفظ القرار ويُرسل إشعار للعميل في حال نجاح خدمة البريد.","This saves the decision and attempts to email the client.")} <strong>{labels[confirm]?.[isArabic?"ar":"en"]}</strong></p>{confirm==="waiting_payment"&&<p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">{t("هذه المرحلة لا تُنشئ رابط Stripe أو PayPal بعد. لن يستطيع العميل الدفع حتى نربط بوابة الدفع.","This step does not create a Stripe/PayPal checkout link yet. Payment integration is required next.")}</p>}<div className="mt-5 flex justify-end gap-2"><button onClick={()=>setConfirm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">{t("إلغاء","Cancel")}</button><button disabled={saving} onClick={()=>void save(confirm)} className="rounded-xl bg-[#df3341] px-4 py-2 text-sm font-black text-white disabled:opacity-50">{t("تأكيد","Confirm")}</button></div></div></div>}
    {review&&<div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6"><h3 className="text-lg font-black">{review.status==="approved"?t("قبول الوثيقة","Approve document"):t("رفض الوثيقة","Reject document")}</h3><p className="mt-2 text-sm text-slate-500">{isArabic?review.document.titleAr:review.document.titleEn}</p><textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} rows={4} className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder={t("سبب الرفض أو ملاحظة اختيارية...","Reason / optional review note...")}/><div className="mt-4 flex justify-end gap-2"><button onClick={()=>setReview(null)} className="rounded-xl border px-4 py-2 text-sm font-bold">{t("إلغاء","Cancel")}</button><button onClick={()=>void submitReview()} disabled={!!action} className="rounded-xl bg-[#173e56] px-4 py-2 text-sm font-black text-white disabled:opacity-50">{t("حفظ المراجعة","Save review")}</button></div></div></div>}
  </div>;
}
