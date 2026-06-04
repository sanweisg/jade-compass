import { NextRequest, NextResponse } from "next/server";
import { getReport, getOrderByOrderId } from "../../../../lib/data-service";
import { marked } from "marked";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) return new NextResponse("Missing orderId", { status: 400 });

    const order = await getOrderByOrderId(orderId);
    const report = await getReport(orderId);
    if (!report) return new NextResponse("Report not found", { status: 404 });

    const planName = order?.plan === "scan" ? "Business Scan"
      : order?.plan === "briefing" ? "Intelligence Briefing"
      : "Deep Dive";

    const customerName = order?.customerName || "Client";
    const businessName = order?.formData?.businessName || "";
    const date = order?.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const body = marked.parse(report, { breaks: true }) as string;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@page { size: A4; margin: 20mm 25mm; }
body { font-family: Georgia, 'Times New Roman', serif; color: #222; font-size: 11pt; line-height: 1.7; }

.cover { text-align: center; padding: 100px 0 60px; page-break-after: always; }
.cover h1 { font-size: 24pt; color: #1a3a2e; margin-bottom: 10px; letter-spacing: 2px; }
.cover .line { width: 50px; height: 2px; background: #0B6E4F; margin: 24px auto; }
.cover .plan { font-size: 13pt; color: #0B6E4F; margin-bottom: 30px; }
.cover .client { color: #555; font-size: 11pt; margin-bottom: 5px; }
.cover .name { font-size: 14pt; color: #1a1a2e; font-weight: bold; margin-bottom: 25px; }
.cover .date { color: #888; font-size: 10pt; }
.cover .footer { margin-top: 60px; color: #aaa; font-size: 8pt; letter-spacing: 2px; }

.content h1 { font-size: 18pt; color: #0B6E4F; margin: 32px 0 14px; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
.content h2 { font-size: 14pt; color: #1a1a2e; margin: 24px 0 10px; }
.content h3 { font-size: 12pt; color: #0B6E4F; margin: 18px 0 8px; }
.content p { margin-bottom: 10px; }
.content ul, .content ol { margin-bottom: 12px; padding-left: 22px; }
.content li { margin-bottom: 4px; }
.content table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 10pt; }
.content th { background: #0B6E4F; color: #fff; padding: 7px 10px; text-align: left; }
.content td { padding: 6px 10px; border-bottom: 1px solid #ddd; }
.content tr:nth-child(even) { background: #f7f7f7; }
.content hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
.content blockquote { border-left: 3px solid #0B6E4F; padding: 6px 14px; margin: 12px 0; background: #f5f9f7; }
.footer-note { text-align: center; color: #999; font-size: 8pt; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }

@media print { .print-hide { display: none; } }
</style></head><body>

<div class="cover">
  <h1>JADE COMPASS</h1>
  <div class="line"></div>
  <p class="plan">${planName}</p>
  <p class="client">Prepared for</p>
  <p class="name">${businessName ? `${customerName} — ${businessName}` : customerName}</p>
  <p class="date">${date}</p>
  <p class="footer">Confidential</p>
</div>

<div class="content">${body}</div>

<div class="footer-note">
  Jade Compass — compassjade.app
</div>

<div class="print-hide" style="position:fixed;bottom:20px;right:20px;text-align:right;z-index:9999">
  <button onclick="window.print()" style="padding:10px 22px;background:#0B6E4F;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)">Save as PDF</button>
</div>

<script>setTimeout(function(){window.print()},600);</script>
</body></html>`;

    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e) {
    console.error(e);
    return new NextResponse("Error", { status: 500 });
  }
}
