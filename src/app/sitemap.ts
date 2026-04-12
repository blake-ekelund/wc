import type { MetadataRoute } from "next";

const BASE_URL = "https://workchores.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Core marketing pages — highest priority
  const corePages = [
    { url: `${BASE_URL}`, lastModified: now, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/crm`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE_URL}/vendor-management`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/task-tracker`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/hr-tracker`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/budget-forecasting`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/demo`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
  ];

  // Company pages
  const companyPages = [
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE_URL}/docs`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  // Blog pages
  const blogPages = [
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${BASE_URL}/blog/contact-management-beyond-spreadsheets`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE_URL}/blog/why-small-teams-dont-need-hubspot`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  // Auth pages — low priority but indexable for branded searches
  const authPages = [
    { url: `${BASE_URL}/signin`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 },
  ];

  // Legal pages
  const legalPages = [
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 },
  ];

  return [...corePages, ...companyPages, ...blogPages, ...authPages, ...legalPages];
}
