"use client";

import { motion } from "framer-motion";

export default function AboutSection() {
  return (
    <section className="py-20 lg:py-32 bg-bg-dark border-t border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-12 h-px bg-gold-500/60 mx-auto mb-8" />

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            About Jade Compass
          </h2>

          <p
            className="text-base sm:text-lg text-text-muted leading-relaxed max-w-3xl mx-auto"
            style={{ fontFamily: "var(--font-merriweather)" }}
          >
            Jade Compass was founded on a simple observation: small business owners deserve the same quality of 
            strategic intelligence that large corporations pay millions for. We combine systematic research 
            methodology with practical business analysis to deliver actionable insights — without the consulting 
            firm price tag.
          </p>

          <p
            className="text-base sm:text-lg text-text-muted leading-relaxed max-w-3xl mx-auto mt-6"
            style={{ fontFamily: "var(--font-merriweather)" }}
          >
            Every report we deliver is the product of rigorous investigation — data gathering, pattern 
            recognition, multi-angle analysis, and actionable synthesis. No templates. No generic advice. 
            Just clear, honest analysis tailored to your specific situation.
          </p>

          <div className="w-12 h-px bg-gold-500/60 mx-auto mt-8" />
        </motion.div>
      </div>
    </section>
  );
}
