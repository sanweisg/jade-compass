"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // For MVP, just show success. Email integration later.
    setSent(true);
  };

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

      <div className="max-w-3xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
          <p className="text-text-muted text-sm mb-8" style={{ fontFamily: "var(--font-merriweather)" }}>
            Have a question about your report, need help choosing a plan, or want to discuss a custom project? We&apos;re here to help.
          </p>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-2xl bg-surface border border-border text-center"
            >
              <div className="w-12 h-12 rounded-full bg-jade-700 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Message Sent!</h2>
              <p className="text-text-muted text-sm">We&apos;ll get back to you within 24 hours.</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact form */}
              <div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">Name *</label>
                    <input
                      type="text" required
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">Email *</label>
                    <input
                      type="email" required
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">Message *</label>
                    <textarea
                      required rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm resize-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-jade-700 hover:bg-jade-600 text-white font-medium rounded-xl transition-all"
                  >
                    Send Message
                  </button>
                </form>
              </div>

              {/* Contact info */}
              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-surface border border-border">
                  <h3 className="text-white font-semibold mb-3 text-sm">Email</h3>
                  <p className="text-text-muted text-sm">
                    General: <strong className="text-white">hello@compassjade.app</strong><br />
                    Support: <strong className="text-white">support@compassjade.app</strong><br />
                    Privacy: <strong className="text-white">privacy@compassjade.app</strong>
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-surface border border-border">
                  <h3 className="text-white font-semibold mb-3 text-sm">Response Time</h3>
                  <p className="text-text-muted text-sm">
                    We typically respond within <strong className="text-white">24 hours</strong> on business days.
                    For urgent inquiries about existing orders, include your order ID.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-surface border border-border">
                  <h3 className="text-white font-semibold mb-3 text-sm">Legal</h3>
                  <div className="flex gap-3 text-sm">
                    <Link href="/privacy" className="text-jade-400 hover:text-jade-300 transition-colors">Privacy Policy</Link>
                    <span className="text-text-dim">·</span>
                    <Link href="/terms" className="text-jade-400 hover:text-jade-300 transition-colors">Terms of Service</Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
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
