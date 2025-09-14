/**
 * Simple scoring worker: in production this listens to provider webhooks or message queue.
 * For demo: periodically scans unscored events and applies scoring rules.
 */
import { createConnection, getRepository } from "typeorm";
import config from "../config";
import { Draft } from "../db/entity/Draft";

async function run() {
  await createConnection({
    type: "postgres",
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    entities: [__dirname + "/../db/entity/*{.ts,.js}"],
    synchronize: true
  });

  console.log("Scoring worker started");
  // placeholder: in real system you'd process live events from a queue
  setInterval(async () => {
    console.log("Scoring tick");
    // process events...
  }, 30_000);
}

run().catch(console.error);
