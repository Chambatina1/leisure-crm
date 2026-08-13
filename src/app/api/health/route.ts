import { jsonResponse } from "@/lib/auth";

export async function GET() {
  return jsonResponse({ ok: true, service: "chambatina", time: new Date().toISOString() });
}
