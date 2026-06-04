import Link from "next/link";

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-text-dim text-sm mb-8">Last updated: June 4, 2026</p>

        <div className="space-y-6 text-text-muted text-sm leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">1. Service Description</h2>
            <p>Jade Compass provides business intelligence reports and market analysis based on information you provide through our questionnaire and publicly available data sources. Our reports are research-based analyses intended to inform business decision-making, not guarantees of business outcomes.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">2. Plans & Pricing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Business Scan ($97):</strong> One-time focused market analysis delivered within 48 hours of order confirmation.</li>
              <li><strong className="text-white">Intelligence Briefing ($197/month):</strong> Ongoing monthly subscription. You may cancel at any time before the next billing cycle.</li>
              <li><strong className="text-white">Deep Dive ($497):</strong> Comprehensive one-time strategic analysis delivered within 3-5 business days.</li>
            </ul>
            <p className="mt-2">All prices are in USD. Applicable taxes may be added where required by law.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">3. Payment Terms</h2>
            <p className="mb-2">Payment is processed securely through PayPal. By purchasing, you agree to PayPal&apos;s terms of service. For subscription plans (Intelligence Briefing), you authorize recurring charges at the stated rate until you cancel.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">4. Refund Policy</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Business Scan & Deep Dive:</strong> If we fail to deliver your report within the stated timeframe, you are entitled to a full refund. If you are unsatisfied with the quality of your report, contact us within 7 days of delivery for a review. Refunds are issued at our discretion after evaluating the concern.</li>
              <li><strong className="text-white">Intelligence Briefing (subscription):</strong> Cancel anytime. You will not be charged for the next billing cycle. No refunds for partial months already billed.</li>
              <li>Refund requests should be sent to <strong className="text-white">support@compassjade.app</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">5. Intellectual Property</h2>
            <p className="mb-2">Upon full payment, you receive a non-exclusive, non-transferable license to use the delivered report for your internal business purposes. You may not:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Republish, resell, or distribute the report to third parties</li>
              <li>Use the report for competitive analysis against Jade Compass</li>
              <li>Copy or replicate our research methodology without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">6. Limitation of Liability</h2>
            <p>Jade Compass provides research and analysis to inform business decisions, not as a substitute for professional legal, financial, or strategic advice. We do not guarantee specific business outcomes. To the maximum extent permitted by law, our liability is limited to the amount paid for the specific report in question.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">7. User Obligations</h2>
            <p className="mb-2">You agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate and truthful information in your questionnaire</li>
              <li>Not use our services for any unlawful purpose</li>
              <li>Not attempt to reverse-engineer or scrape our platform</li>
              <li>Maintain the confidentiality of any account credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">8. Cancellation & Termination</h2>
            <p>For subscriptions, you may cancel at any time through our contact page. We reserve the right to terminate service for violation of these terms, with refund provided for undelivered services.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">9. Governing Law</h2>
            <p>These terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with American Arbitration Association rules.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">10. Contact</h2>
            <p>For questions about these terms:<br />
            Email: <strong className="text-white">support@compassjade.app</strong></p>
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
