"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { motion } from "framer-motion";
import CompassIcon from "@/components/CompassIcon";

const plans: Record<string, { name: string; price: number }> = {
  scan: { name: "Business Scan", price: 97 },
  briefing: { name: "Intelligence Briefing", price: 197 },
  deepdive: { name: "Deep Dive", price: 497 },
};

function QuestionnaireForm() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "scan";
  const plan = plans[planId] || plans.scan;

  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    yearsInOperation: "",
    revenue: "",
    challenges: "",
    targetCustomers: "",
    mainQuestion: "",
    email: "",
    name: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-jade-700 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Thank You!</h1>
          <p className="text-text-muted mb-8" style={{ fontFamily: "var(--font-merriweather)" }}>
            Your order has been confirmed. We&apos;ll start working on your {plan.name} report and deliver it within{" "}
            {planId === "deepdive" ? "3-5 business days" : "48 hours"}. You&apos;ll receive a confirmation email shortly.
          </p>
          <a
            href="/"
            className="inline-flex px-6 py-3 bg-jade-700 hover:bg-jade-600 text-white font-medium rounded-xl transition-all"
          >
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a href="/" className="flex items-center gap-2.5">
            <div className="text-jade-700">
              <CompassIcon size={22} />
            </div>
            <span className="text-sm font-semibold text-white">
              Jade <span className="text-gold-500">Compass</span>
            </span>
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Plan summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-6 rounded-2xl bg-surface border border-border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Selected Plan</p>
              <h1 className="text-2xl font-bold text-white">{plan.name}</h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gold-500">${plan.price}</p>
              <p className="text-text-muted text-xs">
                {planId === "briefing" ? "per month" : "one-time"}
              </p>
            </div>
          </div>
        </motion.div>

        {step === "form" && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleFormSubmit}
            className="space-y-6"
          >
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
              <h2 className="text-lg font-semibold text-white">Your Information</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm"
                  placeholder="Acme Inc."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">Industry *</label>
                  <input
                    type="text"
                    required
                    value={formData.industry}
                    onChange={(e) => updateField("industry", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm"
                    placeholder="e.g., Restaurant, E-commerce, Dental"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">Years in Operation</label>
                  <input
                    type="text"
                    value={formData.yearsInOperation}
                    onChange={(e) => updateField("yearsInOperation", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm"
                    placeholder="e.g., 3 years"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Annual Revenue Range</label>
                <select
                  value={formData.revenue}
                  onChange={(e) => updateField("revenue", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-border text-white focus:outline-none focus:border-jade-700 transition-colors text-sm appearance-none"
                >
                  <option value="">Select revenue range</option>
                  <option value="under-100k">Under $100K</option>
                  <option value="100k-500k">$100K - $500K</option>
                  <option value="500k-1m">$500K - $1M</option>
                  <option value="1m-5m">$1M - $5M</option>
                  <option value="5m-plus">$5M+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Target Customers (optional)</label>
                <input
                  type="text"
                  value={formData.targetCustomers}
                  onChange={(e) => updateField("targetCustomers", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm"
                  placeholder="Who are your customers?"
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
              <h2 className="text-lg font-semibold text-white">Your Needs</h2>

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Current Challenges *</label>
                <textarea
                  required
                  value={formData.challenges}
                  onChange={(e) => updateField("challenges", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm resize-none"
                  placeholder="Describe the biggest challenges your business is facing right now..."
                />
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1.5">What do you most want to know? *</label>
                <textarea
                  required
                  value={formData.mainQuestion}
                  onChange={(e) => updateField("mainQuestion", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm resize-none"
                  placeholder="What specific question do you want our analysis to answer?"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-jade-700 hover:bg-jade-600 text-white font-semibold rounded-xl transition-all text-base hover:shadow-lg hover:shadow-jade-700/25"
            >
              Continue to Payment — ${plan.price}
            </button>
          </motion.form>
        )}

        {step === "payment" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-surface border border-border"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Complete Payment</h2>
            <p className="text-text-muted text-sm mb-6">
              Secure payment via PayPal. You don&apos;t need a PayPal account — credit cards are accepted.
            </p>

            <PayPalScriptProvider
              options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
                currency: "USD",
                intent: "capture",
              }}
            >
              <PayPalButtons
                style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                createOrder={async () => {
                  try {
                    const res = await fetch("/api/paypal/create-order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        plan: planId,
                        price: plan.price,
                        formData,
                      }),
                    });
                    const data = await res.json();
                    return data.orderId;
                  } catch {
                    throw new Error("Failed to create order");
                  }
                }}
                onApprove={async (data) => {
                  const res = await fetch("/api/paypal/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId: data.orderID,
                      plan: planId,
                      formData: { ...formData, price: plan.price },
                    }),
                  });
                  const result = await res.json();
                  if (result.status === "COMPLETED") {
                    // Redirect to report page
                    window.location.href = `/report/${data.orderID}`;
                  }
                }}
                onError={(err) => {
                  console.error("PayPal error:", err);
                  alert("Payment failed. Please try again.");
                }}
              />
            </PayPalScriptProvider>

            <button
              onClick={() => setStep("form")}
              className="w-full mt-4 py-3 text-text-muted hover:text-white text-sm transition-colors"
            >
              &larr; Back to questionnaire
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function QuestionnairePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-dark flex items-center justify-center">
          <div className="text-text-muted">Loading...</div>
        </div>
      }
    >
      <QuestionnaireForm />
    </Suspense>
  );
}
