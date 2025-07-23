import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GoogleSheetsService } from "@/lib/google-sheets";

interface SaveEntryRequest {
  authToken: string;
  entryDate: string;
  tqr_recovery?: number;
  tqr_energy?: number;
  tqr_soreness?: number;
  rpe_borg_scale?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveEntryRequest;
    const { authToken, entryDate, ...formData } = body;

    // 1. Validar que los datos necesarios estén presentes
    if (!authToken || !entryDate) {
      return NextResponse.json(
        { error: "authToken y entryDate son requeridos" },
        { status: 400 },
      );
    }

    // 2. Validar el authToken y obtener el ID del jugador
    const player = await prisma.players.findUnique({
      where: { auth_token: authToken },
      select: { id: true, name: true, auth_token: true },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Token de autenticación inválido" },
        { status: 401 },
      );
    }

    const { id: playerId } = player;

    // Convertir entryDate a objeto Date si es una cadena
    const dateObject = new Date(entryDate + "T00:00:00.000Z");

    // 3. Realizar la operación "UPSERT"
    const upsertResult = await prisma.daily_entries.upsert({
      where: {
        player_id_entry_date: {
          player_id: playerId,
          entry_date: dateObject,
        },
      },
      update: {
        ...formData,
      },
      create: {
        player_id: playerId,
        entry_date: dateObject,
        ...formData,
      },
    });

    // Try to sync to Google Sheets if configured
    let sheetsSync = {
      success: false,
      message: "Google Sheets not configured",
    };

    if (process.env.GOOGLE_SPREADSHEET_ID) {
      try {
        const sheetsService = new GoogleSheetsService();
        await sheetsService.updateSpreadsheetData(
          process.env.GOOGLE_SPREADSHEET_ID,
          [
            {
              id: playerId,
              name: player.name,
              auth_token: player.auth_token,
              daily_entries: [
                {
                  entry_date: dateObject,
                  tqr_recovery: formData.tqr_recovery ?? undefined,
                  tqr_energy: formData.tqr_energy ?? undefined,
                  tqr_soreness: formData.tqr_soreness ?? undefined,
                  rpe_borg_scale: formData.rpe_borg_scale ?? undefined,
                },
              ],
            },
          ],
          new Date(),
        );
        sheetsSync = { success: true, message: "Data synced to Google Sheets" };
      } catch (error) {
        console.error("Google Sheets sync error:", error);
        sheetsSync = {
          success: false,
          message: "Failed to sync to Google Sheets",
        };
      }
    }

    return NextResponse.json({
      message: "Entrada guardada correctamente",
      data: JSON.parse(
        JSON.stringify(upsertResult, (key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      ) as Record<string, unknown>,
      sheetsSync,
    });
  } catch (error) {
    console.error("Error al guardar la entrada:", error);
    return NextResponse.json(
      { error: "Ocurrió un error en el servidor" },
      { status: 500 },
    );
  }
}
