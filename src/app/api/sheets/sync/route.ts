// src/app/api/sheets/sync/route.ts

import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Check environment variables
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!spreadsheetId) {
      console.error("Missing GOOGLE_SPREADSHEET_ID environment variable");
      return NextResponse.json(
        { success: false, error: "Spreadsheet ID not configured" },
        { status: 400 },
      );
    }

    if (!serviceAccountEmail) {
      console.error(
        "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable",
      );
      return NextResponse.json(
        {
          success: false,
          error: "Google service account email not configured",
        },
        { status: 400 },
      );
    }

    if (!privateKey) {
      console.error("Missing GOOGLE_PRIVATE_KEY environment variable");
      return NextResponse.json(
        { success: false, error: "Google private key not configured" },
        { status: 400 },
      );
    }

    console.log("Environment variables check passed");
    console.log("Spreadsheet ID:", spreadsheetId);
    console.log("Service Account Email:", serviceAccountEmail);

    // Fetch all players with their daily entries from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const players = await prisma.players.findMany({
      include: {
        daily_entries: {
          where: {
            entry_date: {
              gte: sixMonthsAgo,
            },
          },
          orderBy: { entry_date: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform data for Google Sheets
    const playerData = players.map((player) => ({
      id: player.id,
      name: player.name,
      auth_token: player.auth_token,
      daily_entries: player.daily_entries.map((entry) => ({
        entry_date: entry.entry_date,
        tqr_recovery: entry.tqr_recovery,
        tqr_energy: entry.tqr_energy,
        tqr_soreness: entry.tqr_soreness,
        rpe_borg_scale: entry.rpe_borg_scale,
      })),
    }));

    const sheetsService = new GoogleSheetsService();

    // Update the spreadsheet with comprehensive data
    await sheetsService.updateSpreadsheetData(spreadsheetId, playerData);

    return NextResponse.json({
      success: true,
      message: "Data synced successfully",
      spreadsheetUrl: sheetsService.getSpreadsheetUrl(spreadsheetId),
      playersCount: playerData.length,
      dateRange: "Last 6 months",
    });
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to sync data to Google Sheets. Please check your credentials and spreadsheet ID.",
      },
      { status: 500 },
    );
  }
}
