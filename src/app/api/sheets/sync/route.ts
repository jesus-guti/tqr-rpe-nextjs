// src/app/api/sheets/sync/route.ts

import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Increase max duration to 60 seconds for Vercel (Pro plan allows up to 300s)
export const maxDuration = 60;

export async function POST(request: Request) {
  const startTime = Date.now();

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

    // Calculate the season start date (July of the appropriate year)
    const now = new Date();
    const currentMonth = now.getMonth();
    const seasonStartYear = currentMonth < 6 ? now.getFullYear() - 1 : now.getFullYear();
    const seasonStartDate = new Date(seasonStartYear, 6, 1); // July 1st

    console.log(`Fetching entries from season start: ${seasonStartDate.toISOString()}`);

    const players = await prisma.players.findMany({
      include: {
        daily_entries: {
          where: {
            entry_date: {
              gte: seasonStartDate,
            },
          },
          orderBy: { entry_date: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    console.log(`Found ${players.length} players`);

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

    const totalEntries = playerData.reduce((sum, p) => sum + p.daily_entries.length, 0);
    console.log(`Total entries to sync: ${totalEntries}`);

    const sheetsService = new GoogleSheetsService();

    // Update the spreadsheet with comprehensive data
    await sheetsService.updateSpreadsheetData(spreadsheetId, playerData);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Sync completed in ${duration}s`);

    return NextResponse.json({
      success: true,
      message: `Sincronización completada en ${duration}s`,
      spreadsheetUrl: sheetsService.getSpreadsheetUrl(spreadsheetId),
      playersCount: playerData.length,
      entriesCount: totalEntries,
      seasonStart: seasonStartDate.toISOString().split('T')[0],
      duration: `${duration}s`,
    });
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`Error syncing to Google Sheets after ${duration}s:`, error);

    // More specific error messages
    let errorMessage = "Error desconocido al sincronizar con Google Sheets";

    if (error.message?.includes("not found")) {
      errorMessage = "La hoja 'TEMPORADA 2025/2026' no existe en el spreadsheet. Por favor, créala primero.";
    } else if (error.response?.status === 403) {
      errorMessage = "Sin permisos para acceder al spreadsheet. Verifica que la cuenta de servicio tenga acceso.";
    } else if (error.response?.status === 404) {
      errorMessage = "Spreadsheet no encontrado. Verifica el GOOGLE_SPREADSHEET_ID.";
    } else if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
      errorMessage = "Timeout al conectar con Google Sheets. Intenta de nuevo.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration: `${duration}s`,
      },
      { status: 500 },
    );
  }
}
