// backend/src/scripts/seed.ts
import "reflect-metadata";
import { AppDataSource } from "../ormconfig";
import { getRepository } from "typeorm";
import { User } from "../db/entity/User";
import { League } from "../db/entity/League";
import { Team } from "../db/entity/Team";
import { Player } from "../db/entity/Player";
import bcrypt from "bcrypt";

async function seed() {
  await AppDataSource.initialize();
  const userRepo = getRepository(User);
  const leagueRepo = getRepository(League);
  const teamRepo = getRepository(Team);
  const playerRepo = getRepository(Player);

  // create users
  const commissioner = userRepo.create({ email: "comm@x.com", passwordHash: await bcrypt.hash("password", 10), displayName: "Commish", role: "COMMISSIONER" as any });
  await userRepo.save(commissioner);

  const u1 = userRepo.create({ email: "u1@x.com", passwordHash: await bcrypt.hash("password", 10), displayName: "User1" });
  const u2 = userRepo.create({ email: "u2@x.com", passwordHash: await bcrypt.hash("password", 10), displayName: "User2" });
  await userRepo.save([u1, u2]);

  const league = leagueRepo.create({ name: "Demo League", commissionerId: commissioner.id, maxTeams: 2 });
  await leagueRepo.save(league);

  const team1 = teamRepo.create({ name: "Team A", ownerUserId: u1.id, leagueId: league.id, draftPosition: 1, roster: [] });
  const team2 = teamRepo.create({ name: "Team B", ownerUserId: u2.id, leagueId: league.id, draftPosition: 2, roster: [] });
  await teamRepo.save([team1, team2]);

  // create sample players
  const names = ["Patrick Mahomes", "Christian McCaffrey", "Derrick Henry", "Justin Jefferson", "Travis Kelce", "Davante Adams"];
  const players = names.map(n => playerRepo.create({ name: n, position: "UNK", nflTeam: "UNK", stats: {} }));
  await playerRepo.save(players);

  console.log("Seed complete");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
