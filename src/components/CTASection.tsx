"use client";

import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-jade-900/40 via-bg-dark to-bg-dark" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-jade-700/10 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to See What You&apos;re Missing?
          </h2>
          <p
            className="text-lg text-text-muted max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "var(--font-merriweather)" }}
          >
            Get the clarity you need to make confident business decisions. Your first insight is one questionnaire away.
          </p>
          <a
            href="#services"
            className="inline-flex items-center gap-3 px-8 py-4 bg-jade-700 hover:bg-jade-600 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jade-700/30 hover:-translate-y-0.5 text-base"
          >
            Start with a Business Scan
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
