"use server";

import type { Player } from "@/components/admin/players-table";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPlayers() {
  return await prisma.players.findMany();
}

export async function createPlayer(formData: FormData) {
  const name = formData.get("name") as string;
  // In a real app, you would associate the player with a team
  await prisma.players.create({
    data: {
      name,
      // You can add the position to your schema if you want to store it
    },
  });
  revalidatePath("/admin");
}

export async function updatePlayer(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const updatedPlayer = await prisma.players.update({
    where: { id },
    data: {
      name,
    },
  });
  revalidatePath("/admin");
  return updatedPlayer as Player;
}

export async function deletePlayer(id: string) {
  await prisma.players.delete({
    where: { id },
  });
  revalidatePath("/admin");
}
