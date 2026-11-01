
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BadgeCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  FileImage,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import {
  clearAdminStripeProofImageCache,
  downloadAdminStripeProofImage,
  getAdminStripeProof,
  openAdminStripeProofImage,
  preloadAdminStripeProofImage,
  reviewAdminStripeProof,
  type StripeProof,
} from "../api/stripeProofAdminApi";

import type {
  AdminApplication,
} from "../api/adminApplicationsApi";

export function StripeProofReviewPanel({
  application,
  isArabic,
  onReviewed,
}: {
  application: AdminApplication;
  isArabic: boolean;
  onReviewed: () => void;
}) {
  const [proof, setProof] =
    useState<StripeProof | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [imageBusy, setImageBusy] =
    useState<"view" | "download" | null>(null);

  const inFlight = useRef(false);

  const [decision, setDecision] =
    useState<"approve" | "reject" | null>(null);

  const [verified, setVerified] = useState(false);
  const [amountVerified, setAmountVerified] =
    useState(false);

  const [transactionId, setTransactionId] =
    useState("");

  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const t = (ar: string, en: string) =>
    isArabic ? ar : en;

  const refresh = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);

      try {
        const data = await getAdminStripeProof(
          application.id
        );

        setProof(data.proof);
        setTransactionId(
          data.proof?.reference || ""
        );
        setError("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load receipt"
        );
      } finally {
        setLoading(false);
      }
    },
    [application.id]
  );

  useEffect(() => {
    let mounted = true;

    setLoading(true);

    getAdminStripeProof(application.id)
      .then(({ proof: data }) => {
        if (!mounted) return;

        setProof(data);
        setTransactionId(
          data?.reference || ""
        );
      })
      .catch((err) => {
        if (mounted) {
          setError(
            String(err?.message || err)
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [application.id]);

  // Preload receipt after the admin opens the panel.
  useEffect(() => {
    if (proof?.submittedAt) {
      preloadAdminStripeProofImage(
        application.id
      );
    }
  }, [application.id, proof?.submittedAt]);

  async function showReceipt(download: boolean) {
    if (imageBusy) return;

    setImageBusy(
      download ? "download" : "view"
    );

    setError("");

    try {
      if (download) {
        await downloadAdminStripeProofImage(
          application.id
        );
      } else {
        await openAdminStripeProofImage(
          application.id
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load receipt image"
      );
    } finally {
      setImageBusy(null);
    }
  }

  async function submitReview() {
    if (
      !decision ||
      inFlight.current ||
      proof?.status !== "pending"
    ) {
      return;
    }

    if (
      decision === "approve" &&
      (
        !verified ||
        !amountVerified ||
        transactionId.trim().length < 5
      )
    ) {
      setError(
        t(
          "تحقق من وصول المبلغ والعملة ورقم العملية أولًا.",
          "Verify the funds, currency and transaction ID first."
        )
      );
      return;
    }

    if (
      decision === "reject" &&
      !note.trim()
    ) {
      setError(
        t(
          "أدخل سبب رفض الإيصال.",
          "Enter a rejection reason."
        )
      );
      return;
    }

    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    const approved = decision === "approve";

    try {
      await reviewAdminStripeProof(
        application.id,
        {
          decision,
          verificationConfirmed: verified,
          amountConfirmed: amountVerified,
          verifiedTransactionId:
            transactionId.trim(),
          note: note.trim(),
        }
      );

      // Update UI without fetching receipt again.
      setProof((current) =>
        current
          ? {
              ...current,
              status: approved
                ? "approved"
                : "rejected",
              reviewedAt:
                new Date().toISOString(),
              reviewNote: note.trim(),
              verifiedTransactionId: approved
                ? transactionId.trim()
                : "",
            }
          : current
      );

      setDecision(null);
      setVerified(false);
      setAmountVerified(false);
      setNote("");

      setNotice(
        approved
          ? t(
              "تم اعتماد الإيصال. سيُرسل إشعار واحد عند بدء الخدمة.",
              "Receipt approved. A single email will be sent when the service starts."
            )
          : t(
              "تم رفض الإيصال ويمكن للعميل إعادة رفعه.",
              "Receipt rejected; the client can upload a new one."
            )
      );

      // IMPORTANT:
      // Do not send an email here.
      // ApplicationDetails handles the start-service email.
      void onReviewed();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Review failed"
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border bg-white p-5 text-sm text-slate-500">
        <LoaderCircle
          size={16}
          className="inline animate-spin"
        />{" "}
        {t(
          "جاري تحميل بيانات الإيصال...",
          "Loading receipt details..."
        )}
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileImage size={20} />

          <h2 className="font-black">
            {t(
              "إثبات الدفع عبر Stripe",
              "Stripe receipt"
            )}
          </h2>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            clearAdminStripeProofImageCache(
              application.id
            );
            void refresh(false);
          }}
          className="rounded-lg border px-3 py-2 text-xs font-bold"
        >
          <RefreshCw
            size={15}
            className="inline"
          />{" "}
          {t("تحديث", "Refresh")}
        </button>
      </header>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      {!proof ? (
        <p className="mt-4 text-sm text-slate-500">
          {t(
            "لم يتم رفع إيصال بعد.",
            "No payment receipt submitted."
          )}
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm font-bold">
            {proof.status === "pending"
              ? t("قيد المراجعة", "Pending review")
              : proof.status === "approved"
                ? t("مقبول", "Approved")
                : t("مرفوض", "Rejected")}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <small className="block">
                {t(
                  "رقم التحويل",
                  "Transaction reference"
                )}
              </small>

              <b dir="ltr">
                {proof.reference}
              </b>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <small className="block">
                {t(
                  "بريد الدافع",
                  "Payer email"
                )}
              </small>

              <b dir="ltr">
                {proof.payerEmail}
              </b>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!!imageBusy}
              onMouseEnter={() =>
                preloadAdminStripeProofImage(
                  application.id
                )
              }
              onFocus={() =>
                preloadAdminStripeProofImage(
                  application.id
                )
              }
              onClick={() =>
                void showReceipt(false)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800 disabled:opacity-50"
            >
              {imageBusy === "view" ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <ExternalLink size={17} />
              )}

              {t("عرض الإيصال", "View receipt")}
            </button>

            <button
              type="button"
              disabled={!!imageBusy}
              onMouseEnter={() =>
                preloadAdminStripeProofImage(
                  application.id
                )
              }
              onFocus={() =>
                preloadAdminStripeProofImage(
                  application.id
                )
              }
              onClick={() =>
                void showReceipt(true)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
            >
              {imageBusy === "download" ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Download size={17} />
              )}

              {t(
                "تنزيل الإيصال",
                "Download receipt"
              )}
            </button>
          </div>

          {proof.reviewNote && (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
              {proof.reviewNote}
            </p>
          )}

          {proof.status === "approved" && (
            <p className="mt-4 text-sm font-bold text-emerald-700">
              <BadgeCheck
                size={17}
                className="inline"
              />{" "}
              {t(
                "تم التحقق من الدفع يدويًا.",
                "Payment manually verified."
              )}
            </p>
          )}

          {proof.status === "pending" &&
            application.status ===
              "waiting_payment" && (
              <>
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <ShieldAlert
                    size={18}
                    className="inline"
                  />{" "}
                  {t(
                    "تحقق من وصول المبلغ والعملة والمرجع داخل حساب Stripe قبل الموافقة.",
                    "Verify amount, currency and reference in Stripe before approval."
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setDecision("approve")
                    }
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {t("قبول", "Approve")}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setDecision("reject")
                    }
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {t("رفض", "Reject")}
                  </button>
                </div>

                {decision && (
                  <div className="mt-4 space-y-3 rounded-lg border p-4">
                    {decision === "approve" && (
                      <>
                        <label className="block text-sm font-bold">
                          {t(
                            "رقم المعاملة المؤكد",
                            "Verified transaction ID"
                          )}

                          <input
                            dir="ltr"
                            className="mt-1 w-full rounded-lg border p-2"
                            value={transactionId}
                            onChange={(e) =>
                              setTransactionId(
                                e.target.value
                              )
                            }
                          />
                        </label>

                        <label className="flex gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={verified}
                            onChange={(e) =>
                              setVerified(
                                e.target.checked
                              )
                            }
                          />

                          {t(
                            "تحققت من وصول الدفع",
                            "Actual payment verified"
                          )}
                        </label>

                        <label className="flex gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={amountVerified}
                            onChange={(e) =>
                              setAmountVerified(
                                e.target.checked
                              )
                            }
                          />

                          {t(
                            "تحققت من المبلغ والعملة",
                            "Amount and currency verified"
                          )}
                        </label>
                      </>
                    )}

                    <label className="block text-sm font-bold">
                      {t(
                        "ملاحظة الإدارة",
                        "Review note"
                      )}

                      <textarea
                        rows={3}
                        className="mt-1 w-full rounded-lg border p-2"
                        value={note}
                        onChange={(e) =>
                          setNote(e.target.value)
                        }
                      />
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void submitReview()
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-[#173e56] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />

                        {busy
                          ? t(
                              "جارٍ الاعتماد...",
                              "Approving..."
                            )
                          : t(
                              "تأكيد القرار",
                              "Confirm decision"
                            )}
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setDecision(null)
                        }
                        className="rounded-lg border px-4 py-2 text-sm font-bold"
                      >
                        {t("إلغاء", "Cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
        </>
      )}
    </section>
  );
}
