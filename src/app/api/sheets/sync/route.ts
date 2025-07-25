// src/app/api/sheets/sync/route.ts

import { NextResponse } from "next/server";
import { startOfWeek } from "date-fns";
import { GoogleSheetsService } from "@/lib/google-sheets";
import prisma from "@/lib/prisma";

// Define a reusable type for player data with entries
type PlayerWithEntries = Awaited<ReturnType<typeof prisma.players.findFirst>>;
type DailyEntry = PlayerWithEntries["daily_entries"][0];

export async function POST(request: Request) {
  try {
    // Body parsing and validation
    const body = (await request.json()) as { spreadsheetId: string };
    const { spreadsheetId } = body;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Spreadsheet ID is required" },
        { status: 400 },
      );
    }

    // --- NEW FULL SYNC LOGIC ---

    // 1. Fetch ALL players with ALL of their daily entries, sorted by date.
    const allPlayers = await prisma.players.findMany({
      include: {
        daily_entries: {
          orderBy: {
            entry_date: "asc",
          },
        },
      },
    });

    if (!allPlayers.some((p) => p.daily_entries.length > 0)) {
      return NextResponse.json({
        success: true,
        message: "No training data found in the database.",
      });
    }

    // 2. Group all entries by microcycle (week).
    // The Map will hold: { "2025-07-21": [playerDataForThatWeek], "2025-07-28": [...] }
    const microcycles = new Map<string, typeof allPlayers>();

    for (const player of allPlayers) {
      for (const entry of player.daily_entries) {
        // Find the Monday for this entry's week
        const weekStartDate = startOfWeek(entry.entry_date, {
          weekStartsOn: 1,
        });
        const weekKey = weekStartDate.toISOString().split("T")[0];

        // Get or create the microcycle bucket
        if (!microcycles.has(weekKey)) {
          microcycles.set(weekKey, []);
        }

        const playersInWeek = microcycles.get(weekKey)!;
        let playerInWeek = playersInWeek.find((p) => p.id === player.id);

        // If this player isn't in this microcycle bucket yet, add them with an empty entries list.
        if (!playerInWeek) {
          playerInWeek = { ...player, daily_entries: [] };
          playersInWeek.push(playerInWeek);
        }

        // Add the current entry to that player's list for that specific week.
        playerInWeek.daily_entries.push(entry);
      }
    }

    // 3. Sort the microcycles chronologically
    const sortedWeeks = Array.from(microcycles.keys()).sort();

    // 4. Process each microcycle one by one
    const sheetsService = new GoogleSheetsService();
    for (const weekKey of sortedWeeks) {
      const playersForThisWeek = microcycles.get(weekKey)!;
      const microcycleStartDate = new Date(`${weekKey}T12:00:00Z`);

      console.log(`Syncing microcycle starting ${weekKey}...`);
      await sheetsService.updateSpreadsheetData(
        spreadsheetId,
        playersForThisWeek,
        microcycleStartDate,
      );
    }

    return NextResponse.json({
      success: true,
      message: `Full sync completed. Processed ${sortedWeeks.length} microcycles.`,
      spreadsheetUrl: sheetsService.getSpreadsheetUrl(spreadsheetId),
    });
  } catch (error) {
    console.error("Error during full sync:", error);
    return NextResponse.json(
      { success: false, error: "Failed during full sync." },
      { status: 500 },
    );
  }
}
