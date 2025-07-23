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
import {
  CalendarDaysIcon,
  Battery0Icon,
  Battery50Icon,
  Battery100Icon,
  BoltIcon,
  BoltSlashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

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
  const [showFisioConfirm, setShowFisioConfirm] = useState(false);
  const [isSavingPreTraining, setIsSavingPreTraining] = useState(false);
  const [isSavingPostTraining, setIsSavingPostTraining] = useState(false);

  const energyIcons = [
    { level: 1, icon: Battery0Icon, color: "text-red-500" },
    { level: 2, icon: Battery50Icon, color: "text-orange-500" },
    { level: 3, icon: Battery50Icon, color: "text-yellow-500" },
    { level: 4, icon: Battery100Icon, color: "text-green-400" },
    { level: 5, icon: Battery100Icon, color: "text-green-600" },
  ];

  const sorenessIcons = [
    { level: 1, icon: BoltIcon, color: "text-green-500" },
    { level: 2, icon: BoltIcon, color: "text-yellow-500" },
    { level: 3, icon: BoltIcon, color: "text-orange-500" },
    { level: 4, icon: BoltSlashIcon, color: "text-red-500" },
    { level: 5, icon: BoltSlashIcon, color: "text-red-700" },
  ];

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

  const handlePreTrainingSave = async () => {
    // Show confirmation dialog if soreness is level 5
    if (soreness === 5) {
      setShowFisioConfirm(true);
      return;
    }

    await savePreTrainingData();
  };

  const savePreTrainingData = async () => {
    setIsSavingPreTraining(true);
    try {
      console.log("Pre-sesión guardado:", {
        date: selectedDate,
        recovery: recovery[0],
        energy,
        soreness,
      });

      const response = await fetch("/api/save_entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authToken: player.auth_token,
          entryDate: format(selectedDate, "yyyy-MM-dd"),
          tqr_recovery: recovery[0],
          tqr_energy: energy,
          tqr_soreness: soreness,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Pre-sesión guardado correctamente");
    } catch (error) {
      console.error("Error al guardar pre-sesión:", error);
      toast.error("Error al guardar el pre-sesión. Inténtalo de nuevo.");
    } finally {
      setIsSavingPreTraining(false);
    }
  };

  const handlePostTrainingSave = async () => {
    setIsSavingPostTraining(true);
    try {
      console.log("Post-sesión guardado:", {
        date: selectedDate,
        effort: effort[0],
      });

      const response = await fetch("/api/save_entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authToken: player.auth_token,
          entryDate: format(selectedDate, "yyyy-MM-dd"),
          rpe_borg_scale: effort[0],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Post-sesión guardado correctamente");
    } catch (error) {
      console.error("Error al guardar post-sesión:", error);
      toast.error("Error al guardar el post-sesión. Inténtalo de nuevo.");
    } finally {
      setIsSavingPostTraining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-center py-4">
          <Image
            src="/vimenor-logo.png"
            alt="Vimenor Logo"
            width={150}
            height={50}
            className="object-contain"
            unoptimized={true}
          />
        </div>
        {/* Header */}
        <div className="py-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {player.name}
          </h1>
        </div>

        {/* Date Selector */}
        <Card>
          <CardContent className="">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Fecha de la sesión
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
                  <CalendarDaysIcon className="mr-2 h-4 w-4" />
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

        {/* Pre-Training Section */}
        <Card className="border-green-200 pt-0">
          <CardHeader className="rounded-t-lg bg-green-600 pt-3 pb-2 text-white">
            <CardTitle className="text-center text-lg font-bold">
              PRE-SESIÓN (TQR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Recovery Question */}
            <div>
              <label className="mb-4 block text-sm font-medium text-gray-900">
                ¿Cómo de recuperado te sientes hoy?
              </label>
              <div className="px-2">
                <Slider
                  value={recovery}
                  onValueChange={setRecovery}
                  max={10}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Nada recuperado</span>
                  <span className="font-semibold text-green-600">
                    {recovery[0]}
                  </span>
                  <span>Recuperado al 100%</span>
                </div>
              </div>
            </div>

            {/* Energy Question */}
            <div>
              <label className="mb-4 block text-sm font-medium text-gray-900">
                ¿Cómo te sientes de energía?
              </label>
              <div className="flex justify-center space-x-2">
                {energyIcons.map(({ level, icon: Icon, color }) => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={cn(
                      "rounded-lg border-2 p-3 transition-all",
                      energy >= level
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-8 w-8",
                        energy >= level ? color : "text-gray-300",
                      )}
                    />
                  </button>
                ))}
              </div>
              <div className="mt-2 text-center">
                <span className="text-sm font-medium text-green-600">
                  Nivel: {energy}/5
                </span>
              </div>
            </div>

            {/* Soreness Question */}
            <div>
              <label className="mb-4 block text-sm font-medium text-gray-900">
                ¿Agujetas?
              </label>
              <div className="flex justify-center space-x-2">
                {sorenessIcons.map(({ level, icon: Icon, color }) => (
                  <button
                    key={level}
                    onClick={() => setSoreness(level)}
                    className={cn(
                      "relative rounded-lg border-2 p-3 transition-all",
                      soreness === level
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-8 w-8",
                        soreness === level ? color : "text-gray-300",
                      )}
                    />
                    {level === 5 && (
                      <div className="absolute -top-8 right-1.5">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          Fisio
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Ligeras</span>
                <span className="font-medium">Nivel: {soreness}</span>
                <span>Sobrecarga</span>
              </div>
            </div>

            <Button
              onClick={() => void handlePreTrainingSave()}
              disabled={isSavingPreTraining}
              className="h-12 w-full bg-green-600 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingPreTraining ? (
                <>
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Pre-Sesión"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Post-Training Section */}
        <Card className="border-black pt-0">
          <CardHeader className="rounded-t-lg bg-black pt-3 pb-2 text-white">
            <CardTitle className="text-center text-lg font-bold">
              POST-SESIÓN (RPE)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div>
              <label className="mb-4 block text-sm font-medium text-gray-900">
                Valora tu esfuerzo (Escala de BORG)
              </label>

              {/* Borg Scale Reference */}
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-center text-base font-bold tracking-wide text-gray-800">
                  ESCALA DE BORG
                </h4>
                <div className="space-y-2">
                  {borgScale.map((item) => {
                    const getColorClasses = (value: number) => {
                      const colors = [
                        "bg-blue-50 border-blue-200 text-blue-800", // 0
                        "bg-blue-100 border-blue-300 text-blue-900", // 1
                        "bg-teal-50 border-teal-200 text-teal-800", // 2
                        "bg-green-50 border-green-200 text-green-800", // 3
                        "bg-green-100 border-green-300 text-green-900", // 4
                        "bg-yellow-50 border-yellow-200 text-yellow-800", // 5
                        "bg-yellow-100 border-yellow-300 text-yellow-900", // 6
                        "bg-orange-50 border-orange-200 text-orange-800", // 7
                        "bg-orange-100 border-orange-300 text-orange-900", // 8
                        "bg-red-50 border-red-200 text-red-800", // 9
                        "bg-red-100 border-red-300 text-red-900", // 10
                      ];
                      return colors[value] ?? colors[0];
                    };

                    return (
                      <div
                        key={item.value}
                        onClick={() => setEffort([item.value])}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all duration-200 hover:shadow-md ${getColorClasses(item.value)} ${
                          effort[0] === item.value
                            ? "shadow-md ring-2 ring-gray-400 ring-offset-1"
                            : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 text-center text-lg font-bold">
                            {item.value}
                          </span>
                          <div className="h-4 w-1 rounded-full bg-current opacity-30"></div>
                        </div>
                        <span className="flex-1 text-right text-sm font-medium tracking-wide">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Effort Slider */}
              <div className="px-2">
                <div className="mb-3">
                  <div className="mb-2 text-center">
                    <span className="text-2xl font-bold text-gray-800">
                      {effort[0]}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">/ 10</span>
                  </div>
                </div>
                <Slider
                  value={effort}
                  onValueChange={setEffort}
                  max={10}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="mt-2 flex justify-between text-xs font-medium text-gray-400">
                  <span>Nada en absoluto</span>
                  <span>Máximo esfuerzo</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => void handlePostTrainingSave()}
              disabled={isSavingPostTraining}
              className="h-12 w-full bg-black font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingPostTraining ? (
                <>
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Post-Sesión"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fisio Confirmation Dialog */}
      {showFisioConfirm && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <BoltSlashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar sesión de Fisioterapia
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Has seleccionado un nivel de agujetas alto (Nivel 5). Al
                guardar, se programará automáticamente una sesión de
                fisioterapia.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFisioConfirm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setShowFisioConfirm(false);
                  void savePreTrainingData();
                }}
                disabled={isSavingPreTraining}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingPreTraining ? (
                  <>
                    <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Confirmar y Guardar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
