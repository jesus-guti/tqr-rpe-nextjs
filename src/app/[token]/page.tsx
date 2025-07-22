import { notFound } from "next/navigation";
import prisma from "@/lib/prisma"; // Asegúrate de tener un cliente Prisma configurado en lib/prisma.ts
import PlayerForm from "@/components/player-form"; // Importamos el nuevo componente de cliente

// Definimos y exportamos el tipo 'Player' para que pueda ser usado en otros archivos.
export type Player = {
  id: string;
  name: string;
  auth_token: string;
};

// Tipos para las props de la página
type PlayerPageProps = {
  params: {
    token: string;
  };
};

// Función para obtener los datos del jugador desde el servidor usando Prisma
async function getPlayerByToken(token: string): Promise<Player | null> {
  // Validamos que el token sea un UUID válido para evitar errores en la base de datos
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return null;
  }

  try {
    const player = await prisma.players.findUnique({
      where: {
        auth_token: token,
      },
    });
    return player;
  } catch (error) {
    console.error("Error al buscar el jugador:", error);
    // En caso de un error de base de datos, no devolvemos nada.
    return null;
  }
}

// El componente de la página (Server Component)
export default async function PlayerPage({ params }: PlayerPageProps) {
  // 1. Obtenemos los datos del jugador en el servidor
  const player = await getPlayerByToken(params.token);

  // 2. Si el token no es válido o el jugador no existe, Next.js mostrará la página 404.
  if (!player) {
    notFound();
  }

  // 3. Si el jugador es válido, renderizamos el componente de cliente (PlayerForm)
  //    y le pasamos los datos del jugador como una prop.
  return <PlayerForm player={player} />;
}
