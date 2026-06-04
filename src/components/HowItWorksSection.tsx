"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Tell Us About Your Business",
    description:
      "Complete our short questionnaire about your industry, competitors, and biggest challenges. It takes about 10 minutes.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold-500">
        <path d="M9 12h6M9 16h6M9 8h6M7 4h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "We Analyze Your Market",
    description:
      "We conduct deep research on your competitive landscape, market trends, and untapped opportunities. No templates — every analysis is unique.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold-500">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Get Your Intelligence Report",
    description:
      "Receive a comprehensive, beautifully formatted report with actionable insights, strategic recommendations, and clear next steps.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold-500">
        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p
            className="text-text-muted max-w-xl mx-auto text-lg"
            style={{ fontFamily: "var(--font-merriweather)" }}
          >
            From your first questionnaire to your actionable intelligence report — in three straightforward steps.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="relative group"
            >
              <div className="p-8 rounded-2xl bg-surface border border-border hover:border-gold-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 h-full">
                {/* Step number */}
                <div className="text-5xl font-bold text-gold-500/10 absolute top-4 right-6 select-none">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-jade-700/20 flex items-center justify-center mb-6 group-hover:bg-jade-700/30 transition-colors">
                  {step.icon}
                </div>

                {/* Connector line (desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-px bg-gradient-to-r from-gold-500/40 to-transparent" />
                )}

                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-text-muted leading-relaxed text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
