import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (
      !fileName.endsWith(".xlsx") &&
      !fileName.endsWith(".csv") &&
      !fileName.endsWith(".xls")
    ) {
      return Response.json(
        { error: "Please upload an Excel or CSV file" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const XLSX = require("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let text = "";

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        text += `Sheet: ${sheetName}\n${csv}\n\n`;
      }
    }

    if (!text.trim()) {
      return Response.json(
        { error: "Could not extract data from spreadsheet" },
        { status: 400 },
      );
    }

    // Limit to 5000 chars
    text = text.slice(0, 5000);

    return Response.json({ text });
  } catch (err: any) {
    console.error("parse-spreadsheet error:", err);
    return Response.json(
      { error: err.message || "Failed to parse file" },
      { status: 500 },
    );
  }
}
