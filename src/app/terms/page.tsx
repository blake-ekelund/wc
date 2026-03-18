import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg text-foreground">
            WorkChores
          </Link>
          <Link href="/signup" className="text-sm text-accent hover:underline font-medium">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted mb-10">Last updated: March 17, 2026</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Agreement to Terms</h2>
            <p className="text-sm text-muted leading-relaxed">
              By accessing or using WorkChores (&ldquo;the Service&rdquo;), operated by WorkChores, LLC, located in Gaithersburg, Maryland, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p className="text-sm text-muted leading-relaxed">
              WorkChores is a customer relationship management (CRM) platform designed for small teams. The Service provides pipeline management, contact tracking, task management, calendar views, touchpoint logging, role-based access controls, and industry-specific workflow templates. We offer free and paid subscription plans as described on our pricing page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Account Registration</h2>
            <p className="text-sm text-muted leading-relaxed">
              To use the Service, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Acceptable Use</h2>
            <p className="text-sm text-muted leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-sm text-muted leading-relaxed space-y-1.5 ml-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Upload or transmit any malicious code, viruses, or harmful data</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Use the Service to store or transmit content that infringes on third-party rights</li>
              <li>Resell, sublicense, or redistribute access to the Service without our written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Your Data</h2>
            <p className="text-sm text-muted leading-relaxed">
              You retain full ownership of all data you enter into WorkChores, including contacts, tasks, touchpoints, notes, and any custom field data. We do not claim any intellectual property rights over your content. You may export or delete your data at any time. When you delete your account, we will permanently remove your data from our systems within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Service Availability</h2>
            <p className="text-sm text-muted leading-relaxed">
              We strive to maintain high availability of the Service but do not guarantee uninterrupted access. We may temporarily suspend the Service for maintenance, updates, or circumstances beyond our control. We will make reasonable efforts to provide advance notice of planned downtime.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Subscription & Billing</h2>
            <p className="text-sm text-muted leading-relaxed">
              Paid plans are billed on a monthly or annual basis as selected at the time of purchase. You may upgrade, downgrade, or cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not offer refunds for partial billing periods. Prices may change with 30 days&apos; notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Team Accounts & Roles</h2>
            <p className="text-sm text-muted leading-relaxed">
              Account administrators are responsible for managing team members, assigning roles (Admin, Manager, Member), and configuring data visibility settings. Administrators are responsible for ensuring that team members comply with these Terms. Removing a team member revokes their access but does not automatically delete data they created.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
            <p className="text-sm text-muted leading-relaxed">
              To the maximum extent permitted by law, WorkChores, LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Termination</h2>
            <p className="text-sm text-muted leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms. You may terminate your account at any time by contacting us or using the account settings. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to Terms</h2>
            <p className="text-sm text-muted leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes via email or through the Service. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Governing Law</h2>
            <p className="text-sm text-muted leading-relaxed">
              These Terms are governed by the laws of the State of Maryland, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts located in Montgomery County, Maryland.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">13. Contact</h2>
            <p className="text-sm text-muted leading-relaxed">
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 text-sm text-muted leading-relaxed">
              <p className="font-medium text-foreground">WorkChores, LLC</p>
              <p>Gaithersburg, Maryland</p>
              <p>legal@workchores.com</p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between text-xs text-muted">
          <span>&copy; {new Date().getFullYear()} WorkChores, LLC. All rights reserved.</span>
          <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
