"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "What kind of businesses do you work with?",
    a: "Small to medium businesses across a wide range of industries — retail, food service, professional services, e-commerce, healthcare practices, and more. If you run a business and need a clearer picture of your competitive landscape, we can help.",
  },
  {
    q: "How do you conduct your research?",
    a: "We use a systematic research methodology combining market data analysis, competitive landscape mapping, industry trend identification, and strategic framework application. Each report is uniquely tailored to your specific business context — no templates, no generic advice.",
  },
  {
    q: "How long does it take to get my report?",
    a: "Business Scan reports are delivered within 48 hours of completing your questionnaire. Deep Dive reports take 3-5 business days. Monthly Briefing subscribers receive their first report within one week of subscribing, with updates delivered monthly thereafter.",
  },
  {
    q: "What if I'm not satisfied?",
    a: "If your Business Scan doesn't provide at least one actionable insight you can implement immediately, we'll refund your purchase — no questions asked. We're confident in the quality of our analysis.",
  },
  {
    q: "Do you work with companies outside the US?",
    a: "Yes. Our research methodology works for any English-speaking market. We've worked with clients across North America, Europe, and Australia. Your location doesn't matter — what matters is understanding your competitive landscape.",
  },
  {
    q: "Can I talk to someone before purchasing?",
    a: "Absolutely. Send us an email or use the contact form and we'll respond within 24 hours. No pushy sales calls — just a straightforward conversation about your needs and how we can help.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 lg:py-32 bg-bg-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p
            className="text-text-muted max-w-xl mx-auto text-lg"
            style={{ fontFamily: "var(--font-merriweather)" }}
          >
            Everything you need to know about Jade Compass
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={`w-full text-left p-5 sm:p-6 rounded-xl border transition-all duration-200 ${
                  openIndex === i
                    ? "bg-surface border-gold-500/30"
                    : "bg-surface/50 border-border hover:border-border/80 hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white font-medium text-sm sm:text-base">
                    {faq.q}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`flex-shrink-0 text-gold-500 transition-transform duration-200 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>

                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p
                        className="mt-4 text-text-muted text-sm leading-relaxed"
                        style={{ fontFamily: "var(--font-merriweather)" }}
                      >
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
