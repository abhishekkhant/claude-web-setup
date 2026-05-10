import { NextResponse } from "next/server";
import { getGlobalHooks, addHook, deleteHook } from "@/lib/claude/hooks";

export async function GET() {
  try {
    const hooks = getGlobalHooks();
    return NextResponse.json({ success: true, data: hooks });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = addHook(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    if (!name) {
      return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    }
    const result = deleteHook(name);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}