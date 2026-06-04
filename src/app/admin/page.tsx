"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CompassIcon from "@/components/CompassIcon";

interface Order {
  id: string;
  orderId: string;
  plan: string;
  status: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  formData: Record<string, string>;
  createdAt: string;
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [reportCache, setReportCache] = useState<Record<string, string>>({});
  const [reportError, setReportError] = useState<string | null>(null);
  const [crawlerStatus, setCrawlerStatus] = useState<Record<string, any> | null>(null);
  const [crawlerLoading, setCrawlerLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, revenue: 0, scan: 0, briefing: 0, deepdive: 0 });

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

  useEffect(() => {
    if (loggedIn) {
      fetchOrders();
    }
  }, [loggedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/questionnaire/submit");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        calculateStats(data);
        // Check for existing reports
        for (const order of data) {
          try {
            const r = await fetch(`/api/reports/get?orderId=${order.orderId}`);
            const d = await r.json();
            if (d.report) {
              setReportCache((prev) => ({ ...prev, [order.orderId]: d.report }));
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const calculateStats = (orderList: Order[]) => {
    const total = orderList.length;
    const revenue = orderList.reduce((sum, o) => sum + (o.amount || 0), 0);
    const scan = orderList.filter((o) => o.plan === "scan").length;
    const briefing = orderList.filter((o) => o.plan === "briefing").length;
    const deepdive = orderList.filter((o) => o.plan === "deepdive").length;
    setStats({ total, revenue, scan, briefing, deepdive });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      setError("");
    } else {
      setError("Invalid password");
    }
  };

  const generateReport = async (order: Order) => {
    setGenerating(order.orderId);
    setReportError(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId }),
      });
      const data = await res.json();
      if (data.error) {
        setReportError(data.error);
      } else if (data.report) {
        setReportCache((prev) => ({ ...prev, [order.orderId]: data.report }));
      }
    } catch (err) {
      setReportError("Network error generating report");
    } finally {
      setGenerating(null);
    }
  };

  const checkCrawlerStatus = async () => {
    setCrawlerLoading(true);
    setCrawlerStatus(null);
    try {
      const res = await fetch("/api/crawler/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: "Pet Products", businessName: "" }),
      });
      const data = await res.json();
      setCrawlerStatus(data);
    } catch (err) {
      setCrawlerStatus({ status: "error", message: "Failed to connect" });
    } finally {
      setCrawlerLoading(false);
    }
  };

  const downloadReport = (orderId: string, customerName: string) => {
    const content = reportCache[orderId];
    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jade-compass-report-${customerName.replace(/\s+/g, "-").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPdf = (orderId: string) => {
    window.open(`/api/reports/pdf?orderId=${orderId}`, "_blank");
  };

  const copyReport = async (orderId: string) => {
    const content = reportCache[orderId];
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      alert("Report copied to clipboard!");
    } catch {
      alert("Could not copy to clipboard");
    }
  };

  const planLabel = (plan: string) => {
    const labels: Record<string, string> = {
      scan: "Business Scan",
      briefing: "Intelligence Briefing",
      deepdive: "Deep Dive",
    };
    return labels[plan] || plan;
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="text-jade-700 mx-auto mb-4">
              <CompassIcon size={48} />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-white placeholder:text-text-dim focus:outline-none focus:border-jade-700 transition-colors text-sm"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-jade-700 hover:bg-jade-600 text-white font-medium rounded-xl transition-all"
            >
              Login
            </button>
          </form>

          <p className="text-text-dim text-xs text-center mt-6">
            Secure admin area for Jade Compass order management.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Admin header */}
      <div className="border-b border-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2">
              <div className="text-jade-700">
                <CompassIcon size={20} />
              </div>
              <span className="text-sm font-semibold text-white">Admin</span>
            </a>
            <span className="text-text-dim text-xs">|</span>
            <span className="text-text-muted text-xs">{orders.length} orders</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-white border border-border rounded-lg transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={checkCrawlerStatus}
              className="px-3 py-1.5 text-xs text-jade-400 hover:text-jade-300 border border-jade-700/50 rounded-lg transition-colors"
              title="Check crawler intelligence data status"
            >
              🕷️ Crawler
            </button>
            <button
              onClick={() => setLoggedIn(false)}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-red-400 border border-border rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Revenue</p>
            <p className="text-2xl font-bold text-gold-500">${stats.revenue}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Scans</p>
            <p className="text-2xl font-bold text-white">{stats.scan}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Briefings / Deep Dives</p>
            <p className="text-2xl font-bold text-white">{stats.briefing} / {stats.deepdive}</p>
          </div>
        </div>

        {/* Crawler Status */}
        {crawlerStatus && (
          <div className="mb-8 p-4 rounded-xl bg-jade-700/10 border border-jade-700/30">
            <div className="flex items-center justify-between">
              <p className="text-jade-400 text-xs font-semibold uppercase tracking-wider">🕷️ Intelligence Crawler</p>
              {crawlerLoading && <span className="text-jade-400 text-xs animate-pulse">Checking...</span>}
            </div>
            {crawlerStatus.status !== "error" ? (
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-muted">
                <span>Status: <span className="text-jade-400">{crawlerStatus.status}</span></span>
                <span>Competitors: <span className="text-white font-medium">{crawlerStatus.competitors || "?"}</span></span>
                <span>Major Brands: <span className="text-white font-medium">{crawlerStatus.major_brands || "?"}</span></span>
                <span>Local: <span className="text-white font-medium">{crawlerStatus.local_competitors || "?"}</span></span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-red-400">{crawlerStatus.message || "Crawler data not available. Run from Hermes CLI first."}</p>
            )}
          </div>
        )}

        {crawlerLoading && (
          <div className="mb-8 p-4 rounded-xl bg-surface border border-border">
            <p className="text-text-muted text-xs animate-pulse">🕷️ Checking crawler intelligence data...</p>
          </div>
        )}

        {/* Orders list */}
        <div className="rounded-xl bg-surface border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-white font-semibold">Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-text-muted">No orders yet. Share your site and start selling!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <div key={order.id}>
                  <div
                    className="px-6 py-4 hover:bg-surface-light/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">{order.customerName}</p>
                        <p className="text-text-dim text-xs">{order.customerEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gold-500 text-sm font-semibold">${order.amount}</p>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-jade-700/20 text-jade-400 capitalize">
                          {order.plan}
                        </span>
                        {reportCache[order.orderId] && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gold-500/20 text-gold-400 ml-1">
                            Report ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedOrder?.orderId === order.orderId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="px-6 pb-4"
                    >
                      <div className="pt-4 border-t border-border">
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-text-dim text-xs">Business</p>
                            <p className="text-white">{order.formData?.businessName || "—"}</p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs">Industry</p>
                            <p className="text-white">{order.formData?.industry || "—"}</p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs">Years in Operation</p>
                            <p className="text-white">{order.formData?.yearsInOperation || "—"}</p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs">Revenue</p>
                            <p className="text-white">{order.formData?.revenue || "—"}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-text-dim text-xs">Challenges</p>
                            <p className="text-white">{order.formData?.challenges || "—"}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-text-dim text-xs">Main Question</p>
                            <p className="text-white">{order.formData?.mainQuestion || "—"}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-text-dim text-xs">Target Customers</p>
                            <p className="text-white">{order.formData?.targetCustomers || "—"}</p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs">Order Date</p>
                            <p className="text-white text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs">PayPal Order ID</p>
                            <p className="text-white text-xs truncate">{order.orderId}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateReport(order);
                            }}
                            disabled={generating === order.orderId}
                            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                              generating === order.orderId
                                ? "bg-surface-light text-text-dim cursor-not-allowed"
                                : reportCache[order.orderId]
                                ? "bg-jade-800 hover:bg-jade-700 text-white border border-jade-700"
                                : "bg-jade-700 hover:bg-jade-600 text-white"
                            }`}
                          >
                            {generating === order.orderId
                              ? "Generating..."
                              : reportCache[order.orderId]
                              ? "Regenerate Report"
                              : "Generate Report"}
                          </button>

                          {reportCache[order.orderId] && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadReport(order.orderId, order.customerName);
                                }}
                                className="px-4 py-2 bg-surface-light hover:bg-border text-white text-xs font-medium rounded-lg transition-all border border-border"
                              >
                                Download .md
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadPdf(order.orderId);
                                }}
                                className="px-4 py-2 bg-jade-700 hover:bg-jade-600 text-white text-xs font-medium rounded-lg transition-all border border-jade-700"
                              >
                                Download PDF
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyReport(order.orderId);
                                }}
                                className="px-4 py-2 bg-surface-light hover:bg-border text-white text-xs font-medium rounded-lg transition-all border border-border"
                              >
                                Copy to Clipboard
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const mailto = `mailto:${order.customerEmail}?subject=Your Jade Compass Intelligence Report - ${planLabel(order.plan)}&body=Hi ${order.customerName},%0D%0A%0D%0AYour intelligence report is ready. Please find it attached.%0D%0A%0D%0ABest regards,%0D%0AJade Compass`;
                                  window.open(mailto);
                                }}
                                className="px-4 py-2 bg-surface-light hover:bg-border text-white text-xs font-medium rounded-lg transition-all border border-border"
                              >
                                Email Client
                              </button>
                            </>
                          )}
                        </div>

                        {/* Report preview */}
                        {reportCache[order.orderId] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="mt-4"
                          >
                            <div className="rounded-lg bg-bg-dark border border-border p-4 max-h-96 overflow-y-auto">
                              <pre className="text-xs text-text-muted whitespace-pre-wrap font-sans leading-relaxed">
                                {reportCache[order.orderId].slice(0, 3000)}
                                {reportCache[order.orderId].length > 3000 ? "\n\n... (report continues, download full version)" : ""}
                              </pre>
                            </div>
                          </motion.div>
                        )}

                        {reportError && (
                          <p className="mt-2 text-red-400 text-xs">{reportError}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
