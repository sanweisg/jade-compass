import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Header */}
      <div className="border-b border-border bg-surface/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 100 100" fill="#0B6E4F"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6"/><path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40Z" fill="none" stroke="currentColor" strokeWidth="4"/><circle cx="50" cy="50" r="8" fill="currentColor"/></svg>
            <span className="text-sm font-semibold text-white">
              Jade <span className="text-gold-500">Compass</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-text-dim text-sm mb-8">Last updated: June 4, 2026</p>

        <div className="space-y-6 text-text-muted text-sm leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">1. Information We Collect</h2>
            <p className="mb-2">When you purchase or use our services, we collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Business Information:</strong> Business name, industry, years in operation, revenue range, challenges, target customers, and strategic questions you provide through our questionnaire.</li>
              <li><strong className="text-white">Personal Information:</strong> Your name and email address provided during checkout or questionnaire submission.</li>
              <li><strong className="text-white">Payment Data:</strong> Payment processing is handled entirely by PayPal. We do not store credit card numbers or banking details. PayPal shares only your order ID and payment status with us.</li>
              <li><strong className="text-white">Technical Data:</strong> IP address, browser type, and page interaction data collected via standard web analytics for site improvement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Generate your personalized intelligence report</li>
              <li>Deliver reports and communicate about your order</li>
              <li>Improve our research methodology and report quality</li>
              <li>Send occasional service-related emails (not marketing, unless you opt in)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">3. Data Storage & Security</h2>
            <p>We store your data securely using industry-standard encryption. Order data and reports are stored in secure cloud infrastructure (Vercel KV / Upstash Redis). We retain your data for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data at any time.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">4. Data Sharing</h2>
            <p className="mb-2">We do not sell your personal or business data to third parties. We may share data with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">PayPal:</strong> For payment processing (subject to PayPal&apos;s privacy policy)</li>
              <li><strong className="text-white">DeepSeek / Tavily:</strong> Our AI report generation and research tools process anonymized business data to generate your report. These providers do not retain your data.</li>
              <li><strong className="text-white">Legal requirements:</strong> If required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">5. Your Rights (GDPR & CCPA)</h2>
            <p className="mb-2">If you are in the EU or California, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <strong className="text-white">privacy@compassjade.app</strong>.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">6. Cookies</h2>
            <p>We use minimal functional cookies necessary for payment processing and site operation. We do not use tracking cookies or third-party marketing cookies. Our analytics are privacy-focused and do not share data with advertising networks.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">7. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. Material changes will be notified via email or a notice on our website.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">8. Contact</h2>
            <p>For privacy-related inquiries:<br />
            Email: <strong className="text-white">privacy@compassjade.app</strong></p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-text-dim text-xs">
          <p>Jade Compass — compassjade.app</p>
        </div>
      </div>
    </div>
  );
}
