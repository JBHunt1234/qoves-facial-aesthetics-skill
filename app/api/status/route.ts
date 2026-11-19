import { NextResponse } from "next/server";
import { activeProvider } from "@/lib/image-providers";

export const dynamic = "force-dynamic";

/** Lets the UI know which features are configured, without exposing any secrets. */
export function GET() {
  return NextResponse.json({
    analysis: Boolean(process.env.ANTHROPIC_API_KEY),
    previews: activeProvider(),
    accessCode: Boolean(process.env.APP_ACCESS_CODE),
  });
}
