"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Battery, BatteryLow, Zap, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Importamos el tipo 'Player' que definiremos en la página
export type Player = {
  id: string;
  name: string;
  auth_token: string;
};

// El componente ahora recibe los datos del jugador como una 'prop'
export default function PlayerForm({ player }: { player: Player }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [recovery, setRecovery] = useState([5]);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [effort, setEffort] = useState([5]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Función genérica para enviar los datos a la API
  const handleSave = async (payload: object) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/save-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Algo salió mal al guardar los datos.");
      }

      setMessage({ type: "success", text: "¡Datos guardados con éxito!" });
    } catch (error: any) {
      setMessage({ type: "error", text: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreTrainingSave = () => {
    const payload = {
      authToken: player.auth_token,
      entryDate: format(selectedDate, "yyyy-MM-dd"),
      tqr_recovery: recovery[0],
      tqr_energy: energy,
      tqr_soreness: soreness,
    };
    handleSave(payload);
  };

  const handlePostTrainingSave = () => {
    const payload = {
      authToken: player.auth_token,
      entryDate: format(selectedDate, "yyyy-MM-dd"),
      rpe_borg_scale: effort[0],
    };
    handleSave(payload);
  };

  // El resto de tu JSX es casi idéntico, solo cambiamos el nombre hardcodeado
  // por el que viene en las props.
  const borgScale = [
    { value: 0, label: "Nada en absoluto" },
    { value: 1, label: "Muy, muy ligero" },
    { value: 2, label: "Muy ligero" },
    { value: 3, label: "Ligero" },
    { value: 4, label: "Algo duro" },
    { value: 5, label: "Duro" },
    { value: 6, label: "Más duro" },
    { value: 7, label: "Muy duro" },
    { value: 8, label: "Muy, muy duro" },
    { value: 9, label: "Extremadamente duro" },
    { value: 10, label: "Máximo" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
      <div className="mx-auto max-w-md space-y-6">
        <div className="py-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {player.name}
          </h1>
        </div>

        {/* Message display */}
        {message && (
          <div
            className={`rounded-md p-4 text-center ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {message.text}
          </div>
        )}

        <Card>
          <CardContent className="p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Fecha del entrenamiento
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card className="border-green-200 pt-0">
          <CardHeader className="rounded-t-lg bg-green-600 pt-3 pb-2 text-white">
            <CardTitle className="text-center text-lg font-bold">
              PRE-ENTRENAMIENTO (TQR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div>
              <label className="mb-4 block text-sm font-medium text-gray-900">
                ¿Cómo de recuperado te sientes hoy?
              </label>
              <Slider
                value={recovery}
                onValueChange={setRecovery}
                max={10}
                min={0}
                step={1}
              />
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Nada</span>{" "}
                <span className="font-semibold text-green-600">
                  {recovery[0]}
                </span>{" "}
                <span>Al 100%</span>
              </div>
            </div>
            <Button
              onClick={handlePreTrainingSave}
              disabled={isLoading}
              className="h-12 w-full bg-green-600 font-semibold text-white hover:bg-green-700"
            >
              {isLoading ? "Guardando..." : "Guardar Pre-entrenamiento"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-black pt-0">
          <CardHeader className="rounded-t-lg bg-black pt-3 pb-2 text-white">
            <CardTitle className="text-center text-lg font-bold">
              POST-ENTRENAMIENTO (RPE)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div>
              <label className="mb-4 block text-sm font-medium text-gray-900">
                Valora tu esfuerzo (Escala de BORG)
              </label>
              <div className="px-2">
                <div className="mb-3 text-center">
                  <span className="text-2xl font-bold text-gray-800">
                    {effort[0]}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">/ 10</span>
                  <p className="text-sm font-medium text-gray-600">
                    {borgScale[effort[0]].label}
                  </p>
                </div>
                <Slider
                  value={effort}
                  onValueChange={setEffort}
                  max={10}
                  min={0}
                  step={1}
                />
              </div>
            </div>
            <Button
              onClick={handlePostTrainingSave}
              disabled={isLoading}
              className="h-12 w-full bg-black font-semibold text-white hover:bg-gray-800"
            >
              {isLoading ? "Guardando..." : "Guardar Post-entrenamiento"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
