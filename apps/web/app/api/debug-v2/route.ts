import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return NextResponse.json({
    message: "Debug V2",
    timestamp: new Date().toISOString(),
    cookies: allCookies.map((c) => ({ name: c.name, value: c.name.includes("auth-token") ? "[REDACTED]" : c.value })),
  });
}
