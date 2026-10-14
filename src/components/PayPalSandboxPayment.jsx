
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getPayPalClientConfig,
  getPaymentQuote,
  createPayPalOrder,
  capturePayPalOrder,
} from "../api/paypalApi.js";

let sdkPromise = null;
let loadedClientId = "";

function loadPayPal(clientId) {
  if (
    window.paypal?.Buttons &&
    loadedClientId === clientId
  ) {
    return Promise.resolve(window.paypal);
  }

  if (sdkPromise && loadedClientId === clientId) {
    return sdkPromise;
  }

  if (
    loadedClientId &&
    loadedClientId !== clientId
  ) {
    return Promise.reject(
      new Error(
        "PayPal configuration changed. Refresh the page."
      )
    );
  }

  loadedClientId = clientId;

  sdkPromise = new Promise((resolve, reject) => {
    const script =
      document.createElement("script");

    script.src =
      "https://www.paypal.com/sdk/js" +
      `?client-id=${encodeURIComponent(clientId)}` +
      "&currency=USD&intent=capture&components=buttons";

    script.async = true;

    script.onload = () => {
      if (window.paypal?.Buttons) {
        resolve(window.paypal);
      } else {
        sdkPromise = null;
        reject(
          new Error(
            "PayPal checkout is unavailable."
          )
        );
      }
    };

    script.onerror = () => {
      sdkPromise = null;
      reject(
        new Error(
          "Could not load PayPal checkout."
        )
      );
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
}

export default function PayPalSandboxPayment({
  applicationId,
  isArabic = false,
  onPaid,
}) {
  const [config, setConfig] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const containerRef = useRef(null);
  const onPaidRef = useRef(onPaid);

  onPaidRef.current = onPaid;

  const tr = (ar, en) => isArabic ? ar : en;

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setQuote(null);

    Promise.all([
      getPayPalClientConfig(),
      getPaymentQuote(applicationId),
    ])
      .then(([nextConfig, nextQuote]) => {
        if (!active) return;

        if (nextConfig.mode !== "live") {
          throw new Error(
            "The payment service is not ready."
          );
        }

        setConfig(nextConfig);
        setQuote(nextQuote);
      })
      .catch((error) => {
        if (active) {
          setError(error.message);
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
  }, [applicationId, refresh]);

  useEffect(() => {
    if (
      loading ||
      !config?.clientId ||
      !quote?.payable ||
      !containerRef.current
    ) {
      return;
    }

    let cancelled = false;
    let buttons = null;

    const container = containerRef.current;

    container.replaceChildren();

    loadPayPal(config.clientId)
      .then((paypal) => {
        if (cancelled) return;

        buttons = paypal.Buttons({
          style: {
            layout: "vertical",
            label: "pay",
            shape: "rect",
            height: 45,
          },

          createOrder: async () => {
            setError("");

            const result =
              await createPayPalOrder(applicationId);

            if (!result?.id) {
              throw new Error(
                "Could not create the payment."
              );
            }

            return result.id;
          },

          onApprove: async ({ orderID }) => {
            if (cancelled) return;

            setProcessing(true);
            setError("");

            try {
              const result =
                await capturePayPalOrder(
                  applicationId,
                  orderID
                );

              if (result?.paid !== true) {
                throw new Error(
                  "Payment confirmation is incomplete."
                );
              }

              if (!cancelled) {
                setQuote((previous) => ({
                  ...previous,
                  payable: false,
                  status: "paid",
                  paymentStatus: "paid",
                }));

                onPaidRef.current?.();
              }
            } catch (error) {
              if (!cancelled) {
                setError(
                  error.message ||
                  tr(
                    "تعذر تأكيد الدفع.",
                    "Could not confirm payment."
                  )
                );
              }
            } finally {
              if (!cancelled) {
                setProcessing(false);
              }
            }
          },

          onCancel: () => {
            if (!cancelled) {
              setError(
                tr(
                  "ألغيت عملية الدفع. يمكنك المحاولة مرة أخرى.",
                  "Payment was cancelled. You can try again."
                )
              );
            }
          },

          onError: (error) => {
            console.error(
              "PAYPAL_CHECKOUT_ERROR:",
              error
            );

            if (!cancelled) {
              setError(
                tr(
                  "حدثت مشكلة أثناء الدفع. يرجى تحديث الحالة قبل المحاولة مرة أخرى.",
                  "A payment error occurred. Refresh the payment status before retrying."
                )
              );
            }
          },
        });

        return buttons.render(container);
      })
      .catch((error) => {
        if (!cancelled) {
          setError(error.message);
        }
      });

    return () => {
      cancelled = true;

      try {
        buttons?.close?.();
      } catch {
        // Ignore PayPal cleanup errors.
      }

      container.replaceChildren();
    };
  }, [
    applicationId,
    loading,
    config?.clientId,
    quote?.payable,
    isArabic,
  ]);

  function refreshPayment() {
    setError("");
    setRefresh((value) => value + 1);
  }

  if (loading) {
    return (
      <p>
        {tr(
          "جاري تجهيز الدفع...",
          "Preparing payment..."
        )}
      </p>
    );
  }

  if (
    quote?.paymentStatus === "paid" ||
    quote?.status === "paid"
  ) {
    return (
      <div role="status">
        {tr(
          "تم الدفع بنجاح. شكرًا لك!",
          "Payment completed successfully. Thank you!"
        )}
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="rita-paypal-payment"
    >
      {quote?.payable && (
        <div ref={containerRef} />
      )}

      {processing && (
        <p role="status">
          {tr(
            "جاري تأكيد العملية، يرجى الانتظار...",
            "Confirming payment, please wait..."
          )}
        </p>
      )}

      {error && (
        <div role="alert">
          <p style={{ color: "#dc2626" }}>
            {error}
          </p>

          <button
            type="button"
            onClick={refreshPayment}
            disabled={processing}
          >
            {tr(
              "تحديث حالة الدفع",
              "Refresh payment status"
            )}
          </button>
        </div>
      )}

      {!quote?.payable &&
        !error &&
        !processing && (
          <p>
            {tr(
              "الدفع غير متاح حاليًا لهذا الطلب.",
              "Payment is not available for this application."
            )}
          </p>
        )}
    </div>
  );
}
