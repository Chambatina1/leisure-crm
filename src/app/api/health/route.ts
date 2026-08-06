import { jsonResponse } from "@/lib/auth";

export async function GET() {
  return jsonResponse({ ok: true, service: "leisure-crm", time: new Date().toISOString() });
}
