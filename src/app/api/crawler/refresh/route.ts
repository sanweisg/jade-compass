import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { industry, businessName } = await req.json();
    
    if (!industry) {
      return NextResponse.json({ error: "Missing industry" }, { status: 400 });
    }

    const crawlerScript = path.join(process.cwd(), "crawler", "run_hermes.py");
    
    // Run the crawler
    const result = execSync(
      `python3 -c "
import sys, json
sys.path.insert(0, '${process.cwd()}/crawler')
from run import identify_competitors, classify_industry, generate_report

# Load existing data to check
import os
crawler_path = '${process.cwd()}/crawler/output/paws-and-claws.json'
if os.path.exists(crawler_path):
    with open(crawler_path) as f:
        d = json.load(f)
    comp = d.get('competitors', {})
    total = comp.get('total', 0)
    majors = len(comp.get('major_brands', []))
    locals_count = len(comp.get('local_competitors', []))
    print(json.dumps({'status': 'cached', 'competitors': total, 'major_brands': majors, 'local_competitors': locals_count}))
else:
    print(json.dumps({'status': 'no_data', 'message': 'Run crawler from Hermes first'}))
" 2>&1`,
      { timeout: 15000, encoding: "utf-8", cwd: process.cwd() }
    );

    const output = JSON.parse(result.trim());
    return NextResponse.json(output);
  } catch (e: any) {
    return NextResponse.json({
      status: "error",
      message: `Crawler check failed: ${e.message?.substring(0, 100)}`,
    }, { status: 500 });
  }
}
