import { Suspense } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Users,
  Database,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import { getPlayers } from "./actions";
import { CreatePlayerForm } from "@/components/admin/create-player-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncButton } from "@/components/admin/sync-button";
import { SheetsButton } from "@/components/admin/sheets-button";
import { LogoutButton } from "@/components/admin/logout-button";
import { PlayersTable } from "@/components/admin/players-table";

export default async function AdminInterface() {
  const users = await getPlayers();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="mt-1 text-gray-600">
              Gestiona jugadores y sincroniza datos
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="px-3 py-1">
              <Users className="mr-1 h-4 w-4" />
              {users.length} jugadores
            </Badge>
            <Suspense fallback={<div>Loading...</div>}>
              <LogoutButton />
            </Suspense>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Sync Card */}
          <Card className="border-blue-200 transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-blue-700">
                <Database className="mr-2 h-5 w-5" />
                Sincronización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                Sincroniza la base de datos con Google Sheets
              </p>
              <Suspense
                fallback={
                  <Button disabled className="w-full">
                    Loading...
                  </Button>
                }
              >
                <SyncButton />
              </Suspense>
            </CardContent>
          </Card>

          {/* Create User Card */}
          <Card className="border-green-200 transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-green-700">
                <Plus className="mr-2 h-5 w-5" />
                Nuevo Jugador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                Añade un nuevo jugador al sistema
              </p>
              <CreatePlayerForm />
            </CardContent>
          </Card>

          {/* Google Sheets Card */}
          <Card className="border-orange-200 transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-orange-700">
                <FileSpreadsheet className="mr-2 h-5 w-5" />
                Google Sheets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="https://docs.google.com/spreadsheets/d/16ZX-qrKq-_Jk7ZLoCxuvUjDA-kC0zinwR8-qGtiqAHI"
                className="mb-4 text-sm text-gray-600"
                target="_blank"
              >
                Accede directamente a la hoja de cálculo
              </a>
              <Suspense
                fallback={
                  <Button disabled className="w-full">
                    Loading...
                  </Button>
                }
              >
                <SheetsButton />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Gestión de Jugadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading players...</div>}>
              <PlayersTable initialPlayers={users} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
