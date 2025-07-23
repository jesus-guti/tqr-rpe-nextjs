import { google } from "googleapis";
import { JWT } from "google-auth-library";

interface PlayerData {
  id: string;
  name: string;
  auth_token: string;
  daily_entries: Array<{
    entry_date: Date;
    tqr_recovery?: number;
    tqr_energy?: number;
    tqr_soreness?: number;
    rpe_borg_scale?: number;
  }>;
}

interface MicrocycleData {
  startDate: Date;
  endDate: Date;
  players: PlayerData[];
}

export class GoogleSheetsService {
  private auth: JWT;
  private sheets: any;
  private drive: any; // Add a property for the Drive API client

  constructor() {
    this.auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    this.sheets = google.sheets({ version: "v4", auth: this.auth });
    this.drive = google.drive({ version: "v3", auth: this.auth }); // Initialize the Drive API client
  }

  async createSpreadsheet(
    title: string = "CONTROL CARGA TQR-RPE",
  ): Promise<string> {
    try {
      // Step 1: Create the spreadsheet resource
      const resource = {
        properties: {
          title,
        },
      };

      const spreadsheet = await this.sheets.spreadsheets.create({
        resource,
        fields: "spreadsheetId",
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId;
      if (!spreadsheetId) {
        throw new Error("Spreadsheet creation failed to return an ID.");
      }

      console.log(
        `✅ Spreadsheet created successfully with ID: ${spreadsheetId}`,
      );
      console.log("Skipping move to folder for this test.");

      // --- TEMPORARILY COMMENT OUT THE FOLLOWING CODE ---
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (!folderId) {
        console.warn("GOOGLE_DRIVE_FOLDER_ID is not set.");
      } else {
        // Step 2: Move the newly created spreadsheet to the specified folder
        await this.drive.files.update({
          fileId: spreadsheetId,
          addParents: folderId,
          fields: "id, parents",
        });
      }

      // Step 3: Initialize with headers (your existing logic)
      await this.initializeSpreadsheet(spreadsheetId);
      // --- END OF TEMPORARILY COMMENTED OUT CODE ---

      return spreadsheetId;
    } catch (error: any) {
      if (error.response) {
        console.error(
          "Google API error response:",
          JSON.stringify(error.response.data, null, 2),
        );
      } else {
        console.error("Error creating spreadsheet:", error.message);
      }
      throw new Error(
        "Failed to create Google Spreadsheet. Check server logs for details.",
      );
    }
  }

  /**
   * Initialize spreadsheet with headers and formatting
   */
  private async initializeSpreadsheet(spreadsheetId: string): Promise<void> {
    const requests = [
      // Set up headers
      {
        updateCells: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 3,
            startColumnIndex: 0,
            endColumnIndex: 15,
          },
          rows: [
            {
              values: [
                { userEnteredValue: { stringValue: "CONTROL CARGA" } },
                { userEnteredValue: { stringValue: "MICROCICLO 1" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
              ],
            },
            {
              values: [
                { userEnteredValue: { stringValue: "NOMBRE" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
                { userEnteredValue: { stringValue: "" } },
              ],
            },
          ],
          fields: "userEnteredValue",
        },
      },
      // Format headers
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 3,
            startColumnIndex: 0,
            endColumnIndex: 15,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.8, green: 0.2, blue: 0.2 },
              textFormat: {
                bold: true,
                foregroundColor: { red: 1, green: 1, blue: 1 },
              },
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
            },
          },
          fields:
            "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
        },
      },
    ];

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  /**
   * Update spreadsheet with player data
   */
  async updateSpreadsheetData(
    spreadsheetId: string,
    players: PlayerData[],
    microcycleStartDate: Date = new Date(),
  ): Promise<void> {
    try {
      // Calculate microcycle dates (7 days)
      const microcycleEndDate = new Date(microcycleStartDate);
      microcycleEndDate.setDate(microcycleEndDate.getDate() + 6);

      // Generate date headers
      const dateHeaders = this.generateDateHeaders(
        microcycleStartDate,
        microcycleEndDate,
      );

      // Prepare data rows
      const dataRows = players.map((player) => {
        const row = [player.name]; // Start with player name

        // Add data for each date in the microcycle
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(microcycleStartDate);
          currentDate.setDate(currentDate.getDate() + i);

          const entry = player.daily_entries.find(
            (entry) =>
              entry.entry_date.toDateString() === currentDate.toDateString(),
          );

          // For now, we'll use soreness data as the main metric
          // This can be expanded to include other metrics
          const value = entry?.tqr_soreness || 0;
          row.push(value);
        }

        return row;
      });

      // Prepare the update request
      const updateData = [
        // Date headers row
        dateHeaders,
        // Player data rows
        ...dataRows,
      ];

      // Update the spreadsheet
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "MICROCICLO 1!A2:H" + (dataRows.length + 2),
        valueInputOption: "RAW",
        requestBody: {
          values: updateData,
        },
      });

      // Add summary rows at the bottom
      await this.addSummaryRows(spreadsheetId, dataRows.length + 3);
    } catch (error) {
      console.error("Error updating spreadsheet data:", error);
      throw new Error("Failed to update Google Spreadsheet");
    }
  }

  /**
   * Generate date headers for the microcycle
   */
  private generateDateHeaders(startDate: Date, endDate: Date): string[] {
    const headers = ["NOMBRE"];
    const daysOfWeek = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);

      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const dayOfWeek = daysOfWeek[currentDate.getDay()];

      headers.push(`${day}-${month.toString().padStart(2, "0")} ${dayOfWeek}`);
    }

    return headers;
  }

  /**
   * Add summary rows at the bottom of the spreadsheet
   */
  private async addSummaryRows(
    spreadsheetId: string,
    startRow: number,
  ): Promise<void> {
    const summaryRows = [
      ["RPEMEDIA", 0, 0, 0, 0, 0, 0, 0],
      ["TIEMPO TOTAL SESIÓN", 80, 80, 80, 80, 80, 80, 80],
      ["CARGA MEDIA", 0, 0, 0, 0, 0, 0, 0],
      ["SUMATORIO MICROCICLO", 0, 0, 0, 0, 0, 0, 0],
      ["CARGA AGUDA", 0, 0, 0, 0, 0, 0, 0],
      ["CARGA CRÓNICA", 0, 0, 0, 0, 0, 0, 0],
      ["A:C 7-28", 0, 0, 0, 0, 0, 0, 0],
    ];

    const requests = [
      {
        updateCells: {
          range: {
            sheetId: 0,
            startRowIndex: startRow - 1,
            endRowIndex: startRow + summaryRows.length - 1,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          rows: summaryRows.map((row, index) => ({
            values: row.map((value, colIndex) => ({
              userEnteredValue: {
                numberValue: typeof value === "number" ? value : undefined,
                stringValue: typeof value === "string" ? value : undefined,
              },
              userEnteredFormat: {
                backgroundColor: this.getSummaryRowColor(index),
                textFormat: { bold: true },
                horizontalAlignment: "CENTER",
              },
            })),
          })),
          fields: "userEnteredValue,userEnteredFormat",
        },
      },
    ];

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  /**
   * Get color for summary rows based on index
   */
  private getSummaryRowColor(index: number): {
    red: number;
    green: number;
    blue: number;
  } {
    const colors = [
      { red: 0.8, green: 0.6, blue: 1.0 }, // Purple for RPEMEDIA
      { red: 1.0, green: 1.0, blue: 0.0 }, // Yellow for TIEMPO TOTAL
      { red: 1.0, green: 0.2, blue: 0.2 }, // Red for CARGA MEDIA
      { red: 0.2, green: 0.2, blue: 0.8 }, // Dark Blue for SUMATORIO
      { red: 1.0, green: 0.8, blue: 0.8 }, // Pink for CARGA AGUDA
      { red: 1.0, green: 0.8, blue: 0.8 }, // Pink for CARGA CRÓNICA
      { red: 1.0, green: 0.8, blue: 0.8 }, // Pink for A:C 7-28
    ];

    return colors[index] || { red: 0.9, green: 0.9, blue: 0.9 };
  }

  /**
   * Get spreadsheet URL
   */
  getSpreadsheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }
}
