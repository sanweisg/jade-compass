"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "scan";

  const planNames: Record<string, string> = {
    scan: "Business Scan",
    briefing: "Intelligence Briefing",
    deepdive: "Deep Dive",
  };

  const deliveryTime: Record<string, string> = {
    scan: "48 hours",
    briefing: "one week",
    deepdive: "3-5 business days",
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-jade-700 to-gold-500 flex items-center justify-center mx-auto mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Payment Confirmed!
        </h1>

        <p
          className="text-text-muted text-lg mb-2"
          style={{ fontFamily: "var(--font-merriweather)" }}
        >
          Your <span className="text-gold-500 font-semibold">{planNames[plan]}</span> is being processed.
        </p>

        <p className="text-text-dim text-sm mb-8 max-w-sm mx-auto">
          We&apos;ll start working on your analysis immediately and deliver it within{" "}
          <span className="text-white">{deliveryTime[plan]}</span>.
          You&apos;ll receive a confirmation email with next steps.
        </p>

        <div className="p-6 rounded-2xl bg-surface border border-border mb-8 text-left">
          <h3 className="text-white font-semibold mb-3 text-sm">What happens next?</h3>
          <ol className="space-y-3 text-sm text-text-muted">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-jade-700/20 text-jade-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>We review your questionnaire answers</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-jade-700/20 text-jade-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Our research team conducts deep market analysis</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-jade-700/20 text-jade-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>We deliver your comprehensive intelligence report</span>
            </li>
          </ol>
        </div>

        <a
          href="/"
          className="inline-flex px-8 py-3.5 bg-jade-700 hover:bg-jade-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-jade-700/25"
        >
          Back to Home
        </a>
      </motion.div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-dark" />}>
      <ThankYouContent />
    </Suspense>
  );
}
