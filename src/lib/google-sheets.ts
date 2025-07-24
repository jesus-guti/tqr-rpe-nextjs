import { google } from "googleapis";
import { JWT } from "google-auth-library";

// The PlayerData interface remains the same.
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

  /**
   * Updates the "MICROCICLOS" sheet by finding the next available columns
   * and writing the new week's data horizontally.
   * @param spreadsheetId The ID of the spreadsheet.
   * @param players An array of all players from the database.
   * @param microcycleStartDate The start date of the week to sync.
   */
  public async updateSpreadsheetData(
    spreadsheetId: string,
    players: PlayerData[],
    microcycleStartDate: Date,
  ): Promise<void> {
    try {
      // 1. Find the next available starting column by reading the header row.
      const headerRange = `'${this.sheetName}'!2:2`; // Read the row with dates
      const headerResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: headerRange,
      });

      // Column index is 0-based. +1 for "NOMBRE" col.
      const startColumnIndex = headerResponse.data.values
        ? headerResponse.data.values[0].length
        : 1;

      // 2. Prepare all data and requests for a single batch update.
      const requests = [];
      const playerNames = players.map((p) => [p.name]);
      const microcycleNumber = Math.floor((startColumnIndex - 1) / 7) + 1;

      // --- Request to update the list of player names (Column A) ---
      requests.push({
        updateCells: {
          range: {
            sheetId: 0, // Assuming the first sheet
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

      // --- Request to add the new "MICROCICLO X" header ---
      requests.push({
        mergeCells: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: startColumnIndex,
            endColumnIndex: startColumnIndex + 7,
          },
          mergeType: "MERGE_ALL",
        },
      });
      requests.push({
        updateCells: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            startColumnIndex: startColumnIndex,
          },
          rows: [
            {
              values: [
                {
                  userEnteredValue: {
                    stringValue: `MICROCICLO ${microcycleNumber}`,
                  },
                  userEnteredFormat: {
                    horizontalAlignment: "CENTER",
                    textFormat: { bold: true },
                  },
                },
              ],
            },
          ],
          fields: "userEnteredValue,userEnteredFormat",
        },
      });

      // --- Request to add the new date headers ---
      const dateHeaders = this.generateDateHeaders(microcycleStartDate);
      requests.push({
        updateCells: {
          range: {
            sheetId: 0,
            startRowIndex: 1, // The second row
            startColumnIndex: startColumnIndex,
          },
          rows: [
            {
              values: dateHeaders.map((header) => ({
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

      // --- Requests to add the player data for the new week ---
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
            userEnteredValue: {
              // Use numberValue for numbers, stringValue for empty strings
              numberValue: entry?.tqr_soreness ?? undefined,
              stringValue: entry?.tqr_soreness === undefined ? "" : undefined,
            },
            userEnteredFormat: { horizontalAlignment: "CENTER" },
          });
        }

        requests.push({
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: playerIndex + 2, // +2 to account for header rows
              startColumnIndex: startColumnIndex,
            },
            rows: [{ values: rowData }],
            fields: "userEnteredValue,userEnteredFormat",
          },
        });
      });

      // 3. Execute the batch update with all prepared requests.
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests,
        },
      });
    } catch (error) {
      console.error("Error updating spreadsheet data:", error);
      throw new Error("Failed to update Google Spreadsheet.");
    }
  }

  /**
   * Generates just the 7 daily date headers for a microcycle.
   */
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

  public getSpreadsheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }
}
