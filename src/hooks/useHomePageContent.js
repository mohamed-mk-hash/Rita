import { usePageContent } from "./usePageContent.js";

export function useHomePageContent(fallbackContent) {
  return usePageContent("home", fallbackContent);
}
