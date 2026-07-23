import { defaultHomePageContent } from "./homePage.default.js";
import { defaultAboutPageContent } from "./aboutPage.default.js";
import { defaultContactPageContent } from "./contactPage.default.js";
import { defaultPricingPageContent } from "./pricingPage.default.js";
import { defaultServicesPageContent } from "./servicesPage.default.js";

export const PAGE_DEFAULTS = Object.freeze({
  home: defaultHomePageContent,
  about: defaultAboutPageContent,
  contact: defaultContactPageContent,
  pricing: defaultPricingPageContent,
  services: defaultServicesPageContent,
});

export function getPageDefault(pageKey) {
  return PAGE_DEFAULTS[pageKey] || null;
}
