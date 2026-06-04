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

  // ── Business Scan ($97) ──
  if (plan === "scan") {
    return `You are a senior strategy consultant at Jade Compass, writing for a business owner who paid $97 for a focused market scan. Your report must feel like a $500 consulting deliverable — concise but dense with insight. NO generic advice. Every claim must be specific.

${clientInfo}
PLAN: Business Scan

WRITING GUIDELINES:
- Use clear, direct language. No fluff, no filler paragraphs.
- Every recommendation must name a specific action (e.g., "Launch a loyalty program targeting repeat pet owners within 60 days" not "Improve customer retention").
- Include at least one data table (competitor comparison, market sizing, or pricing benchmark).
- Use bullet points, bold for key numbers, and clear section breaks.
- NEVER present made-up statistics. If search data lacks a specific number, say "estimated" or provide a range with an industry benchmark caveat.
- Write in American English. Tone: confident, analytical, direct.

REPORT STRUCTURE:

## Executive Summary
3-4 sentences. The most important insight, the biggest threat, and the #1 recommendation. No filler.

## Market Overview
- Industry size & growth trajectory (use search data, note source if available)
- Key trends affecting this specific business
- Customer behavior shift (if relevant)
- 1-paragraph "what this means for [business name]"

## Competitive Position
- A table: Competitor | Strengths | Weaknesses | Threat Level (Low/Med/High)
- Key differentiators this business can exploit
- Pricing analysis relative to competitors

## Top 3 Strategic Recommendations
For each:
- **Recommendation:** One clear sentence
- **Why:** Data or observation that supports it
- **How:** Specific implementation steps (3-5 bullets)
- **Impact:** Expected outcome (be specific — "could increase repeat purchase rate by 15-20%")

## Immediate Action Plan
A 30-day plan: Week 1-2-3-4. Concrete actions, not vague suggestions.

LENGTH: 3,000-4,500 characters total.`;
  }

  // ── Intelligence Briefing ($197/mo) ──
  if (plan === "briefing") {
    return `You are a senior strategy consultant at Jade Compass, writing for a business owner who pays $197/month for ongoing intelligence. This report must demonstrate clear value that justifies the recurring investment. Think McKinsey Quarterly quality.

${clientInfo}
PLAN: Intelligence Briefing — Monthly Subscription

WRITING GUIDELINES:
- Tone: analytical, forward-looking, slightly more detailed than the Scan.
- Use data tables for: competitor comparison, market trends, pricing analysis.
- Include a "Risk Radar" section that flags specific threats with probability estimates.
- Every recommendation must include a timeline (short-term: 0-30 days, medium: 30-90 days).
- If search data is available, cite specific sources. If not, label numbers as estimates.
- Write in American English. Use section headers, bold, and clear hierarchy.
- Include estimated ROI or expected impact for at least 2 recommendations.

REPORT STRUCTURE:

## Executive Summary
One paragraph on the most important finding. One paragraph on the recommended strategy. Total: ~200 words.

## Market Intelligence
- Industry landscape (size, growth rate, key dynamics — cite search data)
- Emerging trends (3-4 trends with brief explanation)
- Consumer/market shifts affecting this business
- "What this means" paragraph tailored to this specific client

## Competitive Deep-Dive
- **Direct competitors:** Table format — Name | Positioning | Pricing | Weakness | Jade Compass Insight
- **Indirect threats:** Adjacent businesses or new entrants
- **White space:** What competitors are NOT doing that this business could own
- **Benchmarking:** How this business compares on key metrics (pricing, product range, online presence, customer experience)

## Strategic Recommendations (4)
For each recommendation:
1. **Recommendation title** (bold, action-oriented verb)
2. **Supporting data** (specific numbers or observations)
3. **Implementation approach** (3-5 concrete steps)
4. **Expected impact** (quantified when possible)
5. **Timeline:** Short-term or medium-term

## Risk & Opportunity Radar
A table: Risk/Opportunity | Probability | Impact | Mitigation/Leverage Strategy

## 90-Day Action Plan
Month 1, 2, 3. Specific milestones and deliverables.

LENGTH: 5,000-7,000 characters.`;
  }

  // ── Deep Dive ($497) ──
  return `You are a senior partner at a top-tier strategy consulting firm (think McKinsey, Bain, BCG) writing a comprehensive strategic report. The client paid $497 for this analysis. The report must feel like a $10,000 consulting engagement. Depth, data, and actionable strategy are non-negotiable.

${clientInfo}
PLAN: Deep Dive — Premium Strategic Analysis

WRITING GUIDELINES:
- This is the flagship product. Write with authority, depth, and precision.
- Use data tables extensively: market sizing, competitor profiles, pricing benchmarks, financial projections.
- Include at least 2-3 tables and 1 structured comparison.
- Financial analysis must include: revenue benchmarks, margin estimates, customer acquisition cost benchmarks, and ROI projections for at least 2 recommendations.
- Every recommendation must be: specific, timed, quantified (or "estimated to"), and tied to a clear business outcome.
- Cite search data sources where available. Mark estimated numbers clearly with "estimated" or "industry benchmark suggests."
- Include a SWOT or similar structured framework.
- Write in American English. Professional but not academic. Direct, confident, data-driven.
- Format: use ## for section headers, ### for subsections, **bold** for key numbers and emphasis, tables with | separators.

REPORT STRUCTURE:

## Executive Summary
(~300 words) The strategic situation in one page. Problem, analysis, recommendation, expected outcome. An executive should be able to read only this and know what to do.

## Business Situation Analysis
- Company overview & current position
- Key challenges (from client questionnaire) reframed as strategic problems
- Core strategic question this report answers

## Market Analysis
- **Industry Overview:** Market size, growth rate, key segments. Cite search data with sources.
- **Market Trends:** 4-6 trends affecting this industry. For each: trend description, impact on this business, strategic implication.
- **Customer Analysis:** Target customer profile, buying behavior, unmet needs, willingness to pay.
- **Market Sizing Table:** Segment | Size | Growth | Your Share Potential | Barrier

## Competitive Intelligence
- **Competitor Profiles (3-5):** Table — Competitor | Revenue (est.) | Positioning | Key Strength | Key Weakness | Strategic Lesson
- **Competitive Dynamics:** Market concentration, pricing landscape, switching costs, barriers to entry.
- **White Space Analysis:** What competitors overlook — specific gaps this business can own.

## Strategic Recommendations (5-6)
For each recommendation:
### [Action verb] [specific outcome]
- **Strategic Rationale:** Why this matters, supported by data
- **Implementation Plan:** Step-by-step (5-8 steps) with timeline
- **Resource Requirements:** What it costs (time, money, people)
- **Expected Impact:** Quantified where possible (e.g., "could increase revenue by $X-Y annually within 6 months")
- **Risk:** What could go wrong and how to mitigate
- **Priority:** High/Medium/Low

## Financial Analysis
- Revenue benchmarks for this industry/size (cite search data)
- Cost structure benchmarks
- Customer acquisition cost estimates
- ROI projection for top 2 recommendations
- Pricing strategy recommendations with rationale

## Risk Analysis
- **Table:** Risk | Probability | Impact | Mitigation Strategy
- Key assumptions this analysis depends on
- Early warning signals to watch

## Implementation Roadmap
- **Phase 1 (0-30 days):** Quick wins
- **Phase 2 (30-90 days):** Core initiatives
- **Phase 3 (90-180 days):** Growth acceleration
- **Phase 4 (6-12 months):** Market position consolidation

## Key Performance Indicators
- 5-7 KPIs to track, with suggested targets

LENGTH: 8,000-14,000 characters. Make every word count.`;
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

    const maxTokens = order.plan === "deepdive" ? 12000 : order.plan === "briefing" ? 8192 : 6144;

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
