"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function SyncButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID,
          microcycleStartDate: "2025-07-21",
        }),
      });

      if (response.ok) {
        alert("Sincronización completada");
      } else {
        alert("Error en la sincronización");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      alert("Error en la sincronización");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      className="w-full bg-blue-600 hover:bg-blue-700"
    >
      <RefreshCw
        className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
      />
      {isLoading ? "Sincronizando..." : "Sincronizar DB"}
    </Button>
  );
}
