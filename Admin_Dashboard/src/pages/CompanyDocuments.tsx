import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, FolderOpen, RefreshCw, UploadCloud, Search, Trash2, Eye, EyeOff, CheckCircle2, LockKeyhole } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { getAdminApplications, type AdminApplication } from "../api/adminApplicationsApi";
import { getAdminCompanyDocuments, uploadAdminCompanyDocument, setAdminCompanyDocumentPublished, deleteAdminCompanyDocument, type CompanyDocument } from "../api/adminCompanyDocumentsApi";

const allowedStatuses = new Set(["processing", "completed"]);
const maxSize = 15 * 1024 * 1024;
const allowedMime = new Set(["application/pdf", "image/png", "image/jpeg"]);

function fileSize(bytes: number) {
  return bytes < 1048576 ? `${Math.max(0, bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}
function dateLabel(value: string | null, isArabic: boolean) {
  if (!value) return "—";
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? "—" : new Intl.DateTimeFormat(isArabic ? "ar-DZ" : "en-US", { dateStyle: "medium" }).format(time);
}

export const CompanyDocuments: React.FC = () => {
  const { isArabic } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [files, setFiles] = useState<CompanyDocument[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const selectedId = params.get("applicationId") || "";
  const selected = applications.find(item => String(item.id) === selectedId);
  const canUpload = Boolean(selected && allowedStatuses.has(selected.status));
  const tr = (ar: string, en: string) => isArabic ? ar : en;

  const loadApplications = useCallback(async () => {
    setLoadingApplications(true);
    try {
      const response = await getAdminApplications();
      setApplications(response.applications);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load applications.");
    } finally { setLoadingApplications(false); }
  }, []);

  const loadFiles = useCallback(async () => {
    if (!selectedId) { setFiles([]); return; }
    setLoadingFiles(true);
    try {
      setFiles(await getAdminCompanyDocuments(Number(selectedId)));
      setError("");
    } catch (e) {
      setFiles([]);
      setError(e instanceof Error ? e.message : "Could not load company documents.");
    } finally { setLoadingFiles(false); }
  }, [selectedId]);

  useEffect(() => { void loadApplications(); }, [loadApplications]);
  useEffect(() => { void loadFiles(); }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return files.filter(item => !query || [item.title, item.fileName, item.description].some(value => value.toLocaleLowerCase().includes(query)));
  }, [files, search]);
  const publishedCount = files.filter(item => item.published).length;

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || !canUpload || !file) return;
    if (!allowedMime.has(file.type) || file.size < 1 || file.size > maxSize) {
      setError(tr("يُسمح بملفات PDF وJPG وPNG بحجم لا يتجاوز 15MB.", "Only PDF, JPG, PNG up to 15MB are allowed."));
      return;
    }
    setBusy(true); setError(""); setSuccess("");
    try {
      await uploadAdminCompanyDocument({ applicationId: selected.id, title: title.trim(), description, file });
      setTitle(""); setDescription(""); setFile(null);
      const input = document.getElementById("company-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadFiles();
      setSuccess(tr("تم رفع الملف كوثيقة خاصة. اضغط نشر لإتاحته للعميل.", "File uploaded privately. Publish it when ready for the client."));
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  async function togglePublished(item: CompanyDocument) {
    setBusy(true); setError(""); setSuccess("");
    try {
      await setAdminCompanyDocumentPublished(item.id, !item.published);
      await loadFiles();
      setSuccess(item.published ? tr("تم إلغاء النشر.", "Document unpublished.") : tr("تم نشر الوثيقة للعميل.", "Document published to the client."));
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(false); }
  }

  async function remove(item: CompanyDocument) {
    if (!window.confirm(tr(`هل تريد حذف ${item.fileName} نهائيًا؟`, `Permanently delete ${item.fileName}?`))) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await deleteAdminCompanyDocument(item.id);
      await loadFiles();
      setSuccess(tr("تم حذف الوثيقة.", "Document deleted."));
    } catch (e) { setError(e instanceof Error ? e.message : "Delete failed."); }
    finally { setBusy(false); }
  }

  function selectApplication(id: string) {
    setError(""); setSuccess(""); setSearch("");
    setParams(id ? { applicationId: id } : {});
  }

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"><FolderOpen className="h-4 w-4" />{tr("مكتبة ملفات الشركات", "Company deliverables")}</span>
          <h1 className="mt-3 text-3xl font-black text-[#07182a]">{tr("وثائق الشركات", "Company Documents")}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">{tr("ارفع الملفات الرسمية للعميل وانشرها فقط عندما تصبح جاهزة.", "Upload official company files and publish them only when they are ready.")}</p>
        </div>
        <button type="button" onClick={() => { void loadApplications(); void loadFiles(); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />{tr("تحديث", "Refresh")}</button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label htmlFor="company-application" className="block text-sm font-black text-slate-900">{tr("اختر طلب العميل", "Select client application")}</label>
        <select id="company-application" value={selectedId} onChange={e => selectApplication(e.target.value)} disabled={loadingApplications} className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-500">
          <option value="">{loadingApplications ? tr("جاري تحميل الطلبات...", "Loading applications...") : tr("اختر طلبًا من القائمة", "Choose an application")}</option>
          {applications.map(item => <option key={item.id} value={item.id}>#{item.id} — {item.client.fullName || item.client.email || tr("عميل", "Client")} — {item.intake?.desiredCompanyName || item.serviceType}</option>)}
        </select>
        {selected && <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{tr("العميل", "Client")}: {selected.client.fullName || "—"}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{tr("الحالة", "Status")}: {selected.status}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{tr("الوثائق المنشورة", "Published")}: {publishedCount}</span></div>}
      </section>

      {!selected ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center"><FolderOpen className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-4 font-bold text-slate-600">{tr("اختر طلبًا لعرض ملفات الشركة وإدارتها.", "Select an application to manage its company files.")}</p></section>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-900">{tr("ملفات الشركة", "Company files")}</h2><p className="mt-1 text-sm text-slate-500">{files.length} {tr("وثيقة", "files")} · {publishedCount} {tr("منشورة", "published")}</p></div><div className="relative"><Search className="pointer-events-none absolute top-3.5 start-3 h-4 w-4 text-slate-400" /><input aria-label={tr("بحث عن وثيقة", "Search documents")} value={search} onChange={e => setSearch(e.target.value)} placeholder={tr("بحث...", "Search...")} className="min-h-11 w-52 max-w-full rounded-xl border border-slate-200 bg-slate-50 ps-10 pe-3 text-sm" /></div></div>
            {loadingFiles ? <p className="py-12 text-center text-sm text-slate-500">{tr("جاري التحميل...", "Loading...")}</p> : filteredFiles.length === 0 ? <div className="py-16 text-center"><FileText className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-500">{tr("لا توجد وثائق مطابقة حاليًا.", "No matching documents yet.")}</p></div> : <div className="mt-6 space-y-3">{filteredFiles.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><FileText className="h-5 w-5" /></div><div className="min-w-0"><h3 className="break-words font-black text-slate-900">{item.title}</h3><p className="mt-1 break-all text-xs font-semibold text-slate-500">{item.fileName} · {fileSize(item.fileSize)} · {dateLabel(item.createdAt, isArabic)}</p><span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${item.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{item.published ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}{item.published ? tr("منشورة للعميل", "Published") : tr("خاصة", "Private")}</span></div></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy || (!canUpload && !item.published)} onClick={() => void togglePublished(item)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173e56] px-3 text-xs font-black text-white disabled:opacity-50">{item.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{item.published ? tr("إلغاء النشر", "Unpublish") : tr("نشر", "Publish")}</button><button type="button" disabled={busy} onClick={() => void remove(item)} aria-label={tr("حذف الوثيقة", "Delete document")} className="grid h-10 w-10 place-items-center rounded-xl border border-rose-200 bg-white text-rose-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>}
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><UploadCloud className="h-5 w-5" /></div><div><h2 className="text-lg font-black text-slate-900">{tr("رفع وثيقة جديدة", "Upload document")}</h2><p className="text-xs font-medium text-slate-500">{tr("ترفع بشكل خاص أولًا", "Private by default")}</p></div></div>
            {!canUpload && <p role="note" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-800">{tr("يجب تحويل حالة الطلب إلى processing أو completed من صفحة تفاصيل الطلب قبل إضافة الوثائق.", "Set the application to processing or completed from its details page before uploading.")}</p>}
            <form onSubmit={e => void upload(e)} className="mt-5 space-y-4"><div><label htmlFor="company-title" className="mb-1.5 block text-sm font-bold">{tr("عنوان الوثيقة", "Document title")}</label><input id="company-title" required maxLength={150} disabled={!canUpload || busy} value={title} onChange={e => setTitle(e.target.value)} placeholder="Certificate of Formation" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" /></div><div><label htmlFor="company-description" className="mb-1.5 block text-sm font-bold">{tr("الوصف (اختياري)", "Description (optional)")}</label><textarea id="company-description" rows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={!canUpload || busy} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500" /></div><div><label htmlFor="company-document-file" className="mb-1.5 block text-sm font-bold">{tr("ملف PDF أو صورة", "PDF or image")}</label><input id="company-document-file" type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={!canUpload || busy} onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700"/><p className="mt-1.5 text-xs text-slate-400">PDF, JPG, PNG · 15 MB</p></div><button type="submit" disabled={!canUpload || busy || !file || !title.trim()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#df3341] px-4 text-sm font-black text-white hover:bg-[#c92b38] disabled:cursor-not-allowed disabled:opacity-50"><UploadCloud className="h-4 w-4" />{busy ? tr("الرجاء الانتظار...", "Please wait...") : tr("رفع كوثيقة خاصة", "Upload privately")}</button></form>
          </section>
        </div>
      )}
    </div>
  );
};
