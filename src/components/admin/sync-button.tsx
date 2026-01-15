// SyncButton.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SyncResponse {
  success: boolean;
  message?: string;
  error?: string;
  playersCount?: number;
  entriesCount?: number;
  duration?: string;
  spreadsheetUrl?: string;
}

export function SyncButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result: SyncResponse = await response.json();

      if (response.ok && result.success) {
        const details = result.entriesCount
          ? ` (${result.playersCount} jugadores, ${result.entriesCount} entradas)`
          : "";
        toast.success(result.message || `Sincronización completada${details}`);
      } else {
        const errorMessage = result.error || "Error desconocido en la sincronización";
        toast.error(errorMessage, {
          duration: 5000, // Show error for longer
        });
      }
    } catch (error) {
      console.error("Error syncing:", error);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      toast.error(`Error de conexión después de ${elapsed}s. Intenta de nuevo.`, {
        duration: 5000,
      });
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
