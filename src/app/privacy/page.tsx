import Link from "next/link";

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted mb-10">Last updated: March 17, 2026</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Our Commitment</h2>
            <p className="text-sm text-muted leading-relaxed">
              At WorkChores, LLC, we believe your data belongs to you — period. We will <strong className="text-foreground">never sell, rent, or share your personal information or business data</strong> with third parties for marketing or advertising purposes. Your contacts, deals, tasks, and touchpoints are yours, and we treat them with the security and respect they deserve.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Who We Are</h2>
            <p className="text-sm text-muted leading-relaxed">
              WorkChores is a customer relationship management platform operated by WorkChores, LLC, based in Gaithersburg, Maryland, United States. This Privacy Policy explains how we collect, use, protect, and handle your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <p className="text-sm text-muted leading-relaxed mb-3">We collect the following types of information:</p>

            <h3 className="text-sm font-semibold text-foreground mb-2 mt-4">Account Information</h3>
            <p className="text-sm text-muted leading-relaxed">
              When you create an account, we collect your name, email address, and password (stored in hashed form). If you subscribe to a paid plan, we collect billing information through our payment processor — we never store credit card numbers directly.
            </p>

            <h3 className="text-sm font-semibold text-foreground mb-2 mt-4">Business Data You Enter</h3>
            <p className="text-sm text-muted leading-relaxed">
              This includes contacts, deals, pipeline stages, tasks, touchpoints, notes, custom fields, and any other data you input into WorkChores. This data is stored securely in our database and is only accessible by you and the team members you authorize.
            </p>

            <h3 className="text-sm font-semibold text-foreground mb-2 mt-4">Usage Data</h3>
            <p className="text-sm text-muted leading-relaxed">
              We collect basic usage data such as login timestamps, feature usage patterns, and browser type to improve the Service. This data is anonymized and aggregated — we do not track individual behavior for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-sm text-muted leading-relaxed space-y-1.5 ml-2">
              <li>To provide, maintain, and improve the WorkChores Service</li>
              <li>To authenticate your identity and manage your account</li>
              <li>To process subscription payments through our payment processor</li>
              <li>To send you important service-related communications (e.g., security alerts, billing confirmations)</li>
              <li>To provide customer support when you reach out to us</li>
              <li>To detect and prevent fraud, abuse, or security threats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. What We Will Never Do</h2>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
              <ul className="text-sm text-emerald-900 leading-relaxed space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">&#10003;</span>
                  <span>We will <strong>never sell your data</strong> to third parties</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">&#10003;</span>
                  <span>We will <strong>never share your contacts or business data</strong> with advertisers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">&#10003;</span>
                  <span>We will <strong>never use your data to train AI models</strong> or for any purpose beyond providing you the Service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">&#10003;</span>
                  <span>We will <strong>never display ads</strong> within the WorkChores platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">&#10003;</span>
                  <span>We will <strong>never access your data</strong> unless required to provide support you&apos;ve requested or to comply with legal obligations</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Security</h2>
            <p className="text-sm text-muted leading-relaxed">
              Your data is protected in our database using industry-standard security measures, including:
            </p>
            <ul className="list-disc list-inside text-sm text-muted leading-relaxed space-y-1.5 ml-2 mt-3">
              <li>Encryption in transit (TLS/SSL) and at rest (AES-256)</li>
              <li>Hashed and salted passwords — we cannot see your password</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Role-based access controls for our internal team</li>
              <li>Database backups with encryption</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Data Retention & Deletion</h2>
            <p className="text-sm text-muted leading-relaxed">
              We retain your data for as long as your account is active. If you choose to delete your account, we will permanently delete all your data from our production systems within 30 days. Backup copies are purged within 90 days. You may request a full export of your data at any time before deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Third-Party Services</h2>
            <p className="text-sm text-muted leading-relaxed">
              We use a limited number of third-party services to operate WorkChores:
            </p>
            <ul className="list-disc list-inside text-sm text-muted leading-relaxed space-y-1.5 ml-2 mt-3">
              <li><strong className="text-foreground">Cloud hosting</strong> — to securely host the application and database</li>
              <li><strong className="text-foreground">Payment processing</strong> — to handle subscription billing (we never see or store your full card number)</li>
              <li><strong className="text-foreground">Email delivery</strong> — to send transactional emails like password resets and billing receipts</li>
            </ul>
            <p className="text-sm text-muted leading-relaxed mt-3">
              These providers are contractually obligated to protect your data and may only use it to provide their specific service to us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Team & Role-Based Access</h2>
            <p className="text-sm text-muted leading-relaxed">
              WorkChores supports role-based access controls (Admin, Manager, Member). Account administrators control which team members can access which data through reporting structure settings. We enforce these access controls at the application level to ensure team members only see the data they are authorized to view.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Cookies</h2>
            <p className="text-sm text-muted leading-relaxed">
              We use only essential cookies required to keep you logged in and maintain your session. We do not use tracking cookies, advertising cookies, or any third-party analytics cookies that track you across other websites.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Your Rights</h2>
            <p className="text-sm text-muted leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-sm text-muted leading-relaxed space-y-1.5 ml-2">
              <li>Access all personal data we hold about you</li>
              <li>Export your data in a standard format at any time</li>
              <li>Correct any inaccurate information in your account</li>
              <li>Delete your account and all associated data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
            <p className="text-sm text-muted leading-relaxed mt-3">
              To exercise any of these rights, contact us at privacy@workchores.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Children&apos;s Privacy</h2>
            <p className="text-sm text-muted leading-relaxed">
              WorkChores is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children. If we learn that we have collected data from a child under 16, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Changes to This Policy</h2>
            <p className="text-sm text-muted leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes via email or through the Service at least 30 days before the changes take effect. The &ldquo;Last updated&rdquo; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">13. Contact Us</h2>
            <p className="text-sm text-muted leading-relaxed">
              If you have questions or concerns about this Privacy Policy or how we handle your data, contact us at:
            </p>
            <div className="mt-3 text-sm text-muted leading-relaxed">
              <p className="font-medium text-foreground">WorkChores, LLC</p>
              <p>Gaithersburg, Maryland</p>
              <p>privacy@workchores.com</p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between text-xs text-muted">
          <span>&copy; {new Date().getFullYear()} WorkChores, LLC. All rights reserved.</span>
          <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
