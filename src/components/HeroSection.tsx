"use client";

import { motion } from "framer-motion";
import CompassIcon from "./CompassIcon";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg-dark">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/30 via-transparent to-bg-dark z-[1]" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-jade-700/8 rounded-full blur-[150px] z-[1]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold-500/5 rounded-full blur-[120px] z-[1]" />

      {/* Decorative compass */}
      <div className="absolute top-1/2 right-[10%] -translate-y-1/2 opacity-[0.03] z-[1] hidden lg:block">
        <CompassIcon size={400} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6 tracking-tight">
            Intelligence is<br />
            <span className="text-gradient">Your Advantage</span>
          </h1>

          <p
            className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "var(--font-merriweather)" }}
          >
            Market research and competitive analysis for business owners who need clarity — not guesswork.
            Know your market, outmaneuver your competitors, and make decisions with confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#services"
              className="px-8 py-4 bg-jade-700 hover:bg-jade-600 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jade-700/25 text-base"
            >
              Get Your Business Scan — <span className="text-gold-500 font-bold">$97</span>
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-4 border border-border hover:border-text-muted text-text-muted hover:text-white font-medium rounded-xl transition-all duration-200 text-base"
            >
              See How It Works
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
