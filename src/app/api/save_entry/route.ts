import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
      select: { id: true },
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

    return NextResponse.json({
      message: "Entrada guardada correctamente",
      data: JSON.parse(
        JSON.stringify(upsertResult, (key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      ) as Record<string, unknown>,
    });
  } catch (error) {
    console.error("Error al guardar la entrada:", error);
    return NextResponse.json(
      { error: "Ocurrió un error en el servidor" },
      { status: 500 },
    );
  }
}
