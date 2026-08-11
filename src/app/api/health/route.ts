import { jsonResponse } from "@/lib/auth";

export async function GET() {
  return jsonResponse({ ok: true, service: "vuela-cargo", time: new Date().toISOString() });
}
