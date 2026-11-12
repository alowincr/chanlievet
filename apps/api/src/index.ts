import "dotenv/config";
import { createServer } from "node:http";
import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { closeSocketServer, initSocketServer } from "./realtime/socket";

const server = createServer(app);

// Socket.io comparte el mismo servidor HTTP que Express.
initSocketServer(server);

server.on("error", (error) => {
  logger.error("Error en el servidor HTTP", error);
  process.exit(1);
});

server.listen(env.PORT, () => {
  logger.info(`🐾 API ChanlieVet disponible en http://localhost:${env.PORT}/api`);
  logger.info(`   WebSockets habilitados en ws://localhost:${env.PORT}`);
});

// Comprobación no bloqueante: el API puede arrancar aunque la BD tarde en estar lista.
void prisma
  .$queryRaw`SELECT 1`
  .then(() => logger.info("Conexión a PostgreSQL establecida"))
  .catch((error: unknown) => {
    logger.warn(
      "Aún no se pudo conectar a PostgreSQL. Se reintentará con las próximas consultas.",
      error instanceof Error ? error.message : error,
    );
  });

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`Recibida señal ${signal}. Cerrando servidor...`);
  closeSocketServer();

  server.close(() => {
    void prisma.$disconnect().finally(() => {
      logger.info("Servidor cerrado correctamente");
      process.exit(0);
    });
  });

  // Fuerza la salida si algo queda colgado.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
