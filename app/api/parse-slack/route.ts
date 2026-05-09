import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.endsWith(".json")) {
      return Response.json(
        { error: "Please upload a Slack JSON export file" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const messages = JSON.parse(text);

    if (!Array.isArray(messages)) {
      return Response.json(
        { error: "Invalid Slack JSON format" },
        { status: 400 },
      );
    }

    // Extract meaningful messages only
    const extracted = messages
      .filter(
        (m: any) =>
          m.type === "message" &&
          m.text &&
          m.text.trim().length > 10 &&
          !m.bot_id && // skip bot messages
          m.subtype !== "channel_join" &&
          m.subtype !== "channel_leave",
      )
      .map((m: any) => {
        const user =
          m.user_profile?.display_name ||
          m.user_profile?.real_name ||
          m.username ||
          "Someone";
        return `${user}: ${m.text}`;
      })
      .slice(0, 100); // limit to last 100 messages

    if (extracted.length === 0) {
      return Response.json(
        { error: "No messages found in this Slack export" },
        { status: 400 },
      );
    }

    const cleanText = extracted.join("\n");

    return Response.json({ text: cleanText });
  } catch (err: any) {
    console.error("parse-slack error:", err);
    return Response.json(
      { error: err.message || "Failed to parse Slack file" },
      { status: 500 },
    );
  }
}
