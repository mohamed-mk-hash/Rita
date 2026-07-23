import { useEffect, useState } from "react";
import { getPublicPage } from "../api/PageApi";

export function usePageContent(pageKey, fallbackContent) {
  const [content, setContent] = useState(fallbackContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      setLoading(true);
      setError("");

      try {
        const data = await getPublicPage(pageKey);

        if (!cancelled && data?.page?.content) {
          setContent(data.page.content);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : `Could not load the ${pageKey} page content`
          );

          setContent(fallbackContent);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadContent();

    return () => {
      cancelled = true;
    };
  }, [pageKey, fallbackContent]);

  return {
    content,
    loading,
    error,
  };
}
