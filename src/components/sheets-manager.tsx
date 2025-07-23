"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SheetsManagerProps {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
}

export function SheetsManager({
  spreadsheetId,
  spreadsheetUrl,
}: SheetsManagerProps) {
  const [title, setTitle] = useState("CONTROL CARGA TQR-RPE");
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newSpreadsheetId, setNewSpreadsheetId] = useState(spreadsheetId);
  const [newSpreadsheetUrl, setNewSpreadsheetUrl] = useState(spreadsheetUrl);
  const [microcycleStartDate, setMicrocycleStartDate] = useState<Date>(
    new Date(),
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const createSpreadsheet = async () => {
    setIsCreating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/sheets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const data = (await response.json()) as {
        success: boolean;
        spreadsheetId?: string;
        spreadsheetUrl?: string;
        error?: string;
      };

      if (data.success) {
        setNewSpreadsheetId(data.spreadsheetId);
        setNewSpreadsheetUrl(data.spreadsheetUrl);
        setMessage({
          type: "success",
          text: "Spreadsheet created successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error ?? "Failed to create spreadsheet",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create spreadsheet" });
    } finally {
      setIsCreating(false);
    }
  };

  const syncData = async () => {
    if (!newSpreadsheetId) {
      setMessage({ type: "error", text: "Please create a spreadsheet first" });
      return;
    }

    setIsSyncing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: newSpreadsheetId,
          microcycleStartDate: microcycleStartDate.toISOString().split("T")[0],
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        playersCount?: number;
        error?: string;
      };

      if (data.success) {
        setMessage({
          type: "success",
          text: `Data synced successfully! ${data.playersCount} players updated.`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error ?? "Failed to sync data",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to sync data" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Google Sheets Integration
          </CardTitle>
          <CardDescription>
            Create and manage Google Sheets for TQR-RPE data in CONTROL CARGA
            format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Spreadsheet Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create New Spreadsheet</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="title">Spreadsheet Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                  placeholder="CONTROL CARGA TQR-RPE"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={createSpreadsheet}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? "Creating..." : "Create Spreadsheet"}
                </Button>
              </div>
            </div>
          </div>

          {/* Sync Data Section */}
          {(newSpreadsheetId || spreadsheetId) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sync Data</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Microcycle Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(microcycleStartDate, "PPP", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={microcycleStartDate}
                        onSelect={(date) =>
                          date && setMicrocycleStartDate(date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={syncData}
                    disabled={isSyncing}
                    className="w-full"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      "Sync Data"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Current Spreadsheet Info */}
          {(newSpreadsheetId || spreadsheetId) && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Current Spreadsheet</h3>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Spreadsheet ID:</p>
                <p className="font-mono text-sm">
                  {newSpreadsheetId || spreadsheetId}
                </p>
                {(newSpreadsheetUrl || spreadsheetUrl) && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          newSpreadsheetUrl || spreadsheetUrl,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Google Sheets
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div
              className={`rounded-lg p-4 ${
                message.type === "success"
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
