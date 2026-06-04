"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import CompassIcon from "@/components/CompassIcon";

// Simple markdown renderer (avoids needing marked on client)
function renderMarkdown(text: string): string {
  let html = text
    // Headers
    .replace(/^###### (.*$)/gm, "<h6>$1</h6>")
    .replace(/^##### (.*$)/gm, "<h5>$1</h5>")
    .replace(/^#### (.*$)/gm, "<h4>$1</h4>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Unordered lists
    .replace(/^\- (.*$)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    // Ordered lists
    .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
    // Paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(.+)$/gm, function (m: string) {
      if (m.startsWith("<h") || m.startsWith("<li") || m.startsWith("<ul") || m.startsWith("</ul") || m.startsWith("<p") || m.startsWith("</p") || m.startsWith("<code")) return m;
      if (m.trim() === "") return "";
      return m;
    });

  return `<p>${html}</p>`;
}

export default function ReportPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [status, setStatus] = useState<"loading" | "generating" | "ready" | "error">("loading");
  const [report, setReport] = useState<string>("");
  const [planName, setPlanName] = useState("Intelligence Report");
  const [customerName, setCustomerName] = useState("");
  const [progressMsg, setProgressMsg] = useState("Preparing your report...");
  const [dots, setDots] = useState(".");

  // Animated dots
  useEffect(() => {
    if (status !== "generating") return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 600);
    return () => clearInterval(interval);
  }, [status]);

  // Progress messages
  useEffect(() => {
    if (status !== "generating") return;
    const messages = [
      "Analyzing your business data...",
      "Researching your market...",
      "Mapping competitive landscape...",
      "Identifying strategic opportunities...",
      "Crafting your intelligence report...",
      "Finalizing insights...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setProgressMsg(messages[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, [status]);

  // Load or generate report
  useEffect(() => {
    async function load() {
      // Try to get existing report
      const checkRes = await fetch(`/api/reports/get?orderId=${orderId}`);
      const checkData = await checkRes.json();

      if (checkData.report) {
        setReport(checkData.report);
        setStatus("ready");
        return;
      }

      // No report yet - generate
      setStatus("generating");
      try {
        const genRes = await fetch("/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const genData = await genRes.json();

        if (genData.error) {
          setStatus("error");
          return;
        }

        if (genData.report) {
          setReport(genData.report);
          setStatus("ready");
          return;
        }
      } catch {
        setStatus("error");
      }
    }

    load();
  }, [orderId]);

  // Fetch order details for display
  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/questionnaire/submit?orderId=${orderId}`);
        const data = await res.json();
        if (data?.formData?.businessName) {
          setCustomerName(data.formData.businessName);
        }
        if (data?.plan) {
          const names: Record<string, string> = {
            scan: "Business Scan",
            briefing: "Intelligence Briefing",
            deepdive: "Deep Dive",
          };
          setPlanName(names[data.plan] || "Intelligence Report");
        }
      } catch {}
    }
    fetchOrder();
  }, [orderId]);

  const mdDownload = () => {
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jade-compass-report-${customerName || "client"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pdfDownload = () => {
    window.open(`/api/reports/pdf?orderId=${orderId}`, "_blank");
  };

  if (status === "error") {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Report Generation Failed</h2>
          <p className="text-text-muted text-sm mb-6">
            We couldn't generate your report automatically. Our team has been notified and will follow up shortly.
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

  if (status === "ready") {
    return (
      <div className="min-h-screen bg-bg-dark">
        {/* Header */}
        <div className="border-b border-border bg-surface/50">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5">
              <div className="text-jade-700">
                <CompassIcon size={22} />
              </div>
              <span className="text-sm font-semibold text-white">
                Jade <span className="text-gold-500">Compass</span>
              </span>
            </a>
            <div className="flex items-center gap-3">
              {customerName && (
                <span className="text-text-dim text-xs hidden sm:block">{customerName}</span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-jade-700/20 text-jade-400 text-xs font-medium">
                {planName}
              </span>
            </div>
          </div>
        </div>

        {/* Report content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white">Your Intelligence Report</h1>
            <div className="flex gap-2">
              <button
                onClick={mdDownload}
                className="px-4 py-2 bg-surface hover:bg-surface-light text-white text-xs font-medium rounded-lg border border-border transition-all"
              >
                Download .md
              </button>
              <button
                onClick={pdfDownload}
                className="px-4 py-2 bg-jade-700 hover:bg-jade-600 text-white text-xs font-medium rounded-lg transition-all"
              >
                Download PDF
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white text-gray-900 overflow-hidden shadow-2xl"
          >
            {/* Cover */}
            <div className="px-10 py-16 text-center border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ letterSpacing: "3px" }}>
                JADE COMPASS
              </h1>
              <div className="w-12 h-0.5 bg-emerald-700 mx-auto my-6" />
              <p className="text-emerald-700 text-base mb-6">{planName}</p>
              {customerName && (
                <>
                  <p className="text-gray-500 text-sm mb-1">Prepared for</p>
                  <p className="text-gray-800 font-bold text-base">{customerName}</p>
                </>
              )}
              <p className="text-gray-400 text-xs mt-8 tracking-widest">CONFIDENTIAL</p>
            </div>

            {/* Report body */}
            <div
              className="px-10 py-8 report-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
            />
          </motion.div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-text-dim text-xs">
              Jade Compass — compassjade.app
            </p>
          </div>
        </div>

        <style>{`
          .report-body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #333; font-size: 14px; }
          .report-body h1 { font-size: 22px; color: #0B6E4F; margin: 32px 0 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
          .report-body h2 { font-size: 18px; color: #1a1a2e; margin: 24px 0 10px; }
          .report-body h3 { font-size: 15px; color: #0B6E4F; margin: 18px 0 8px; }
          .report-body p { margin-bottom: 12px; }
          .report-body ul { margin-bottom: 12px; padding-left: 24px; }
          .report-body li { margin-bottom: 4px; list-style: disc; }
          .report-body strong { color: #1a1a2e; }
          .report-body a { color: #0B6E4F; text-decoration: underline; }
          .report-body code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
          .report-body table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
          .report-body th { background: #0B6E4F; color: #fff; padding: 8px 12px; text-align: left; }
          .report-body td { padding: 6px 12px; border-bottom: 1px solid #ddd; }
        `}</style>
      </div>
    );
  }

  // Loading / Generating state
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full text-center"
      >
        {/* Animated compass */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-8 text-jade-700"
        >
          <CompassIcon size={80} />
        </motion.div>

        <h2 className="text-xl font-bold text-white mb-3">
          {status === "generating" ? `Generating Your ${planName}` : "Loading Your Report"}
        </h2>

        <p className="text-text-muted text-sm mb-8" style={{ fontFamily: "var(--font-merriweather)" }}>
          {progressMsg}{dots}
        </p>

        {/* Progress indicator */}
        <div className="max-w-xs mx-auto">
          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <motion.div
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-full w-1/2 rounded-full bg-gradient-to-r from-jade-700 to-gold-500"
            />
          </div>
        </div>

        <p className="text-text-dim text-xs mt-6">
          This usually takes 30-60 seconds. Please don't close this page.
        </p>
      </motion.div>
    </div>
  );
}
