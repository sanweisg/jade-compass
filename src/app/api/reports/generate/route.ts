import { NextRequest, NextResponse } from "next/server";
import { getOrderByOrderId, saveReport } from "../../../../lib/data-service";
import { execSync } from "child_process";
import path from "path";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "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";

// ─── Try Python v2 generator first ────────────────────────────────
async function tryPythonGenerator(order: any): Promise<string | null> {
  try {
    const crawlerScript = path.join(process.cwd(), "crawler", "generate_report.py");
    
    const input = JSON.stringify({
      orderId: order.orderId,
      formData: order.formData,
      plan: order.plan,
    });

    const result = execSync(`python3 "${crawlerScript}"`, {
      input,
      timeout: 30000,  // 30 seconds max
      encoding: "utf-8",
      cwd: process.cwd(),
    });

    const output = JSON.parse(result.trim());
    
    if (output.status === "ok" && output.report) {
      console.log(`Python v2 generator succeeded: ${output.stats?.competitors_found || 0} competitors, engine v2`);
      return output.report;
    }
    
    console.log("Python generator returned unexpected output:", JSON.stringify(output).substring(0, 200));
    return null;
  } catch (e: any) {
    console.log("Python generator failed, falling back to DeepSeek:", e.message?.substring(0, 100));
    return null;
  }
}

// ─── Fallback: Tavily search ──────────────────────────────────────
async function searchMarketData(industry: string, businessName: string): Promise<string> {
  try {
    const queries = [
      `${industry} market size revenue 2025 2026 growth rate forecast`,
      `${industry} key trends consumer behavior 2026`,
      `top companies competitors in ${industry} market share 2025 2026`,
      `${industry} small business profit margins pricing benchmarks`,
      `${industry} consumer demographics spending patterns`,
      `${industry} latest news strategic moves 2026`
    ];
    
    const results: string[] = [];
    const seenUrls = new Set<string>();
    
    for (const q of queries) {
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: q,
            search_depth: "advanced",
            max_results: 3,
            include_answer: true,
          }),
        });
        const data = await res.json();
        
        if (data.answer) {
          results.push(`[SEARCH SUMMARY: ${q}] ${data.answer.substring(0, 1000)}`);
        }
        
        if (data.results) {
          for (const r of data.results) {
            if (r.content && !seenUrls.has(r.url)) {
              seenUrls.add(r.url);
              results.push(
                `[SOURCE: ${r.title}](${r.url})\n${r.content.substring(0, 1500)}`
              );
            }
          }
        }
      } catch (e) {
        console.error(`Search error for "${q}":`, e);
      }
    }
    
    return results.join("\n\n---\n\n");
  } catch (e) {
    console.error("Search error:", e);
    return "";
  }
}

function buildPrompt(formData: any, plan: string, searchData?: string): string {
  const clientInfo = `
CLIENT INFORMATION:
- Business Name: ${formData.businessName || "N/A"}
- Industry: ${formData.industry || "N/A"}
- Years in Operation: ${formData.yearsInOperation || "N/A"}
- Annual Revenue Range: ${formData.revenue || "N/A"}
- Key Challenges: ${formData.challenges || "N/A"}
- Main Question: ${formData.mainQuestion || "N/A"}
- Target Customers: ${formData.targetCustomers || "N/A"}
- Additional Context: ${formData.additionalInfo || "N/A"}`;

  if (plan === "scan") {
    return `You are a senior business intelligence analyst at Jade Compass. Produce a CONCISE but high-value Business Scan report.

${clientInfo}
PLAN: Business Scan ($97 — one-time)

This is a focused, quick-turnaround analysis. Be direct, avoid fluff.

REPORT STRUCTURE (keep each section concise):
## Executive Summary (150-200 words)
## Market Snapshot
## Competitive Landscape
## Strategic Recommendations (3)
## Immediate Action Plan

LENGTH: 4,000-5,000 characters total.`;
  }

  if (plan === "briefing") {
    return `You are a senior business intelligence analyst at Jade Compass. Produce a DETAILED Intelligence Briefing report.

${clientInfo}
PLAN: Intelligence Briefing ($197/month — ongoing subscription)

This client pays monthly for ongoing intelligence. Show depth and justify recurring investment.

REPORT STRUCTURE:
## Executive Summary (250-350 words)
## Market Intelligence
## Competitive Deep-Dive
## Strategic Recommendations (4-5)
## Risk & Opportunity Radar
## 90-Day Action Plan

LENGTH: 6,000-7,000 characters.`;
  }

  // Deep Dive
  return `You are a senior strategy consultant at Jade Compass. Produce a COMPREHENSIVE Deep Dive strategic report.

${clientInfo}
PLAN: Deep Dive ($497 — one-time premium)

This is the highest-tier product. The client paid $497. The report must feel like a $5,000 consulting engagement.

REPORT STRUCTURE:
## Executive Summary (400-500 words)
## Business Situation Analysis
## Market Analysis
## Competitive Intelligence
## Strategic Recommendations (5-6)
## Financial Analysis
## Risk Analysis
## Implementation Roadmap
## Key Performance Indicators

LENGTH: 8,000-12,000 characters.`;
}

// ─── POST handler ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await getOrderByOrderId(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Check cache first
    const { getReport } = await import("../../../../lib/data-service");
    const existing = await getReport(orderId);
    if (existing) return NextResponse.json({ status: "ok", report: existing, cached: true });

    // ─── TRY PYTHON v2 GENERATOR FIRST ─────────────────────────────
    const pythonReport = await tryPythonGenerator(order);
    if (pythonReport) {
      await saveReport(orderId, pythonReport);
      return NextResponse.json({
        status: "ok",
        report: pythonReport,
        cached: false,
        engine: "v2",
      });
    }

    console.log("Python v2 unavailable, falling back to DeepSeek + Tavily");

    // ─── FALLBACK: DeepSeek + Tavily ───────────────────────────────
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === "sk-you...-key") {
      return NextResponse.json({ error: "DeepSeek API key not configured" }, { status: 500 });
    }

    const maxTokens = order.plan === "deepdive" ? 8192 : order.plan === "briefing" ? 6144 : 4096;

    console.log(`Searching market data for: ${order.formData.industry}`);
    const autoSearchData = await searchMarketData(order.formData.industry || "", order.formData.businessName || "");
    if (autoSearchData) {
      console.log(`Found ${autoSearchData.length} chars of real market data from search`);
    }

    let prompt = buildPrompt(order.formData, order.plan);
    
    if (autoSearchData) {
      prompt = `===== REAL MARKET DATA FROM WEB SEARCH =====
Below is actual market research data gathered from the web. 
- Data marked with [SOURCE: ...](url) comes from a specific web page — you can reference the source.
- Data marked with [SEARCH SUMMARY: ...] is a search engine's summary of multiple sources.
ONLY use data from the sources above for specific numbers (market size, percentages, revenue, growth rates). 
If the search data doesn't contain a specific number you want to include, either:
  (a) Say "approximately" and note it as an estimate, OR
  (b) Use a reasonable range (e.g., "15-20%") and say it's an industry benchmark
NEVER present AI-generated numbers as if they are from a real source.

${autoSearchData}

===== END OF REAL MARKET DATA =====

${prompt}

IMPORTANT INSTRUCTIONS FOR DATA ACCURACY:
1. For every specific number you cite (market size, growth rate, margin %, competitor share), check if it exists in the REAL MARKET DATA section above.
2. If a number is NOT in the search data, clearly label it as "estimated" or "approximately" or give it as a range.
3. When you cite a number from search results, include the source title in parentheses.
4. For financial projections, always label them as "projected" or "estimated" and explain the assumptions used.
5. Better to say "we estimate" than to present a made-up number as fact.`;
    }

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a senior strategy consultant at a top-tier firm (Bain, McKinsey). You write data-driven, actionable strategic reports. Your analysis is specific, grounded in real market dynamics, and always ties back to what the client should DO. Use American English. Avoid generic advice.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("DeepSeek API error:", res.status, errText);
      return NextResponse.json({ error: `AI report generation failed (${res.status})` }, { status: 500 });
    }

    const data = await res.json();
    const reportContent = data.choices?.[0]?.message?.content || "";
    if (!reportContent) return NextResponse.json({ error: "AI returned empty" }, { status: 500 });

    await saveReport(orderId, reportContent);
    return NextResponse.json({ status: "ok", report: reportContent, cached: false, engine: "v1" });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
