
import { useEffect, useState } from "react";

import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileImage,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";

import {
  getStripeProofRequest,
  submitStripeProofRequest,
} from "../api/stripeProofApi.js";

const STRIPE_PROFILE_URL =
  "https://stripe.com/@ritadigital";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function StripeManualPayment({
  applicationId,
  isArabic,
  plan,
  onSubmitted,
}) {
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [screenshot, setScreenshot] = useState(null);
  const [reference, setReference] = useState("");
  const [payerEmail, setPayerEmail] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = (ar, en) =>
    isArabic ? ar : en;

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    getStripeProofRequest(applicationId)
      .then(({ proof: incoming }) => {
        if (active) {
          setProof(incoming || null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || String(err));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applicationId]);

  const pending = proof?.status === "pending";
  const approved = proof?.status === "approved";
  const rejected = proof?.status === "rejected";

  async function submit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !screenshot ||
      !ALLOWED_TYPES.includes(screenshot.type) ||
      screenshot.size > MAX_FILE_BYTES ||
      screenshot.size <= 0
    ) {
      setError(
        t(
          "اختر صورة PNG أو JPG أو WEBP بحجم لا يتجاوز 5 MB.",
          "Choose a PNG, JPG or WEBP image no larger than 5 MB."
        )
      );
      return;
    }

    if (
      reference.trim().length < 5 ||
      reference.trim().length > 160
    ) {
      setError(
        t(
          "أدخل رقم المعاملة (5 أحرف على الأقل).",
          "Enter a transaction reference of at least 5 characters."
        )
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        payerEmail.trim()
      )
    ) {
      setError(
        t(
          "أدخل البريد الإلكتروني المستخدم في الدفع.",
          "Enter the email used for payment."
        )
      );
      return;
    }

    setUploading(true);

    try {
      const result = await submitStripeProofRequest(
        applicationId,
        {
          screenshot,
          reference,
          payerEmail,
        }
      );

      setProof(result.proof);
      setScreenshot(null);

      setSuccess(
        result.adminEmailQueued === false
          ? t(
              "حُفظ الإيصال للمراجعة، لكن إشعار البريد لم يؤكد إرساله. يمكن للإدارة مراجعته من اللوحة.",
              "Receipt saved for review, but the email notification was not confirmed. Admin can review it in the dashboard."
            )
          : t(
              "تم رفع الإيصال للمراجعة. ستؤكد الإدارة وصول الدفع قبل بدء الخدمة.",
              "Receipt submitted for review. Admin will verify the payment before processing."
            )
      );

      onSubmitted?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : String(err)
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section
      className="rita-stripe-manual"
      aria-label="Stripe manual payment"
    >
      <div className="rita-stripe-header">
        <div>
          <strong>
            {t("الدفع عبر Stripe", "Stripe payment")}
          </strong>

          <p>
            {t(
              "التحويل الخارجي ثم رفع إثبات الدفع",
              "External transfer followed by manual receipt review"
            )}
          </p>
        </div>

        <ShieldAlert size={22} />
      </div>

      {plan && (
        <p className="rita-stripe-amount">
          {t("المبلغ المطلوب:", "Amount due:")}{" "}
          <b dir="ltr">{plan}</b>
        </p>
      )}

      <p
        className="rita-stripe-warning"
        role="note"
      >
        {t(
          "الرابط هو معرّف Stripe العام وليس رابط دفع مضمونًا. تحقق من وسيلة التحويل والمستلم والمبلغ قبل الدفع.",
          "This is a public Stripe profile, not a guaranteed checkout. Verify the transfer method, recipient and amount before paying."
        )}
      </p>

      <a
        className="rita-stripe-open"
        href={STRIPE_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ArrowUpRight size={18} />

        {t(
          "فتح حساب Rita على Stripe",
          "Open Rita's Stripe profile"
        )}
      </a>

      {loading ? (
        <p>
          {t(
            "جاري تحميل حالة الإيصال...",
            "Loading receipt status..."
          )}
        </p>
      ) : (
        <>
          {pending && (
            <div className="rita-stripe-state pending">
              <Clock3 size={19} />

              <div>
                <strong>
                  {t(
                    "الإيصال قيد المراجعة",
                    "Receipt pending review"
                  )}
                </strong>

                <p>
                  {t(
                    "لا تكرر الدفع أو الرفع. ستتحقق الإدارة أولًا.",
                    "Do not pay or submit again. Admin will verify first."
                  )}
                </p>

                <small dir="ltr">
                  {proof.reference}
                </small>
              </div>
            </div>
          )}

          {approved && (
            <div className="rita-stripe-state approved">
              <CheckCircle2 size={19} />

              {t(
                "تم تأكيد الدفع يدويًا.",
                "Payment manually verified."
              )}
            </div>
          )}

          {rejected && (
            <div className="rita-stripe-state rejected">
              <ShieldAlert size={19} />

              <div>
                <strong>
                  {t(
                    "الإيصال يحتاج تصحيحًا",
                    "Receipt needs correction"
                  )}
                </strong>

                <p>
                  {proof.reviewNote ||
                    t(
                      "راجع المعاملة وأعد رفع الإثبات.",
                      "Check the transaction and submit again."
                    )}
                </p>
              </div>
            </div>
          )}

          {!pending && !approved && (
            <form
              className="rita-stripe-form"
              onSubmit={submit}
            >
              <label>
                {t(
                  "رقم المعاملة",
                  "Transaction reference"
                )}

                <input
                  dir="ltr"
                  type="text"
                  required
                  minLength={5}
                  maxLength={160}
                  value={reference}
                  onChange={(e) =>
                    setReference(e.target.value)
                  }
                />
              </label>

              <label>
                {t(
                  "البريد المستخدم في الدفع",
                  "Payer email"
                )}

                <input
                  dir="ltr"
                  type="email"
                  required
                  value={payerEmail}
                  onChange={(e) =>
                    setPayerEmail(e.target.value)
                  }
                />
              </label>

              <label className="rita-stripe-upload">
                <FileImage size={19} />

                <span>
                  {t(
                    "صورة إيصال الدفع (JPG / PNG / WEBP)",
                    "Receipt image (JPG / PNG / WEBP)"
                  )}
                </span>

                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    setScreenshot(
                      e.target.files?.[0] || null
                    );
                    setError("");
                  }}
                />

                {screenshot && (
                  <small>{screenshot.name}</small>
                )}
              </label>

              <p className="rita-stripe-disclaimer">
                {t(
                  "رفع الإيصال لا يعني تأكيد الدفع. صاحب الحساب يتحقق من وصول المبلغ أولًا.",
                  "Submitting a receipt does not verify payment. The account owner checks the funds first."
                )}
              </p>

              <button
                type="submit"
                disabled={uploading}
              >
                <UploadCloud size={17} />

                {uploading
                  ? t("جاري الرفع...", "Uploading...")
                  : t(
                      "إرسال إثبات الدفع",
                      "Submit payment proof"
                    )}
              </button>
            </form>
          )}
        </>
      )}

      {error && (
        <p
          className="rita-stripe-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className="rita-stripe-success"
          role="status"
        >
          {success}
        </p>
      )}
    </section>
  );
}
