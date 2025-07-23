// src/app/api/sheets/create/route.ts

import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";

// 🧹 We can remove these imports as they are not used directly in this file.
// The GoogleSheetsService handles all the googleapis logic internally.
// import { google } from "googleapis";
// import { drive } from "googleapis/build/src/apis/drive";

export async function POST(request: Request) {
  console.log(
    "Service Account Email:",
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  );
  console.log("Drive Folder ID:", process.env.GOOGLE_DRIVE_FOLDER_ID);
  try {
    const body = (await request.json()) as { title?: string };

    // ✨ Let's use the title from the request body.
    // If no title is provided in the request, we'll use a default one.
    const title = body.title ?? "CONTROL CARGA TQR-RPE";

    const sheetsService = new GoogleSheetsService();

    // Pass the dynamic title to the service method.
    const spreadsheetId = await sheetsService.createSpreadsheet(title);

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl: sheetsService.getSpreadsheetUrl(spreadsheetId),
      message: "Spreadsheet created successfully",
    });
  } catch (error) {
    // This error handling is perfect. It logs the real error for you
    // but sends a generic message to the client.
    console.error("Error creating spreadsheet:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to create spreadsheet. Please check your Google Sheets credentials and server logs.",
      },
      { status: 500 },
    );
  }
}
