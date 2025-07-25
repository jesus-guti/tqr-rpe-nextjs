"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function SheetsButton() {
  const handleOpenSheets = () => {
    window.open("https://docs.google.com/spreadsheets", "_blank");
  };

  return (
    <Button
      onClick={handleOpenSheets}
      variant="outline"
      className="w-full border-orange-300 bg-transparent text-orange-700 hover:bg-orange-50"
    >
      <ExternalLink className="mr-2 h-4 w-4" />
      Abrir Sheets
    </Button>
  );
}
