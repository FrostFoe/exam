import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const CSV_API_ENTRY =
  (process.env.NEXT_PUBLIC_CSV_API_BASE_URL || "https://csv.mnr.world").replace(
    /\/$/,
    "",
  ) + "/api/index.php";
const API_KEY = process.env.NEXT_PUBLIC_CSV_API_KEY || "";
if (!API_KEY) {
  throw new Error("Missing NEXT_PUBLIC_CSV_API_KEY in environment");
}

function buildCsvUrl(
  routeName: string,
  params: Record<string, string | undefined>,
) {
  let u = `${CSV_API_ENTRY}?route=${routeName}`;

  // id should come first for file routes
  if (params.id) u += `&id=${encodeURIComponent(params.id)}`;

  // any other params (stable order)
  Object.keys(params)
    .filter((k) => k !== "id")
    .sort()
    .forEach((k) => {
      const v = params[k];
      if (v) u += `&${k}=${encodeURIComponent(v)}`;
    });

  u += `&token=${encodeURIComponent(API_KEY)}`;
  return u;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Build URL in exact format: route=file&id=...&token=...
    const url = buildCsvUrl("file", { id: id || undefined });

    const res = await fetch(url, {
      headers: { "User-Agent": "Course-MNR-World-Backend/1.0" },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { success: false, message: text },
        { status: res.status },
      );
    }

    const payload = await res.json();
    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    console.error("[FETCH-FILE] Error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
