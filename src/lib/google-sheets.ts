// lib/google-sheets.ts

import { google } from "googleapis";
import { JWT } from "google-auth-library";

// PlayerData interface (no changes needed)
interface PlayerData {
  id: string;
  name: string;
  auth_token: string;
  daily_entries: Array<{
    entry_date: Date;
    tqr_recovery?: number | null;
    tqr_energy?: number | null;
    tqr_soreness?: number | null;
    rpe_borg_scale?: number | null;
  }>;
}

export class GoogleSheetsService {
  private auth: JWT;
  private sheets: any;
  private readonly sheetName = "MICROCICLOS";

  constructor() {
    this.auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  public async updateSpreadsheetData(
    spreadsheetId: string,
    players: PlayerData[],
    microcycleStartDate: Date,
  ): Promise<void> {
    try {
      // 1. Read the date header row to find existing microcycles
      const headerRange = `'${this.sheetName}'!2:2`;
      const headerResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: headerRange,
      });
      const existingHeaders = headerResponse.data.values
        ? headerResponse.data.values[0]
        : [];

      // 2. Search for the column of the current microcycle
      const dateHeadersForWeek = this.generateDateHeaders(microcycleStartDate);
      const targetHeader = dateHeadersForWeek[0]; // Header for Monday
      let startColumnIndex = existingHeaders.indexOf(targetHeader);

      const requests = [];
      const playerNames = players.map((p) => [p.name]);

      // --- Always update the list of player names (Column A) ---
      requests.push({
        updateCells: {
          range: {
            sheetId: 0,
            startRowIndex: 2, // Start below headers
            startColumnIndex: 0,
            endColumnIndex: 1,
          },
          rows: playerNames.map((name) => ({
            values: [{ userEnteredValue: { stringValue: name[0] } }],
          })),
          fields: "userEnteredValue",
        },
      });

      // 3. Decide whether to UPDATE an existing microcycle or INSERT a new one
      if (startColumnIndex !== -1) {
        // --- A. UPDATE EXISTING MICROCYCLE ---
        console.log(
          `Updating existing microcycle at column index: ${startColumnIndex}`,
        );
      } else {
        // --- B. INSERT NEW MICROCYCLE ---
        startColumnIndex =
          existingHeaders.length > 0 ? existingHeaders.length : 1;
        console.log(
          `Inserting new microcycle at column index: ${startColumnIndex}`,
        );

        // The "MICROCICLO X" merge/unmerge requests have been REMOVED.

        // Add request to create the date headers
        requests.push({
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: 1,
              startColumnIndex: startColumnIndex,
            },
            rows: [
              {
                values: dateHeadersForWeek.map((header) => ({
                  userEnteredValue: { stringValue: header },
                  userEnteredFormat: {
                    horizontalAlignment: "CENTER",
                    textFormat: { bold: true },
                  },
                })),
              },
            ],
            fields: "userEnteredValue,userEnteredFormat",
          },
        });
      }

      // 4. Prepare player data requests for either UPDATE or INSERT
      players.forEach((player, playerIndex) => {
        const rowData = [];
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(microcycleStartDate);
          currentDate.setDate(currentDate.getDate() + i);
          const dateString = currentDate.toISOString().split("T")[0];

          const entry = player.daily_entries.find(
            (e) => e.entry_date.toISOString().split("T")[0] === dateString,
          );

          rowData.push({
            userEnteredValue: { numberValue: entry?.tqr_soreness ?? undefined },
            userEnteredFormat: { horizontalAlignment: "CENTER" },
          });
        }

        requests.push({
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: playerIndex + 2,
              startColumnIndex: startColumnIndex,
            },
            rows: [{ values: rowData }],
            fields: "userEnteredValue,userEnteredFormat",
          },
        });
      });

      // 5. Execute the single batch update
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });
    } catch (error) {
      console.error("Error updating spreadsheet data:", error);
      throw new Error("Failed to update Google Spreadsheet.");
    }
  }

  // This helper function remains the same.
  private generateDateHeaders(startDate: Date): string[] {
    const headers = [];
    const daysOfWeek = [
      "DOMINGO",
      "LUNES",
      "MARTES",
      "MIÉRCOLES",
      "JUEVES",
      "VIERNES",
      "SÁBADO",
    ];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const datePart = `${currentDate.getDate()}-${currentDate.toLocaleString("es-ES", { month: "short" }).replace(".", "")}`;
      headers.push(`${datePart}\n${daysOfWeek[currentDate.getDay()]}`);
    }
    return headers;
  }

  // This helper function remains the same.
  public getSpreadsheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }
}
