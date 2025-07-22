import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Definimos los datos de los jugadores en un array
const playerData: Prisma.playersCreateInput[] = [
  {
    name: "Jude Bellingham",
    // El auth_token se generará automáticamente por la base de datos
  },
  {
    name: "Lamine Yamal",
  },
  {
    name: "Vinícius Júnior",
  },
];

async function main() {
  console.log(`Iniciando el proceso de seed...`);

  // Usamos un bucle para crear cada jugador
  for (const p of playerData) {
    const player = await prisma.players.create({
      data: p,
    });
    console.log(`Jugador creado: ${player.name} (ID: ${player.id})`);
    console.log(`   🔑 Token: ${player.auth_token}`);
    console.log(`   🚀 URL: /${player.auth_token}`);
  }

  console.log(`Proceso de seed finalizado.`);
}

// Ejecutamos la función main y nos aseguramos de desconectar el cliente de Prisma
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
