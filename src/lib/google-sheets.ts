// lib/google-sheets.ts

import { google } from "googleapis";
import { JWT } from "google-auth-library";

// PlayerData interface for the new approach
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
  private readonly sheetName = "TEMPORADA 2025/2026";

  constructor() {
    this.auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  /**
   * Creates a comprehensive spreadsheet showing all daily entries for the last 6 months
   * with color scaling based on values
   */
  public async updateSpreadsheetData(
    spreadsheetId: string,
    players: PlayerData[],
  ): Promise<void> {
    try {
      // 1. Calculate date range (last 3 months for better performance)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(6); // Set to July (month index 6)
      startDate.setFullYear(new Date().getFullYear()); // Ensure current year

      // 2. Generate weekly ranges instead of individual dates
      const weeklyRanges = this.generateWeeklyRanges(startDate, endDate);
      console.log("Total weeks to process:", weeklyRanges.length);

      // 3. Prepare the data matrix
      const { dataMatrix, maxValues } = this.prepareDataMatrix(
        players,
        weeklyRanges,
      );

      // 4. Clear existing content and prepare new structure
      await this.clearSheet(spreadsheetId);

      // 5. Ensure the spreadsheet has enough columns
      await this.ensureSheetCapacity(spreadsheetId, dataMatrix);

      // 6. Create the comprehensive spreadsheet
      await this.createComprehensiveSheet(
        spreadsheetId,
        dataMatrix,
        weeklyRanges,
        maxValues,
      );
    } catch (error) {
      console.error("Error updating spreadsheet data:", error);
      if (error.response) {
        console.error("Google Sheets API Error:", error.response.data);
        console.error("Status:", error.response.status);
      }
      throw new Error(`Failed to update Google Spreadsheet: ${error.message}`);
    }
  }

  /**
   * Generates weekly ranges instead of individual dates to reduce columns
   */
  private generateWeeklyRanges(
    startDate: Date,
    endDate: Date,
  ): { weekStart: Date; weekEnd: Date; weekLabel: string }[] {
    const weeks: { weekStart: Date; weekEnd: Date; weekLabel: string }[] = [];
    const currentDate = new Date(startDate);

    // Start from the beginning of the week (Monday)
    const dayOfWeek = currentDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentDate.setDate(currentDate.getDate() - daysToMonday);

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekLabel = `Week ${weekStart.toLocaleDateString("es-ES", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("es-ES", { month: "short", day: "numeric" })}`;

      weeks.push({ weekStart, weekEnd, weekLabel });
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks;
  }

  /**
   * Prepares the data matrix with one row per player and columns for each week
   */
  private prepareDataMatrix(
    players: PlayerData[],
    weeklyRanges: { weekStart: Date; weekEnd: Date; weekLabel: string }[],
  ): {
    dataMatrix: any[][];
    maxValues: {
      recovery: number;
      energy: number;
      soreness: number;
      rpe: number;
    };
  } {
    const dataMatrix: any[][] = [];
    let maxRecovery = 0,
      maxEnergy = 0,
      maxSoreness = 0,
      maxRpe = 0;

    // Generate all individual dates from the weekly ranges
    const allDates: Date[] = [];
    weeklyRanges.forEach((week) => {
      const currentDate = new Date(week.weekStart);
      while (currentDate <= week.weekEnd) {
        allDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Create header rows with individual dates
    const headerRow1 = ["Player Name"];
    const headerRow2 = [""];

    // Add date headers for each individual date
    allDates.forEach((date) => {
      const dateStr = date.toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      });
      headerRow1.push(dateStr, "", "", ""); // Date label spans 4 columns
      headerRow2.push("Recovery", "Energy", "Soreness", "RPE");
    });

    dataMatrix.push(headerRow1, headerRow2);

    // Loop through players (ONE ROW PER PLAYER)
    players.forEach((player) => {
      // Create ONE row for this player
      const playerRow = [player.name];

      // Fill the row with data for each individual date
      allDates.forEach((date) => {
        // Find the specific entry for this date
        const entry = player.daily_entries.find(
          (e) =>
            e.entry_date.toISOString().split("T")[0] ===
            date.toISOString().split("T")[0],
        );

        // Use the actual values (no averaging)
        const recovery = entry?.tqr_recovery || null;
        const energy = entry?.tqr_energy || null;
        const soreness = entry?.tqr_soreness || null;
        const rpe = entry?.rpe_borg_scale || null;

        playerRow.push(recovery, energy, soreness, rpe);

        // Update max values for color scaling
        if (recovery && recovery > maxRecovery) maxRecovery = recovery;
        if (energy && energy > maxEnergy) maxEnergy = energy;
        if (soreness && soreness > maxSoreness) maxSoreness = soreness;
        if (rpe && rpe > maxRpe) maxRpe = rpe;
      });

      // Add the complete player row to the matrix (ONCE per player)
      dataMatrix.push(playerRow);
    });

    return {
      dataMatrix,
      maxValues: {
        recovery: maxRecovery,
        energy: maxEnergy,
        soreness: maxSoreness,
        rpe: maxRpe,
      },
    };
  }

  /**
   * Clears the existing sheet content
   */
  private async clearSheet(spreadsheetId: string): Promise<void> {
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${this.sheetName}'!A:ZZ`,
    });
  }

  /**
   * Ensures the sheet has enough rows and columns to accommodate the data
   */
  private async ensureSheetCapacity(
    spreadsheetId: string,
    dataMatrix: any[][],
  ): Promise<void> {
    if (dataMatrix.length === 0) return;

    const maxColumns = Math.max(...dataMatrix.map((row) => row.length));
    const maxRows = dataMatrix.length;
    console.log(
      `Ensuring sheet has at least ${maxRows} rows and ${maxColumns} columns`,
    );

    // Add some buffer to prevent edge cases
    const requiredColumns = maxColumns + 5;
    const requiredRows = maxRows + 10;

    // Get current sheet properties
    const sheetResponse = await this.sheets.spreadsheets.get({
      spreadsheetId,
      ranges: [`'${this.sheetName}'!A:ZZ`],
      fields: "sheets.properties.gridProperties",
    });

    const currentColumns =
      sheetResponse.data.sheets[0].properties.gridProperties.columnCount;
    const currentRows =
      sheetResponse.data.sheets[0].properties.gridProperties.rowCount;

    const needsExpansion =
      currentColumns < requiredColumns || currentRows < requiredRows;

    if (needsExpansion) {
      console.log(
        `Expanding sheet from ${currentRows}x${currentColumns} to ${requiredRows}x${requiredColumns}`,
      );
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: 0,
                  gridProperties: {
                    rowCount: Math.max(currentRows, requiredRows),
                    columnCount: Math.max(currentColumns, requiredColumns),
                  },
                },
                fields: "gridProperties.rowCount,gridProperties.columnCount",
              },
            },
          ],
        },
      });
      console.log("Sheet expansion completed");
    } else {
      console.log("Sheet already has sufficient capacity");
    }
  }

  /**
   * Creates the comprehensive spreadsheet with color scaling
   */
  private async createComprehensiveSheet(
    spreadsheetId: string,
    dataMatrix: any[][],
    weeklyRanges: { weekStart: Date; weekEnd: Date; weekLabel: string }[],
    maxValues: {
      recovery: number;
      energy: number;
      soreness: number;
      rpe: number;
    },
  ): Promise<void> {
    const requests = [];

    // 1. Write the data
    requests.push({
      updateCells: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          startColumnIndex: 0,
        },
        rows: dataMatrix.map((row) => ({
          values: row.map((cell) => ({
            userEnteredValue:
              typeof cell === "number"
                ? { numberValue: cell }
                : { stringValue: cell?.toString() || "" },
          })),
        })),
        fields: "userEnteredValue",
      },
    });

    // 2. Apply formatting and color scaling
    const totalColumns = 2 + weeklyRanges.length * 4; // Player + 4 metrics per week

    // Header formatting
    requests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 2,
          startColumnIndex: 0,
          endColumnIndex: totalColumns,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
            textFormat: {
              bold: true,
              foregroundColor: { red: 1, green: 1, blue: 1 },
            },
            horizontalAlignment: "CENTER",
          },
        },
        fields:
          "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
      },
    });

    // 3. Apply simplified formatting for better performance
    // Calculate total number of dates
    const totalDates = weeklyRanges.reduce((total, week) => {
      const daysInWeek =
        Math.ceil(
          (week.weekEnd.getTime() - week.weekStart.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
      return total + daysInWeek;
    }, 0);

    // Apply alternating backgrounds for all data at once
    requests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 2,
          startColumnIndex: 2,
          endColumnIndex: 2 + totalDates * 4,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.98, green: 0.98, blue: 0.98 }, // Light background
          },
        },
        fields: "userEnteredFormat.backgroundColor",
      },
    });

    // Note: Conditional formatting removed for performance and compatibility
    // Data will be displayed with basic formatting only

    // 4. Freeze the first two columns and first two rows
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: 0,
          gridProperties: {
            frozenRowCount: 2,
            frozenColumnCount: 1,
          },
        },
        fields:
          "gridProperties.frozenRowCount,gridProperties.frozenColumnCount",
      },
    });

    // 5. Auto-resize columns
    requests.push({
      autoResizeDimensions: {
        dimensions: {
          sheetId: 0,
          dimension: "COLUMNS",
          startIndex: 0,
          endIndex: totalColumns,
        },
      },
    });

    // Execute all requests with retry logic and fallback to smaller chunks
    let retries = 3;
    while (retries > 0) {
      try {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests },
        });
        console.log("Spreadsheet updated successfully");
        break; // Success, exit retry loop
      } catch (error) {
        retries--;
        if (error.response?.status === 503 && retries > 0) {
          console.log(
            `Google Sheets API temporarily unavailable. Retrying... (${retries} attempts left)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
        } else if (error.response?.status === 503 && retries === 0) {
          // Final fallback: try writing just the data without formatting
          console.log("Trying fallback approach: writing data only...");
          try {
            await this.sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `'${this.sheetName}'!A1`,
              valueInputOption: "RAW",
              requestBody: {
                values: dataMatrix,
              },
            });
            console.log("Data written successfully (formatting skipped)");
            break;
          } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError.message);
            throw error; // Throw original error
          }
        } else {
          throw error; // Re-throw if not a 503 error
        }
      }
    }
  }

  /**
   * Gets the spreadsheet URL
   */
  public getSpreadsheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }
}
