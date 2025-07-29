"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function SheetsButton() {
  const handleOpenSheets = () => {
    window.open(
      `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID}`,
      "_blank",
    );
  };

  return (
    <Button
      onClick={handleOpenSheets}
      className="w-full bg-orange-600 hover:bg-orange-700"
    >
      <ExternalLink className="mr-2 h-4 w-4" />
      Abrir Sheets
    </Button>
  );
}
