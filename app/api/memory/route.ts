import { NextResponse } from "next/server";
import { getGlobalMemory, updateMemory, getUserMemory } from "@/lib/claude/memory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "global";
    const memory = type === "user" ? getUserMemory() : getGlobalMemory();
    return NextResponse.json({ success: true, data: memory });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = updateMemory(body.type, body.content, body.projectPath);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}