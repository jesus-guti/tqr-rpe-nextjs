// SyncButton.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Sincronización completada");
      } else {
        toast.error("Error en la sincronización");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error("Error en la sincronización");
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
