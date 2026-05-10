import { NextResponse } from "next/server";
import { getGlobalSettings, updateGlobalSettings, getLocalSettings, updateLocalSettings } from "@/lib/claude/config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "global";
    const settings = scope === "local" ? getLocalSettings() : getGlobalSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const scope = body.scope || "global";
    const settings = body.settings;

    const result = scope === "local"
      ? updateLocalSettings(settings)
      : updateGlobalSettings(settings);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}