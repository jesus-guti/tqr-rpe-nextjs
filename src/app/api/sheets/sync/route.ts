import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Check if request has content
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json" },
        { status: 400 },
      );
    }

    let body: { spreadsheetId: string; microcycleStartDate?: string };

    try {
      const requestBody = await request.json();
      body = requestBody as {
        spreadsheetId: string;
        microcycleStartDate?: string;
      };
    } catch (jsonError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { spreadsheetId, microcycleStartDate } = body;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: "Spreadsheet ID is required" },
        { status: 400 },
      );
    }

    // Get all players with their daily entries
    const players = await prisma.players.findMany({
      include: {
        daily_entries: {
          orderBy: { entry_date: "asc" },
        },
      },
    });

    // Transform data for Google Sheets
    const playerData = players.map((player) => ({
      id: player.id,
      name: player.name,
      auth_token: player.auth_token,
      daily_entries: player.daily_entries.map((entry) => ({
        entry_date: entry.entry_date,
        tqr_recovery: entry.tqr_recovery ?? undefined,
        tqr_energy: entry.tqr_energy ?? undefined,
        tqr_soreness: entry.tqr_soreness ?? undefined,
        rpe_borg_scale: entry.rpe_borg_scale ?? undefined,
      })),
    }));

    const sheetsService = new GoogleSheetsService();
    const startDate = microcycleStartDate
      ? new Date(microcycleStartDate)
      : new Date();

    await sheetsService.updateSpreadsheetData(
      spreadsheetId,
      playerData,
      startDate,
    );

    return NextResponse.json({
      success: true,
      message: "Data synced successfully",
      spreadsheetUrl: sheetsService.getSpreadsheetUrl(spreadsheetId),
      playersCount: playerData.length,
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
