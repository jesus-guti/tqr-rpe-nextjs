"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Users,
  Database,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  status: "active" | "inactive";
  lastActivity: string;
}

export default function AdminInterface() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Carlos Rodríguez",
      email: "carlos@team.com",
      position: "Delantero",
      status: "active",
      lastActivity: "2024-01-24",
    },
    {
      id: "2",
      name: "Miguel Santos",
      email: "miguel@team.com",
      position: "Centrocampista",
      status: "active",
      lastActivity: "2024-01-23",
    },
    {
      id: "3",
      name: "David López",
      email: "david@team.com",
      position: "Defensa",
      status: "inactive",
      lastActivity: "2024-01-20",
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    position: "",
    status: "active" as const,
  });

  const handleSync = async () => {
    setIsSyncing(true);
    // Simular sincronización
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncing(false);
    alert("Sincronización completada con Google Sheets");
  };

  const handleCreateUser = () => {
    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      lastActivity: new Date().toISOString().split("T")[0],
    };
    setUsers([...users, user]);
    setNewUser({ name: "", email: "", position: "", status: "active" });
    setIsCreateModalOpen(false);
    alert("Usuario creado correctamente");
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)));
    setIsEditModalOpen(false);
    setEditingUser(null);
    alert("Usuario actualizado correctamente");
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      setUsers(users.filter((u) => u.id !== userId));
      alert("Usuario eliminado correctamente");
    }
  };

  const openGoogleSheets = () => {
    window.open("https://docs.google.com/spreadsheets", "_blank");
  };

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
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar DB
                  </>
                )}
              </Button>
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
              <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Jugador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Jugador</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) =>
                          setNewUser({ ...newUser, name: e.target.value })
                        }
                        placeholder="Ej: Carlos Rodríguez"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        placeholder="carlos@team.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Posición</Label>
                      <Input
                        id="position"
                        value={newUser.position}
                        onChange={(e) =>
                          setNewUser({ ...newUser, position: e.target.value })
                        }
                        placeholder="Ej: Delantero, Centrocampista, Defensa"
                      />
                    </div>
                    <Button onClick={handleCreateUser} className="w-full">
                      Crear Jugador
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
              <p className="mb-4 text-sm text-gray-600">
                Accede directamente a la hoja de cálculo
              </p>
              <Button
                onClick={openGoogleSheets}
                variant="outline"
                className="w-full border-orange-300 bg-transparent text-orange-700 hover:bg-orange-50"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Sheets
              </Button>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-gray-600">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.position}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "secondary"
                          }
                          className={cn(
                            user.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800",
                          )}
                        >
                          {user.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.lastActivity}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Jugador</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nombre completo</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-position">Posición</Label>
                  <Input
                    id="edit-position"
                    value={editingUser.position}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        position: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Estado</Label>
                  <select
                    id="edit-status"
                    value={editingUser.status}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
                <Button onClick={handleUpdateUser} className="w-full">
                  Actualizar Jugador
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
