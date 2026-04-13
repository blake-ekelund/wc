import NavbarSimple from "@/components/navbar-simple";
import HomepageContent from "@/components/homepage-content";
import Footer from "@/components/footer";
import PageTracker from "@/components/page-tracker";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WorkChores",
  url: "https://workchores.com",
  logo: "https://workchores.com/icon.png",
  description: "CRM, vendor management, HR, budgets, and tasks — one platform for the people who run the business.",
  foundingDate: "2025",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Gaithersburg",
    addressRegion: "MD",
    addressCountry: "US",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@workchores.com",
    contactType: "customer support",
  },
  sameAs: [],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WorkChores",
  url: "https://workchores.com",
};

export default function Home() {
  return (
    <div className="min-h-screen font-sans flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <PageTracker />
      <NavbarSimple />
      <main className="flex-1">
        <HomepageContent />
      </main>
      <Footer />
    </div>
  );
}
