import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openai_key_set: !!process.env.OPENAI_API_KEY,
    openai_key_length: process.env.OPENAI_API_KEY?.length || 0,
    openai_key_prefix: process.env.OPENAI_API_KEY?.slice(0, 10) || "(vacía)",
  });
}
