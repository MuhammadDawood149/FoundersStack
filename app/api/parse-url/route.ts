import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return Response.json({ error: "No URL provided" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FoundersStack/1.0)",
      },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Could not fetch URL: ${res.statusText}` },
        { status: 400 },
      );
    }

    const html = await res.text();

    // Strip HTML tags and clean up text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000); // limit to 5000 chars

    if (!text) {
      return Response.json(
        { error: "Could not extract text from URL" },
        { status: 400 },
      );
    }

    return Response.json({ text });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Failed to fetch URL" },
      { status: 500 },
    );
  }
}
