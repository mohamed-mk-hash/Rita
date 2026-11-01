import { useEffect, useState } from "react";
import { getStripeProofRequest } from "../api/stripeProofApi.js";
import PayPalSandboxPayment from "./PayPalSandboxPayment.jsx";
import StripeManualPayment from "./StripeManualPayment.jsx";

export default function PaymentMethodChooser({ applicationId, isArabic, plan, onPaid, onProofSubmitted }) {
  const [method, setMethod] = useState("paypal");
  const [stripePending, setStripePending] = useState(false);
  useEffect(() => {
    let active = true;
    getStripeProofRequest(applicationId)
      .then(({ proof }) => {
        if (!active) return;
        const isPending = proof?.status === "pending" || proof?.status === "approved";
        setStripePending(isPending);
        if (isPending) setMethod("stripe");
      })
      .catch(() => {});
    return () => { active = false; };
  }, [applicationId]);
  const t = (ar, en) => isArabic ? ar : en;
  return <section className="rita-payment-methods">
    <h4>{t("اختر طريقة دفع واحدة", "Choose one payment method")}</h4>
    <div className="rita-payment-options" role="radiogroup" aria-label={t("طريقة الدفع", "Payment method")}>
      <label className={method === "paypal" ? "chosen" : ""}><input type="radio" name={`payment-${applicationId}`} checked={method === "paypal"} disabled={stripePending} onChange={() => setMethod("paypal")}/><span><strong>PayPal</strong><small>{t("الدفع المباشر والتأكيد التلقائي", "Direct checkout and automatic confirmation")}</small></span></label>
      <label className={method === "stripe" ? "chosen" : ""}><input type="radio" name={`payment-${applicationId}`} checked={method === "stripe"} onChange={() => setMethod("stripe")}/><span><strong>Stripe</strong><small>{t("الدفع الخارجي وإثبات الدفع اليدوي", "External payment with manual proof review")}</small></span></label>
    </div>
    {method === "paypal" ? <PayPalSandboxPayment applicationId={applicationId} isArabic={isArabic} onPaid={onPaid}/> : <StripeManualPayment applicationId={applicationId} isArabic={isArabic} plan={plan} onSubmitted={() => { setStripePending(true); onProofSubmitted?.(); }}/>}
  </section>;
}
