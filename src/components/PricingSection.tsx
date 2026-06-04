"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const plans = [
  {
    id: "scan",
    name: "Business Scan",
    price: 97,
    period: "one-time",
    description: "A quick, focused analysis to identify your biggest opportunities.",
    popular: false,
    features: [
      "One comprehensive market analysis",
      "5-7 page intelligence report",
      "Competitive landscape overview",
      "3 actionable recommendations",
      "3 days follow-up Q&A",
    ],
  },
  {
    id: "briefing",
    name: "Intelligence Briefing",
    price: 197,
    period: "/month",
    description: "Ongoing market intelligence to keep you ahead of the competition.",
    popular: true,
    features: [
      "Monthly market intelligence report",
      "Personalized to your industry",
      "Competitor activity monitoring",
      "Trend analysis & emerging threats",
      "Unlimited follow-up questions",
      "Cancel anytime",
    ],
  },
  {
    id: "deepdive",
    name: "Deep Dive",
    price: 497,
    period: "one-time",
    description: "When you need a complete strategic picture before a major decision.",
    popular: false,
    features: [
      "Comprehensive strategic analysis",
      "20+ page detailed report",
      "In-depth competitor profiling",
      "Market opportunity assessment",
      "Pricing & positioning analysis",
      "30-day strategic advisory",
      "90-day action plan",
    ],
  },
];

export default function PricingSection() {
  const router = useRouter();

  const handleSelect = (planId: string, price: number) => {
    router.push(`/questionnaire?plan=${planId}&price=${price}`);
  };

  return (
    <section id="services" className="py-20 lg:py-32 bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your Intelligence Plan
          </h2>
          <p
            className="text-text-muted max-w-xl mx-auto text-lg"
            style={{ fontFamily: "var(--font-merriweather)" }}
          >
            Pick the level of analysis that matches your needs. All plans include our quality guarantee.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.popular
                  ? "bg-surface border-2 border-gold-500/50 glow-gold"
                  : "bg-surface border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-gold-500 to-gold-600 text-bg-dark text-xs font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold ${plan.popular ? "text-gold-500" : "text-white"} mb-2`}>
                  {plan.name}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-text-muted text-sm ml-1">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-text-muted">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={plan.popular ? "#C9A84C" : "#0B6E4F"}
                      strokeWidth="2"
                      className="flex-shrink-0 mt-0.5"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.id, plan.price)}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  plan.popular
                    ? "bg-jade-700 hover:bg-jade-600 text-white hover:shadow-lg hover:shadow-jade-700/25 hover:-translate-y-0.5"
                    : "bg-surface-light hover:bg-border text-white hover:-translate-y-0.5 border border-border"
                }`}
              >
                {plan.id === "briefing" ? "Subscribe Now" : "Get Started"}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mt-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 border border-border">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B6E4F" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="text-text-muted text-xs">
              Secure payment via PayPal. No subscription surprises. Cancel anytime.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
