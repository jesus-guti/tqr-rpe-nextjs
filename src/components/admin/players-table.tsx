"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditPlayerForm } from "./edit-player-form";
import { DeletePlayerButton } from "./delete-player-button";

export type Player = {
  id: string;
  name: string;
  auth_token: string;
};

export function PlayersTable({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);

  // Refresh players list when needed
  const refreshPlayers = async () => {
    try {
      const response = await fetch("/api/admin/players");
      if (response.ok) {
        const updatedPlayers = await response.json();
        setPlayers(updatedPlayers);
      }
    } catch (error) {
      console.error("Error refreshing players:", error);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Auth Token</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell className="text-gray-600">
                {player.auth_token}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <EditPlayerForm user={player} setPlayers={setPlayers} />
                  <DeletePlayerButton
                    userId={player.id}
                    setPlayers={setPlayers}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
